const test = require('node:test');
const assert = require('node:assert/strict');
const { toggleCondition, project, blurAt, deutanColour } = require('../field-math.js');

test('Normal clears the visual conditions; choosing a condition clears Normal', () => {
  assert.deepEqual([...toggleCondition(new Set(['myopia', 'colour']), 'normal')], ['normal']);
  assert.deepEqual([...toggleCondition(new Set(['normal']), 'myopia')], ['myopia']);
});
test('Optical conditions can coexist and be removed independently', () => {
  const previous = new Set(['myopia']);
  const next = toggleCondition(previous, 'snow');
  assert.deepEqual([...next], ['myopia', 'snow']);
  assert.deepEqual([...previous], ['myopia']);
  assert.deepEqual([...toggleCondition(next, 'myopia')], ['snow']);
});
test('Perspective makes near objects larger while camera panning changes their position', () => {
  const camera = { x: 0, y: 0, zoom: 0 };
  const near = project({ x: 1, y: 0, z: -1 }, camera, 1200, 600);
  const far = project({ x: 1, y: 0, z: 1 }, camera, 1200, 600);
  const pan = project({ x: 1, y: 0, z: -1 }, { ...camera, x: .5 }, 1200, 600);
  assert.ok(near.size > far.size);
  assert.ok(near.depth < far.depth);
  assert.ok(pan.x < near.x);
});
test('Myopia view has a movable plane of focus; Normal stays unblurred', () => {
  assert.equal(blurAt(.4, .4, true), 0);
  assert.ok(blurAt(.8, .2, true) > blurAt(.3, .2, true));
  assert.ok(blurAt(.8, .8, true) < blurAt(.8, .2, true));
  assert.equal(blurAt(.8, .2, false), 0);
});
test('Deuteranopia colour transform preserves neutral colours and returns bounded RGB', () => {
  assert.equal(deutanColour('#000000'), '#000000');
  assert.equal(deutanColour('#ffffff'), '#ffffff');
  assert.equal(deutanColour('#808080'), '#808080');
  assert.notEqual(deutanColour('#ff7049'), '#ff7049');
  for (const colour of ['#dcff5c', '#71efdf', '#ff7049', '#8e9cfb']) assert.match(deutanColour(colour), /^#[0-9a-f]{6}$/);
});
