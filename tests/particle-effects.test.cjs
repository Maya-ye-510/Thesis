const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const FieldMath = require('../field-math.js');

function fieldPrototype() {
  const context = { FieldMath, document: { createElement: () => {
    const canvas = { width: 0, height: 0, stamp: null, strokes:0, rotations:[] };
    canvas.getContext = () => ({ clearRect() {}, drawImage(source) { canvas.stamp = source.stamp; },translate(){},rotate(angle){canvas.rotations.push(angle);},save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},arc(){},fill(){},stroke(){canvas.strokes++;},fillRect(){},createRadialGradient(){return {addColorStop(){}};},createLinearGradient(){return {addColorStop(){}};} });
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
test('The missing field is filled behind a soft boundary without autonomous decorative rings', () => {
  for(const mode of ['left','right','side']){
    const field=fieldPrototype(),paths=[],current=[];
    const ctx={globalAlpha:1,fillStyle:'',save(){},restore(){},beginPath(){current.length=0;},moveTo(x,y){current.push({x,y});},lineTo(x,y){current.push({x,y});},closePath(){},fill(){paths.push({fill:this.fillStyle,points:[...current],filter:this.filter});},drawImage(){throw Error('No particle contacts means no extra circles');}};
    Object.assign(field,{width:1000,height:600,time:0,lens:null,details:{hemianopia:mode},fieldContacts:[]});field.drawFieldLoss(ctx);
    assert.equal(paths.length,mode==='side'?2:1);
    assert.ok(paths.every(p=>p.fill==='#000'&&p.filter==='blur(20px)'));
    if(mode!=='right')assert.ok(paths.some(p=>p.points[0].x<0));
    if(mode!=='left')assert.ok(paths.some(p=>p.points[0].x>1000));
  }
});
test('Astigmatism caches a single-axis, parallel light smear instead of radial spokes', () => {
  const field=fieldPrototype();field.sprites=new Map();const glare=field.glare('#ff48cf');
  assert.equal(glare.strokes,3);assert.equal(glare.rotations.length,1);
  assert.equal(field.glare('#ff48cf'),glare);
});
test('Primary yellow, pink, blue/cyan particles dominate, including during colour evolution', () => {
  const field=fieldPrototype();field.build();field.conditions=new Set();field.controls={colors:false};
  const primary=new Set(field.constructor.primaryColours.map(i=>field.constructor.palette[i]));
  const ratio=()=>field.particles.filter(p=>primary.has(field.colourFor(p))).length/field.particles.length;
  assert.ok(ratio()>.84&&ratio()<.9);
  assert.ok(!field.constructor.palette.includes('#101a48'));
  field.controls.colors=true;
  for(const time of [0,6,12,30,75]){field.time=time;assert.ok(ratio()>.84&&ratio()<.9);}
});
