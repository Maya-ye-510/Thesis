const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const FieldMath = require('../field-math.js');

function fieldPrototype() {
  const context = { FieldMath, document: { createElement: () => {
    const canvas = { width: 0, height: 0, stamp: null };
    canvas.getContext = () => ({ clearRect() {}, drawImage(source) { canvas.stamp = source.stamp; } });
    return canvas;
  } } };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../particle-field.js'), 'utf8'), context);
  return Object.create(context.ParticleField.prototype);
}
test('Circles remain the dominant elements, with only a small minority of other geometry', () => {
  const field = fieldPrototype(); field.build();
  const circleTypes = new Set(['disc','ring','double-ring','halo','dashed-ring','arc','dot-ring']);
  assert.ok(field.particles.filter(p => circleTypes.has(p.type)).length / field.particles.length > .94);
  assert.ok(new Set(field.particles.filter(p => circleTypes.has(p.type)).map(p => p.type)).size >= 6);
});
test('Visual snow displays genuinely older scene frames and keeps its history bounded', () => {
  const field = fieldPrototype(), shown = [];
  Object.assign(field, { width: 10, height: 10, history: [], scene: { width: 10, height: 10, stamp: 0 }, ctx: { globalAlpha: 1, drawImage(source) { shown.push(source.stamp); } } });
  for (let time = 0; time <= 1200; time += 60) {
    field.scene.stamp = time; shown.length = 0; field.drawDelayed(time);
    if (time >= 180) assert.ok(time - shown.at(-1) >= 130 && time - shown.at(-1) < 190);
    assert.ok(field.history.length <= 7);
  }
  assert.ok(shown.length === 2, 'An older afterimage accompanies the delayed scene');
  assert.ok(shown[0] < shown[1]);
});
