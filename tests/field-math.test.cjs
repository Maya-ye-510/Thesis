const test = require('node:test');
const assert = require('node:assert/strict');
const { toggleCondition, rotate, wrap, focusZoom, project, blurAt, deutanColour } = require('../field-math.js');

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
test('Perspective makes near objects larger; turning around reveals the world behind the viewer', () => {
  const camera = { yaw: 0, pitch: 0, zoom: 0 };
  const near = project({ x: 1, y: 0, z: 3 }, camera, 1200, 600);
  const far = project({ x: 1, y: 0, z: 12 }, camera, 1200, 600);
  assert.ok(near.size > far.size * 3);
  assert.ok(near.distance < far.distance);
  assert.equal(project({ x: 1, y: 0, z: -5 }, camera, 1200, 600).visible, false);
  assert.equal(project({ x: 1, y: 0, z: -5 }, { ...camera, yaw: Math.PI }, 1200, 600).visible, true);
});
test('The repeating world has no travel boundary and a complete cell traversal repeats seamlessly', () => {
  assert.equal(wrap(19), -17);
  assert.equal(wrap(-19), 17);
  const point = { x: 2, y: 1, z: 8 };
  const a = project(point, { yaw: 0, pitch: 0, zoom: 0 }, 1200, 600);
  const b = project(point, { yaw: 0, pitch: 0, zoom: 36 }, 1200, 600);
  for (const key of ['x','y','size','distance']) assert.ok(Math.abs(a[key] - b[key]) < 1e-10);
  assert.equal(a.visible, b.visible);
});
test('A full rotation returns every coordinate; orbiting preserves distance from the model centre', () => {
  const point = { x: 1.2, y: -.7, z: 2.1 };
  const full = rotate(point, Math.PI * 2);
  for (const axis of ['x','y','z']) assert.ok(Math.abs(full[axis] - point[axis]) < 1e-10);
  const turned = rotate(point, 1.3, -.6);
  assert.ok(Math.abs(Math.hypot(turned.x, turned.y, turned.z) - Math.hypot(point.x, point.y, point.z)) < 1e-10);
});
test('Moving the camera changes perspective while keeping the same world point', () => {
  const point = { x: 1, y: .2, z: 10 };
  const near = project(point, { yaw: 0, pitch: 0, zoom: focusZoom(.2) }, 1200, 600);
  const far = project(point, { yaw: 0, pitch: 0, zoom: focusZoom(.6) }, 1200, 600);
  assert.ok(near.size > far.size * 1.5);
  assert.ok(near.x > far.x);
  assert.equal(focusZoom(.35), 0);
});
test('Myopia stays clear nearby and becomes progressively more blurred with distance', () => {
  assert.equal(blurAt(2, true), 0);
  assert.equal(blurAt(4, true), 0);
  assert.ok(blurAt(12, true) > blurAt(7, true));
  assert.equal(blurAt(14, false), 0);
});
test('Approaching a previously blurred world point brings it into the clear near range', () => {
  const point = { x: .1, y: .1, z: 10 };
  const initial = project(point, { yaw: 0, pitch: 0, zoom: 0 }, 1200, 600);
  const close = project(point, { yaw: 0, pitch: 0, zoom: focusZoom(0) }, 1200, 600);
  assert.ok(blurAt(initial.distance, true) > 3);
  assert.equal(blurAt(close.distance, true), 0);
  assert.ok(close.size > initial.size);
});
test('Deuteranopia colour transform preserves neutral colours and returns bounded RGB', () => {
  assert.equal(deutanColour('#000000'), '#000000');
  assert.equal(deutanColour('#ffffff'), '#ffffff');
  assert.equal(deutanColour('#808080'), '#808080');
  assert.notEqual(deutanColour('#ff7049'), '#ff7049');
  for (const colour of ['#dcff5c', '#71efdf', '#ff7049', '#8e9cfb']) assert.match(deutanColour(colour), /^#[0-9a-f]{6}$/);
});
