/* Editorial positions use the original 1421 × 832 Figma canvas as their coordinate space. */
(function(root){
 const WIDTH=770,CYCLE=6200;
 const photoY={myopia:[193,551,1260,1980,2860,3650,4590,6076],astigmatism:[210,700,1330,2140,2930,3760,4680,6076],colour:[190,635,1410,2220,3000,3810,4740,6076],snow:[200,650,1440,2200,3050,3800,4740,6076],hemianopia:[205,660,1360,2130,2920,3700,4640,6076],normal:[190,630,1400,2150,2940,3750,4670,6076]};
 const photoX={myopia:[69,134,483,210,415,69,360,442],astigmatism:[405,69,450,120,390,80,440,180],colour:[69,430,145,450,100,380,75,445],snow:[425,105,400,69,450,150,440,105],hemianopia:[69,420,160,445,75,405,130,435],normal:[400,69,430,120,390,80,445,170]};
 const textX=[69,372,69,450,69,360,483,85,69,350,390,215,69,360,69,400];
 const textY=[5850,735,1217,1020,1570,1790,2150,2490,2960,3280,3730,4080,4550,5000,5540,5750];
 const textW=[349,349,349,230,260,280,230,349,260,300,300,349,230,300,300,270];
 const mobileOrder=['text-0','photo-0','text-1','text-2','stat-0','photo-1','text-3','text-5','photo-2','text-4','text-7','photo-3','text-6','stat-1','photo-4','text-8','text-9','photo-5','text-10','text-11','photo-6','text-12','text-13','photo-7','text-14','text-15','source'];
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function plan(item,condition,mobileWidth=null){
  const mobile=mobileWidth!==null,mirror=['astigmatism','snow','normal'].includes(condition);let x,y,w;
  if(item.role==='photo'){w=item.width;x=photoX[condition][item.index];y=item.index===7?CYCLE-Math.max(40,(item.height??item.h??250)-126):photoY[condition][item.index];}
  else if(item.role==='text'){w=textW[item.index];x=textX[item.index];y=textY[item.index];if(mirror)x=WIDTH-w-x;}
  else if(item.role==='stat'){w=349;x=item.index?78:362;y=item.index?914:303;if(mirror)x=WIDTH-w-x;}
  else{w=300;x=mirror?401:69;y=5940;}
  if(mobile){w=item.role==='photo'?Math.min(item.width,mobileWidth-32):mobileWidth-(item.role==='text'&&item.index%3===2?56:32);x=item.role==='photo'?[16,Math.max(16,mobileWidth-w-16),(mobileWidth-w)/2][item.index%3]:item.role==='text'&&item.index%3===2?40:16;y=0;}
  return{...item,x:clamp(x,0,(mobile?mobileWidth:WIDTH)-w),y,w};
 }
 function arrange(items,condition,mobileWidth=null){
  const mobile=mobileWidth!==null,result=items.map(item=>plan(item,condition,mobileWidth));
  if(mobile){let y=180;const map=new Map(result.map(item=>[item.id,item]));for(const id of mobileOrder){const item=map.get(id);if(!item)continue;item.y=y;y+=item.h+(item.role==='photo'?70:86);}return{items:result,cycle:y+48};}
  const sorted=[...result].sort((a,b)=>a.y-b.y),placed=[];
  for(const item of sorted){let changed=true;while(changed){changed=false;for(const prev of placed){if(item.x<prev.x+prev.w+16&&item.x+item.w+16>prev.x&&item.y<prev.y+prev.h+32&&item.y+item.h+32>prev.y){item.y=prev.y+prev.h+32;changed=true;}}}placed.push(item);}
  const peek=result.find(item=>item.id==='photo-7');const cycle=Math.max(CYCLE,(peek?.y??6076)+Math.max(40,(peek?.h??250)-126));
  return{items:result,cycle};
 }
 const api={WIDTH,CYCLE,plan,arrange};root.InformationLayout=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
