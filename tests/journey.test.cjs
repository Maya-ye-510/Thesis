const test=require('node:test');
const assert=require('node:assert/strict');
const {whiteBalance,temperatureMatrix}=require('../field-math.js');
require('../perspective-content.js');
const Journey=require('../journey-content.js');
test('White balance retains a blue background while moving between cool and warm illumination',()=>{
 const blue='#152bac',rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 assert.equal(whiteBalance(blue,0),blue);
 const cold=rgb(whiteBalance(blue,-1)),warm=rgb(whiteBalance(blue,1));
 assert.ok(warm[0]/warm[2]>cold[0]/cold[2]);
 for(const result of[cold,warm])assert.ok(result[2]>result[0]&&result[2]>result[1],'The background must remain blue');
 assert.equal(temperatureMatrix(100).tone,1);assert.equal(temperatureMatrix(-100).tone,-1);
 assert.deepEqual(temperatureMatrix(0).gain,[1,1,1]);
});
test('The three topic notes combine the current selection, subtype and lighting rather than repeating condition sections',()=>{
 const entries=[{id:'myopia'},{id:'hemianopia'}];
 assert.match(Journey.combined(entries,'structure'),/distant outlines/);
 assert.match(Journey.combined(entries,'structure'),/Partial outlines/);
 assert.match(Journey.combined(entries,'field',{details:{hemianopia:'right'}}),/on the right/);
 assert.match(Journey.combined([{id:'colour'}],'color',{tone:-.6,details:{colour:'tritan'}}),/blue–yellow/i);
 assert.match(Journey.combined(entries,'color',{tone:.6}),/warmer cast/);
 assert.equal(new Set(Object.values(Journey.photographs)).size,6);
 for(const id of Object.keys(Journey.photographs)){const extended=Journey.study(id),original=globalThis.PerspectiveContent.notes[id];assert.ok(extended.intro.length-original.intro.length>120);assert.ok(extended.impact.length-original.perspective.length>120);}
});

const SceneStudy=require('../scene-study.js');
test('Scene viewing stays bounded through repeated dragging and keyboard steps',()=>{
 assert.deepEqual(SceneStudy.pose(0,0),{x:0,y:0,yaw:0,pitch:0});
 assert.deepEqual(SceneStudy.pose(100,-100),{x:1,y:-1,yaw:3,pitch:2});
 assert.notEqual(SceneStudy.pose(.7,.3).yaw,SceneStudy.pose(-.7,.3).yaw);
 const entries=[{id:'myopia'},{id:'snow'}];
 assert.equal(new Set(['structure','color','field'].map(kind=>Journey.combined(entries,kind).split('.')[0])).size,3);
});

const TopicMotion=require('../topic-motion.js');
test('Topic motion eases out continuously and interpolates colours between the Figma endpoints',()=>{
 assert.equal(TopicMotion.easeOut(0),0);assert.equal(TopicMotion.easeOut(1),1);
 const values=Array.from({length:21},(_,i)=>TopicMotion.easeOut(i/20));
 assert.ok(values.every((v,i)=>i===0||v>=values[i-1]));assert.ok(TopicMotion.easeOut(.5)>.5);
 assert.equal(TopicMotion.color('#8DCCFF','#FF8787',0),'rgb(141,204,255)');
 assert.equal(TopicMotion.color('#8DCCFF','#FF8787',1),'rgb(255,135,135)');
 assert.equal(TopicMotion.color('white','black',.5),'rgb(128,128,128)');
});
