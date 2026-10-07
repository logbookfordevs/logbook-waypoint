import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const context = vm.createContext({});
vm.runInContext(await readFile(new URL('../public/content/modules/journal-geometry.js', import.meta.url), 'utf8'), context);
const full = { left: 10, top: 20, right: 1010, bottom: 100, width: 1000, height: 80 };
function target(tagName, rects, mixed = false) {
  return { tagName, textContent: 'Visible words', getBoundingClientRect: () => full, querySelector: () => mixed, ownerDocument: { createRange: () => ({ selectNodeContents() {}, getClientRects: () => rects }) } };
}
test('journal bounds fit text across wrapped lines while preserving container targets', () => {
  const lines = [{ left: 10, top: 20, right: 210, bottom: 40, width: 200, height: 20 }, { left: 10, top: 40, right: 110, bottom: 60, width: 100, height: 20 }];
  const bounds = context.WaypointJournalGeometry.targetBounds(target('H1', lines));
  assert.equal(bounds.width, 200);
  assert.equal(bounds.height, 40);
  assert.equal(context.WaypointJournalGeometry.targetBounds(target('SECTION', lines)), full);
  assert.equal(context.WaypointJournalGeometry.targetBounds(target('SPAN', lines, true)), full);
  assert.equal(context.WaypointJournalGeometry.targetBounds(target('P', [])), full);
});
