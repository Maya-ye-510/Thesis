const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Information=require('../information.js');
const Layout=require('../information-layout.js');
test('Infinite scroll wraps forwards and backwards over the longer editorial sequence',()=>{
 const n=Layout.CYCLE,wrap=Information.wrap;assert.ok(n>=6200);
 for(const y of [-987654,-n,-1,0,1,n,987654]){assert.ok(wrap(y,n)>=0&&wrap(y,n)<n);assert.equal(wrap(y+n*4,n),wrap(y,n));}
 assert.equal(wrap(n+52,n),52);assert.equal(wrap(-52,n),n-52);
});
test('All 48 studies use different photographs, including across different conditions',()=>{
 const ids=[],originals=[],hashes=[];
 for(const id of ['normal','myopia','colour','astigmatism','snow','hemianopia']){
  const data=Information.studies[id];assert.equal(data.cards.length,8);assert.equal(data.facts.length,7);assert.equal(1+data.cards.length+data.facts.length,16);
  for(const card of data.cards){const photo=Information.photos[card.image];assert.ok(photo);assert.equal(photo.condition,id);assert.ok(fs.existsSync(path.join(__dirname,'../assets/nov10/photos',card.image+'.webp')));assert.ok(card.text.length>55);ids.push(card.image);originals.push(photo.originalUrl);hashes.push(photo.sourceSha256);}
 }
 assert.equal(new Set(ids).size,48);assert.equal(new Set(originals).size,48);assert.equal(new Set(hashes).size,48);
});
test('Every photograph identifies a human photographer, pre-2021 publication and a reuse licence',()=>{
 for(const p of Object.values(Information.photos)){assert.ok(p.author.length>1);assert.ok(p.publishedBefore<'2021');assert.match(p.url,/^https:\/\/commons.wikimedia.org\/wiki\/File:/);assert.match(p.license,/CC|Public domain/);assert.match(p.licenseUrl,/^https:/);}
});
test('Every myopia photograph has an individual depth mask, rather than a whole-image blur setting',()=>{
 const masks=[];for(const card of Information.studies.myopia.cards){const d=Information.photos[card.image].depth;assert.ok(d&&d.sigma>0);assert.ok(d.polygons.length||d.gradientPolygons?.length);assert.ok(d.near&&d.far);assert.notDeepEqual(d.near,d.far);masks.push(JSON.stringify(d));}
 assert.equal(new Set(masks).size,8);
});
test('Editorial placement preserves image/text sizes, separates overlaps and differs by condition',()=>{
 const items=[...Array.from({length:8},(_,index)=>({id:'photo-'+index,role:'photo',index,width:index%2?280:188,h:index%2?186:250})),...Array.from({length:16},(_,index)=>({id:'text-'+index,role:'text',index,width:349,h:110})),...Array.from({length:2},(_,index)=>({id:'stat-'+index,role:'stat',index,width:349,h:200})),{id:'source',role:'source',index:0,width:300,h:70}];
 const signatures=new Set();
 for(const condition of Object.keys(Information.studies)){
  const result=Layout.arrange(items,condition);assert.ok(result.cycle>=6200);signatures.add(JSON.stringify(result.items.map(p=>[p.x,p.y])));
  for(const a of result.items){assert.ok(a.x>=0&&a.x+a.w<=Layout.WIDTH);for(const b of result.items){if(a===b)continue;assert.ok(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),'Overlapping '+a.id+' / '+b.id);}}
  const phone=Layout.arrange(items,condition,327);assert.ok(phone.cycle>4500);for(const item of phone.items)assert.ok(item.x>=0&&item.x+item.w<=327);
 }
 assert.equal(signatures.size,6);
});
