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
 assert.match(Journey.combined(entries,'structure'),/near and distant clarity/);
 assert.match(Journey.combined(entries,'structure'),/partly available outlines/);
 assert.match(Journey.combined(entries,'field',{details:{hemianopia:'right'}}),/on the right/);
 assert.match(Journey.combined([{id:'colour'}],'color',{tone:-.6,details:{colour:'tritan'}}),/blue–yellow/);
 assert.match(Journey.combined(entries,'color',{tone:.6}),/warmer cast/);
 assert.equal(new Set(Object.values(Journey.photographs)).size,6);
 for(const id of Object.keys(Journey.photographs)){const extended=Journey.study(id),original=globalThis.PerspectiveContent.notes[id];assert.ok(extended.intro.length-original.intro.length>120);assert.ok(extended.impact.length-original.perspective.length>120);}
});
