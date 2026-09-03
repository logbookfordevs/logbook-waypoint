import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { LocalAnnotationsServer } from '../lib/server.js';

test('scoped Queue reads survey compact actionable annotation context', async () => {
  const server = new LocalAnnotationsServer();
  server.loadAnnotations = async () => [{
    id: 'waypoint_1750000000000_abc123xyz',
    url: 'http://localhost:3000/page?mode=review#target',
    url_path: '/page?mode=review#target',
    comment: 'Align this Target',
    status: 'pending',
    selector: '#target',
    element_context: {
      tag: 'button',
      text: 'Save',
      styles: {
        display: 'flex',
        position: 'static',
        fontSize: '16px',
        color: 'rgb(16, 44, 52)',
        lineHeight: '24px',
        padding: '0px 16px',
      },
      position: { x: 100, y: 200, width: 96.4, height: 40.2 },
    },
    parent_chain: [
      { tag: 'main', classes: ['settings', 'stack'], text_sample: 'Settings Save' },
      { tag: 'body', classes: [] },
    ],
    source_file_path: 'src/Button.tsx',
    source_line_range: '10-20',
    component_name: 'SaveButton',
    source_map_available: true,
    context_hints: ['React test ID: save'],
    pending_changes: { paddingLeft: { original: '16px', value: '24px' } },
    screenshot: { data_url: 'data:image/png;base64,AAAA' },
    attachments: [{ id: 'attachment-1', data_url: 'data:image/png;base64,BBBB' }],
    created_at: '2026-08-26T12:00:00.000Z',
    updated_at: '2026-08-26T12:05:00.000Z',
  }];

  const result = await server.readAnnotations({
    status: 'pending',
    url: 'http://localhost:3000/*',
  });
  const [annotation] = result.annotations;

  assert.deepEqual(annotation, {
    id: 'waypoint_1750000000000_abc123xyz',
    url: 'http://localhost:3000/page?mode=review#target',
    url_path: '/page?mode=review#target',
    status: 'pending',
    comment: 'Align this Target',
    target_count: 1,
    targets: [{
      index: 0,
      selector: '#target',
      tag: 'button',
      text: 'Save',
      styles: {
        display: 'flex',
        color: 'rgb(16, 44, 52)',
        padding: '0px 16px',
      },
      size: { width: 96, height: 40 },
      context: { tag: 'main', classes: ['settings', 'stack'] },
      source_identity: {
        component_name: 'SaveButton',
        source_file_path: 'src/Button.tsx',
        source_line_range: '10-20',
        source_map_available: true,
      },
    }],
    pending_changes: { paddingLeft: { original: '16px', value: '24px' } },
    has_screenshot: true,
    has_attachments: true,
    created_at: '2026-08-26T12:00:00.000Z',
    updated_at: '2026-08-26T12:05:00.000Z',
  });
  assert.doesNotMatch(JSON.stringify(annotation), /lineHeight|text_sample|data:image|attachment-1/);
});

test('inspect_annotations diagnoses selected IDs with complete captured context', async () => {
  const server = new LocalAnnotationsServer();
  const selectedId = 'waypoint_1750000000000_abc123xyz';
  const missingId = 'waypoint_1750000000002_abcdefghi';
  server.loadAnnotations = async () => [{
    id: selectedId,
    url: 'http://localhost:3000/settings',
    comment: 'The layout shifts here',
    status: 'pending',
    selector: '#settings-title',
    element_context: {
      tag: 'h1',
      text: 'Settings',
      styles: { display: 'grid', lineHeight: '48px', gridTemplateColumns: '1fr auto' },
      position: { x: 64, y: 96, width: 420, height: 48 },
    },
    parent_chain: [{ tag: 'header' }, { tag: 'main' }],
    component_name: 'SettingsHeader',
    source_file_path: 'src/settings/header.tsx',
    source_line_range: { start: 18, end: 42 },
    source_map_available: true,
    context_hints: ['React component: SettingsHeader'],
    screenshot: { data_url: 'data:image/png;base64,AAAA' },
  }, {
    id: 'waypoint_1750000000001_abcdefghi',
    url: 'http://localhost:3000/profile',
    comment: 'Unrelated work',
    status: 'pending',
  }];

  let callTool;
  let listTools;
  server.setupMCPHandlersForServer({
    setRequestHandler(schema, handler) {
      if (schema === CallToolRequestSchema) callTool = handler;
      if (schema === ListToolsRequestSchema) listTools = handler;
    },
  });

  const tools = await listTools();
  const readTool = tools.tools.find(tool => tool.name === 'read_annotations');
  const inspectTool = tools.tools.find(tool => tool.name === 'inspect_annotations');
  assert.match(readTool.description, /^Intake requests\b/);
  assert.match(readTool.description, /Pending Annotations are actionable work/i);
  assert.match(readTool.description, /claim before implementation, resolve after verification, or release when blocked/i);
  assert.match(inspectTool.description, /^Diagnose\b/);
  assert.equal(inspectTool.inputSchema.properties.ids.maxItems, undefined);

  const response = await callTool({
    params: {
      name: 'inspect_annotations',
      arguments: { ids: [selectedId, missingId] },
    },
  });
  const payload = JSON.parse(response.content[0].text);

  assert.deepEqual(payload.data.annotations.map(annotation => annotation.id), [selectedId]);
  assert.deepEqual(payload.data.missing_ids, [missingId]);
  assert.equal(payload.data.annotations[0].element_context.styles.lineHeight, '48px');
  assert.equal(payload.data.annotations[0].parent_chain.length, 2);
  assert.equal(payload.data.annotations[0].source_file_path, 'src/settings/header.tsx');
  assert.equal(payload.data.annotations[0].component_name, 'SettingsHeader');
  assert.equal(payload.data.annotations[0].has_screenshot, true);
  assert.doesNotMatch(JSON.stringify(payload), /data:image/);
  assert.doesNotMatch(JSON.stringify(payload), /Unrelated work/);
});

