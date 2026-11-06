(function (root) {
  'use strict';
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function toggleCondition(current, id) {
    const next = new Set(current);
    if (id === 'normal') return current.has('normal') ? new Set() : new Set(['normal']);
    next.delete('normal');
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  }
  function rotate(point, yaw = 0, pitch = 0) {
    const x = point.x * Math.cos(yaw) + point.z * Math.sin(yaw);
    const z = point.z * Math.cos(yaw) - point.x * Math.sin(yaw);
    return { x, y: point.y * Math.cos(pitch) - z * Math.sin(pitch), z: point.y * Math.sin(pitch) + z * Math.cos(pitch) };
  }
  const wrap = (value, period = 36) => ((value + period / 2) % period + period) % period - period / 2;
  function focusZoom(focus) { return (clamp(focus, 0, 1) - .35) * 18; }
  function project(point, camera, width, height) {
    const yaw = camera.yaw || 0, pitch = camera.pitch || 0, travel = camera.zoom || 0;
    // The viewer stays inside a repeating world. Seams lie beyond the visible fog.
    const eye = { x: travel * Math.sin(yaw) * Math.cos(pitch), y: -travel * Math.sin(pitch), z: -travel * Math.cos(yaw) * Math.cos(pitch) };
    const relative = { x: wrap(point.x - eye.x), y: wrap(point.y - eye.y), z: wrap(point.z - eye.z) };
    const rotated = rotate(relative, yaw, pitch);
    const distance = Math.hypot(relative.x, relative.y, relative.z);
    const lens = camera.lens;
    const perspective = 6 / Math.max(.7, rotated.z) * (lens ? width * lens.sizeRatio : 1);
    const focal = lens ? width * lens.focalRatio : Math.min(width, height) * .8;
    return {
      x: width * (lens ? lens.centerX : .5) + rotated.x * focal / Math.max(.7, rotated.z),
      y: height * (lens ? lens.centerY : .5) + rotated.y * focal / Math.max(.7, rotated.z),
      size: perspective,
      distance,
      viewZ: rotated.z,
      visible: rotated.z > .8 && distance < 17.5,
      depth: clamp(distance / 17.5, 0, 1)
    };
  }
  function blurAt(distance, myopia) {
    return myopia ? clamp((distance - 4.2) * .7, 0, 9) : 0;
  }
  const COLOUR_MATRICES = {
      deutan: [[.367322, .860646, -.227968], [.280085, .672501, .047413], [-.01182, .04294, .968881]],
      protan: [[.152286,1.052583,-.204868],[.114503,.786281,.099216],[-.003882,-.048116,1.051998]],
      tritan: [[1.255528,-.076749,-.178779],[-.078411,.930809,.147602],[.004733,.691367,.3039]],
      weak: [[.547494,.607765,-.155259],[.181692,.781742,.036566],[-.010410,.027275,.983136]]
    };
  function visionColour(hex, type = 'deutan') {
    const bytes = hex.replace('#', '').match(/../g).map(v => parseInt(v, 16) / 255);
    const linear = bytes.map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    const matrix = COLOUR_MATRICES[type] || COLOUR_MATRICES.deutan;
    const rgb = matrix.map(row => clamp(row.reduce((sum, k, i) => sum + k * linear[i], 0), 0, 1));
    return '#' + rgb.map(v => Math.round(255 * (v <= .0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - .055)).toString(16).padStart(2, '0')).join('');
  }
  function visibleField(width,type='left'){return type==='side'?[width*.34,width*.66]:type==='right'?[0,width*.5]:[width*.5,width];}
  // Existing particles deform the boundary into the missing region as they touch it.
  function fieldBoundary(y,edge,contacts){
    let bulge=0;
    for(const p of contacts){
      const r=Math.min(90,Math.max(5,p.r)),near=Math.exp(-1*((p.x-edge.x)/(r+45))**2);
      bulge+=r*1.4*near*Math.exp(-2*((y-p.y)/(r+20))**2)*p.alpha;
    }
    return edge.x+(edge.left?-1:1)*Math.min(edge.maxBulge??110,bulge);
  }
  function focusRays(progress){
    const t=clamp(progress,0,1),lerp=(a,b)=>a+(b-a)*t;
    return [[lerp(0,58),lerp(411,356),869,lerp(411,356),1361,lerp(411,423),lerp(1421,1361),lerp(411,423)],
      [lerp(0,58),lerp(411,476),lerp(869,872),lerp(411,476),1361,lerp(411,423),lerp(1421,1361),lerp(411,423)]];
  }
  function anatomyLook(pointerY,centerY,height){return clamp((centerY-pointerY)/Math.max(1,height)*6,-2.8,2.8);}
  function snowSeed(time,yaw=0,pitch=0){return Math.floor(time*12)+Math.floor(yaw*89)*131+Math.floor(pitch*103)*197;}
  function snowPixels(seed,size=128){
    const pixels=new Uint8ClampedArray(size*size*4);let state=(seed*2654435761+2176136261)>>>0;
    for(let i=0;i<pixels.length;i+=4){state^=state<<13;state^=state>>>17;state^=state<<5;const n=(state>>>0)/4294967296;
      const light=n>.54,visible=n>.34;pixels[i]=pixels[i+1]=pixels[i+2]=light?235:12;pixels[i+3]=visible?(light?46:30):0;
    }return pixels;
  }
  function floaterPosition(p,time,gaze={x:0,y:0},camera={yaw:0,pitch:0}){
    const cycle=n=>((n%1)+1)%1;
    return {x:cycle(p.x+p.vx*time+Math.sin(time*p.speed*.65+p.phase)*.035+gaze.x*(.45+Math.sin(p.phase)*.25)-camera.yaw*.004),
      y:cycle(p.y+p.vy*time+Math.cos(time*p.speed*.55+p.phase)*.04+gaze.y*(.45+Math.cos(p.phase)*.25)-camera.pitch*.006)};
  }
  const deutanColour = hex => visionColour(hex, 'deutan');
  const api = { clamp, wrap, toggleCondition, rotate, focusZoom, project, blurAt, visionColour, deutanColour, COLOUR_MATRICES, visibleField, fieldBoundary, focusRays, anatomyLook, snowSeed, snowPixels, floaterPosition };
  root.FieldMath = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
