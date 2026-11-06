(function(root){
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const CONDITIONS=[
    {id:'normal',name:'Normal',default:'nov4/normal.svg',hover:'d87c9.svg',selected:'4f20c.svg'},
    {id:'myopia',name:'Myopia',default:'nov4/myopia.svg',hover:'95338.svg',selected:'65769.svg'},
    {id:'colour',name:'Color Blind',default:'nov4/colour.svg',hover:'nov5/colour-hover.svg',selected:'nov5/colour-selected.svg',options:[{value:'deutan',label:'Red–green · Deuteranopia'},{value:'protan',label:'Red–green · Protanopia'},{value:'tritan',label:'Blue–yellow'},{value:'weak',label:'Color weakness'}]},
    {id:'astigmatism',name:'Astigmatism',default:'nov4/snow.svg',hover:'nov5/astigmatism-hover.svg',selected:'nov5/astigmatism-selected.svg'},
    {id:'snow',name:'Visual Snow',default:'nov4/snow.svg',hover:'59035.svg',selected:'3d3a2.svg'},
    {id:'hemianopia',name:'Hemianopia',default:'nov4/snow.svg',hover:'nov5/hemianopia-hover.svg',selected:'nov5/hemianopia-selected.svg',options:[{value:'left',label:'Left visual field'},{value:'right',label:'Right visual field'},{value:'side',label:'Side · central view'}]}
  ];
  class ConditionSelection{
    constructor(){this.selected=new Set();this.details={colour:'deutan',hemianopia:'left'};}
    toggle(id){if(!CONDITIONS.some(c=>c.id===id))return;if(id==='normal'){const chosen=this.selected.has(id);this.selected.clear();if(!chosen)this.selected.add(id);return;}this.selected.delete('normal');this.selected.has(id)?this.selected.delete(id):this.selected.add(id);}
    setDetail(id,value){const c=CONDITIONS.find(c=>c.id===id);if(!c?.options?.some(o=>o.value===value))return;this.details[id]=value;this.selected.delete('normal');this.selected.add(id);}
    entries(){return CONDITIONS.filter(c=>this.selected.has(c.id)).map(c=>({...c,detail:c.options?.find(o=>o.value===this.details[c.id])?.label||''}));}
    reset(){this.selected.clear();this.details={colour:'deutan',hemianopia:'left'};}
  }
  const CROP_ASPECT=466/662;
  function initialCrop(bounds){const height=Math.min(bounds.height*.8,bounds.width*.8/CROP_ASPECT);const width=height*CROP_ASPECT;return{x:(bounds.width-width)/2,y:(bounds.height-height)/2,width,height};}
  function moveCrop(rect,dx,dy,bounds){return{...rect,x:clamp(rect.x+dx,0,Math.max(0,bounds.width-rect.width)),y:clamp(rect.y+dy,0,Math.max(0,bounds.height-rect.height))};}
  function resizeCrop(rect,dx,dy,corner,bounds){
    const sx=corner.includes('w')?-1:1,sy=corner.includes('n')?-1:1;
    const ax=sx<0?rect.x+rect.width:rect.x,ay=sy<0?rect.y+rect.height:rect.y;
    const maxH=Math.max(0,Math.min(sy<0?ay:bounds.height-ay,(sx<0?ax:bounds.width-ax)/CROP_ASPECT));
    const delta=(dx*sx*CROP_ASPECT+dy*sy)/(CROP_ASPECT*CROP_ASPECT+1);
    const height=clamp(rect.height+delta,Math.min(140,maxH),maxH),width=height*CROP_ASPECT;
    return{x:sx<0?ax-width:ax,y:sy<0?ay-height:ay,width,height};
  }
  function cropLens(sourceWidth,sourceHeight,rect){return{sourceWidth,sourceHeight,crop:{...rect},focalRatio:Math.min(sourceWidth,sourceHeight)*.8/rect.width,centerX:(sourceWidth/2-rect.x)/rect.width,centerY:(sourceHeight/2-rect.y)/rect.height,sizeRatio:1/rect.width};}
  const api={CONDITIONS,ConditionSelection,CROP_ASPECT,initialCrop,moveCrop,resizeCrop,cropLens};root.SeeFlow=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
