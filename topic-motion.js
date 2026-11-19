/* Morph the original Figma geometry in one visible SVG, including interrupted hovers. */
(function(root){
 'use strict';
 const numbers=/[-+]?(?:\d*\.)?\d+(?:[eE][-+]?\d+)?/g;
 const mix=(a,b,p)=>a+(b-a)*p;
 const rgb=value=>{const named={white:'#ffffff',black:'#000000'};value=named[value]||value;return [1,3,5].map(i=>parseInt(value.slice(i,i+2),16));};
 const color=(a,b,p)=>{const x=rgb(a),y=rgb(b);return 'rgb('+x.map((v,i)=>Math.round(mix(v,y[i],p))).join(',')+')';};
 function easeOut(progress){if(progress<=0)return 0;if(progress>=1)return 1;let lo=0,hi=1,t=progress;for(let i=0;i<18;i++){t=(lo+hi)/2;const x=3*(1-t)*t*t*.58+t*t*t;if(x<progress)lo=t;else hi=t;}return 3*(1-t)*t*t+t*t*t;}
 function bounds(path){const n=(path.match(numbers)||[]).map(Number),x=n.filter((_,i)=>i%2===0),y=n.filter((_,i)=>i%2===1);return{x:Math.min(...x),y:Math.min(...y),w:Math.max(...x)-Math.min(...x),h:Math.max(...y)-Math.min(...y)};}
 class TopicMotion{
  constructor(card){
   this.card=card;this.progress=0;this.raf=0;this.reduce=matchMedia('(prefers-reduced-motion: reduce)');
   const from=card.querySelector('.art-state.default svg'),to=card.querySelector('.art-state.hover svg');this.svg=to.cloneNode(true);
   const ids=new Map();this.svg.querySelectorAll('[id]').forEach(n=>{const old=n.id;ids.set(old,old+'-live');n.id=old+'-live';});
   this.svg.querySelectorAll('*').forEach(n=>{for(const a of [...n.attributes])if(a.value.includes('url(#'))n.setAttribute(a.name,a.value.replace(/url\(#([^)]*)\)/g,(_,id)=>'url(#'+(ids.get(id)||id)+')'));});
   const wrapper=document.createElement('span');wrapper.className='topic-live';const scale=document.createElement('span');scale.className='perspective-vector';scale.append(this.svg);wrapper.append(scale);card.append(wrapper);
   card.querySelectorAll('.art-state').forEach(layer=>layer.style.visibility='hidden');
   this.tracks=[];this.svg.querySelectorAll('[data-motion-key]').forEach(node=>{
    const key=node.dataset.motionKey,a=from.querySelector('[data-motion-key="'+key+'"]'),b=to.querySelector('[data-motion-key="'+key+'"]');if(!a||!b)return;
    const attrs=node.tagName==='circle'?['cx','cy','r','fill']:['stroke-width','stroke'];
    for(const attr of attrs){const av=a.getAttribute(attr),bv=b.getAttribute(attr);if(av!==null&&bv!==null)this.tracks.push({node,attr,a:av,b:bv,color:attr==='fill'||attr==='stroke'});}
    if(node.tagName==='circle'){
     const filterFor=(svg,circle)=>{const ref=circle.closest('g[filter]')?.getAttribute('filter').match(/url\(#([^)]*)\)/)?.[1];return ref?svg.querySelector('[id="'+ref+'"]'):null;};
     const af=filterFor(from,a),bf=filterFor(to,b),live=filterFor(this.svg,node);
     if(af&&bf&&live)for(const attr of['x','y','width','height'])this.tracks.push({node:live,attr,a:af.getAttribute(attr),b:bf.getAttribute(attr)});
    }
    if(node.tagName==='path'){
     const ad=a.getAttribute('d'),bd=b.getAttribute('d'),an=(ad.match(numbers)||[]).map(Number),bn=(bd.match(numbers)||[]).map(Number);
     if(an.length===bn.length)this.tracks.push({node,attr:'d',a:an,b:bn,template:bd});
     else this.tracks.push({node,boxA:bounds(ad),boxB:bounds(bd)});
    }
   });
   this.veils=[...this.svg.children].filter(n=>n.tagName==='rect'&&Number(n.getAttribute('fill-opacity'))===.55);
   if(card.dataset.perspectiveCard==='structure')this.svg.querySelectorAll('rect[stroke]').forEach(n=>n.removeAttribute('stroke'));
   this.render(0);card.topicMotion=this;
  }
  render(progress){this.progress=progress;this.card.dataset.motionProgress=progress.toFixed(3);
   for(const track of this.tracks){const {node}=track;
    if(track.boxA){const a=track.boxA,b=track.boxB,sx=mix(a.w/b.w,1,progress),sy=mix(a.h/b.h,1,progress);node.setAttribute('transform',`matrix(${sx} 0 0 ${sy} ${mix(a.x-b.x*a.w/b.w,0,progress)} ${mix(a.y-b.y*a.h/b.h,0,progress)})`);}
    else if(track.template){let i=0;node.setAttribute('d',track.template.replace(numbers,()=>String(mix(track.a[i],track.b[i++],progress))));}
    else node.setAttribute(track.attr,track.color?color(track.a,track.b,progress):mix(Number(track.a),Number(track.b),progress));
   }
   this.veils.forEach(n=>n.setAttribute('fill-opacity',.55*progress));
  }
  to(open){const target=open?1:0;cancelAnimationFrame(this.raf);this.raf=0;this.card.dataset.artState=open?'hover':'default';if(this.reduce.matches){this.render(target);return;}const from=this.progress,start=performance.now();
   const tick=now=>{const t=Math.min(1,(now-start)/300);this.render(mix(from,target,easeOut(t)));if(t<1)this.raf=requestAnimationFrame(tick);else this.raf=0;};this.raf=requestAnimationFrame(tick);
  }
  destroy(){cancelAnimationFrame(this.raf);}
 }
 TopicMotion.easeOut=easeOut;TopicMotion.color=color;root.TopicMotion=TopicMotion;if(typeof module!=='undefined'&&module.exports)module.exports=TopicMotion;
})(globalThis);
