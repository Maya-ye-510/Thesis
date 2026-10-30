/* An immersive repeating space, rendered with cached native Canvas 2D sprites. */
(function (root) {
  'use strict';
  const { clamp, project, focusZoom, blurAt, deutanColour } = root.FieldMath;
  const palette = ['#dfff33', '#63e6e2', '#ff563b', '#a65aff', '#fff064', '#20d8ff', '#101a48', '#ff48cf'];
  const deutan = palette.map(deutanColour);
  class ParticleField {
    constructor(canvas, onDepth) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d', { alpha: false }); this.onDepth = onDepth;
      this.camera = { yaw: 0, pitch: 0, zoom: 0 }; this.target = { ...this.camera }; this.focus = .35;
      this.conditions = new Set(); this.controls = { structure: false, colors: false, motion: false }; this.paused = false;
      this.reduced = matchMedia('(prefers-reduced-motion: reduce)');
      this.active = false; this.time = 0; this.raf = 0; this.last = 0; this.width = this.height = 0; this.drag = null;
      this.sprites = new Map(); this.history = []; this.historyUntil = 0;
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
        e.preventDefault(); this.setFocus(this.focus - clamp(e.deltaY, -120, 120) * .0013);
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
        color: Math.floor(rand() * palette.length),
        type: i % 43 === 0 ? 'triangle' : i % 61 === 0 ? 'line' : circles[i % circles.length],
        rotation: rand() * Math.PI * 2, phase: rand() * Math.PI * 2, speed: .18 + rand() * .26
      }));
      this.dust = Array.from({ length: 70 }, () => ({ x: rand(), y: rand(), radius: .7 + rand() ** 3 * 6, phase: rand() * Math.PI * 2, speed: .01 + rand() * .02 }));
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
      this.canvas.dataset.particleCount = String(this.width < 600 ? 2200 : this.particles.length); this.request();
    }
    setActive(active) { this.active = active; this.last = 0; if (active) { this.resize(); this.request(); } else this.stop(); }
    setConditions(conditions) {
      this.conditions = new Set(conditions); this.canvas.dataset.conditions = [...conditions].sort().join(',') || 'normal';
      this.history = []; this.sprites.clear(); this.request();
    }
    setControls(controls) {
      if (Object.keys(controls).some(key => controls[key] !== this.controls[key])) this.historyUntil = performance.now() + 320;
      Object.assign(this.controls, controls); this.request();
    }
    setPaused(value) { this.paused = value; this.request(); }
    setFocus(value) {
      this.focus = clamp(value, 0, 1); this.target.zoom = focusZoom(this.focus);
      this.canvas.dataset.focus = this.focus.toFixed(3); this.onDepth?.(this.focus); this.request();
    }
    pointerDown(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      this.canvas.focus({ preventScroll: true }); this.canvas.setPointerCapture(e.pointerId);
      this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, yaw: this.target.yaw, pitch: this.target.pitch };
    }
    pointerMove(e) {
      if (!this.drag || e.pointerId !== this.drag.id) return;
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
      if (e.key === 'ArrowUp' || e.key === '+' || e.key === '=') this.setFocus(this.focus - .06);
      if (e.key === 'ArrowDown' || e.key === '-') this.setFocus(this.focus + .06);
      if (e.key === 'Home') { this.target = { yaw: 0, pitch: 0, zoom: 0 }; this.setFocus(.35); }
      this.updateRotation(); this.request();
    }
    updateRotation() { this.canvas.dataset.rotation = (this.target.yaw * 180 / Math.PI).toFixed(1) + ',' + (this.target.pitch * 180 / Math.PI).toFixed(1); }
    reset() {
      if (this.drag && this.canvas.hasPointerCapture(this.drag.id)) this.canvas.releasePointerCapture(this.drag.id);
      this.drag = null; this.camera = { yaw: 0, pitch: 0, zoom: 0 }; this.target = { ...this.camera };
      this.time = 0; this.last = 0; this.history = []; this.historyUntil = 0; this.paused = false;
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
    frame(timestamp) {
      this.raf = 0;
      if (!this.active || !this.width || document.hidden) return;
      const dt = this.last ? Math.min((timestamp - this.last) / 1000, .05) : 0; this.last = timestamp;
      const animate = !this.paused && !this.reduced.matches;
      if (animate) this.time += dt * (this.controls.motion ? 1.85 : 1);
      const easing = this.reduced.matches ? 1 : .12;
      for (const key of ['yaw', 'pitch', 'zoom']) this.camera[key] += (this.target[key] - this.camera[key]) * easing;
      const unsettled = Object.keys(this.target).some(k => Math.abs(this.target[k] - this.camera[k]) > .001);
      if (animate || unsettled) this.historyUntil = timestamp + 320;
      this.draw(timestamp);
      this.canvas.dataset.motion = animate ? 'running' : 'paused';
      if (animate || unsettled || (this.conditions.has('snow') && !this.reduced.matches && timestamp < this.historyUntil)) this.request();
    }
    draw(timestamp) {
      const ctx = this.ctx, w = this.width, h = this.height, snow = this.conditions.has('snow');
      ctx.globalAlpha = 1; ctx.fillStyle = '#2548c3'; ctx.fillRect(0, 0, w, h);
      const glow = ctx.createRadialGradient(w * .5, h * .46, 5, w * .5, h * .48, Math.max(w, h) * .7);
      glow.addColorStop(0, '#537cf0'); glow.addColorStop(.43, '#294ad1'); glow.addColorStop(1, '#152bac');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
      this.sceneCtx.clearRect(0, 0, w, h); this.drawParticles(this.sceneCtx);
      if (snow && !this.reduced.matches) this.drawDelayed(timestamp);
      else ctx.drawImage(this.scene, 0, 0, w, h);
      this.canvas.dataset.snowDelay = snow && !this.reduced.matches ? '130' : '0';
      if (snow) this.drawDust(ctx);
    }
    drawParticles(ctx) {
      const w = this.width, h = this.height, myopia = this.conditions.has('myopia'), colour = this.conditions.has('colour');
      const points = [], count = w < 600 ? 2200 : this.particles.length;
      for (let i = 0; i < count; i++) {
        const p = this.particles[i];
        const point = { x: p.x + Math.sin(this.time * p.speed + p.phase) * .36, y: p.y + Math.cos(this.time * p.speed * .8 + p.phase) * .26, z: p.z + Math.sin(this.time * p.speed * .7 + p.phase) * .18 };
        const pos = project(point, this.camera, w, h), size = p.radius * pos.size;
        if (!pos.visible || pos.x < -size * 2 || pos.y < -size * 2 || pos.x > w + size * 2 || pos.y > h + size * 2) continue;
        pos.p = p; points.push(pos);
      }
      points.sort((a, b) => b.viewZ - a.viewZ);
      if (this.controls.structure) {
        ctx.save(); ctx.strokeStyle = '#c9eeff'; ctx.globalAlpha = .22; ctx.lineWidth = .8;
        for (let i = 0; i < points.length - 3; i += 5) {
          const a = points[i], b = points[i + 3];
          if (Math.abs(a.distance - b.distance) < 2 && Math.hypot(a.x - b.x, a.y - b.y) < Math.min(w, h) * .2) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        } ctx.restore();
      }
      for (const pos of points) {
        const p = pos.p, box = p.radius * pos.size * 5;
        const index = this.controls.colors ? (p.color + Math.floor(this.time * .18)) % palette.length : p.color;
        const color = colour ? deutan[index] : palette[index];
        const blur = blurAt(pos.distance, myopia);
        const type = this.controls.structure && p.type === 'disc' && p.radius > 15 ? 'ring' : p.type;
        // Convert optical blur in screen pixels into sprite pixels before caching.
        const sprite = this.sprite(type, color, blur * 160 / Math.max(12, box));
        const nearFade = clamp((pos.viewZ - .8) / .8, 0, 1), fog = clamp((17.5 - pos.distance) / 4.5, 0, 1);
        ctx.globalAlpha = (.95 - pos.depth * .38) * nearFade * fog;
        ctx.save(); ctx.translate(pos.x, pos.y); ctx.rotate(p.rotation + this.camera.yaw + this.time * p.speed * .06);
        ctx.drawImage(sprite, -box / 2, -box / 2, box, box); ctx.restore();
      }
      ctx.globalAlpha = 1; this.canvas.dataset.rendered = String(points.length);
    }
    drawDelayed(timestamp) {
      const w = this.width, h = this.height, history = this.history;
      if (!history.length || timestamp - history.at(-1).time >= 55) {
        const frame = history.length === 7 ? history.shift() : { canvas: document.createElement('canvas') };
        if (frame.canvas.width !== this.scene.width || frame.canvas.height !== this.scene.height) { frame.canvas.width = this.scene.width; frame.canvas.height = this.scene.height; }
        const ctx = frame.canvas.getContext('2d'); ctx.clearRect(0, 0, frame.canvas.width, frame.canvas.height); ctx.drawImage(this.scene, 0, 0);
        frame.time = timestamp; history.push(frame);
      }
      const delayed = history.findLast(frame => frame.time <= timestamp - 130) || history[0];
      const echo = history.findLast(frame => frame.time <= timestamp - 260);
      if (echo && echo !== delayed) { this.ctx.globalAlpha = .18; this.ctx.drawImage(echo.canvas, 0, 0, w, h); }
      this.ctx.globalAlpha = 1; this.ctx.drawImage(delayed.canvas, 0, 0, w, h);
    }
    drawDust(ctx) {
      const w = this.width, h = this.height, count = w < 600 ? 35 : this.dust.length;
      const dust = this.sprite('disc', '#d4d7de', 8);
      for (let i = 0; i < count; i++) {
        const p = this.dust[i];
        const x = ((p.x + this.time * p.speed * .09 + Math.sin(this.time * .25 + p.phase) * .025 - this.camera.yaw * .012) % 1 + 1) % 1 * w;
        const y = ((p.y - this.time * p.speed * .06 + Math.cos(this.time * .2 + p.phase) * .035 - this.camera.pitch * .02) % 1 + 1) % 1 * h;
        ctx.globalAlpha = .12 + (i % 3) * .055; ctx.drawImage(dust, x - p.radius * 2, y - p.radius * 2, p.radius * 4, p.radius * 4);
      }
      ctx.fillStyle = '#e6e8ed'; ctx.globalAlpha = .2;
      const seed = Math.floor(this.time * 9);
      for (let i = 0; i < 450; i++) ctx.fillRect(((i * 137.508 + seed * 13) % 1000) / 1000 * w, ((i * 73.18 + seed * 7) % 997) / 997 * h, 1, 1);
      ctx.globalAlpha = 1;
    }
  }
  root.ParticleField = ParticleField;
})(globalThis);
