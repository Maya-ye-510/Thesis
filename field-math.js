(function (root) {
  'use strict';
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function toggleCondition(current, id) {
    const next = new Set(current);
    if (id === 'normal') return new Set(['normal']);
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
    const perspective = 6 / Math.max(.7, rotated.z);
    const focal = Math.min(width, height) * .8;
    return {
      x: width / 2 + rotated.x * focal / Math.max(.7, rotated.z),
      y: height / 2 + rotated.y * focal / Math.max(.7, rotated.z),
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
  function deutanColour(hex) {
    const bytes = hex.replace('#', '').match(/../g).map(v => parseInt(v, 16) / 255);
    const linear = bytes.map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    const matrix = [[.367322, .860646, -.227968], [.280085, .672501, .047413], [-.01182, .04294, .968881]];
    const rgb = matrix.map(row => clamp(row.reduce((sum, k, i) => sum + k * linear[i], 0), 0, 1));
    return '#' + rgb.map(v => Math.round(255 * (v <= .0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - .055)).toString(16).padStart(2, '0')).join('');
  }
  const api = { clamp, wrap, toggleCondition, rotate, focusZoom, project, blurAt, deutanColour };
  root.FieldMath = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