test('inspect_annotations preserves complete ordered Target Sets', async () => {
  const server = new LocalAnnotationsServer();
  const id = 'waypoint_1750000000000_multitarget';
  server.loadAnnotations = async () => [{
    id,
    url: 'http://localhost:3000/workflow',
    comment: 'Align these related Targets',
    status: 'pending',
    targets: [{
      selector: '#workflow-title',
      element_context: { tag: 'h2', text: 'Workflow', styles: { lineHeight: '40px' } },
      parent_chain: [{ tag: 'header' }],
      component_name: 'WorkflowTitle',
      screenshot: { data_url: 'data:image/png;base64,AAAA' },
    }, {
      selector: '.browser-surface',
      element_context: { tag: 'div', text: 'localhost:3000/dashboard' },
      parent_chain: [{ tag: 'main' }],
      component_name: 'BrowserSurface',
    }],
  }];

  const result = await server.inspectAnnotations({ ids: [id] });
  const [annotation] = result.annotations;

  assert.deepEqual(annotation.targets.map(target => target.selector), [
    '#workflow-title',
    '.browser-surface',
  ]);
  assert.equal(annotation.targets[0].element_context.styles.lineHeight, '40px');
  assert.equal(annotation.targets[0].component_name, 'WorkflowTitle');
  assert.equal(annotation.targets[1].component_name, 'BrowserSurface');
  assert.equal(annotation.has_screenshot, true);
  assert.doesNotMatch(JSON.stringify(annotation), /data:image/);
});

test('compact surveys omit known framework component noise deterministically', async () => {
  const server = new LocalAnnotationsServer();
  server.loadAnnotations = async () => [{
    id: 'waypoint_1750000000000_abc123xyz',
    url: 'http://localhost:3000/dashboard',
    comment: 'Tighten this section',
    status: 'pending',
    selector: '#dashboard',
    element_context: { tag: 'section', text: 'Dashboard' },
    component_name: 'LayoutRouterContext',
    context_hints: ['React component: LayoutRouterContext'],
  }];

  const result = await server.readAnnotations({ url: 'http://localhost:3000/*' });

  assert.equal('source_identity' in result.annotations[0].targets[0], false);
  assert.doesNotMatch(JSON.stringify(result.annotations[0]), /LayoutRouterContext/);
});

test('compact surveys preserve stored multi-Target annotations in canonical order', async () => {
  const server = new LocalAnnotationsServer();
  server.loadAnnotations = async () => [{
    id: 'waypoint_1750000000000_multitarget',
    url: 'http://localhost:3000/workflow',
    comment: 'Align these related Targets',
    status: 'pending',
    targets: [{
      selector: '#workflow-title',
      element_context: { tag: 'h2', text: 'Workflow' },
      component_name: 'WorkflowTitle',
    }, {
      selector: '.browser-surface',
      element_context: { tag: 'div', text: 'localhost:3000/dashboard' },
      component_name: 'BrowserSurface',
    }],
  }];

  const result = await server.readAnnotations({ url: 'http://localhost:3000/*' });
  const [annotation] = result.annotations;

  assert.equal(annotation.target_count, 2);
  assert.deepEqual(annotation.targets.map(target => ({
    index: target.index,
    selector: target.selector,
    component_name: target.source_identity.component_name,
  })), [{
    index: 0,
    selector: '#workflow-title',
    component_name: 'WorkflowTitle',
  }, {
    index: 1,
    selector: '.browser-surface',
    component_name: 'BrowserSurface',
  }]);
});

test('Watch delivers Survey-grade multi-Target context with event metadata', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'waypoint-watch-survey-'));
  const server = new LocalAnnotationsServer({
    watchHistoryFile: path.join(directory, 'watch-history.json'),
  });
  server.loadAnnotations = async () => [{
    id: 'waypoint_1750000000000_multitarget',
    url: 'http://localhost:3000/workflow',
    comment: 'Align these related Targets',
    status: 'pending',
    targets: [{
      selector: '#workflow-title',
      element_context: {
        tag: 'h2',
        text: 'Workflow',
        styles: { display: 'flex', lineHeight: '40px' },
        position: { x: 40, y: 80, width: 420.4, height: 40.2 },
      },
      parent_chain: [{ tag: 'header', classes: ['workflow-heading', 'stack'] }],
      component_name: 'WorkflowTitle',
      source_file_path: 'src/WorkflowTitle.tsx',
      context_hints: ['React component: WorkflowTitle'],
      badge_offset: { x: 8, y: -4 },
    }, {
      selector: '.browser-surface',
      element_context: { tag: 'div', text: 'localhost:3000/dashboard' },
      component_name: 'BrowserSurface',
    }],
    design_intent: { schema_version: 1, workflow: 'impeccable', action: 'Polish' },
  }];

  try {
    const result = await server.watchAnnotations({ timeout_ms: 0 });
    const [change] = result.changes;

    assert.equal(change.annotation.target_count, 2);
    assert.deepEqual(change.annotation.targets.map(target => target.selector), [
      '#workflow-title',
      '.browser-surface',
    ]);
    assert.equal(change.annotation.targets[0].source_identity.component_name, 'WorkflowTitle');
    assert.deepEqual(change.annotation.design_intent, {
      schema_version: 1,
      workflow: 'impeccable',
      action: 'Polish',
    });
    assert.equal(typeof change.revision, 'string');
    assert.equal(change.dedupe_key, `${change.annotation.id}:${change.revision}`);
    assert.doesNotMatch(JSON.stringify(change.annotation), /lineHeight|context_hints|badge_offset/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
