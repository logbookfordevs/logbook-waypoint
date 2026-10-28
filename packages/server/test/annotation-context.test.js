import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

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

  const payload = { data: await server.runAgentOperation('inspect_annotations', { ids: [selectedId, missingId] }) };

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

test('an explicit unknown loopback scope is a successful empty survey', async () => {
  const server = new LocalAnnotationsServer();
  server.loadAnnotations = async () => [];

  const result = await server.readAnnotations({
    status: 'pending',
    url: 'http://localhost:3002/*',
  });

  assert.deepEqual(result.annotations, []);
  assert.equal(result.pagination.total, 0);
  assert.deepEqual(result.projectInfo, []);
  assert.equal(result.projectSelection, null);
});

test('read_annotations surveys one ID directly and can verify its URL scope', async () => {
  const server = new LocalAnnotationsServer();
  const id = 'waypoint_1750000000000_abc123xyz';
  const unsupportedId = 'waypoint_1750000000001_abcdefghi';
  server.loadAnnotations = async () => [{
    id,
    url: 'http://localhost:3000/settings',
    comment: 'Keep the label aligned',
    status: 'resolved',
  }, {
    id: unsupportedId,
    url: 'https://example.com/settings',
    comment: 'Outside the local project',
    status: 'pending',
  }];

  const selected = await server.readAnnotations({ id });
  assert.deepEqual(selected.annotations.map(annotation => annotation.id), [id]);
  assert.equal(selected.annotations[0].comment, 'Keep the label aligned');
  assert.equal(selected.projectSelection, null);

  const wrongScope = await server.readAnnotations({ id, url: 'http://localhost:3000/profile' });
  assert.deepEqual(wrongScope.annotations, []);

  const unsupported = await server.readAnnotations({ id: unsupportedId });
  assert.deepEqual(unsupported.annotations, []);

  await assert.rejects(server.readAnnotations({ id: 'invalid' }), /Invalid Waypoint annotation ID/);
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
