'use strict';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const selected = new Set();
const controls = { structure: false, colors: false, motion: true };
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
let screen = 'home';
let transition = null;

// Reflow the original artwork into responsive regions; SVG internals stay unchanged.
const homeCenter = document.createElement('div');
homeCenter.className = 'home-center';
$('#home').append(homeCenter);
homeCenter.append($('#enter'), $('.eye-small'));
const homeBackground = document.createElement('div');
homeBackground.className = 'home-background';
$('#home').prepend(homeBackground);
homeBackground.append($('#home > img[data-node-id="167:177"]'));
$$('#home img[data-node-id="167:157"],#home img[data-node-id="167:156"]').forEach((el, i) => {
  el.className = 'home-cross ' + (i ? 'first' : 'second');
  el.style.left = ''; el.style.top = '';
});
const homeRule = document.createElement('div'); homeRule.className = 'home-rule';
homeRule.append($('#home img[data-node-id="166:148"]')); $('#home').append(homeRule);
const conditionFooter = document.createElement('div'); conditionFooter.className = 'condition-footer';
$('#conditions').append(conditionFooter); conditionFooter.append($('#bubbles'), $('.next'));
$('#conditions img[data-node-id="212:489"]').classList.add('condition-old-rule');
const experienceFooter = document.createElement('div'); experienceFooter.className = 'experience-footer';
$('#experience').append(experienceFooter); experienceFooter.append($('.eye-control'), $('#display-options'));
$('#experience img[data-node-id="252:175"]').classList.add('experience-old-rule');

function sizeArtwork() {
  const container = $('.intro-graphic');
  if (!container.getBoundingClientRect().width) return;
  const width = container.clientWidth;
  const scale = width / 1128;
  $('.eye-artboard').style.transform = `scale(${scale})`;
  if (innerWidth > 700) container.style.minHeight = Math.max(560, 907 * scale - 40) + 'px';
  else container.style.minHeight = '';
}
new ResizeObserver(sizeArtwork).observe($('.intro-graphic'));
addEventListener('resize', sizeArtwork);
const field = new ParticleField($('#particle-canvas'), value => { $('#focus-depth').value = Math.round(value * 100); });

function updateScreen(name, replace) {
  screen = name;
  $$('.screen').forEach(el => { el.hidden = el.id !== name; el.classList.remove('entering'); });
  document.title = 'I SEE — ' + ({ home: 'Prototype 2', intro: 'About', conditions: 'Personal condition', experience: 'Experience' })[name];
  if (replace) history.replaceState({ screen: name }, '', '#' + name);
  else if (location.hash !== '#' + name) history.pushState({ screen: name }, '', '#' + name);
  field.setActive(name === 'experience');
  if (name === 'experience') updateConditions();
  resetEyes();
  window.scrollTo({ top: 0, behavior: 'instant' });
  requestAnimationFrame(() => {
    sizeArtwork();
    const el = $('#' + name); el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true });
  });
}
function go(name, replace = false, immediate = false) {
  if (!['home', 'intro', 'conditions', 'experience'].includes(name)) name = 'home';
  if (name === screen && !immediate) return;
  if (transition) transition.skipTransition();
  if (document.startViewTransition && !reduceMotion.matches && !immediate) {
    transition = document.startViewTransition(() => updateScreen(name, replace));
    transition.finished.catch(() => {}).finally(() => { transition = null; });
  } else {
    updateScreen(name, replace);
    if (!immediate && !reduceMotion.matches) $('#' + name).classList.add('entering');
  }
}
addEventListener('popstate', () => go(location.hash.slice(1) || 'home', true));
$$('[data-go]').forEach(b => { b.onclick = () => go(b.dataset.go); });
$('#enter').onclick = () => go('intro');
$('#home').addEventListener('click', e => { if (!e.target.closest('button')) go('intro'); });
$('#home').addEventListener('keydown', e => {
  if (e.target === $('#home') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); go('intro'); }
});

