import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

import {
  applyDesignIntentUpdate,
  assertDesignIntent,
  createFreeformDesignIntent,
} from '../../server/lib/design-intent.js';

test('server and extension enforce the same versioned Freeform Design Intent contract', async () => {
  const context = vm.createContext({});
  context.globalThis = context;
  const source = await readFile(new URL('../.output/chrome-mv3/design-intent.js', import.meta.url), 'utf8');
  vm.runInContext(source, context);

  const valid = createFreeformDesignIntent();
  assert.deepEqual(JSON.parse(JSON.stringify(context.WaypointDesignIntent.createFreeform())), valid);

  const cases = [
    valid,
    { schema_version: 2, workflow: 'impeccable', action: null },
    { schema_version: 1, workflow: 'other', action: null },
    { schema_version: 1, workflow: 'impeccable', action: 'polish' },
    { schema_version: 1, workflow: 'impeccable', action: null, extra: true },
  ];

  for (const designIntent of cases) {
    let serverAccepted = true;
    let extensionAccepted = true;
    try { assertDesignIntent(designIntent); } catch { serverAccepted = false; }
    try { context.WaypointDesignIntent.assert(designIntent); } catch { extensionAccepted = false; }
    assert.equal(extensionAccepted, serverAccepted);
  }

  const annotation = { id: 'waypoint_1_abcdefghi', design_intent: valid };
  assert.equal('design_intent' in applyDesignIntentUpdate(annotation, { design_intent: null }), false);
  assert.equal(
    'design_intent' in context.WaypointDesignIntent.applyUpdate(annotation, { design_intent: null }),
    false,
  );

  const removalIds = context.WaypointDesignIntent.updateRemovalIds([], annotation.id, {
    design_intent: null,
  });
  assert.deepEqual(Array.from(removalIds), [annotation.id]);
  assert.deepEqual(
    Array.from(context.WaypointDesignIntent.updateRemovalIds(removalIds, annotation.id, {
      design_intent: valid,
    })),
    [],
  );
  assert.deepEqual(
    Array.from(context.WaypointDesignIntent.removeIds([annotation.id, 'waypoint_2_abcdefghi'], [annotation.id])),
    ['waypoint_2_abcdefghi'],
  );
});
