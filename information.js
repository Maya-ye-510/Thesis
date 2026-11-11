/* A finite set of unique photographs and independent text fragments, wrapped into an endless scroll. */
(function(root){
 'use strict';
 const sources={
  myopia:{title:'National Eye Institute · Myopia',url:'https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/nearsightedness-myopia'},
  astigmatism:{title:'National Eye Institute · Astigmatism',url:'https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/astigmatism'},
  colour:{title:'National Eye Institute · Color vision differences',url:'https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/color-blindness/types-color-vision-deficiency'},
  snow:{title:'Puledda et al., Neurology, 2020 · 1,100 cases',url:'https://pubmed.ncbi.nlm.nih.gov/31941797/'},
  hemianopia:{title:'RNIB · Stroke-related eye conditions',url:'https://www.rnib.org.uk/your-eyes/eye-conditions-az/stroke-related-eye-conditions/'},
  acuity:{title:'American Academy of Ophthalmology · Visual acuity',url:'https://www.aao.org/eye-health/glasses-contacts/what-does-20-20-vision-mean'},
  prevalence:{title:'Holden et al., Ophthalmology, 2016 · Model projections',url:'https://pubmed.ncbi.nlm.nih.gov/26875007/'},
 };
 const photos=root.SeePhotographs||(typeof module!=='undefined'?require('./photography.js'):null);
 const {studies}=root.SeeInformationContent||(typeof module!=='undefined'?require('./information-content.js'):null);
 const layout=root.InformationLayout||(typeof module!=='undefined'?require('./information-layout.js'):null);
 const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const wrap=(value,length)=>((value%length)+length)%length;
 class SeeingInformation{
  constructor(view,onOptics){
   this.view=view;this.track=view.querySelector('#information-track');this.onOptics=onOptics;this.offset=0;this.target=0;this.cycle=layout.CYCLE;this.raf=0;this.active=false;this.nodes=[];this.reduce=matchMedia('(prefers-reduced-motion: reduce)');
   view.addEventListener('wheel',e=>{if(!this.active||e.ctrlKey)return;e.preventDefault();this.scrollBy(e.deltaY*(e.deltaMode===1?18:e.deltaMode===2?innerHeight:1));},{passive:false});
   let touch=null;view.addEventListener('touchstart',e=>{touch=e.touches[0]?.clientY??null;},{passive:true});view.addEventListener('touchmove',e=>{if(touch===null||!this.active)return;const y=e.touches[0].clientY;e.preventDefault();this.scrollBy((touch-y)*1.2);touch=y;},{passive:false});view.addEventListener('touchend',()=>touch=null,{passive:true});
   view.addEventListener('keydown',e=>{if(e.target!==view)return;const amount=({ArrowDown:90,ArrowUp:-90,PageDown:innerHeight*.7,PageUp:-innerHeight*.7,' ':innerHeight*.7})[e.key];if(e.key==='Home'){e.preventDefault();this.target=this.offset=0;this.paint();return;}if(amount){e.preventDefault();this.scrollBy(e.shiftKey&&e.key===' '?-amount:amount);}});
   view.addEventListener('focusin',e=>{const el=e.target.closest('[data-feed-id]');if(!el)return;const r=el.getBoundingClientRect(),v=view.getBoundingClientRect();if(r.top<v.top+170||r.bottom>v.bottom)this.scrollBy(r.top-v.top-200);});
   addEventListener('resize',()=>this.paint());document.fonts?.ready.then(()=>this.paint());
  }
  setActive(active){this.active=active;if(!active){cancelAnimationFrame(this.raf);this.raf=0;}else this.paint();}
  show(id,details={}){
   if(this.raf)cancelAnimationFrame(this.raf);this.raf=0;this.id=id;this.details=details;const data=studies[id];this.target=this.offset=0;this.selectedIndex=null;this.hoverReady=performance.now()+(this.reduce.matches?0:700);this.nodes=[];this.track.replaceChildren();
   this.view.setAttribute('aria-label',`${id==='snow'?'Visual Snow':id} photographs and information. Eight different photographs. Scroll up or down; content loops.`);
   const add=(el,role,index=0,width=349)=>{const item={id:role==='source'?'source':role+'-'+index,role,index,width,height:role==='photo'?photos[data.cards[index].image].height:undefined,el};el.classList.add('information-item');el.dataset.feedId=item.id;el.style.setProperty('--type-size','16');this.track.append(el);this.nodes.push(item);};
   data.cards.forEach((card,index)=>{
    const p=photos[card.image],figure=document.createElement('figure');figure.className='information-photo';figure.tabIndex=0;figure.dataset.photo=index;figure.dataset.source=card.image;figure.setAttribute('aria-label',card.label+'. '+card.text);
    const box=document.createElement('div');box.className='photo-image '+card.effect;box.dataset.hemisphere=details.hemianopia||'left';box.style.aspectRatio=`${p.width} / ${p.height}`;
    if(card.effect.includes('selected-colour'))box.style.setProperty('--photo-filter',`url(#preview-${details.colour||'deutan'})`);
    const img=document.createElement('img');img.src=`assets/nov10/photos/${card.image}.webp?v=20261110-depth-1`;img.alt=p.title;img.width=p.width*3;img.height=p.height*3;img.draggable=false;img.decoding='async';box.append(img);
    if(card.effect.includes('snow-photo')){const noise=document.createElement('span');noise.className='photo-noise';noise.style.animationDelay=(-index*.17)+'s';noise.setAttribute('aria-hidden','true');box.append(noise);}
    if(card.effect.includes('floaters-photo')){const floaters=document.createElement('span');floaters.className='photo-floaters';floaters.style.setProperty('--floater-delay',(-index*2.3)+'s');floaters.setAttribute('aria-hidden','true');floaters.innerHTML='<i></i><i></i><i></i>';box.append(floaters);}
    if(card.effect.includes('afterimage-photo')){const trace=document.createElement('span');trace.className='photo-afterimage';trace.style.backgroundImage=`url("${img.src}")`;trace.setAttribute('aria-hidden','true');box.append(trace);}
    figure.append(box);const hover=()=>{if(performance.now()>=this.hoverReady)this.select(card,index);};figure.addEventListener('pointerenter',hover);figure.addEventListener('pointermove',hover);figure.addEventListener('focus',()=>this.select(card,index));add(figure,'photo',index,p.width);
   });
   const blocks=[data.intro,data.cards[0].text,data.facts[0],data.cards[1].text,data.cards[2].text,data.facts[1],data.cards[3].text,data.facts[2],data.cards[4].text,data.facts[3],data.cards[5].text,data.facts[4],data.cards[6].text,data.facts[5],data.cards[7].text,data.facts[6]];
   blocks.forEach((body,index)=>{const p=document.createElement('p');p.className='information-prose'+(index===15?' information-question':'');p.textContent=body;add(p,'text',index);});
   data.stats.forEach((stat,index)=>{const el=document.createElement('div');el.className='information-stat';const big=document.createElement('span');big.textContent=stat[0];big.className=/[0-9½∞≠]/.test(stat[0])?'numeric-stat':'word-stat';const caption=document.createElement('p');caption.textContent=stat[1];const small=document.createElement('small');small.textContent=stat[2];el.append(big,caption,small);if(id==='myopia'){const a=document.createElement('a');a.href=sources.prevalence.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Study ↗';el.append(a);}add(el,'stat',index);});
   const source=document.createElement('p');source.className='information-source';if(sources[id]){const a=document.createElement('a');a.href=sources[id].url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=sources[id].title+' ↗';source.append(a);}const credits=document.createElement('button');credits.textContent='Photography & sources ↗';credits.onclick=()=>document.querySelector('#about-dialog').showModal();source.append(credits);add(source,'source');
   this.select(data.cards[0],0);this.paint();
  }
  select(card,index){if(this.selectedIndex===index)return;this.selectedIndex=index;this.view.dataset.activePhoto=index;this.onOptics({focus:card.focus,spread:card.spread,label:card.label});}
  scrollBy(pixels){this.target+=pixels/(this.scale||1);if(this.reduce.matches){this.offset=this.target;this.normalise();this.paint();return;}if(!this.raf)this.raf=requestAnimationFrame(()=>this.tick());}
  normalise(){const shift=Math.floor(this.offset/this.cycle)*this.cycle;this.offset-=shift;this.target-=shift;}
  tick(){this.raf=0;if(!this.active)return;this.offset+=(this.target-this.offset)*.22;if(Math.abs(this.target-this.offset)<.1)this.offset=this.target;this.normalise();this.paint();if(Math.abs(this.target-this.offset)>.1)this.raf=requestAnimationFrame(()=>this.tick());}
  paint(){
   if(!this.nodes.length)return;const mobile=innerWidth<=700,wasMobile=this.mobile,fraction=this.offset/this.cycle;this.mobile=mobile;this.scale=mobile?1:Math.min(innerWidth/1421,innerHeight/832);
   this.track.style.setProperty('--information-scale',this.scale);this.track.style.transform=`scale(${this.scale})`;
   const mobileWidth=mobile?this.view.clientWidth:null;
   for(const item of this.nodes){const plan=layout.plan(item,this.id,mobileWidth);item.el.style.width=plan.w+'px';}
   const placed=layout.arrange(this.nodes.map(item=>({...item,h:item.el.offsetHeight})),this.id,mobileWidth);this.cycle=placed.cycle;
   if(wasMobile!==undefined&&wasMobile!==mobile){this.offset=fraction*this.cycle;this.target=this.offset;}
   this.view.dataset.loopPosition=wrap(this.offset,this.cycle).toFixed(1);this.view.dataset.loopExtent=this.cycle.toFixed(1);this.view.dataset.photoCount=studies[this.id].cards.length;this.view.dataset.textCount='16';
   for(const item of placed.items){const top=wrap(item.y-this.offset+520,this.cycle)-520;item.el.style.left=item.x+'px';item.el.style.top=top+'px';item.el.dataset.feedY=item.y;const band=mobile?[90,155]:[110,205],overlap=Math.max(0,Math.min(top+item.h,band[1])-Math.max(top,band[0]));item.el.style.opacity=item.x<(mobile?190:240)?String(1-.72*Math.min(1,overlap/Math.min(item.h,85))):'1';}
  }
  static credits(){return '<h2>Real photography</h2>'+Object.values(photos).map(p=>`<p><a href="${escape(p.url)}" target="_blank" rel="noopener noreferrer">${escape(p.title)}</a> — ${escape(p.author)} · <a href="${escape(p.licenseUrl)}" target="_blank" rel="noopener noreferrer">${escape(p.license)}</a>. Cropped and optically processed; adaptations retain the photograph’s licence.</p>`).join('')+'<h2>Research</h2>'+Object.values(sources).map(p=>`<p><a href="${escape(p.url)}" target="_blank" rel="noopener noreferrer">${escape(p.title)} ↗</a></p>`).join('');}
 }
 SeeingInformation.studies=studies;SeeingInformation.photos=photos;SeeingInformation.wrap=wrap;root.SeeingInformation=SeeingInformation;if(typeof module!=='undefined'&&module.exports)module.exports=SeeingInformation;
})(globalThis);
