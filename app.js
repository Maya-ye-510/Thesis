'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const {CONDITIONS,ConditionSelection,initialCrop,moveCrop,resizeCrop,cropLens}=SeeFlow;
const selection=new ConditionSelection();
const controls={structure:false,colors:false,motion:false};
const artAnimations=new WeakMap();
let focusProgress=0,focusRAF=0,textEntrances=[],anatomyRAF=0,anatomyAngle=0,anatomyTarget=0;
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
let screen='home',transition=null,cropping=false,cropRect=null,cropDrag=null,capture=null,comparing=null,capturing=false,revision=0,detailAnchor=null;
const homeCenter=document.createElement('div');homeCenter.className='home-center';$('#home').append(homeCenter);homeCenter.append($('#enter'),$('.eye-small'));
const homeBackground=document.createElement('div');homeBackground.className='home-background';$('#home').prepend(homeBackground);homeBackground.append($('#home > img[data-node-id="167:177"]'));
$$('#home img[data-node-id="167:157"],#home img[data-node-id="167:156"]').forEach((el,i)=>{el.className='home-cross '+(i?'first':'second');el.style.left='';el.style.top='';});
const homeRule=document.createElement('div');homeRule.className='home-rule';homeRule.append($('#home img[data-node-id="166:148"]'));$('#home').append(homeRule);
const field=new ParticleField($('#particle-canvas'));
const resultField=new ParticleField($('#result-canvas'));resultField.lockZoom=true;resultField.freezePerception=true;

function sizeArtwork(){
 document.documentElement.style.setProperty('--flow-scale',Math.min(innerWidth/1421,innerHeight/832));
 $$('.condition-art').forEach(art=>{art.firstElementChild.style.transform=`scale(${art.clientWidth/141},${art.clientHeight/155.25})`;});
 const box=$('.intro-graphic');if(box.clientWidth&&box.clientHeight){const scale=Math.min(box.clientWidth/1128,box.clientHeight/907);$('.eye-artboard').style.transform=`translate(${(box.clientWidth-1128*scale)/2}px,${(box.clientHeight-907*scale)/2}px) scale(${scale})`;}
 const eye=$('.result-artwork');const es=innerWidth>700?Math.max(innerWidth/1421,innerHeight/832):Math.min(innerWidth/850,innerHeight*.31/832);
 eye.style.setProperty('--eye-scale',es);
 $('#result-symptoms').style.top=(innerWidth>700?(innerHeight-832*es)/2+411*es:innerHeight-832*es+411*es)+'px';
 if(cropping&&cropRect){const b=fieldBounds();if(cropRect.width>b.width||cropRect.height>b.height)cropRect=initialCrop(b);else cropRect=moveCrop(cropRect,0,0,b);paintCrop();}
}
new ResizeObserver(sizeArtwork).observe($('.intro-graphic'));new ResizeObserver(sizeArtwork).observe($('#condition-options'));addEventListener('resize',sizeArtwork);

