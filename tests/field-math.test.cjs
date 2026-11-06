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

test('Visual-field modes preserve the requested half or central region', () => {
  const {visibleField}=require('../field-math.js');
  assert.deepEqual(visibleField(1000,'left'),[500,1000]);
  assert.deepEqual(visibleField(1000,'right'),[0,500]);
  assert.deepEqual(visibleField(1000,'side'),[340,660]);
});


test('A touching scene particle bends the boundary into the missing region and leaves no permanent bubble', () => {
  const {fieldBoundary}=require('../field-math.js');
  const left={x:500,left:true},right={x:500,left:false},particle={x:510,y:300,r:30,alpha:.8};
  assert.equal(fieldBoundary(300,left,[]),500);
  assert.ok(fieldBoundary(300,left,[particle])<480);
  assert.ok(fieldBoundary(300,right,[particle])>520);
  assert.ok(Math.abs(fieldBoundary(550,left,[particle])-500)<1e-5);
  assert.ok(Math.abs(fieldBoundary(300,left,[{...particle,x:900}])-500)<1e-5);
});

test('Focus rays share one baseline, split continuously, and reach the explanation geometry', () => {
  const {focusRays}=require('../field-math.js');
  const [startA,startB]=focusRays(0);assert.deepEqual(startA,startB);
  assert.ok(startA.filter((_,i)=>i%2).every(y=>y===411));
  const [middleA,middleB]=focusRays(.5);
  assert.ok(middleA[1]>356&&middleA[1]<411);assert.ok(middleB[1]>411&&middleB[1]<476);
  const [endA,endB]=focusRays(1);assert.equal(endA[1],356);assert.equal(endB[1],476);
  assert.equal(endA[5],423);assert.equal(endB[5],423);
});
test('The yellow eye looks up/down through a restrained rotation around a fixed pivot', () => {
  const {anatomyLook}=require('../field-math.js');
  assert.equal(anatomyLook(400,400,500),0);
  const up=anatomyLook(0,400,500),down=anatomyLook(800,400,500);
  assert.ok(up>0&&up<=2.8);assert.ok(down<0&&down>=-2.8);
  const frontY=407.299+(1024.41-1192.88)*Math.sin(up*Math.PI/180);
  assert.ok(frontY<407.299&&frontY>398);
});
test('Visual snow has both light and dark softened noise, changing with time and view', () => {
  const {snowSeed,snowPixels}=require('../field-math.js');
  const seed=snowSeed(2,0,0),a=snowPixels(seed),b=snowPixels(snowSeed(2.1,0,0)),c=snowPixels(snowSeed(2,.1,0));
  assert.notDeepEqual(a,b);assert.notDeepEqual(a,c);assert.deepEqual(a,snowPixels(seed));
  let light=0,dark=0;
  for(let i=0;i<a.length;i+=4)if(a[i+3])a[i]>128?light++:dark++;
  assert.ok((light+dark)/(a.length/4)>.6&&(light+dark)/(a.length/4)<.7);assert.ok(light>1000&&dark>1000);
});
test('Floaters wander independently in opposite directions even with a stationary view', () => {
  const {floaterPosition}=require('../field-math.js');
  const p={x:.5,y:.5,vx:.01,vy:0,speed:0,phase:0};
  const a=floaterPosition(p,3),b=floaterPosition({...p,vx:-.01},3);
  assert.ok(a.x>.5&&b.x<.5);
  const shifted=floaterPosition(p,3,{x:.04,y:0},{yaw:1,pitch:0});
  assert.ok(Math.abs(shifted.x-a.x)<.03,'Floater response is weaker than a rigid view attachment');
});
