/* An immersive repeating space, rendered with cached native Canvas 2D sprites. */
(function (root) {
  'use strict';
  const { clamp, project, focusZoom, blurAt, visionColour, visibleField, fieldBoundary, snowSeed, snowPixels, floaterPosition } = root.FieldMath;
  const palette = ['#edff38', '#63e6e2', '#ff563b', '#a65aff', '#fff064', '#20d8ff', '#ff9c38', '#ff48cf', '#21ed81', '#ff3434', '#59b3ff', '#f4fff1'];
  const colourWeights=[.12,.14,.03,.02,.16,.12,.02,.23,.02,.02,.1,.02];
  const primaryColours=[0,1,4,5,7,10],accentColours=[2,3,6,8,9,11];
  function pickColour(value){let total=0;for(let i=0;i<colourWeights.length;i++){total+=colourWeights[i];if(value<total)return i;}return palette.length-1;}
  class ParticleField {
    constructor(canvas, onDepth) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d', { alpha: false }); this.onDepth = onDepth;
      this.camera = { yaw: 0, pitch: 0, zoom: 0 }; this.target = { ...this.camera }; this.focus = .35;
      this.conditions = new Set(); this.controls = { structure: false, colors: false, motion: false }; this.paused = false;
      this.details = { colour: 'deutan', hemianopia: 'left' }; this.colourPalette = palette.map(c => visionColour(c));
      this.lens = null; this.lockZoom = false; this.particleLimit = 0; this.lastGestureMoved = false;
      this.reduced = matchMedia('(prefers-reduced-motion: reduce)');
      this.active = false; this.time = 0; this.raf = 0; this.last = 0; this.width = this.height = 0; this.drag = null;
      this.sprites = new Map(); this.history = []; this.historyUntil = 0;
      this.snowTime=0;this.freezePerception=false;this.snowGaze={x:0,y:0,yaw:0,pitch:0};this.frozenSnow=null;this.grainSeed=null;this.grainTile=null;
      this.scene = document.createElement('canvas'); this.sceneCtx = this.scene.getContext('2d');
      this.build();
      this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(canvas.parentElement);
      canvas.addEventListener('pointerdown', e => this.pointerDown(e));
      canvas.addEventListener('pointermove', e => this.pointerMove(e));
      canvas.addEventListener('pointerup', e => this.pointerEnd(e));
      canvas.addEventListener('pointercancel', e => this.pointerEnd(e));
      canvas.addEventListener('lostpointercapture', () => { this.drag = null; });
      canvas.addEventListener('wheel', e => {
        if (e.ctrlKey) return;
        e.preventDefault(); if (!this.lockZoom) this.setFocus(this.focus - clamp(e.deltaY, -120, 120) * .0013);
      }, { passive: false });
      canvas.addEventListener('keydown', e => this.key(e));
      document.addEventListener('visibilitychange', () => { if (document.hidden) this.stop(); else this.request(); });
      this.reduced.addEventListener('change', () => { this.history = []; this.request(); });
    }
    build() {
      let seed = 216730;
      const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
      const circles = ['disc', 'ring', 'disc', 'double-ring', 'halo', 'ring', 'dashed-ring', 'arc', 'disc', 'dot-ring'];
      this.particles = Array.from({ length: 5400 }, (_, i) => ({
        x: (rand() - .5) * 36, y: (rand() - .5) * 36, z: (rand() - .5) * 36,
        radius: i % 29 === 0 ? 25 + rand() * 17 : i % 5 === 0 ? 10 + rand() * 13 : 2 + rand() ** 2 * 10,
        color: pickColour(rand()),
        type: i % 43 === 0 ? 'triangle' : i % 61 === 0 ? 'line' : circles[i % circles.length],
        rotation: rand() * Math.PI * 2, phase: rand() * Math.PI * 2, speed: .24 + rand() * .32
      }));
      this.dust = Array.from({ length: 80 }, (_,i) => ({ x: rand(), y: rand(), radius: .9 + rand() ** 2 * 4.8, phase: rand() * Math.PI * 2, speed: .2 + rand() * .5, vx:(rand()-.5)*.018,vy:(rand()-.5)*.016,type:[0,3,1,4,3,2,4,3][i%8] }));
    }
    resize() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      this.width = rect.width; this.height = rect.height; this.dpr = Math.min(devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(rect.width * this.dpr); this.canvas.height = Math.round(rect.height * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      const dpr = Math.min(this.dpr, 1.5);
      this.scene.width = Math.round(rect.width * dpr); this.scene.height = Math.round(rect.height * dpr);
      this.sceneCtx.setTransform(dpr, 0, 0, dpr, 0, 0); this.history = [];
      this.canvas.dataset.particleCount = String(this.particleLimit || (this.width < 600 ? 2200 : this.particles.length)); this.request();
    }
    setActive(active) { this.active = active; this.last = 0; if (active) { this.resize(); this.request(); } else this.stop(); }
    setConditions(conditions) {
      this.conditions = new Set(conditions); this.canvas.dataset.conditions = [...conditions].sort().join(',') || 'normal';
      this.history = []; this.sprites.clear(); this.request();
    }
    setDetails(details) {
      Object.assign(this.details, details); this.colourPalette = palette.map(c => visionColour(c, this.details.colour));
      this.sprites.clear(); this.history = []; this.request();
    }
    liveState() {
      return { camera: { ...this.camera }, target: { ...this.target }, time: this.time || 0, focus: this.focus,
        conditions: [...(this.conditions || [])], details: { ...this.details }, controls: { ...this.controls }, paused: !!this.paused,
        particleLimit: this.particleLimit || (this.width < 600 ? 2200 : 5400), lens: this.lens || null, snowTime:this.snowTime??this.time, snowGaze:{...this.snowGaze} };
    }
    captureState() {
      const state = this.conditions.has('snow') && !this.reduced.matches && !this.paused && this.lastPresentedState ? this.lastPresentedState : this.liveState();
      return { ...state, camera: { ...state.camera }, target: { ...state.camera }, conditions: [...this.conditions], details: { ...this.details }, controls: { ...this.controls }, paused: this.paused, snowGaze:{...state.snowGaze},snowView:{time:this.snowTime??this.time,camera:{...this.camera},gaze:{...this.snowGaze}} };
    }
    restoreState(state, lens = null) {
      this.camera = { ...state.camera }; this.target = { ...state.camera }; this.originPose = { ...state.camera };
      this.time = state.time;this.snowTime=state.snowTime??state.snowView?.time??state.time; this.focus = state.focus; this.particleLimit = state.particleLimit;
      this.lens = lens; this.lastPresentedState = null; this.history = [];
      this.snowGaze={x:0,y:0,yaw:state.camera.yaw,pitch:state.camera.pitch,...state.snowGaze};this.frozenSnow=this.freezePerception&&state.snowView?state.snowView:null;
      this.setConditions(state.conditions); this.setDetails(state.details); this.setControls(state.controls); this.setPaused(state.paused);
      this.updateRotation(); this.canvas.dataset.focus = this.focus.toFixed(3);
    }
    setControls(controls) {
      if (Object.keys(controls).some(key => controls[key] !== this.controls[key])) this.historyUntil = performance.now() + 320;
      Object.assign(this.controls, controls); this.request();
    }
    setPaused(value) { this.paused = value; if(value)this.historyUntil=0;this.request(); }
    setFocus(value) {
      this.focus = clamp(value, 0, 1); this.target.zoom = focusZoom(this.focus);
      this.canvas.dataset.focus = this.focus.toFixed(3); this.onDepth?.(this.focus); this.request();
    }
    pointerDown(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      this.canvas.focus({ preventScroll: true }); this.canvas.setPointerCapture(e.pointerId);
      this.lastGestureMoved = false;
      this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, yaw: this.target.yaw, pitch: this.target.pitch };
    }
    pointerMove(e) {
      if (!this.drag || e.pointerId !== this.drag.id) return;
      if (Math.hypot(e.clientX - this.drag.x, e.clientY - this.drag.y) > 4) this.lastGestureMoved = true;
      this.target.yaw = this.drag.yaw + (e.clientX - this.drag.x) / Math.max(200, this.width) * Math.PI * 2;
      this.target.pitch = clamp(this.drag.pitch + (e.clientY - this.drag.y) / Math.max(200, this.height) * Math.PI, -Math.PI / 3, Math.PI / 3);
      this.updateRotation(); this.request();
    }
    pointerEnd(e) {
      if (this.drag?.id === e.pointerId) { this.drag = null; if (this.canvas.hasPointerCapture(e.pointerId)) this.canvas.releasePointerCapture(e.pointerId); }
    }
    key(e) {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', 'Home'].includes(e.key)) return;
      e.preventDefault();
      if (e.key === 'ArrowLeft') this.target.yaw -= Math.PI / 12;
      if (e.key === 'ArrowRight') this.target.yaw += Math.PI / 12;
      if (this.lockZoom) {
        if (e.key === 'ArrowUp') this.target.pitch = clamp(this.target.pitch - Math.PI / 36, -Math.PI / 3, Math.PI / 3);
        if (e.key === 'ArrowDown') this.target.pitch = clamp(this.target.pitch + Math.PI / 36, -Math.PI / 3, Math.PI / 3);
        if (e.key === 'Home') this.target = { ...(this.originPose || this.camera) };
      } else {
        if (e.key === 'ArrowUp' || e.key === '+' || e.key === '=') this.setFocus(this.focus - .06);
        if (e.key === 'ArrowDown' || e.key === '-') this.setFocus(this.focus + .06);
        if (e.key === 'Home') { this.target = { yaw: 0, pitch: 0, zoom: 0 }; this.setFocus(.35); }
      }
      this.updateRotation(); this.request();
    }
    updateRotation() { this.canvas.dataset.rotation = (this.target.yaw * 180 / Math.PI).toFixed(1) + ',' + (this.target.pitch * 180 / Math.PI).toFixed(1); }
    reset() {
      if (this.drag && this.canvas.hasPointerCapture(this.drag.id)) this.canvas.releasePointerCapture(this.drag.id);
      this.drag = null; this.camera = { yaw: 0, pitch: 0, zoom: 0 }; this.target = { ...this.camera };
      this.time = 0; this.last = 0; this.history = []; this.historyUntil = 0; this.paused = false;
      this.lens = null; this.particleLimit = 0; this.lastPresentedState = null;
      this.snowTime=0;this.snowGaze={x:0,y:0,yaw:0,pitch:0};this.frozenSnow=null;
      this.conditions.clear(); this.sprites.clear(); this.controls = { structure: false, colors: false, motion: false };
      this.updateRotation(); this.setFocus(.35);
    }
    stop() { if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0; this.last = 0; }
    request() { if (this.active && !document.hidden && !this.raf) this.raf = requestAnimationFrame(t => this.frame(t)); }
    sprite(type, color, blur) {
      const bucket = Math.round(Math.min(blur, 16) / 2) * 2, key = type + color + bucket;
      if (this.sprites.has(key)) return this.sprites.get(key);
      const sprite = document.createElement('canvas'); sprite.width = sprite.height = 160;
      const ctx = sprite.getContext('2d'); ctx.translate(80, 80); ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = 3;
      if (bucket) ctx.filter = `blur(${bucket}px)`;
      ctx.beginPath();
      if (type === 'triangle') { ctx.moveTo(0, -32); ctx.lineTo(34, 29); ctx.lineTo(-34, 29); ctx.closePath(); ctx.stroke(); }
      else if (type === 'line') { ctx.moveTo(-38, -17); ctx.lineTo(38, 17); ctx.stroke(); }
      else if (type === 'arc') { ctx.lineWidth = 6; ctx.arc(0, 0, 30, -.35, Math.PI * 1.4); ctx.stroke(); }
      else if (type === 'halo') {
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 36); glow.addColorStop(0, color); glow.addColorStop(.5, color + 'cc'); glow.addColorStop(1, color + '00');
        ctx.fillStyle = glow; ctx.arc(0, 0, 36, 0, Math.PI * 2); ctx.fill();
      } else {
        if (type === 'dashed-ring') ctx.setLineDash([6, 5]);
        ctx.arc(0, 0, 32, 0, Math.PI * 2); type === 'disc' ? ctx.fill() : ctx.stroke();
        if (type === 'double-ring' || type === 'dot-ring') { ctx.beginPath(); ctx.arc(0, 0, type === 'dot-ring' ? 7 : 20, 0, Math.PI * 2); type === 'dot-ring' ? ctx.fill() : ctx.stroke(); }
      }
      this.sprites.set(key, sprite); return sprite;
    }
    glare(color) {
      const key='glare:'+color;if(this.sprites.has(key))return this.sprites.get(key);
      const canvas=document.createElement('canvas');canvas.width=canvas.height=320;const ctx=canvas.getContext('2d');ctx.translate(160,160);ctx.rotate(-Math.PI*.345);
      const halo=ctx.createRadialGradient(0,0,0,0,0,53);halo.addColorStop(0,color+'88');halo.addColorStop(.35,color+'33');halo.addColorStop(1,color+'00');ctx.fillStyle=halo;ctx.fillRect(-60,-60,120,120);
      // Parallel, asymmetric diffraction trails: one optical axis, no radial star.
      for(const band of [{y:0,width:2.5,blur:1.5,length:143,alpha:.78},{y:3.5,width:8,blur:5,length:128,alpha:.36},{y:-4,width:1.2,blur:1.2,length:111,alpha:.28}]){
        ctx.save();ctx.globalAlpha=band.alpha;ctx.filter=`blur(${band.blur}px)`;
        const light=ctx.createLinearGradient(-band.length,0,band.length,0);light.addColorStop(0,color+'00');light.addColorStop(.22,color+'15');light.addColorStop(.47,color+'99');light.addColorStop(.51,'#fff9e8dd');light.addColorStop(.68,color+'33');light.addColorStop(1,color+'00');
        ctx.strokeStyle=light;ctx.lineWidth=band.width;ctx.beginPath();ctx.moveTo(-band.length*.88,band.y);ctx.lineTo(band.length,band.y+.7);ctx.stroke();ctx.restore();
      }
      this.sprites.set(key,canvas);return canvas;
    }
    colourFor(p){
      const group=primaryColours.includes(p.color)?primaryColours:accentColours;
      const index=this.controls.colors?group[(group.indexOf(p.color)+Math.floor(this.time*.18))%group.length]:p.color;
      return this.conditions.has('colour')?this.colourPalette[index]:palette[index];
    }
    frame(timestamp) {
      this.raf = 0;
      if (!this.active || !this.width || document.hidden) return;
      const dt = this.last ? Math.min((timestamp - this.last) / 1000, .05) : 0; this.last = timestamp;
      const animate = !this.paused && !this.reduced.matches;
      if (animate) this.time += dt;
      const animateSnow=this.conditions.has('snow')&&!this.reduced.matches&&!this.freezePerception;
      if(animateSnow)this.snowTime=(this.snowTime??0)+dt;
      const easing = this.reduced.matches ? 1 : .12;
      for (const key of ['yaw', 'pitch', 'zoom']) this.camera[key] += (this.target[key] - this.camera[key]) * easing;
      const unsettled = Object.keys(this.target).some(k => Math.abs(this.target[k] - this.camera[k]) > .001);
      if(this.conditions.has('snow')&&(animateSnow||unsettled)){
        this.frozenSnow=null;const gaze=this.snowGaze||(this.snowGaze={x:0,y:0,yaw:this.camera.yaw,pitch:this.camera.pitch});
        const decay=Math.exp(-Math.max(dt,.016)*2.6);
        gaze.x=gaze.x*decay+(this.camera.yaw-gaze.yaw)*.095;gaze.y=gaze.y*decay+(this.camera.pitch-gaze.pitch)*.12;
        gaze.yaw=this.camera.yaw;gaze.pitch=this.camera.pitch;
      }
      if (animate || unsettled) this.historyUntil = timestamp + 320;
      this.draw(timestamp);
      this.canvas.dataset.motion = animate ? 'running' : 'paused';
      if (animate || animateSnow || unsettled || (this.conditions.has('snow') && !this.reduced.matches && timestamp < this.historyUntil)) this.request();
    }
    draw(timestamp) {
      const ctx = this.ctx, w = this.width, h = this.height, snow = this.conditions.has('snow');
      ctx.globalAlpha = 1; ctx.fillStyle = '#2548c3'; ctx.fillRect(0, 0, w, h);
      const l = this.lens, scale = l ? w * l.sizeRatio : 1;
      const glow = l ? ctx.createRadialGradient(w * l.centerX, (l.sourceHeight * .46 - l.crop.y) * scale, 5 * scale, w * l.centerX, (l.sourceHeight * .48 - l.crop.y) * scale, Math.max(l.sourceWidth, l.sourceHeight) * .7 * scale)
        : ctx.createRadialGradient(w * .5, h * .46, 5, w * .5, h * .48, Math.max(w, h) * .7);
      glow.addColorStop(0, '#537cf0'); glow.addColorStop(.43, '#294ad1'); glow.addColorStop(1, '#152bac');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
      this.sceneCtx.clearRect(0, 0, w, h); this.drawParticles(this.sceneCtx);
      if (snow && !this.reduced.matches && !this.paused) this.drawDelayed(timestamp);
      else ctx.drawImage(this.scene, 0, 0, w, h);
      this.canvas.dataset.snowDelay = snow && !this.reduced.matches && !this.paused ? '130' : '0';
      if (snow) this.drawDust(ctx);
      if (this.conditions.has('hemianopia')) this.drawFieldLoss(ctx);
    }
    drawFieldLoss(ctx) {
      const l=this.lens,scale=l?this.width*l.sizeRatio:1,sourceW=l?l.sourceWidth:this.width;
      const [start,end]=visibleField(sourceW,this.details.hemianopia),ox=l?l.crop.x:0,oy=l?l.crop.y:0;
      const maxBulge=Math.min(110,sourceW*.085),edges=[];if(start>0)edges.push({x:start,left:true,maxBulge});if(end<sourceW)edges.push({x:end,left:false,maxBulge});
      const w=this.width,h=this.height,contacts=this.fieldContacts||[],margin=100*scale;
      for(const edge of edges){
        const near=contacts.filter(p=>Math.abs(p.x-edge.x)<p.r+110),points=[];
        for(let y=Math.floor((oy-100)/8)*8;y<=oy+h/scale+108;y+=8)points.push({x:(fieldBoundary(y,edge,near)-ox)*scale,y:(y-oy)*scale});
        // A soft, curved field boundary reacts to the original particles themselves.
        ctx.save();ctx.fillStyle='#000';ctx.filter=`blur(${20*scale}px)`;ctx.beginPath();
        const outside=edge.left?-margin:w+margin;ctx.moveTo(outside,-margin);
        for(const p of points)ctx.lineTo(p.x,p.y);ctx.lineTo(outside,h+margin);ctx.closePath();ctx.fill();ctx.restore();
        // Reuse touching particles' own shape, colour and coordinates as they merge.
        ctx.save();ctx.globalCompositeOperation='screen';
        for(const p of near){
          const touch=clamp(1-Math.abs(p.x-edge.x)/(p.r+40),0,1);if(touch<.05)continue;
          const box=p.r*6*scale;ctx.globalAlpha=touch*p.alpha*.42;
          ctx.save();ctx.translate((p.x-ox)*scale,(p.y-oy)*scale);ctx.rotate(p.rotation);ctx.drawImage(this.sprite(p.type,p.color,8),-box/2,-box/2,box,box);ctx.restore();
        }
        ctx.restore();
      }
    }
    drawParticles(ctx) {
      const w = this.width, h = this.height, myopia = this.conditions.has('myopia');
      this.fieldContacts=[];
      const l=this.lens,sourceW=l?l.sourceWidth:w,sourceH=l?l.sourceHeight:h,fieldEdges=visibleField(sourceW,this.details.hemianopia);
      const points = [], count = this.particleLimit || (w < 600 ? 2200 : this.particles.length), camera = { ...this.camera, lens: this.lens };
      for (let i = 0; i < count; i++) {
        const p = this.particles[i];
        const point = { x: p.x + Math.sin(this.time * p.speed + p.phase) * .36, y: p.y + Math.cos(this.time * p.speed * .8 + p.phase) * .26, z: p.z + Math.sin(this.time * p.speed * .7 + p.phase) * .18 };
        const pos = project(point, camera, w, h);
        if(this.conditions.has('hemianopia')){
          const source=l?project(point,this.camera,sourceW,sourceH):pos,r=p.radius*source.size;
          if(source.visible&&r>3&&fieldEdges.some(edge=>edge>0&&edge<sourceW&&Math.abs(source.x-edge)<r+110)){
            const alpha=(.95-source.depth*.38)*clamp((source.viewZ-.8)/.8,0,1)*clamp((17.5-source.distance)/4.5,0,1);
            this.fieldContacts.push({x:source.x,y:source.y,r:Math.min(100,r),color:this.colourFor(p),type:this.controls.structure&&p.type==='disc'&&p.radius>15?'ring':p.type,rotation:p.rotation+this.camera.yaw+this.time*p.speed*.06,alpha});
          }
        }
        // Connections use the source scene's same ordering, including off-crop neighbours.
        const sourceConnections = l && this.controls.structure;
        const visiblePos = sourceConnections ? project(point, this.camera, l.sourceWidth, l.sourceHeight) : pos;
        const size = p.radius * visiblePos.size, visibleW = sourceConnections ? l.sourceWidth : w, visibleH = sourceConnections ? l.sourceHeight : h;
        if (!visiblePos.visible || visiblePos.x < -size * 2 || visiblePos.y < -size * 2 || visiblePos.x > visibleW + size * 2 || visiblePos.y > visibleH + size * 2) continue;
        pos.p = p; points.push(pos);
      }
      points.sort((a, b) => b.viewZ - a.viewZ);
      if (this.controls.structure) {
        const l = this.lens, scale = l ? w * l.sizeRatio : 1;
        ctx.save(); ctx.strokeStyle = '#c9eeff'; ctx.globalAlpha = .22; ctx.lineWidth = .8 * scale;
        for (let i = 0; i < points.length - 3; i += 5) {
          const a = points[i], b = points[i + 3];
          if (Math.abs(a.distance - b.distance) < 2 && Math.hypot(a.x - b.x, a.y - b.y) < (l ? Math.min(l.sourceWidth, l.sourceHeight) * scale : Math.min(w, h)) * .2) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        } ctx.restore();
      }
      for (const pos of points) {
        const p = pos.p, box = p.radius * pos.size * 5;
        const color = this.colourFor(p);
        const opticalScale = this.lens ? w * this.lens.sizeRatio : 1;
        const blur = blurAt(pos.distance, myopia) * opticalScale;
        const type = this.controls.structure && p.type === 'disc' && p.radius > 15 ? 'ring' : p.type;
        // Convert optical blur in screen pixels into sprite pixels before caching.
        const sprite = this.sprite(type, color, blur * 160 / Math.max(12, box));
        const nearFade = clamp((pos.viewZ - .8) / .8, 0, 1), fog = clamp((17.5 - pos.distance) / 4.5, 0, 1);
        ctx.globalAlpha = (.95 - pos.depth * .38) * nearFade * fog;
        ctx.save(); ctx.translate(pos.x, pos.y); ctx.rotate(p.rotation + this.camera.yaw + this.time * p.speed * .06);
        ctx.drawImage(sprite, -box / 2, -box / 2, box, box); ctx.restore();
        if(this.conditions.has('astigmatism')&&p.radius>9){
          const alpha=ctx.globalAlpha;ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=alpha*.85;
          ctx.drawImage(this.glare(color),pos.x-box,pos.y-box,box*2,box*2);ctx.restore();
          ctx.globalAlpha=alpha*.1;ctx.drawImage(sprite,pos.x-box/2+3*opticalScale,pos.y-box/2-6*opticalScale,box,box);ctx.globalAlpha=alpha;
        }
      }
      ctx.globalAlpha = 1; this.canvas.dataset.rendered = String(points.length);
    }
    drawDelayed(timestamp) {
      const w = this.width, h = this.height, history = this.history;
      if (!history.length || timestamp - history.at(-1).time >= 55) {
        const frame = history.length === 7 ? history.shift() : { canvas: document.createElement('canvas') };
        if (frame.canvas.width !== this.scene.width || frame.canvas.height !== this.scene.height) { frame.canvas.width = this.scene.width; frame.canvas.height = this.scene.height; }
        const ctx = frame.canvas.getContext('2d'); ctx.clearRect(0, 0, frame.canvas.width, frame.canvas.height); ctx.drawImage(this.scene, 0, 0);
        frame.time = timestamp; frame.state = this.liveState(); history.push(frame);
      }
      const delayed = history.findLast(frame => frame.time <= timestamp - 130) || history[0];
      const echo = history.findLast(frame => frame.time <= timestamp - 260);
      if (echo && echo !== delayed) { this.ctx.globalAlpha = .18; this.ctx.drawImage(echo.canvas, 0, 0, w, h); }
      this.ctx.globalAlpha = 1; this.ctx.drawImage(delayed.canvas, 0, 0, w, h);
      this.lastPresentedState = delayed.state;
    }
    floaterSprite(type){
      const key='floater:'+type;if(this.sprites.has(key))return this.sprites.get(key);
      const canvas=document.createElement('canvas');canvas.width=canvas.height=96;const c=canvas.getContext('2d');c.translate(48,48);c.filter='blur(.65px)';
      c.lineWidth=2;c.strokeStyle='#17252b99';c.fillStyle='#24343b77';
      if(type===0){c.beginPath();c.ellipse(0,0,16,12,-.4,0,Math.PI*2);c.stroke();c.strokeStyle='#dce3e355';c.lineWidth=1;c.beginPath();c.ellipse(1,0,14,10,-.4,0,Math.PI*2);c.stroke();}
      else if(type===1){c.beginPath();c.moveTo(-27,14);c.bezierCurveTo(-16,-23,2,21,10,-12);c.bezierCurveTo(16,-30,29,2,20,20);c.stroke();c.globalAlpha=.35;c.translate(3,2);c.stroke();}
      else if(type===2){c.filter='blur(2px)';c.beginPath();c.ellipse(0,0,7,11,.35,0,Math.PI*2);c.fill();}
      else if(type===3){c.filter='blur(.8px)';c.fillStyle='#dfeaf01a';c.strokeStyle='#f3fbfc66';c.lineWidth=1.4;c.beginPath();c.ellipse(0,0,21,15,.3,0,Math.PI*2);c.fill();c.stroke();c.strokeStyle='#25354633';c.beginPath();c.ellipse(1,1,18,12,.3,0,Math.PI*2);c.stroke();}
      else{c.filter='blur(1.2px)';c.strokeStyle='#eef7fa66';c.lineWidth=3;c.shadowColor='#0e263b55';c.shadowBlur=3;c.beginPath();c.moveTo(-30,11);c.bezierCurveTo(-12,-22,0,24,12,-10);c.bezierCurveTo(20,-30,32,-1,20,23);c.stroke();}
      this.sprites.set(key,canvas);return canvas;
    }
    drawDust(ctx) {
      const l=this.lens,w=l?l.sourceWidth:this.width,h=l?l.sourceHeight:this.height,scale=l?this.width*l.sizeRatio:1;
      const view=this.frozenSnow,time=view?view.time:(this.snowTime??this.time),camera=view?view.camera:this.camera,gaze=view?view.gaze:(this.snowGaze||{x:0,y:0});
      const count=w<600?48:this.dust.length;
      for(let i=0;i<count;i++){
        const p=this.dust[i],pos=floaterPosition(p,time,gaze,camera),x=(pos.x*w-(l?l.crop.x:0))*scale,y=(pos.y*h-(l?l.crop.y:0))*scale,box=p.radius*9*scale*(p.type>=3?1.65:1);
        ctx.globalAlpha=.68+(i%3)*.1;ctx.drawImage(this.floaterSprite(p.type),x-box/2,y-box/2,box,box);
      }
      const seed=snowSeed(time,camera.yaw,camera.pitch);
      if(!this.grainTile)this.grainTile=document.createElement('canvas');
      if(this.grainSeed!==seed){this.grainTile.width=this.grainTile.height=128;const tile=this.grainTile.getContext('2d'),pixels=tile.createImageData(128,128);pixels.data.set(snowPixels(seed));tile.putImageData(pixels,0,0);this.grainSeed=seed;}
      ctx.save();ctx.globalAlpha=1;ctx.translate(-(l?l.crop.x:0)*scale,-(l?l.crop.y:0)*scale);ctx.scale(scale,scale);ctx.fillStyle=ctx.createPattern(this.grainTile,'repeat');ctx.fillRect(0,0,w,h);ctx.restore();
      ctx.globalAlpha=1;this.canvas.dataset.snowGrain=String(seed);
    }

  }
  ParticleField.palette = Object.freeze(palette);
  ParticleField.primaryColours = Object.freeze(primaryColours);
  root.ParticleField = ParticleField;
})(globalThis);
