/* Native canvas keeps the field dependency-free and available when opened offline. */
(function (root) {
  'use strict';
  const { clamp, project, blurAt, deutanColour } = root.FieldMath;
  const palette = ['#dfff33', '#63e6e2', '#ff563b', '#a65aff', '#fff064', '#20d8ff', '#101a48', '#ff48cf'];
  const deutan = palette.map(deutanColour);
  class ParticleField {
    constructor(canvas, onDepth) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', { alpha: false });
      this.onDepth = onDepth;
      this.camera = { x: 0, y: 0, zoom: 0 };
      this.target = { x: 0, y: 0, zoom: 0 };
      this.focus = .35;
      this.conditions = new Set();
      this.controls = { structure: false, colors: false, motion: true };
      this.reduced = matchMedia('(prefers-reduced-motion: reduce)');
      this.active = false;
      this.time = 0;
      this.raf = 0;
      this.last = 0;
      this.width = this.height = 0;
      this.drag = null;
      this.sprites = new Map();
      this.build();
      this.observer = new ResizeObserver(() => this.resize());
      this.observer.observe(canvas.parentElement);
      canvas.addEventListener('pointerdown', e => this.pointerDown(e));
      canvas.addEventListener('pointermove', e => this.pointerMove(e));
      canvas.addEventListener('pointerup', e => this.pointerEnd(e));
      canvas.addEventListener('pointercancel', e => this.pointerEnd(e));
      canvas.addEventListener('lostpointercapture', () => { this.drag = null; });
      canvas.addEventListener('wheel', e => {
        if (e.ctrlKey) return; // Keep browser zoom available.
        e.preventDefault();
        this.setFocus(this.focus + clamp(e.deltaY, -120, 120) * .0013);
        this.target.zoom = (this.focus - .35) * 2;
        this.request();
      }, { passive: false });
      canvas.addEventListener('keydown', e => this.key(e));
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.stop(); else this.request();
      });
      this.reduced.addEventListener('change', () => this.request());
    }
    build() {
      let seed = 216730;
      const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
      this.particles = Array.from({ length: 900 }, (_, i) => ({
        x: (rand() - .5) * 8.8,
        y: (rand() - .5) * 4.4,
        z: (rand() - .5) * 4,
        radius: 3 + rand() ** 2 * 21,
        color: Math.floor(rand() * palette.length),
        type: i % 11 === 0 ? 'triangle' : i % 13 === 0 ? 'square' : i % 9 === 0 ? 'line' : i % 3 === 0 ? 'ring' : 'disc',
        phase: rand() * Math.PI * 2,
        speed: .08 + rand() * .12
      }));
    }
    resize() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      this.width = rect.width;
      this.height = rect.height;
      this.dpr = Math.min(devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(rect.width * this.dpr);
      this.canvas.height = Math.round(rect.height * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.canvas.dataset.particleCount = String(this.width < 600 ? 320 : 900);
      this.request();
    }
    setActive(active) { this.active = active; this.last = 0; if (active) { this.resize(); this.request(); } else this.stop(); }
    setConditions(conditions) {
      this.conditions = new Set(conditions);
      this.canvas.dataset.conditions = [...conditions].sort().join(',') || 'normal';
      this.sprites.clear();
      this.request();
    }
    setControls(controls) { Object.assign(this.controls, controls); this.request(); }
    setFocus(value) {
      this.focus = clamp(value, 0, 1);
      this.canvas.dataset.focus = this.focus.toFixed(3);
      this.onDepth?.(this.focus);
      this.request();
    }
    pointerDown(e) {
      this.canvas.focus({ preventScroll: true });
      this.canvas.setPointerCapture(e.pointerId);
      this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, cameraX: this.target.x, cameraY: this.target.y };
    }
    pointerMove(e) {
      if (!this.drag || e.pointerId !== this.drag.id) return;
      this.target.x = clamp(this.drag.cameraX - (e.clientX - this.drag.x) / Math.max(200, this.width) * 4.4, -3.5, 3.5);
      this.target.y = clamp(this.drag.cameraY - (e.clientY - this.drag.y) / Math.max(200, this.height) * 3.5, -2, 2);
      this.canvas.dataset.pan = this.target.x.toFixed(2) + ',' + this.target.y.toFixed(2);
      this.request();
    }
    pointerEnd(e) { if (this.drag?.id === e.pointerId) { this.drag = null; if (this.canvas.hasPointerCapture(e.pointerId)) this.canvas.releasePointerCapture(e.pointerId); } }
    key(e) {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', 'Home'].includes(e.key)) return;
      e.preventDefault();
      if (e.key === 'ArrowLeft') this.target.x = clamp(this.target.x - .25, -3.5, 3.5);
      if (e.key === 'ArrowRight') this.target.x = clamp(this.target.x + .25, -3.5, 3.5);
      if (e.key === 'ArrowUp' || e.key === '+' || e.key === '=') this.setFocus(this.focus + .06);
      if (e.key === 'ArrowDown' || e.key === '-') this.setFocus(this.focus - .06);
      if (e.key === 'Home') { this.target = { x: 0, y: 0, zoom: 0 }; this.setFocus(.35); }
      this.target.zoom = (this.focus - .35) * 2;
      this.canvas.dataset.pan = this.target.x.toFixed(2) + ',' + this.target.y.toFixed(2);
      this.request();
    }
    stop() { if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0; this.last = 0; }
    request() { if (this.active && !document.hidden && !this.raf) this.raf = requestAnimationFrame(t => this.frame(t)); }
    sprite(type, color, blur) {
      const bucket = Math.round(Math.min(blur, 10));
      const key = type + color + bucket;
      if (this.sprites.has(key)) return this.sprites.get(key);
      const sprite = document.createElement('canvas'); sprite.width = sprite.height = 160;
      const ctx = sprite.getContext('2d');
      ctx.translate(80, 80); ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = 3;
      if (bucket) ctx.filter = `blur(${bucket * 1.1}px)`;
      ctx.beginPath();
      if (type === 'triangle') { ctx.moveTo(0, -32); ctx.lineTo(34, 29); ctx.lineTo(-34, 29); ctx.closePath(); ctx.stroke(); }
      else if (type === 'square') { ctx.rotate(.25); ctx.strokeRect(-28, -28, 56, 56); }
      else if (type === 'line') { ctx.moveTo(-38, -17); ctx.lineTo(38, 17); ctx.stroke(); }
      else { ctx.arc(0, 0, 32, 0, Math.PI * 2); type === 'ring' ? ctx.stroke() : ctx.fill(); }
      this.sprites.set(key, sprite);
      return sprite;
    }
    frame(timestamp) {
      this.raf = 0;
      if (!this.active || !this.width || document.hidden) return;
      const dt = this.last ? Math.min((timestamp - this.last) / 1000, .05) : 0;
      this.last = timestamp;
      const animate = this.controls.motion && !this.reduced.matches;
      if (animate) this.time += dt;
      const easing = this.reduced.matches ? 1 : .12;
      for (const key of ['x', 'y', 'zoom']) this.camera[key] += (this.target[key] - this.camera[key]) * easing;
      this.draw();
      const unsettled = Object.keys(this.target).some(k => Math.abs(this.target[k] - this.camera[k]) > .001);
      this.canvas.dataset.motion = animate ? 'running' : 'paused';
      if (animate || unsettled) this.request();
    }
    draw() {
      const ctx = this.ctx, w = this.width, h = this.height;
      const myopia = this.conditions.has('myopia'), snow = this.conditions.has('snow'), colour = this.conditions.has('colour');
      ctx.fillStyle = '#2548c3'; ctx.fillRect(0, 0, w, h);
      const glow = ctx.createRadialGradient(w * .5, h * .46, 5, w * .5, h * .48, Math.max(w, h) * .7);
      glow.addColorStop(0, '#537cf0'); glow.addColorStop(.43, '#294ad1'); glow.addColorStop(1, '#152bac');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
      ctx.save(); ctx.globalAlpha = .16; ctx.strokeStyle = '#a6c4ff'; ctx.lineWidth = 1;
      for (let j = 0; j < 6; j++) {
        const y = h * (.12 + j * .145);
        ctx.beginPath(); ctx.moveTo(-w * .1, y);
        ctx.bezierCurveTo(w * .25, y - h * .16, w * .56, y + h * .2, w * 1.12, y - h * .07); ctx.stroke();
      } ctx.restore();
      const points = [];
      const count = w < 600 ? 320 : this.particles.length;
      for (let i = 0; i < count; i++) {
        const p = this.particles[i];
        const point = { x: p.x + Math.sin(this.time * p.speed + p.phase) * .13, y: p.y + Math.cos(this.time * p.speed * .8 + p.phase) * .1, z: p.z };
        const pos = project(point, this.camera, w, h);
        pos.p = p; points.push(pos);
      }
      points.sort((a, b) => b.depth - a.depth);
      if (this.controls.structure) {
        ctx.save(); ctx.strokeStyle = '#c9eeff'; ctx.globalAlpha = .28; ctx.lineWidth = .8;
        for (let i = 0; i < points.length - 7; i += 5) {
          const a = points[i], b = points[i + 7];
          if (Math.hypot(a.x - b.x, a.y - b.y) < Math.min(w, h) * .24) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        } ctx.restore();
      }
      for (const pos of points) {
        const p = pos.p, size = p.radius * pos.size;
        if (pos.x < -80 || pos.y < -80 || pos.x > w + 80 || pos.y > h + 80) continue;
        const index = this.controls.colors ? (p.color + Math.floor(this.time * .18)) % palette.length : p.color;
        const c = colour ? deutan[index] : palette[index];
        const blur = blurAt(pos.depth, this.focus, myopia);
        const type = this.controls.structure && p.type === 'disc' && p.radius > 15 ? 'ring' : p.type;
        const sprite = this.sprite(type, c, blur);
        const box = size * 5;
        ctx.globalAlpha = .96 - pos.depth * .26;
        ctx.drawImage(sprite, pos.x - box / 2, pos.y - box / 2, box, box);
        // Directional halos are an artistic optical study, not a diagnostic simulation.
        if (myopia && p.radius > 18 && p.type === 'disc' && blur > 1) {
          ctx.save(); ctx.translate(pos.x, pos.y); ctx.rotate(-.55); ctx.strokeStyle = c;
          ctx.globalAlpha = .16; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(-size * (1 + blur * .45), 0); ctx.lineTo(size * (1 + blur * .45), 0); ctx.stroke();
          ctx.globalAlpha = .12; ctx.drawImage(sprite, -box / 2 + blur * 2, -box / 2, box, box); ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
      if (snow) {
        ctx.fillStyle = '#f5f7ff'; ctx.globalAlpha = .38;
        const seed = this.controls.motion && !this.reduced.matches ? Math.floor(this.time * 7) : 0;
        for (let i = 0; i < 900; i++) {
          const x = ((i * 137.508 + seed * 31) % 1000) / 1000 * w, y = ((i * 73.18 + seed * 17) % 997) / 997 * h;
          ctx.fillRect(x, y, i % 4 ? 1 : 1.7, i % 4 ? 1 : 1.7);
        }
        ctx.globalAlpha = 1;
      }
    }
  }
  root.ParticleField = ParticleField;
})(globalThis);
