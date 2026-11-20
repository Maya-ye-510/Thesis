/* Reuse the particle field's exact transparent/light/dark floater and grain renderer. */
(function(root){
 'use strict';
 class SnowOverlay{
  constructor(host,options={}){
   this.host=host;this.canvas=document.createElement('canvas');this.canvas.className='snow-perception-layer';this.canvas.setAttribute('aria-hidden','true');host.append(this.canvas);this.canvas.style.opacity=String(options.opacity??1);this.ctx=this.canvas.getContext('2d');this.active=false;this.visible=true;this.raf=0;this.last=0;this.reduce=matchMedia('(prefers-reduced-motion: reduce)');this.abort=new AbortController();
   this.sim=Object.create(root.ParticleField.prototype);Object.assign(this.sim,{canvas:this.canvas,sprites:new Map(),camera:{yaw:0,pitch:0},snowTime:0,snowGaze:{x:0,y:0},lens:null,frozenSnow:null});this.sim.build();delete this.sim.particles;if(options.density)this.sim.dust=this.sim.dust.slice(0,Math.max(12,Math.round(this.sim.dust.length*options.density)));
   this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);this.visibility=new IntersectionObserver(entries=>{this.visible=entries[0].isIntersecting;if(this.visible)this.request();else this.stop();});this.visibility.observe(host);
   host.addEventListener('pointermove',e=>{const r=host.getBoundingClientRect();this.sim.snowGaze.x+=e.movementX/Math.max(1,r.width)*.05;this.sim.snowGaze.y+=e.movementY/Math.max(1,r.height)*.05;this.request();},{passive:true,signal:this.abort.signal});document.addEventListener('visibilitychange',()=>{if(document.hidden)this.stop();else this.request();},{signal:this.abort.signal});this.reduce.addEventListener('change',()=>this.request(),{signal:this.abort.signal});
  }
  resize(){const r=this.host.getBoundingClientRect();if(!r.width||!r.height)return;this.sim.width=r.width;this.sim.height=r.height;const dpr=Math.min(devicePixelRatio||1,1.5);this.canvas.width=Math.round(r.width*dpr);this.canvas.height=Math.round(r.height*dpr);this.ctx.setTransform(dpr,0,0,dpr,0,0);this.request();}
  setActive(active){this.active=active;this.last=0;if(active){this.resize();this.request();}else this.stop();}
  request(){if(this.active&&this.visible&&!document.hidden&&!this.raf)this.raf=requestAnimationFrame(t=>this.frame(t));}
  frame(time){this.raf=0;const dt=this.last?Math.min(.05,(time-this.last)/1000):0;this.last=time;if(!this.reduce.matches)this.sim.snowTime+=dt;this.sim.snowGaze.x*=Math.exp(-dt*2.6);this.sim.snowGaze.y*=Math.exp(-dt*2.6);this.ctx.clearRect(0,0,this.sim.width,this.sim.height);if(this.sim.width){this.sim.drawDust(this.ctx);this.canvas.dataset.perceptionTime=this.sim.snowTime.toFixed(3);this.canvas.dataset.floaterTypes='dark,transparent,light,thread';}if(!this.reduce.matches)this.request();}
  stop(){cancelAnimationFrame(this.raf);this.raf=0;this.last=0;}
  destroy(){this.stop();this.observer.disconnect();this.visibility.disconnect();this.abort.abort();this.canvas.remove();}
 }
 root.SnowOverlay=SnowOverlay;
})(globalThis);
