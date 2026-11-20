const test=require('node:test');
const assert=require('node:assert/strict');
const {build,CLOSING}=require('../report-study.js');
const capture=(ids,focus=.5,tone=0,controls={})=>({entries:ids.map(id=>({id})),state:{focus,tone,controls},details:{colour:'deutan',hemianopia:'left'}});
test('Report combines myopia and snow as independent visual dimensions',()=>{
 const report=build(capture(['myopia','snow']));assert.match(report.conditions.body,/separate aspects/);assert.match(report.conditions.insight,/visual stability/);assert.equal(report.entries.length,2);
});
test('Every valid condition combination produces a 100–180 word summary and exactly the same closing paragraph',()=>{
 const ids=['myopia','snow','colour','astigmatism','hemianopia'];
 const combinations=[['normal'],...Array.from({length:31},(_,i)=>ids.filter((id,j)=>(i+1)&(1<<j)))];
 for(const selected of combinations)for(const focus of [.1,.5,.9])for(const tone of [-.8,0,.8])for(const controls of [{},{structure:true,motion:true}]){
  const report=build(capture(selected,focus,tone,controls)),count=report.summary.split(/\s+/).length;assert.ok(count>=100&&count<=180,selected+': '+count);assert.equal(report.closing,CLOSING);assert.doesNotMatch(report.summary,/\[|your ability|memory score/);
 }
});
test('Summary changes with selected conditions, viewing distance, lighting and interaction context',()=>{
 const summaries=['normal','myopia','snow','colour','astigmatism','hemianopia'].map(id=>build(capture([id])).summary);assert.equal(new Set(summaries).size,6);
 const close=build(capture(['normal'],.9)),mid=build(capture(['normal'],.5)),far=build(capture(['normal'],.1));assert.equal(new Set([close.summary,mid.summary,far.summary]).size,3);assert.equal(close.distance,'Close-range');assert.equal(mid.distance,'Mid-range');assert.equal(far.distance,'Far-range');
 const structural=build(capture(['myopia'],.4,.7,{structure:true,motion:true}));assert.match(structural.summary,/Added connections/);assert.match(structural.summary,/world can pause/);assert.match(structural.summary,/warm/);
});
test('A multi-condition summary includes the combined dimensions without altering the captured settings',()=>{
 const snapshot=capture(['myopia','snow','colour','hemianopia','astigmatism'],.4,.7,{structure:true}),original=JSON.stringify(snapshot),report=build(snapshot);assert.match(report.summary,/hues shift/);assert.match(report.summary,/part of the field/);assert.match(report.summary,/noise drifts/);assert.equal(JSON.stringify(snapshot),original);
});