function updateScreen(name,replace){
 screen=name;if(name!=='conditions')closeDetails();$$('.screen').forEach(el=>{el.hidden=el.id!==(name==='detail'?'result':name);el.classList.remove('entering');});
 document.title='I SEE — '+({home:'Prototype 2',intro:'About',conditions:'Personal condition',experience:'Experience',result:'The world in your eyes',detail:'Ways of seeing'})[name];
 if(replace)history.replaceState({screen:name},'','#'+name);else if(location.hash!=='#'+name)history.pushState({screen:name},'','#'+name);
 field.setActive(name==='experience');const showResult=name==='result'||name==='detail';if(resultField.active!==showResult)resultField.setActive(showResult);
 $('#result').classList.toggle('is-explaining',name==='detail');$('.condition-explanation').hidden=name!=='detail';
 $('#result').setAttribute('aria-label',name==='detail'?'Condition explanation':'The world in your eyes');
 $$('.result-symptom').forEach(b=>{const hidden=name==='detail'&&b.dataset.symptom!==comparing;b.inert=hidden;b.setAttribute('aria-hidden',hidden);});
 $('.result-window>p').setAttribute('aria-hidden',name==='detail');
 if(name==='result'&&capture){comparing=null;renderSymptoms();}
 if(name==='home')resetExperience();
 if(name==='experience'){Object.assign(controls,{structure:false,colors:false,motion:false});field.setPaused(false);updateConditions();updateControls();}
 if(name!=='experience'){cropping=false;$('#crop-frame').hidden=true;$('#crop-actions').hidden=true;$('.blue-panel').classList.remove('is-cropping');}
 sizeArtwork();resetEyes();if(name!=='result')resetAnatomy();scrollTo({top:0,behavior:'instant'});
 requestAnimationFrame(()=>{sizeArtwork();const el=$('#'+(name==='detail'?'result':name));el.setAttribute('tabindex','-1');el.focus({preventScroll:true});});
}
async function go(name,replace=false,immediate=false){
 if(transition)await transition.updateCallbackDone.catch(()=>{});
 if(!['home','intro','conditions','experience','result','detail'].includes(name))name='home';
 if((name==='result'||name==='detail')&&!capture)name='experience';
 if((name==='experience'||name==='result'||name==='detail')&&!selection.selected.size){name='conditions';history.replaceState({screen:name},'','#conditions');}
 if(name===screen&&!immediate)return;
 if(transition)transition.skipTransition();
 if((screen==='result'&&name==='detail')||(screen==='detail'&&name==='result')){
  const id=comparing,button=$(`[data-symptom="${id}"]`),boxes=button?[...button.querySelectorAll('.symptom-dot,.symptom-label')].map(el=>el.getBoundingClientRect()):[];
  document.documentElement.dataset.pageMotion='result-detail';updateScreen(name,replace);animateFocusLines(name==='detail');textEntrances.forEach(a=>a.cancel());textEntrances=[];
  const next=$(`[data-symptom="${id}"]`);
  if(!reduceMotion.matches&&next){next.querySelectorAll('.symptom-dot,.symptom-label').forEach((el,i)=>{const from=boxes[i],to=el.getBoundingClientRect();if(from&&to.width)el.animate([{transform:`translate(${from.x-to.x}px,${from.y-to.y}px)`},{transform:'none'}],{duration:700,easing:'ease-in-out'});});
   if(name==='detail'){const text=$('.condition-explanation'),travel=innerHeight-text.getBoundingClientRect().top+24;textEntrances.push(text.animate([{opacity:0,transform:`translateY(${travel}px)`},{opacity:1,transform:'none'}],{duration:700,easing:'ease-in'}));}
  }return;
 }
 const motion=name==='home'?'dissolve':screen==='home'&&name==='intro'?'home-intro':screen==='intro'&&name==='conditions'?'intro-conditions':screen==='experience'&&name==='result'?'crop-result':'click';
 document.documentElement.dataset.pageMotion=motion;
 const after=()=>{if(screen==='result'&&capture){$('#result-bridge').classList.add('settled');resultField.setPaused(true);}};
 if(document.startViewTransition&&!reduceMotion.matches&&!immediate){
  const current=document.startViewTransition(()=>updateScreen(name,replace));transition=current;current.ready.catch(()=>{});
  current.finished.catch(()=>{}).finally(()=>{if(transition===current){transition=null;after();}});
 }else{updateScreen(name,replace);if(!immediate&&!reduceMotion.matches)$('#'+name).classList.add('entering');after();}
}
addEventListener('popstate',()=>go(location.hash.slice(1)||'home',true));
$$('[data-go]').forEach(button=>button.onclick=()=>{if(button.dataset.go==='experience'&&!selection.selected.size){$('#condition-alert').showModal();return;}go(button.dataset.go);});
$('#condition-alert-close').onclick=()=>$('#condition-alert').close();
$('#enter').onclick=()=>go('intro');$('#home').addEventListener('click',e=>{if(!e.target.closest('button'))go('intro');});
$('#home').addEventListener('keydown',e=>{if(e.target===$('#home')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();go('intro');}});
$('#experience').addEventListener('click',e=>{if(!e.target.closest('button'))e.stopPropagation();});
function namespacedSvg(markup,prefix){return markup.replace(/\sid="([^"]+)"/g,(_,id)=>` id="${prefix}-${id}"`).replace(/url\(#([^)]*)\)/g,(_,id)=>`url(#${prefix}-${id})`);}
function layers(config,condition=false){return ['default','hover','selected'].map(state=>{
 let x=0,y=0,scale=1;
 if(condition&&state!=='default'&&!config[state].startsWith('nov5/')){scale=.75;x=state==='hover'?-4.5:0;if(config.id==='myopia'){x-=9;y-=9;}if(['snow','astigmatism','hemianopia'].includes(config.id)){x-=3;y-=3;}}
 return `<span class="art-state ${state}" style="left:${x}px;top:${y}px"><span class="vector-scale" style="transform:scale(${scale})">${namespacedSvg(ControlArtwork[config[state]],config.id||'eye-control')}</span></span>`;
}).join('');}
function animateArtwork(button, click = false) {
  const state = button.classList.contains('is-selected') ? 'selected' : (button.classList.contains('is-hover')||button.closest('.is-open')) ? 'hover' : 'default';
  const sourceState = button.dataset.artState || 'default';
  if (sourceState === state) return;
  const source = button.querySelector('.art-state.' + sourceState);
  const target = button.querySelector('.art-state.' + state);
  const sourceParts = [...source.querySelectorAll('[data-motion-key]')];
  const targetParts = [...target.querySelectorAll('[data-motion-key]')];
  const boxes = new Map(sourceParts.map(el => [el.dataset.motionKey, el.getBoundingClientRect()]));
  (artAnimations.get(button)||[]).forEach(animation=>animation.cancel());
  const owned=[];artAnimations.set(button,owned);
  button.dataset.artState = state;
  button.querySelectorAll('.art-state').forEach(layer => { layer.style.opacity = layer === target ? '1' : '0'; });
  if (reduceMotion.matches) return;
  const timing = { duration: click ? 300 : button.matches('[data-condition]') ? 700 : 450, easing: click ? 'ease-in' : 'ease-in-out' };
  const animate=(el,frames)=>{const animation=el.animate(frames,timing);owned.push(animation);};
  const inverse = (from, to, svg) => {
    const units = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
    return `translate(${(from.x - to.x) / units}px,${(from.y - to.y) / units}px) scale(${from.width / to.width},${from.height / to.height})`;
  };
  for (const part of targetParts) {
    const from = boxes.get(part.dataset.motionKey), to = part.getBoundingClientRect();
    if (!from?.width || !from.height || !to.width || !to.height) continue;
    animate(part,[{ transform: inverse(from, to, part.ownerSVGElement) }, { transform: 'none' }]);
    const old = sourceParts.find(el => el.dataset.motionKey === part.dataset.motionKey);
    const oldBox = old.getBoundingClientRect();
    animate(old,[{ transform: inverse(from, oldBox, old.ownerSVGElement) }, { transform: inverse(to, oldBox, old.ownerSVGElement) }]);
  }
  animate(source,[{ opacity: 1 }, { opacity: 0 }]);
  animate(target,[{ opacity: 0 }, { opacity: 1 }]);
}
function hoverStates(button) {
  button.dataset.artState = 'default';
  const hover = value => { button.classList.toggle('is-hover', value); animateArtwork(button); };
  button.addEventListener('pointerenter', () => hover(true));
  button.addEventListener('pointerleave', () => hover(false));
  button.addEventListener('focus', () => hover(true));
  button.addEventListener('blur', () => hover(false));
}
// Filters use the same linear-RGB matrices as the live particle field.
const colourDefs=document.createElementNS('http://www.w3.org/2000/svg','svg');colourDefs.setAttribute('class','optical-defs');colourDefs.setAttribute('aria-hidden','true');
colourDefs.innerHTML='<defs>'+Object.entries(FieldMath.COLOUR_MATRICES).map(([key,rows])=>`<filter id="preview-${key}" color-interpolation-filters="linearRGB"><feColorMatrix type="matrix" values="${rows.map(row=>row.join(' ')+' 0 0').join(' ')} 0 0 0 1 0"/></filter>`).join('')+'</defs>';document.body.append(colourDefs);
function updateConditions(){
 CONDITIONS.forEach(c=>{
  const b=$(`[data-condition="${c.id}"]`),selected=selection.selected.has(c.id);b.classList.toggle('is-selected',selected);b.setAttribute('aria-pressed',selected);
  b.dataset.colour=selection.details.colour;b.dataset.hemisphere=selection.details.hemianopia;
  if(c.id==='colour')b.style.setProperty('--vision-filter',`url(#preview-${selection.details.colour})`);
  animateArtwork(b,true);const detail=$(`[data-detail-value="${c.id}"]`);if(detail)detail.textContent=selected?c.options.find(o=>o.value===selection.details[c.id]).label:'';
 });
 field.setConditions(selection.selected);field.setDetails(selection.details);
 $('#field-conditions').replaceChildren(...selection.entries().map(c=>{const li=document.createElement('li');li.textContent=c.name+(c.detail?' — '+c.detail:'');return li;}));
 $('#particle-canvas').setAttribute('aria-label','Interactive particle field. '+selection.entries().map(c=>c.name+(c.detail?' '+c.detail:'')).join(', ')+'. Drag to rotate 360 degrees; scroll to move through the world.');
}
CONDITIONS.forEach(c=>{
 const card=document.createElement('div');card.className='condition-card';
 const b=document.createElement('button');b.className='condition';b.dataset.condition=c.id;b.setAttribute('aria-label',c.name);b.setAttribute('aria-pressed','false');
 const optics=c.id==='astigmatism'?'<span class="preview-rays" aria-hidden="true"><i></i><i></i><i></i></span>':c.id==='hemianopia'?'<span class="hemi-mask-layers" aria-hidden="true"><span class="hemi-shade left"></span><span class="hemi-shade right"></span><span class="hemi-shade side"></span></span>':'';
 b.innerHTML=`<span class="condition-art" aria-hidden="true"><span class="condition-geometry">${layers(c,true)}</span>${optics}<span class="condition-bar"></span></span><span class="condition-label">${c.name}</span>`;hoverStates(b);b.onclick=()=>{if(selection.selected.has(c.id)||!c.options){closeDetails();selection.toggle(c.id);updateConditions();}else openDetails(c,card.querySelector('.condition-details-toggle'));};card.append(b);
 if(c.options){const arrow=document.createElement('button');arrow.className='condition-details-toggle';arrow.dataset.category=c.id;arrow.setAttribute('aria-label',c.name+' options');arrow.setAttribute('aria-haspopup','dialog');arrow.setAttribute('aria-expanded','false');arrow.innerHTML='<img src="assets/nov4/option-arrow.svg" alt="">';arrow.onclick=()=>detailAnchor===arrow?closeDetails():openDetails(c,arrow);const detail=document.createElement('span');detail.className='chosen-detail';detail.dataset.detailValue=c.id;card.append(arrow,detail);}
 $('#condition-options').append(card);
});
function closeDetails(restoreFocus=false){
 const anchor=detailAnchor;if(!anchor)return;$('#condition-details').hidden=true;anchor.setAttribute('aria-expanded','false');anchor.closest('.condition-card').classList.remove('is-open');detailAnchor=null;animateArtwork(anchor.closest('.condition-card').querySelector('[data-condition]'));if(restoreFocus)anchor.focus({preventScroll:true});
}
function positionDetails(){
 if(!detailAnchor)return;const dialog=$('#condition-details'),r=detailAnchor.getBoundingClientRect();
 const left=innerWidth>700?r.right+10:r.left-dialog.offsetWidth/2;
 dialog.style.left=Math.max(12,Math.min(left,innerWidth-dialog.offsetWidth-12))+'px';dialog.style.top=Math.max(12,Math.min(r.top-24,innerHeight-dialog.offsetHeight-12))+'px';
}
function openDetails(c,anchor){
 closeDetails();detailAnchor=anchor;const dialog=$('#condition-details');dialog.setAttribute('aria-label',c.name+' options');anchor.setAttribute('aria-expanded','true');anchor.closest('.condition-card').classList.add('is-open');
 $('#detail-options').replaceChildren(...c.options.map(o=>{const label=document.createElement('label'),input=document.createElement('input');input.type='radio';input.name='condition-detail';input.value=o.value;input.checked=selection.details[c.id]===o.value;input.onclick=()=>{selection.setDetail(c.id,o.value);updateConditions();closeDetails(true);};label.append(input,document.createTextNode(o.label));return label;}));
 dialog.hidden=false;positionDetails();
 if(!reduceMotion.matches)dialog.animate([{opacity:0,transform:'translateX(-8px)'},{opacity:1,transform:'none'}],{duration:300,easing:'ease-in'});
 $('#detail-options input:checked').focus({preventScroll:true});
}
addEventListener('resize',positionDetails);
document.addEventListener('pointerdown',e=>{if(detailAnchor&&!e.target.closest('#condition-details,.is-open'))closeDetails();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(detailAnchor){e.preventDefault();closeDetails(true);}else if(screen==='detail')go('result');}});
const display=[{id:'structure',name:'Structure',default:'b4f9d.svg',hover:'c72f5.svg',selected:'459a5.svg'},{id:'colors',name:'Colors',default:'c26e9.svg',hover:'c9691.svg',selected:'3e706.svg'},{id:'motion',name:'Motion',default:'821d9.svg',hover:'9a6a0.svg',selected:'29b56.svg'}];
function updateControls(){display.forEach(c=>{const b=$(`[data-display="${c.id}"]`);b.classList.toggle('is-selected',controls[c.id]);b.setAttribute('aria-pressed',controls[c.id]);animateArtwork(b,true);});field.setControls(controls);field.setPaused(controls.motion);}
function setHover(button,value){button.classList.toggle('is-hover',value);animateArtwork(button);}
display.forEach(c=>{const group=document.createElement('div');group.className='display-choice';const b=document.createElement('button');b.className='variant-button display-button';b.dataset.display=c.id;b.setAttribute('aria-label',c.name);b.innerHTML=layers(c);hoverStates(b);b.onclick=()=>{controls[c.id]=!controls[c.id];updateControls();};if(c.id==='motion')b.title='Pause or resume particle motion';const label=document.createElement('button');label.className='display-label';label.textContent=c.name;label.setAttribute('aria-label','Select '+c.name);label.onclick=()=>b.click();['pointerenter','focus'].forEach(type=>label.addEventListener(type,()=>setHover(b,true)));['pointerleave','blur'].forEach(type=>label.addEventListener(type,()=>setHover(b,false)));group.append(b,label);$('#display-options').append(group);});
const eyeButton=$('.eye-control');eyeButton.innerHTML=layers({id:'eye-control',default:eyeButton.dataset.default,hover:eyeButton.dataset.hover,selected:eyeButton.dataset.selected});hoverStates(eyeButton);
function resetExperience(){animateFocusLines(false,true);closeDetails();revision++;selection.reset();Object.assign(controls,{structure:false,colors:false,motion:false});capture=null;comparing=null;capturing=false;cancelCrop();field.reset();resultField.reset();$$('.is-hover').forEach(b=>b.classList.remove('is-hover'));updateConditions();updateControls();$('#result-symptoms').replaceChildren();$('#result-bridge').removeAttribute('src');}