const conditions = [
  { id: 'normal', name: 'Normal', default: 'ea661.svg', hover: 'd87c9.svg', selected: '4f20c.svg' },
  { id: 'myopia', name: 'Myopia', default: '5dcb7.svg', hover: '95338.svg', selected: '65769.svg' },
  { id: 'colour', name: 'Color Blind', default: '88554.svg', hover: 'af152.svg', selected: '61fc6.svg' },
  { id: 'snow', name: 'Vision Snow', default: '6948b.svg', hover: '59035.svg', selected: '3d3a2.svg' }
];
function conditionOffset(id, state) {
  let x = state === 'hover' ? -6 : 0, y = 0;
  if (id === 'myopia' && state !== 'default') { x -= 12; y -= 12; }
  if (id === 'snow' && state !== 'default') { x -= 4; y -= 4; }
  return `left:${x}px;top:${y}px`;
}
function layers(config, condition = false) {
  return ['default', 'hover', 'selected'].map(state => `<span class="art-state ${state}" style="${condition ? conditionOffset(config.id, state) : ''}"><img class="asset" src="assets/${config[state]}" alt=""></span>`).join('');
}
function hoverStates(button) {
  button.addEventListener('pointerenter', () => button.classList.add('is-hover'));
  button.addEventListener('pointerleave', () => button.classList.remove('is-hover'));
  button.addEventListener('focus', () => button.classList.add('is-hover'));
  button.addEventListener('blur', () => button.classList.remove('is-hover'));
}
function updateConditions() {
  conditions.forEach(c => {
    const b = $(`[data-condition="${c.id}"]`);
    b.classList.toggle('is-selected', selected.has(c.id)); b.setAttribute('aria-pressed', selected.has(c.id));
  });
  field.setConditions(selected);
  $('#field-condition').textContent = conditions.filter(c => selected.has(c.id)).map(c => c.name).join(' + ') || 'Normal';
  $('#particle-canvas').setAttribute('aria-label', 'Interactive particle field. ' + $('#field-condition').textContent + '. Drag to explore; use arrow keys to pan and change focus.');
}
conditions.forEach(c => {
  const button = document.createElement('button'); button.className = 'condition'; button.dataset.condition = c.id;
  button.setAttribute('aria-label', c.name); button.setAttribute('aria-pressed', 'false');
  button.innerHTML = `<span class="condition-art">${layers(c, true)}</span><span class="condition-label">${c.name}</span>`;
  hoverStates(button);
  button.onclick = () => {
    const next = FieldMath.toggleCondition(selected, c.id); selected.clear(); next.forEach(id => selected.add(id)); updateConditions();
  };
  $('#condition-options').append(button);
});
const bubbles = [[1344,707,'b2653'],[1294,733,'b2653'],[1241,676,'76bd1'],[1176,755,'b2653'],[1155,705,'b0dc6'],[1205,783,'5863d'],[1271,768,'f1c0b'],[1170,705,'d604f'],[1325,743,'f1c0b'],[1379,718,'f1c0b'],[1378,692,'d7757'],[1306,668,'94370'],[1097,775,'94370'],[1344,743,'2c6ae',true],[1240,743,'2c6ae',true],[1105,743,'2c6ae',true],[1040,732,'2c6ae',true],[1319,708,'2c6ae',true],[1251,707,'2c6ae',true],[1271,733,'2c6ae',true],[1138,718,'2c6ae',true],[1384,743,'b2653'],[1201,676,'2c6ae',true]];
bubbles.forEach(([x, y, file, overlay]) => {
  const im = document.createElement('img'); im.className = 'asset'; im.src = 'assets/' + file + '.svg'; im.alt = '';
  im.style.left = x - 1040 + 'px'; im.style.top = y - 668 + 'px'; if (overlay) im.style.mixBlendMode = 'overlay'; $('#bubbles').append(im);
});
const display = [
  { id: 'structure', name: 'Structure', default: 'b4f9d.svg', hover: 'c72f5.svg', selected: '459a5.svg' },
  { id: 'colors', name: 'Colors', default: 'c26e9.svg', hover: 'c9691.svg', selected: '3e706.svg' },
  { id: 'motion', name: 'Motion', default: '821d9.svg', hover: '9a6a0.svg', selected: '29b56.svg' }
];
function updateControls() {
  display.forEach(c => {
    const b = $(`[data-display="${c.id}"]`); b.classList.toggle('is-selected', controls[c.id]); b.setAttribute('aria-pressed', controls[c.id]);
  });
  const pause = $('#field-pause'); pause.textContent = controls.motion ? 'Pause motion' : 'Resume motion'; pause.setAttribute('aria-pressed', !controls.motion);
  field.setControls(controls);
}
display.forEach(c => {
  const choice = document.createElement('div'); choice.className = 'display-choice';
  const b = document.createElement('button'); b.className = 'variant-button display-button'; b.dataset.display = c.id;
  b.setAttribute('aria-label', c.name); b.innerHTML = layers(c); hoverStates(b);
  b.onclick = () => { controls[c.id] = !controls[c.id]; updateControls(); };
  const label = document.createElement('button'); label.className = 'display-label'; label.textContent = c.name; label.setAttribute('aria-label', 'Select ' + c.name); label.onclick = () => b.click();
  choice.append(b, label); $('#display-options').append(choice);
});
const eyeButton = $('.eye-control'); eyeButton.innerHTML = layers({ default: eyeButton.dataset.default, hover: eyeButton.dataset.hover, selected: eyeButton.dataset.selected }); hoverStates(eyeButton);
$('#field-pause').onclick = () => { controls.motion = !controls.motion; updateControls(); };
$('#focus-depth').oninput = e => field.setFocus(Number(e.target.value) / 100);
updateControls();

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
addEventListener('pagehide', () => { field.stop(); if (eyeRAF) cancelAnimationFrame(eyeRAF); });
go(location.hash.slice(1) || 'home', true, true);
