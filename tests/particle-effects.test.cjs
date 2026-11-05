const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const FieldMath = require('../field-math.js');

function fieldPrototype() {
  const context = { FieldMath, document: { createElement: () => {
    const canvas = { width: 0, height: 0, stamp: null, strokes:0 };
    canvas.getContext = () => ({ clearRect() {}, drawImage(source) { canvas.stamp = source.stamp; },translate(){},rotate(){},save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},arc(){},fill(){},stroke(){canvas.strokes++;},createLinearGradient(){return {addColorStop(){}};} });
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

test('Result keyboard exploration rotates and tilts without changing captured zoom', () => {
  const field=fieldPrototype();
  Object.assign(field,{lockZoom:true,target:{yaw:.3,pitch:.1,zoom:-2},camera:{yaw:.3,pitch:.1,zoom:-2},originPose:{yaw:.3,pitch:.1,zoom:-2},canvas:{dataset:{}},request(){},setFocus(){throw Error('Result must not zoom');}});
  for (const key of ['+','-','=','ArrowRight','ArrowUp','ArrowDown']) field.key({key,preventDefault(){}});
  assert.equal(field.target.zoom,-2); assert.ok(field.target.yaw>.3);
  field.key({key:'Home',preventDefault(){}});
  assert.equal(field.target.zoom,-2); assert.equal(field.target.yaw,.3); assert.equal(field.target.pitch,.1);
});

test('Paused particles keep their time while manual rotation remains responsive', () => {
  const field=fieldPrototype();
  Object.assign(field,{active:true,width:1000,paused:true,reduced:{matches:false},camera:{yaw:0,pitch:0,zoom:0},target:{yaw:1,pitch:0,zoom:0},time:7,last:1000,conditions:new Set(),canvas:{dataset:{}},draw(){},request(){}});
  field.frame(1050);assert.equal(field.time,7);assert.ok(field.camera.yaw>0);
  field.paused=false;field.frame(1100);assert.ok(field.time>7);
});
test('Lost visual fields are fully black away from the feathered luminous edge', () => {
  for(const mode of ['left','right','side']){
    const field=fieldPrototype(),fills=[];
    const ctx={globalAlpha:1,fillStyle:'',createLinearGradient(){return{addColorStop(){}};},fillRect(x,y,w,h){fills.push({x,w,fill:this.fillStyle});},save(){},restore(){},beginPath(){},rect(){},clip(){},arc(){},stroke(){}};
    Object.assign(field,{width:1000,height:600,time:0,lens:null,details:{hemianopia:mode}});field.drawFieldLoss(ctx);
    const black=fills.filter(f=>f.fill==='#000');
    if(mode!=='right')assert.ok(black.some(f=>f.x===0&&f.w>300));
    if(mode!=='left')assert.ok(black.some(f=>f.x>500&&f.x+f.w>=1000));
  }
});


test('Astigmatism adds cached radial strokes; the expanded base palette omits dark grey/navy', () => {
  const field=fieldPrototype();field.sprites=new Map();
  const normal=field.sprite('disc','#ff563b',0,false),astig=field.sprite('disc','#ff563b',0,true);
  assert.equal(normal.strokes,0);assert.equal(astig.strokes,4);
  assert.equal(field.sprite('disc','#ff563b',0,true),astig);
  assert.ok(field.constructor.palette.length>=12);
  assert.ok(!field.constructor.palette.includes('#101a48'));
});
