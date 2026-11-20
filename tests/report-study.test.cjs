const test=require('node:test');
const assert=require('node:assert/strict');
const {build}=require('../report-study.js');
const capture=(ids,focus=.5,tone=0,controls={})=>({entries:ids.map(id=>({id})),state:{focus,tone,controls},details:{colour:'deutan',hemianopia:'left'}});
test('Report combines myopia and snow as independent visual dimensions, rather than stacking diagnoses',()=>{
 const report=build(capture(['myopia','snow']));assert.match(report.conditions.body,/separate aspects/);assert.match(report.conditions.insight,/visual stability/);assert.match(report.question,/detail fades/);assert.equal(report.entries.length,2);
});
test('Report text changes with selected conditions and three viewing distances without assigning an ability score',()=>{
 const close=build(capture(['normal'],.9)),middle=build(capture(['normal'],.5)),far=build(capture(['normal'],.1));
 assert.equal(close.distance,'Close-range');assert.equal(middle.distance,'Mid-range');assert.equal(far.distance,'Far-range');assert.equal(new Set([close.focusCopy,middle.focusCopy,far.focusCopy]).size,3);
 const reports=['normal','myopia','snow','colour','astigmatism','hemianopia'].map(id=>build(capture([id])));
 assert.equal(new Set(reports.map(r=>r.conditions.body)).size,6);assert.equal(new Set(reports.map(r=>r.question)).size,6);
 for(const r of reports)assert.doesNotMatch(r.conditions.body+r.question,/your memory score|your ability|you are a .*thinker/i);
});
test('The diagram has deterministic source and cue positions, with myopia changing distant definition more than near definition',()=>{
 const record=capture(['myopia'],.3),a=build(record),b=build(record);assert.deepEqual(a.nodes,b.nodes);assert.equal(a.nodes.length,24);
 assert.ok(a.nodes.filter(n=>n.depth===1).every(n=>n.blur>0));assert.ok(a.nodes.filter(n=>n.depth===0).every(n=>n.blur===0));
 assert.ok(a.nodes.some(n=>n.x!==n.cueX));assert.equal(new Set(a.nodes.map(n=>n.group)).size,3);
 for(const n of a.nodes){assert.ok(n.cueX>0&&n.cueX<728);assert.ok(n.cueY>0&&n.cueY<145);}
});
test('Combined cues preserve the interaction context and never mutate the captured settings',()=>{
 const snapshot=capture(['colour','hemianopia','astigmatism'],.4,.7,{structure:true});const original=JSON.stringify(snapshot),report=build(snapshot);
 assert.match(report.conditions.body,/colour separation/);assert.match(report.conditions.body,/available field/);assert.match(report.cueNote,/Connections/);assert.equal(report.tone,.7);assert.equal(JSON.stringify(snapshot),original);
});
