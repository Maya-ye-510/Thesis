(function(root){
 'use strict';
 const $=s=>document.querySelector(s),reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const asset=root.Nov13Artwork;
 const parseSvg=(markup,prefix)=>{
  const text=markup.replace(/\sid="([^"]+)"/g,(_,id)=>` id="${prefix}-${id}"`).replace(/url\(#([^)]*)\)/g,(_,id)=>`url(#${prefix}-${id})`);
  return document.importNode(new DOMParser().parseFromString(text,'image/svg+xml').documentElement,true);
 };
 const toneDefs=document.createElementNS('http://www.w3.org/2000/svg','svg');toneDefs.classList.add('optical-defs');toneDefs.setAttribute('aria-hidden','true');
 toneDefs.innerHTML='<defs><filter id="day-astigmatism"><feGaussianBlur stdDeviation="0.9 0.25"/></filter><filter id="journey-tone" color-interpolation-filters="sRGB"><feColorMatrix id="journey-tone-matrix" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"/></filter></defs>';document.body.append(toneDefs);
 function setTheme(value=0){$('#journey-tone-matrix').setAttribute('values',FieldMath.temperatureMatrix(value).values.join(' '));document.documentElement.style.setProperty('--journey-tone',value);}
 class JourneyInformation extends root.PerspectiveInformation{
  show(entries,details={},settings={}){
   this.sceneStudies?.forEach(scene=>scene.destroy());this.topicMotions?.forEach(motion=>motion.destroy());this.sceneStudies=[];this.topicMotions=[];
   super.show(entries,details);this.track.classList.add('journey-information');this.settings=settings;setTheme(settings.tone||0);
   const overview=document.createElement('section');overview.className='perspective-overview';overview.setAttribute('aria-labelledby','perspective-question');
   const question=document.createElement('h1');question.id='perspective-question';question.textContent='How do you understand the world around you?';overview.append(question);
   const cards=this.track.querySelector('.perspective-cards');overview.append(cards);
   cards.querySelectorAll('.perspective-card').forEach(card=>{const kind=card.dataset.perspectiveCard;card.setAttribute('aria-label','Your perspective — '+(kind==='field'?'Visual field':kind[0].toUpperCase()+kind.slice(1)));card.querySelector('.perspective-card-copy').textContent=JourneyContent.combined(entries,kind,{...settings,details});card.dataset.motionDuration='300';card.dataset.motionEasing='ease-out';this.topicMotions.push(new TopicMotion(card));});
   this.track.prepend(overview);
   this.track.querySelectorAll('.perspective-section').forEach(section=>{
    const id=section.dataset.condition,entry=entries.find(c=>c.id===id),text=JourneyContent.study(id);
    section.querySelector('.perspective-introduction').remove();section.querySelector('.perspective-cards')?.remove();
    const row=document.createElement('div');row.className='condition-study';
    const copy=document.createElement('div');copy.className='condition-study-copy';
    const introduction=document.createElement('p');introduction.className='condition-introduction';introduction.textContent=text.intro;introduction.tabIndex=0;introduction.setAttribute('aria-label',entry.name+' introduction');
    const introPanel=document.createElement('div');introPanel.className='condition-introduction-panel';introPanel.append(introduction);
    const impact=document.createElement('div');impact.className='condition-impact';const badge=document.createElement('span');badge.className='impact-label';badge.textContent='Impact';const paragraph=document.createElement('p');paragraph.textContent=text.impact;impact.append(badge,paragraph);copy.append(introPanel,impact);
    paragraph.tabIndex=0;paragraph.setAttribute('aria-label',entry.name+' impact');
    const media=document.createElement('figure');media.className='condition-study-media';const photo=document.createElement('div');photo.className='condition-study-photo';photo.dataset.condition=id;
    const img=document.createElement('img');const name=JourneyContent.photographs[id];img.src='assets/nov10/photos/'+name+'.webp';img.alt=entry.name+' — '+SeePhotographs[name].title;img.draggable=false;img.decoding='async';
    img.style.filter=(id==='colour'?`url(#preview-${details.colour||'deutan'}) `:'')+'url(#journey-tone)';photo.append(img);
    if(id==='hemianopia'){const mask=document.createElement('span');mask.className='condition-photo-mask';mask.dataset.side=details.hemianopia||'left';photo.append(mask);}
    if(id==='snow')addSnow(photo);
    const hint=document.createElement('span');hint.className='scene-drag-hint';hint.textContent='Drag to explore this view';photo.append(hint);const switcher=document.createElement('button');switcher.type='button';switcher.className='scene-switch';switcher.textContent='Click to switch scenes';media.append(photo,switcher);row.append(copy,media);section.append(row);const scene=new SceneStudy(photo,{id,name,details});switcher.onclick=()=>scene.switchScene();this.sceneStudies.push(scene);
   });
   const report=this.track.querySelector('.report-control');report.disabled=false;report.innerHTML='Create Report <span aria-hidden="true">▸</span>';report.onclick=()=>document.dispatchEvent(new CustomEvent('journey-report'));
   const back=document.createElement('button');back.type='button';back.className='information-back';back.innerHTML=$('#result-back').innerHTML;back.onclick=()=>$('#result-back').click();report.parentElement.prepend(back);
   this.view.setAttribute('aria-label','Your combined perspective and selected visual conditions');this.view.scrollTop=0;this.paint();
  }
  setActive(active){super.setActive(active);this.sceneStudies?.forEach(scene=>scene.setActive(active));}
  clear(){this.sceneStudies?.forEach(scene=>scene.destroy());this.topicMotions?.forEach(motion=>motion.destroy());this.sceneStudies=[];this.topicMotions=[];this.track.replaceChildren();this.view.dataset.conditionCount='0';}
 }
 root.PerspectiveInformation=JourneyInformation;
 function addSnow(parent){
  const noise=document.createElement('span');noise.className='photo-noise report-perception';noise.setAttribute('aria-hidden','true');
  const floaters=document.createElement('span');floaters.className='photo-floaters report-perception';floaters.setAttribute('aria-hidden','true');floaters.innerHTML='<i></i><i></i><i></i>';parent.append(noise,floaters);
 }
 // Reuse the same three-part Start button so its hover behaviour matches page 2.
 const analyze=$('#start-analysis');analyze.classList.add('start');analyze.innerHTML='<span class="start-line left"></span><span class="start-text">Analyze</span><span class="start-line right"></span>';
 $('.analysis-prompt>p').textContent='How does my vision affect how I understand this experience and the world around me?';
 const conditionOrb=document.createElement('div');conditionOrb.className='condition-orb';conditionOrb.setAttribute('aria-hidden','true');conditionOrb.innerHTML=asset['condition-orb'];$('#conditions').prepend(conditionOrb);
 const adjust=document.createElement('p');adjust.id='field-adjust';adjust.textContent='Keep adjusting until you find your favourite view';$('.blue-panel').append(adjust);
 const tone=document.createElement('label');tone.className='tone-control';tone.innerHTML='<span>Switch color tone</span><input id="color-tone" type="range" min="-1" max="1" step="0.02" value="0" aria-label="Color tone: cool to warm" aria-valuetext="Neutral"><span class="tone-ticks" aria-hidden="true"></span>';$('.blue-panel').append(tone);
 $('.current-condition>p').textContent='Selected conditions';
 const report=document.createElement('section');report.id='report';report.className='screen new-screen';report.hidden=true;report.setAttribute('aria-label','Your experience report');
 report.innerHTML='<header class="site-header"><button class="logo logo-small" data-go="home" aria-label="I SEE home"><span>I </span><span class="see">SEE</span></button><button class="about" data-about>ABOUT</button></header><img class="report-cross" src="assets/nov19/report-cross.svg" alt=""><div class="report-data"><h1>Data Analysis</h1><div class="report-tabs" role="tablist" aria-label="Your experience data"></div><aside class="report-current" aria-label="Your choices"></aside><div id="report-summary" class="report-insight" role="tabpanel"></div></div><div class="report-picture"><img id="report-image" alt="The view you chose and cropped"><canvas id="report-canvas" role="img" aria-label="Your cropped particle world, gently floating at a fixed focus"></canvas><div class="report-eye-layer" aria-hidden="true"></div></div><p class="report-save-copy">Here is your vision analysis ticket. Save your result below, and return to explore another perspective at any time.</p><button id="save-report" class="start" type="button"><span class="start-line left"></span><span class="start-text">Save My Result</span><span class="start-line right"></span></button><button class="report-back" data-go="detail"><span aria-hidden="true">◂</span> Back</button>';
 $('#stage').append(report);
 let reportEye;function mountReportEye(markup){reportEye=parseSvg(markup,'report-eye');reportEye.setAttribute('aria-hidden','true');
 reportEye.querySelector('rect[fill="#3256C8"]').setAttribute('fill','transparent');
 reportEye.querySelectorAll('circle').forEach(circle=>{const r=Number(circle.getAttribute('r'));if([85,69.5,51.5].includes(r)){const parent=circle.parentElement;const target=parent.hasAttribute('filter')?parent:circle;target.dataset.gazePupil='';target.dataset.baseTransform=target.getAttribute('transform')||'';}});
 $('.report-eye-layer').replaceChildren(reportEye);}
 mountReportEye(asset['report-eye']);fetch('assets/nov19/report-eye.svg').then(r=>{if(!r.ok)throw Error('Report eye');return r.text();}).then(mountReportEye).catch(console.error);
 const reportStudy=new ReportStudy(report);
 const reportField=new ParticleField($('#report-canvas'));reportField.lockZoom=true;reportField.freezePerception=false;reportField.ambient=true;reportField.canvas.style.pointerEvents='none';
 new ResizeObserver(()=>{const w=$('.report-picture').clientWidth;if(w) $('.report-picture').style.setProperty('--report-scale',w/450);}).observe($('.report-picture'));
 const loader=document.createElement('div');loader.className='report-loader';loader.hidden=true;loader.setAttribute('role','status');loader.setAttribute('aria-label','Creating your experience report');loader.innerHTML='<div class="loader-center"><div class="loader-word logo" aria-hidden="true"><span>I </span><span class="see">SEE</span></div></div>';$('#result').append(loader);
 let loadingAnimations=[],loadingTimer=0,loadingResolve=null;
 function cancelLoading(){loadingAnimations.forEach(a=>a.cancel());loadingAnimations=[];clearTimeout(loadingTimer);loadingTimer=0;loader.hidden=true;$('#result').removeAttribute('aria-busy');$('.condition-explanation').inert=false;$('.result-window').inert=false;$('.result-navigation').inert=false;if(loadingResolve){loadingResolve(false);loadingResolve=null;}}
 function playLoading(){
  cancelLoading();loader.hidden=false;$('#result').setAttribute('aria-busy','true');$('.condition-explanation').inert=true;$('.result-window').inert=true;$('.result-navigation').inert=true;loader.dataset.phase='entering';
  return new Promise(resolve=>{
   loadingResolve=resolve;const finish=()=>{loader.dataset.phase='complete';loadingResolve=null;resolve(true);};
   if(reduce.matches){loadingTimer=setTimeout(finish,500);return;}
   const word=$('.loader-word'),letters=word.querySelector('.see');
   const motion=word.animate([{transform:'translateX(calc(-50vw - 410px * var(--flow-scale,1)))',offset:0,easing:'cubic-bezier(0,0,.2,1)'},{transform:'translateX(0)',offset:1/3},{transform:'translateX(0)',offset:10/21},{transform:'translateX(0)',offset:5/7,easing:'cubic-bezier(.55,0,1,.45)'},{transform:'translateX(calc(50vw + 291px * var(--flow-scale,1)))',offset:1}],{duration:2100,fill:'both'});
   const spacing=letters.animate([{letterSpacing:'-.15em',offset:0},{letterSpacing:'-.05em',offset:1/3,easing:'ease-out'},{letterSpacing:'-.15em',offset:10/21},{letterSpacing:'-.15em',offset:1}],{duration:2100,fill:'both'});
   loadingAnimations=[motion,spacing];motion.finished.then(finish).catch(()=>{});
  });
 }
 let currentCapture=null;
 function prepareReport(capture){
  currentCapture=capture;const image=$('#report-image');image.src=capture.image;image.dataset.source='user-crop';
  const rect={...capture.rect},side=Math.min(rect.width,rect.height);rect.x+=(rect.width-side)/2;rect.y+=(rect.height-side)/2;rect.width=rect.height=side;
  const state={...capture.state,controls:{...capture.state.controls,motion:false},paused:false};
  reportField.restoreState(state,SeeFlow.cropLens(capture.bounds.width,capture.bounds.height,rect));reportField.setActive(true);
  const distance=capture.state.focus>.66?'Closer':capture.state.focus<.33?'Further away':'Mid-range',tone=JourneyContent.toneLabel(capture.state.tone);
  const current=$('.report-current');current.replaceChildren();
  for(const [label,values]of[['Current conditions',capture.entries.map(c=>c.name+(c.detail?' · '+c.detail:''))],['View distance',[distance]],['Color tone',[tone]]]){const title=document.createElement('p');title.textContent=label;current.append(title);for(const value of values){const line=document.createElement('div');line.textContent=value;current.append(line);}}
  reportStudy.show(capture);
 }
 $('#save-report').onclick=async()=>{
  const button=$('#save-report');if(button.disabled||!currentCapture)return;button.disabled=true;
  try{const output=document.createElement('canvas');output.width=output.height=1200;const ctx=output.getContext('2d');ctx.drawImage($('#report-canvas'),0,0,1200,1200);
   const blob=new Blob([new XMLSerializer().serializeToString(reportEye)],{type:'image/svg+xml'}),url=URL.createObjectURL(blob),eye=new Image();try{eye.src=url;await eye.decode();ctx.drawImage(eye,0,0,1200,1200);}finally{URL.revokeObjectURL(url);}
   const file=await new Promise(resolve=>output.toBlob(resolve,'image/png'));if(!file)throw Error('Could not save result');const link=document.createElement('a'),download=URL.createObjectURL(file);link.href=download;link.download='I-SEE-my-result.png';link.click();setTimeout(()=>URL.revokeObjectURL(download),1000);
  }catch(error){console.error(error);button.setAttribute('aria-label','Save failed. Please try again.');}finally{button.disabled=false;}
 };
 // Small independent gaze offsets keep the frames still while the pupils look around.
 let gazeRAF=0,marker={x:0,y:0,tx:0,ty:0},pupil={x:0,y:0,tx:0,ty:0};
 function gazeTick(){gazeRAF=0;let running=false;for(const p of[marker,pupil]){p.x+=(p.tx-p.x)*(reduce.matches?1:.16);p.y+=(p.ty-p.y)*(reduce.matches?1:.16);running||=Math.abs(p.tx-p.x)+Math.abs(p.ty-p.y)>.02;}
  $('.perspective-marker').style.transform=`translate(${marker.x}px,${marker.y}px)`;
  reportEye.querySelectorAll('[data-gaze-pupil]').forEach(n=>n.setAttribute('transform',n.dataset.baseTransform+` translate(${pupil.x} ${pupil.y})`));if(running)gazeRAF=requestAnimationFrame(gazeTick);
 }
 function look(event){if(event.pointerType==='touch')return;const eye=$('.perspective-spine>img'),r=eye.getBoundingClientRect(),scale=Math.min(innerWidth/1421,innerHeight/832);if(r.width&&$('#result').classList.contains('is-explaining')){marker.tx=Math.max(-5*scale,Math.min(5*scale,(event.clientX-r.left-r.width/2)*.018));marker.ty=Math.max(-4*scale,Math.min(4*scale,(event.clientY-r.top-r.height/2)*.018));}
  const box=$('.report-picture').getBoundingClientRect();if(!report.hidden&&box.width){pupil.tx=Math.max(-8,Math.min(8,(event.clientX-box.left-box.width/2)/box.width*14));pupil.ty=Math.max(-7,Math.min(7,(event.clientY-box.top-box.height*233/450)/box.height*14));}
  if(!gazeRAF)gazeRAF=requestAnimationFrame(gazeTick);
 }
 addEventListener('pointermove',look,{passive:true});document.documentElement.addEventListener('pointerleave',()=>{marker.tx=marker.ty=pupil.tx=pupil.ty=0;if(!gazeRAF)gazeRAF=requestAnimationFrame(gazeTick);});
 // One eased cursor, rather than a trail of decorative particles.
 const cursor=document.createElement('div');cursor.className='cursor-orb';cursor.setAttribute('aria-hidden','true');document.body.append(cursor);const fine=matchMedia('(pointer:fine)');let cursorRAF=0,cx=0,cy=0,tx=0,ty=0,started=false;
 function cursorTick(){cursorRAF=0;const factor=reduce.matches?1:.24;cx+=(tx-cx)*factor;cy+=(ty-cy)*factor;cursor.style.transform=`translate3d(${cx-7}px,${cy-7}px,0)`;if(Math.abs(tx-cx)+Math.abs(ty-cy)>.05)cursorRAF=requestAnimationFrame(cursorTick);}
 addEventListener('pointermove',e=>{if(e.pointerType==='touch'||!fine.matches||document.querySelector('dialog[open]')){document.documentElement.classList.remove('has-custom-cursor');cursor.classList.remove('visible');return;}document.documentElement.classList.add('has-custom-cursor');cursor.classList.add('visible');tx=e.clientX;ty=e.clientY;if(!started){cx=tx;cy=ty;started=true;}if(!cursorRAF)cursorRAF=requestAnimationFrame(cursorTick);},{passive:true});
 addEventListener('pointerdown',()=>cursor.classList.add('pressed'));addEventListener('pointerup',()=>cursor.classList.remove('pressed'));document.documentElement.addEventListener('pointerleave',()=>cursor.classList.remove('visible'));addEventListener('blur',()=>cursor.classList.remove('visible'));
 addEventListener('pagehide',()=>{cancelAnimationFrame(cursorRAF);cancelAnimationFrame(gazeRAF);cancelLoading();});
 root.JourneyUI={setTheme,prepareReport,playLoading,cancelLoading,setReportActive(active){reportField.setActive(active);},resetReport(){reportField.setActive(false);reportField.reset();currentCapture=null;reportStudy.reset();$('#report-image').removeAttribute('src');$('#report-summary').replaceChildren();$('.report-current').replaceChildren();}};
})(globalThis);
