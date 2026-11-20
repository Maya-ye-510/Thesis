/* Restrained 2.5D views of the credited photographs. No new scenery is generated. */
(function(root){
 'use strict';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const nightNames={myopia:'astigmatism-02',astigmatism:'astigmatism-01',colour:'astigmatism-03',snow:'astigmatism-04',hemianopia:'astigmatism-05',normal:'astigmatism-06'};
 const foregrounds={
  astigmatism:[[[0,.91],[1,.91],[1,1],[0,1]]],
  colour:[[[.49,.04],[.63,.06],[.72,.18],[.72,.3],[.85,.38],[.94,.52],[.9,.67],[.74,.69],[.65,.84],[.55,.91],[.45,.86],[.43,.65],[.29,.65],[.17,.55],[.2,.4],[.35,.32],[.43,.24],[.43,.12]]],
  snow:[[[0,.8],[.11,.84],[.23,.87],[.32,.91],[.41,.96],[.48,1],[0,1]]],
  hemianopia:[[[0,.64],[.24,.62],[.46,.66],[.58,.75],[.69,.79],[.9,.86],[1,.87],[1,1],[0,1]]],
  normal:[[[.81,.79],[.84,.69],[.88,.67],[.88,.46],[.93,.43],[.98,.53],[1,.55],[1,1],[.56,1],[.67,.92]]]
 };
 function pose(x,y){return{x:clamp(x,-1,1),y:clamp(y,-1,1),yaw:clamp(x,-1,1)*3,pitch:-clamp(y,-1,1)*2||0};}
 function mask(polygons,width,height){
  return 'url("data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><filter id="soft"><feGaussianBlur stdDeviation="2"/></filter></defs><g fill="white" filter="url(#soft)">${polygons.map(points=>`<polygon points="${points.map(([x,y])=>x*width+','+y*height).join(' ')}"/>`).join('')}</g></svg>`)+'")';
 }
 class SceneStudy{
  constructor(host,{id,name,details}){
   this.host=host;this.id=id;this.name=name;this.scene='day';this.sceneVersion=0;this.active=false;this.raf=0;this.drag=null;this.current={x:0,y:0};this.target={x:0,y:0};this.reduce=matchMedia('(prefers-reduced-motion: reduce)');this.abort=new AbortController();
   const signal=this.abort.signal,photo=host.querySelector('img');this.camera=document.createElement('div');this.camera.className='scene-camera';
   this.planes=[];for(const [index,part]of['far','middle','near'].entries()){
    const plane=document.createElement('div');plane.className='scene-plane scene-'+part;const image=index===0?photo:photo.cloneNode();image.alt=index===0?photo.alt:'';image.draggable=false;
    if(index===2&&id==='myopia')image.src='assets/nov10/photos/'+name+'-source.webp';plane.append(image);this.camera.append(plane);this.planes.push(plane);
   }host.prepend(this.camera);host.classList.add('scene-study');host.tabIndex=0;host.setAttribute('role','group');host.setAttribute('aria-roledescription','draggable photographic scene');host.setAttribute('aria-label',photo.alt+'. Drag horizontally or use arrow keys to look around. Home resets the view.');
   this.setScene('day');if(id==='snow')this.snow=new SnowOverlay(host);
   host.addEventListener('pointerdown',e=>{if(e.button!==0)return;this.drag={id:e.pointerId,x:e.clientX,y:e.clientY,start:{...this.target},touch:e.pointerType==='touch'};host.setPointerCapture(e.pointerId);host.classList.add('is-dragging');},{signal});
   host.addEventListener('pointermove',e=>{if(!this.drag||e.pointerId!==this.drag.id)return;const r=host.getBoundingClientRect(),dx=(e.clientX-this.drag.x)/r.width,dy=(e.clientY-this.drag.y)/r.height;this.target.x=clamp(this.drag.start.x+dx*2,-1,1);if(!this.drag.touch)this.target.y=clamp(this.drag.start.y+dy*2,-1,1);this.request();},{signal});
   const release=e=>{if(e.type==='pointerup'&&this.drag&&Math.hypot(e.clientX-this.drag.x,e.clientY-this.drag.y)<6)this.switchScene();this.drag=null;host.classList.remove('is-dragging');};host.addEventListener('pointerup',release,{signal});host.addEventListener('pointercancel',release,{signal});host.addEventListener('lostpointercapture',release,{signal});
   host.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();this.switchScene();return;}if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();if(e.key==='Home')this.target={x:0,y:0};else this.target[e.key==='ArrowLeft'||e.key==='ArrowRight'?'x':'y']+=e.key==='ArrowLeft'||e.key==='ArrowUp'?-.15:.15;this.target=pose(this.target.x,this.target.y);this.request();},{signal});
   this.visibility=new IntersectionObserver(entries=>{this.visible=entries[0].isIntersecting;if(this.visible)this.request();},{threshold:0});this.visibility.observe(host);this.visible=true;
   this.onVisibility=()=>{if(document.hidden){cancelAnimationFrame(this.raf);this.raf=0;}else this.request();};document.addEventListener('visibilitychange',this.onVisibility,{signal});
  }
  switchScene(){this.setScene(this.scene==='day'?'night':'day');}
  setScene(scene){
   this.scene=scene;const version=++this.sceneVersion,night=scene==='night',name=night?nightNames[this.id]:this.id==='astigmatism'?'normal-03':this.name;
   this.host.dataset.scene=scene;this.host.dataset.sceneReady='false';
   const source='assets/nov10/photos/'+name,processed=night&&this.id==='astigmatism'||!night&&this.id!=='astigmatism';
   this.planes.forEach((plane,i)=>{const img=plane.querySelector('img');img.src=source+(processed&&!(i===2&&this.id==='myopia')?'':'-source')+'.webp';img.alt=i===0?this.id+' — '+scene+' scene: '+SeePhotographs[name].title:'';});
   const photo=this.planes[0].querySelector('img'),setup=()=>{if(version!==this.sceneVersion)return;const polygons=!night&&this.id==='myopia'?SeePhotographs[this.name].depth.polygons:!night?foregrounds[this.id]:[[[0,.75],[1,.75],[1,1],[0,1]]];this.planes[2].style.maskImage=mask(polygons,photo.naturalWidth,photo.naturalHeight);this.host.dataset.sceneReady='true';};
   if(photo.complete&&photo.naturalWidth)setup();else photo.addEventListener('load',setup,{once:true,signal:this.abort.signal});
   this.host.setAttribute('aria-label',this.id+' — '+scene+' scene. Drag or use arrow keys to explore. Click or press Enter to switch day and night.');
   const button=this.host.parentElement.querySelector('.scene-switch');if(button){button.setAttribute('aria-label','Switch '+this.id+' to the '+(night?'day':'night')+' scene');button.setAttribute('aria-pressed',String(night));}
   this.request();
  }
  setActive(active){this.snow?.setActive(active);this.active=active;if(active)this.request();else{cancelAnimationFrame(this.raf);this.raf=0;this.drag=null;this.host.classList.remove('is-dragging');}}
  request(){if(this.active&&this.visible&&!document.hidden&&!this.raf)this.raf=requestAnimationFrame(()=>this.paint());}
  paint(){this.raf=0;const ease=this.reduce.matches?1:.16;for(const axis of['x','y'])this.current[axis]+=(this.target[axis]-this.current[axis])*ease;const p=pose(this.current.x,this.current.y);
   // The container remains fixed; three cropped planes move by different amounts.
   this.camera.style.transform=`perspective(1100px) rotateX(${p.pitch}deg) rotateY(${p.yaw}deg) scale(1.025)`;
   // One shared pose avoids shifted duplicate photographs and false light streaks.
   this.planes.forEach(plane=>{plane.style.transform=`translate(${p.x*-4}px,${p.y*-3}px)`;});
   this.host.dataset.scenePose=p.yaw.toFixed(2)+','+p.pitch.toFixed(2);
   if(Math.abs(this.target.x-p.x)+Math.abs(this.target.y-p.y)>.002)this.request();
  }
  destroy(){this.snow?.destroy();cancelAnimationFrame(this.raf);this.abort.abort();this.visibility.disconnect();}
 }
 SceneStudy.pose=pose;SceneStudy.nightNames=Object.freeze(nightNames);root.SceneStudy=SceneStudy;if(typeof module!=='undefined'&&module.exports)module.exports=SceneStudy;
})(globalThis);
