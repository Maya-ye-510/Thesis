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
  function project(point, camera, width, height) {
    const distance = Math.max(.6, 3.1 + point.z + camera.zoom);
    const perspective = 2.4 / distance;
    const unit = Math.min(width * .24, height * .42);
    return {
      x: width / 2 + (point.x - camera.x) * unit * perspective,
      y: height / 2 + (point.y - camera.y) * unit * perspective,
      size: perspective,
      depth: clamp((distance - 1) / 4.5, 0, 1)
    };
  }
  function blurAt(depth, focus, myopia) {
    return myopia ? Math.max(0, Math.abs(depth - focus) * 12 - .55) : 0;
  }
  function deutanColour(hex) {
    const bytes = hex.replace('#', '').match(/../g).map(v => parseInt(v, 16) / 255);
    const linear = bytes.map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    const matrix = [[.367322, .860646, -.227968], [.280085, .672501, .047413], [-.01182, .04294, .968881]];
    const rgb = matrix.map(row => clamp(row.reduce((sum, k, i) => sum + k * linear[i], 0), 0, 1));
    return '#' + rgb.map(v => Math.round(255 * (v <= .0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - .055)).toString(16).padStart(2, '0')).join('');
  }
  const api = { clamp, toggleCondition, project, blurAt, deutanColour };
  root.FieldMath = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