function fieldBounds(){const r=$('.blue-panel').getBoundingClientRect();return{width:r.width,height:r.height};}
function paintCrop(){if(!cropRect)return;Object.assign($('#crop-frame').style,{left:cropRect.x+'px',top:cropRect.y+'px',width:cropRect.width+'px',height:cropRect.height+'px'});$('#crop-frame').setAttribute('aria-label',`Crop selection, ${Math.round(cropRect.width)} by ${Math.round(cropRect.height)}. Drag to move. Shift and arrow keys resize.`);}
function beginCrop(){if(cropping||capturing)return;cropping=true;cropRect=initialCrop(fieldBounds());$('#crop-frame').hidden=false;$('#crop-actions').hidden=false;$('#crop-preview').style.visibility='hidden';$('.blue-panel').classList.add('is-cropping');paintCrop();$('#crop-frame').focus({preventScroll:true});}
function cancelCrop(){cropping=false;cropDrag=null;$('#crop-frame').hidden=true;$('#crop-actions').hidden=true;$('.blue-panel').classList.remove('is-cropping');}
$('#crop-toggle').onclick=()=>cropping?captureSelection():beginCrop();$('#experience-next').onclick=()=>cropping?captureSelection():beginCrop();$('#crop-cancel').onclick=cancelCrop;$('#crop-confirm').onclick=captureSelection;
$('#crop-frame').addEventListener('pointerdown',e=>{if(capturing||(e.pointerType==='mouse'&&e.button!==0))return;e.preventDefault();e.stopPropagation();const frame=$('#crop-frame');frame.focus({preventScroll:true});frame.setPointerCapture(e.pointerId);cropDrag={id:e.pointerId,x:e.clientX,y:e.clientY,rect:{...cropRect},corner:e.target.dataset.corner||null};});
$('#crop-frame').addEventListener('pointermove',e=>{if(!cropDrag||e.pointerId!==cropDrag.id)return;const dx=e.clientX-cropDrag.x,dy=e.clientY-cropDrag.y;cropRect=cropDrag.corner?resizeCrop(cropDrag.rect,dx,dy,cropDrag.corner,fieldBounds()):moveCrop(cropDrag.rect,dx,dy,fieldBounds());paintCrop();});
function endCropDrag(e){if(cropDrag?.id!==e.pointerId)return;cropDrag=null;if($('#crop-frame').hasPointerCapture(e.pointerId))$('#crop-frame').releasePointerCapture(e.pointerId);}
$('#crop-frame').addEventListener('pointerup',endCropDrag);$('#crop-frame').addEventListener('pointercancel',endCropDrag);$('#crop-frame').addEventListener('lostpointercapture',()=>{cropDrag=null;});
$('#crop-frame').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();cancelCrop();return;}if(e.key==='Enter'){e.preventDefault();captureSelection();return;}const step=e.altKey?1:10;const dx=e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0,dy=e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0;if(!dx&&!dy)return;e.preventDefault();cropRect=e.shiftKey?resizeCrop(cropRect,dx,dy,'se',fieldBounds()):moveCrop(cropRect,dx,dy,fieldBounds());paintCrop();});
async function captureSelection(){
 if(!cropping||capturing||screen!=='experience')return;capturing=true;const token=revision,rect={...cropRect},bounds=fieldBounds();const state=field.captureState();
 const preview=$('#crop-preview'),dpr=field.dpr;preview.width=Math.round(rect.width*dpr);preview.height=Math.round(rect.height*dpr);preview.getContext('2d').drawImage($('#particle-canvas'),rect.x*dpr,rect.y*dpr,rect.width*dpr,rect.height*dpr,0,0,preview.width,preview.height);preview.style.visibility='visible';
 const image=preview.toDataURL('image/png');capture={rect,bounds,state,image,details:{...selection.details},entries:selection.entries()};comparing=null;
 const bridge=$('#result-bridge');bridge.classList.remove('settled');bridge.src=image;await bridge.decode().catch(()=>{});if(token!==revision){capturing=false;return;}
 resultField.restoreState({...state,paused:true},cropLens(bounds.width,bounds.height,rect));animateFocusLines(false,true);resultField.setPaused(true);renderSymptoms();field.setPaused(true);await go('result');capturing=false;
}
function renderSymptoms(){
 const list=$('#result-symptoms');list.classList.toggle('single',capture.entries.length===1);
 list.replaceChildren(...capture.entries.map((c,i)=>{
  const b=document.createElement('button');b.className='result-symptom '+(i%2?'above':'below')+(comparing===c.id?' is-explained':'');b.dataset.symptom=c.id;
  b.setAttribute('aria-label',c.name+(c.detail?' — '+c.detail:''));b.setAttribute('aria-expanded',screen==='detail'&&comparing===c.id);b.innerHTML='<span class="symptom-dot" aria-hidden="true"></span><span class="symptom-label"></span>';b.querySelector('.symptom-label').textContent=c.name;
  if(c.detail){const small=document.createElement('span');small.className='symptom-subtype';small.textContent=c.detail;b.querySelector('.symptom-label').append(small);}b.title=c.detail||c.name;
  b.onclick=()=>screen==='detail'?go('result'):openExplanation(c.id);return b;
 }));
}
async function openExplanation(id){
 if(!capture||!capture.entries.some(c=>c.id===id))return;
 comparing=id;$('#condition-overview').textContent=ConditionNotes[id].overview;$('#condition-interpretation').textContent=ConditionNotes[id].interpretation;
 $$('[data-symptom]').forEach(b=>b.classList.toggle('is-explained',b.dataset.symptom===id));
 await go('detail');$(`[data-symptom="${id}"]`).setAttribute('aria-expanded','true');
 $('#result-announcement').textContent=CONDITIONS.find(c=>c.id===id).name+' — ways of seeing';
}
$('#result-canvas').addEventListener('click',()=>{if(!capture||resultField.lastGestureMoved||screen!=='result')return;resultField.target.yaw+=Math.PI/6;resultField.updateRotation();resultField.request();});
updateConditions();updateControls();
// Eye movement is computed from the actual responsive element bounds.
const eyes = $$('[data-eye]').map(el => ({ el, pupil: el.querySelector('.pupil'), x: 0, y: 0, tx: 0, ty: 0 })); let eyeRAF = 0;
function animateEyes() {
  let running = false;
  for (const eye of eyes) {
    const ease = reduceMotion.matches ? 1 : .16;
    eye.x += (eye.tx - eye.x) * ease; eye.y += (eye.ty - eye.y) * ease;
    if (Math.abs(eye.x - eye.tx) + Math.abs(eye.y - eye.ty) > .02) running = true;
    else { eye.x = eye.tx; eye.y = eye.ty; }
    eye.pupil.style.transform = `translate(${eye.x.toFixed(3)}px,${eye.y.toFixed(3)}px)`;
  }
  eyeRAF = running ? requestAnimationFrame(animateEyes) : 0;
}
function wakeEyes() { if (!eyeRAF) eyeRAF = requestAnimationFrame(animateEyes); }
function resetEyes() { for (const eye of eyes) eye.tx = eye.ty = 0; wakeEyes(); }
addEventListener('pointermove', event => {
  if (event.pointerType === 'touch') return;
  for (const eye of eyes) {
    if (eye.el.closest('.screen').hidden) continue;
    const rect = eye.el.getBoundingClientRect();
    const localScale = rect.width / (eye.el.dataset.eye === 'small' ? 50 : 367);
    const dx = (event.clientX - rect.left - rect.width / 2) / localScale, dy = (event.clientY - rect.top - rect.height / 2) / localScale;
    const d = Math.hypot(dx, dy), amount = Math.min(Number(eye.el.dataset.range), d * .075);
    eye.tx = d ? dx / d * amount : 0; eye.ty = d ? dy / d * amount : 0;
  }
  wakeEyes();
}, { passive: true });
document.documentElement.addEventListener('pointerleave', resetEyes); addEventListener('blur', resetEyes);
addEventListener('pagehide', () => { field.stop(); resultField.stop(); if (eyeRAF) cancelAnimationFrame(eyeRAF);if(anatomyRAF)cancelAnimationFrame(anatomyRAF);if(focusRAF)cancelAnimationFrame(focusRAF); });
go(location.hash.slice(1)||'home',true,true);

