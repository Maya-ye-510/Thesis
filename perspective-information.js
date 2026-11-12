(function(root){
 'use strict';
 const artwork=root.PerspectiveArtwork;
 function svgLayer(name,prefix){
  const markup=artwork[name].replace(/\sid="([^"]+)"/g,(_,id)=>` id="${prefix}-${id}"`).replace(/url\(#([^)]*)\)/g,(_,id)=>`url(#${prefix}-${id})`);
  const doc=new DOMParser().parseFromString(markup,'image/svg+xml'),svg=doc.documentElement;
  // The exported prose is replaced by the selected condition's accessible live text.
  svg.querySelectorAll('path').forEach(p=>{if((p.getAttribute('d')||'').length>120000)p.remove();});
  svg.querySelectorAll('circle').forEach((p,i)=>p.dataset.motionKey='circle-'+i);
  svg.querySelectorAll('path[stroke]').forEach((p,i)=>p.dataset.motionKey='line-'+i);
  svg.setAttribute('aria-hidden','true');return document.importNode(svg,true);
 }
 class PerspectiveInformation{
  constructor(view){this.view=view;this.track=view.querySelector('#information-track');this.active=false;}
  setActive(active){this.active=active;if(active)this.paint();}
  scrollBy(pixels){this.view.scrollBy({top:pixels,behavior:'auto'});}
  show(entries,details={}){
   this.track.replaceChildren();this.view.scrollTop=0;this.hoverReady=performance.now()+500;
   this.view.setAttribute('aria-label','How your selected visual conditions shape understanding');
   this.view.dataset.conditionCount=entries.length;
   entries.forEach((entry,index)=>{
    const data=PerspectiveContent.notes[entry.id],section=document.createElement('section');
    section.className='perspective-section';section.dataset.condition=entry.id;
    const heading=document.createElement('h2');heading.textContent=entry.name;heading.id='perspective-heading-'+entry.id;section.setAttribute('aria-labelledby',heading.id);section.append(heading);
    if(entry.detail){const sub=document.createElement('p');sub.className='perspective-subtype';sub.textContent=entry.detail;section.append(sub);}
    const intro=document.createElement('div');intro.className='perspective-introduction';
    for(const text of [data.intro,data.perspective]){const p=document.createElement('p');p.textContent=text;intro.append(p);}section.append(intro);
    const cards=document.createElement('div');cards.className='perspective-cards';
    ['structure','color','field'].forEach(kind=>{
     const title=kind==='field'?'Visual field':kind[0].toUpperCase()+kind.slice(1),card=document.createElement('button');card.type='button';card.className='perspective-card '+kind;card.dataset.perspectiveCard=kind;card.dataset.artState='default';card.setAttribute('aria-expanded','false');card.setAttribute('aria-label',entry.name+' — '+title);card.setAttribute('aria-describedby',entry.id+'-'+kind+'-note');
     for(const state of ['default','hover']){const layer=document.createElement('span');layer.className='art-state '+state;const scale=document.createElement('span');scale.className='perspective-vector';scale.append(svgLayer(kind+'-'+state,entry.id+'-'+kind+'-'+state));layer.append(scale);card.append(layer);}
     const copy=document.createElement('span');copy.id=entry.id+'-'+kind+'-note';copy.className='perspective-card-copy';copy.textContent=data[kind];card.append(copy);
     let pinned=false,inside=false,focused=false;
     const update=()=>{const open=pinned||inside||focused;card.classList.toggle('is-hover',open);card.setAttribute('aria-expanded',String(open));animateArtwork(card);};
     card.addEventListener('pointerenter',e=>{if(e.pointerType==='touch')return;if(performance.now()>=this.hoverReady){inside=true;update();}});card.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;if(!inside&&performance.now()>=this.hoverReady){inside=true;update();}});card.addEventListener('pointerleave',()=>{inside=false;update();});card.addEventListener('focus',()=>{focused=true;update();});card.addEventListener('blur',()=>{focused=false;pinned=false;update();});
     card.addEventListener('click',()=>{pinned=!pinned;if(!pinned)focused=false;update();});card.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();pinned=inside=focused=false;card.blur();update();}});
     cards.append(card);
    });section.append(cards);this.track.append(section);
   });
   const end=document.createElement('div');end.className='perspective-end';const report=document.createElement('button');report.type='button';report.className='report-control';report.disabled=true;report.innerHTML='Create experience report <span aria-hidden="true">▸</span>';end.append(report);this.track.append(end);
   this.paint();
  }
  paint(){
   this.track.querySelectorAll('.perspective-card').forEach(card=>{const svg=card.querySelector('svg'),width=svg.width.baseVal.value;card.style.setProperty('--card-scale',card.clientWidth/width);});
  }
 }
 root.PerspectiveInformation=PerspectiveInformation;
 const panel=document.createElement('div');panel.className='analysis-prompt';panel.innerHTML='<p>How my visual condition impact my understand of this experience, or even my way to view the world?</p><button id="start-analysis" type="button"><span>Analyze</span></button><output id="analysis-progress" role="progressbar" aria-label="Analyzing your perspective" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" hidden>0%</output>';
 document.querySelector('#result').append(panel);
 const halos=document.createElement('div');halos.className='analysis-halos';halos.setAttribute('aria-hidden','true');
 ['cyan','blue','yellow'].forEach(color=>{const slot=document.createElement('div');slot.className='analysis-halo '+color;slot.innerHTML=artwork['analyze-'+color];halos.append(slot);});document.querySelector('#result').prepend(halos);
 const eye=document.querySelector('.result-artwork');eye.querySelector('.eye-anatomy').classList.add('previous-eye');eye.querySelector('.eye-yellow').classList.remove('eye-yellow');eye.querySelector('.eye-optics').classList.remove('eye-optics');
 const fresh=svgLayer('analyze-eye','new-anatomy');fresh.classList.add('eye-optics','nov12-anatomy');fresh.querySelector('path[fill="#FFE96D"]').classList.add('eye-yellow');eye.append(fresh);
 const spine=document.createElement('div');spine.className='perspective-spine';spine.setAttribute('aria-hidden','true');spine.innerHTML='<img src="assets/nov12/information-eye-mark.svg" alt=""><span class="perspective-marker"></span>';document.querySelector('#result').append(spine);
 addEventListener('resize',()=>root.dispatchEvent(new Event('perspective-resize')));
})(globalThis);
