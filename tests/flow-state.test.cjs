const test = require('node:test');
const assert = require('node:assert/strict');
const {ConditionSelection, CROP_ASPECT, initialCrop, moveCrop, resizeCrop, cropLens} = require('../flow-state.js');
const {project, visionColour} = require('../field-math.js');
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-8, `${a} must equal ${b}`);

test('Subtypes select their parent, respect Normal exclusivity, and reset for a new trip', () => {
  const s = new ConditionSelection();
  s.toggle('normal'); s.setDetail('colour','protan'); s.toggle('myopia');
  assert.deepEqual([...s.selected], ['colour','myopia']);
  assert.equal(s.entries().find(c=>c.id==='colour').detail,'Red–green · Protanopia');
  s.setDetail('hemianopia','right'); s.setDetail('colour','invalid');
  assert.equal(s.details.colour,'protan');
  s.toggle('normal'); assert.deepEqual([...s.selected],['normal']);
  s.reset(); assert.equal(s.entries().length,0);
  assert.deepEqual(s.details,{colour:'deutan',hemianopia:'left'});
});
test('Every crop corner preserves the portrait aspect, opposite anchor, and scene bounds', () => {
  for (const bounds of [{width:1294,height:577},{width:350,height:560}]) {
    const r=initialCrop(bounds); near(r.width/r.height,CROP_ASPECT);
    const moved=moveCrop(r,-10000,10000,bounds);
    near(moved.x,0); near(moved.y+moved.height,bounds.height);
    for (const corner of ['nw','ne','sw','se']) for (const delta of [-10000,-50,35,10000]) {
      const n=resizeCrop(r,delta,delta,corner,bounds);
      near(n.width/n.height,CROP_ASPECT);
      near(n.x+(corner.includes('w')?n.width:0),r.x+(corner.includes('w')?r.width:0));
      near(n.y+(corner.includes('n')?n.height:0),r.y+(corner.includes('n')?r.height:0));
      assert.ok(n.x>=-1e-8 && n.y>=-1e-8 && n.x+n.width<=bounds.width+1e-8 && n.y+n.height<=bounds.height+1e-8);
    }
  }
});
test('Result projection reproduces exactly the selected off-centre scene at any display size', () => {
  const source={width:1294,height:577}, rect={x:180,y:37,width:300,height:300/CROP_ASPECT};
  const camera={yaw:.4,pitch:-.12,zoom:-2.3};
  for (const width of [220,466,620]) {
    const height=width/CROP_ASPECT, scale=width/rect.width;
    for (const point of [{x:1,y:.4,z:8},{x:-2,y:-.8,z:12},{x:3,y:2,z:7}]) {
      const original=project(point,camera,source.width,source.height);
      const result=project(point,{...camera,lens:cropLens(source.width,source.height,rect)},width,height);
      near(result.x,(original.x-rect.x)*scale); near(result.y,(original.y-rect.y)*scale);
      near(result.size,original.size*scale); near(result.distance,original.distance);
      assert.equal(result.visible,original.visible);
    }
  }
});
test('Colour subtypes preserve neutral colours while producing distinct views of the same image', () => {
  const views=new Set();
  for (const type of ['deutan','protan','tritan','weak']) {
    assert.equal(visionColour('#808080',type),'#808080');
    views.add(visionColour('#ff563b',type));
  }
  assert.equal(views.size,4);
});