function paintFocusLines(){FieldMath.focusRays(focusProgress).forEach((points,i)=>$('.focus-ray.'+(i?'lower':'upper')).setAttribute('points',points.join(' ')));}
function animateFocusLines(expanded,instant=false){
 if(focusRAF)cancelAnimationFrame(focusRAF);focusRAF=0;const target=expanded?1:0;
 if(instant||reduceMotion.matches){focusProgress=target;paintFocusLines();return;}
 const from=focusProgress,start=performance.now();
 const tick=now=>{const t=Math.min(1,(now-start)/700),ease=t<.5?4*t*t*t:1-(-2*t+2)**3/2;focusProgress=from+(target-from)*ease;paintFocusLines();if(t<1)focusRAF=requestAnimationFrame(tick);else focusRAF=0;};focusRAF=requestAnimationFrame(tick);
}
function animateAnatomy(){anatomyRAF=0;const ease=reduceMotion.matches?1:.16;anatomyAngle+=(anatomyTarget-anatomyAngle)*ease;$('.eye-yellow').setAttribute('transform',`rotate(${anatomyAngle} 1192.88 407.299)`);if(Math.abs(anatomyAngle-anatomyTarget)>.005)anatomyRAF=requestAnimationFrame(animateAnatomy);}
function resetAnatomy(){anatomyTarget=0;if(!anatomyRAF)anatomyRAF=requestAnimationFrame(animateAnatomy);}
addEventListener('pointermove',e=>{if(screen!=='result'||e.pointerType==='touch')return;const r=$('.eye-optics').getBoundingClientRect();anatomyTarget=FieldMath.anatomyLook(e.clientY,r.top+r.height/2,r.height);if(!anatomyRAF)anatomyRAF=requestAnimationFrame(animateAnatomy);},{passive:true});
addEventListener('blur',resetAnatomy);document.documentElement.addEventListener('pointerleave',resetAnatomy);
