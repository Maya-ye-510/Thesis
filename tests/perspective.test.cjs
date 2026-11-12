const test=require('node:test');
const assert=require('node:assert/strict');
const {progressAt,duration,hold,transition,notes}=require('../perspective-content.js');
const {CONDITIONS,ConditionSelection}=require('../flow-state.js');
test('Analysis progresses monotonically from 0 to 100 with ease-out over 1000ms, then holds for 500ms',()=>{
 assert.equal(duration,1000);assert.equal(hold,500);assert.equal(transition,500);
 assert.equal(progressAt(-1),0);assert.equal(progressAt(0),0);assert.equal(progressAt(500),75);assert.equal(progressAt(999),99);assert.equal(progressAt(1000),100);
 assert.ok(progressAt(250)-progressAt(0)>progressAt(1000)-progressAt(750),'Earlier increments must be larger than later increments');assert.equal(progressAt(10000),100);
 let last=0;for(let t=0;t<=1000;t++){const value=progressAt(t);assert.ok(value>=last&&value<=100);last=value;}
});
test('Every selectable condition has its own introduction and three perspective notes; a new trip does not retain old sections',()=>{
 const seen=new Set();
 for(const condition of CONDITIONS){const copy=notes[condition.id];assert.ok(copy);for(const kind of ['intro','perspective','structure','color','field']){assert.ok(copy[kind].length>80);assert.ok(!seen.has(copy[kind]));seen.add(copy[kind]);}}
 const selected=new ConditionSelection();selected.toggle('myopia');selected.toggle('snow');assert.deepEqual(selected.entries().map(c=>c.id),['myopia','snow']);selected.reset();selected.toggle('normal');assert.deepEqual(selected.entries().map(c=>c.id),['normal']);
});
