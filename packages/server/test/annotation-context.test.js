import assert from 'node:assert/strict';
import test from 'node:test';

import { LocalAnnotationsServer } from '../lib/server.js';

test('agent Queue context keeps portable Target data and omits Source Identity fields', async () => {
  const server = new LocalAnnotationsServer();
  server.loadAnnotations = async () => [{
    id: 'waypoint_1750000000000_abc123xyz',
    url: 'http://localhost:3000/page?mode=review#target',
    url_path: '/page?mode=review#target',
    comment: 'Align this Target',
    status: 'pending',
    selector: '#target',
    element_context: { tag: 'button', text: 'Save' },
    parent_chain: [{ tag: 'main' }],
    source_file_path: 'src/Button.tsx',
    source_line_range: '10-20',
    source_map_available: true,
    context_hints: ['React test ID: save'],
  }];

  const result = await server.readAnnotations({ status: 'pending' });
  const [annotation] = result.annotations;

  assert.equal(annotation.url_path, '/page?mode=review#target');
  assert.deepEqual(annotation.targets[0].element_context, { tag: 'button', text: 'Save' });
  assert.deepEqual(annotation.targets[0].parent_chain, [{ tag: 'main' }]);
  assert.equal('source_file_path' in annotation.targets[0], false);
  assert.equal('source_line_range' in annotation.targets[0], false);
  assert.equal('source_map_available' in annotation.targets[0], false);
  assert.equal('context_hints' in annotation.targets[0], false);
});
