// Dapur Kilat boot: canvas sizing, the fixed-step loop, sounds, the best
// score, and the ?shot= scenes the screenshots are taken from.

import { FIELD, STEP, BEST_KEY } from './config.js';
import { World, SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER } from './world.js';
import { draw } from './render.js';
import { createInput } from './input.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;

const world = new World(seed);
let best = 0;
try { best = Number(localStorage.getItem(BEST_KEY) || '0') || 0; } catch { best = 0; }

let lastRegions = null;
let muted = false;
let audio = null;

function beep(freq, dur, type = 'sine', gain = 0.08, when = 0) {
  if (muted || !audio) return;
  try {
    const t0 = audio.currentTime + when;
    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g).connect(audio.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  } catch { /* sound is decoration; never break the game */ }
}

function playEvent(type) {
  if (type === 'add') beep(660, 0.07, 'triangle', 0.06);
  else if (type === 'cook') beep(440, 0.12, 'triangle', 0.06);
  else if (type === 'ready') { beep(880, 0.1, 'sine', 0.07); beep(1174, 0.14, 'sine', 0.07, 0.1); }
  else if (type === 'serve') { beep(523, 0.09, 'triangle', 0.07); beep(659, 0.09, 'triangle', 0.07, 0.08); beep(784, 0.16, 'triangle', 0.07, 0.16); }
  else if (type === 'lost') beep(180, 0.3, 'sawtooth', 0.05);
  else if (type === 'spoiled') beep(140, 0.18, 'square', 0.05);
  else if (type === 'order') beep(980, 0.06, 'sine', 0.04);
  else if (type === 'over') { beep(523, 0.15, 'triangle', 0.07); beep(392, 0.2, 'triangle', 0.07, 0.15); beep(330, 0.3, 'triangle', 0.07, 0.3); }
}

function ensureAudio() {
  if (!audio) {
    try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch { audio = null; }
  }
  if (audio && audio.state === 'suspended') audio.resume().catch(() => {});
}

function saveBest() {
  if (world.coins > best) {
    best = world.coins;
    try { localStorage.setItem(BEST_KEY, String(best)); } catch { /* private mode */ }
  }
}

function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  const w = Math.floor(FIELD.width * scale);
  const h = Math.floor(FIELD.height * scale);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  canvas.width = Math.floor(FIELD.width * dpr);
  canvas.height = Math.floor(FIELD.height * dpr);
  canvas.style.left = `${Math.floor((window.innerWidth - w) / 2)}px`;
  canvas.style.top = `${Math.floor((window.innerHeight - h) / 2)}px`;
}

function renderFrame() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  lastRegions = draw(ctx, world, input.getHover(), best);
}

const input = createInput(canvas, world, () => lastRegions, {
  onStart: () => { ensureAudio(); world.start(); announce(); },
  onRestart: () => { ensureAudio(); world.start(); announce(); },
  onMute: () => { muted = !muted; },
});

function announce() {
  if (!statusEl) return;
  if (world.screen === SCREEN_PLAY) statusEl.textContent = `Playing Dapur Kilat. ${world.coins} coins, ${world.hearts} hearts, ${world.orders.length} orders waiting.`;
  else if (world.screen === SCREEN_OVER) statusEl.textContent = `Shift over. ${world.coins} coins, ${world.served} dishes served.`;
  else statusEl.textContent = 'Dapur Kilat. A warung cooking game. Press Enter or tap Start to play.';
}

window.addEventListener('resize', resize);
window.addEventListener('pointerdown', ensureAudio, { once: true });
resize();
announce();

// Screenshot mode: stage the scene once and stop. The shot tool waits for
// window.__shotReady before capturing.
if (shotName) {
  const staged = stageShot(shotName, world);
  if (staged.screen === SCREEN_OVER) saveBest();
  renderFrame();
  window.__shotReady = true;
} else {
  let last = performance.now();
  let acc = 0;
  function frame(now) {
    const dt = Math.min(0.25, (now - last) / 1000);
    last = now;
    if (world.screen === SCREEN_PLAY) {
      acc += dt;
      while (acc >= STEP) {
        world.step(STEP);
        acc -= STEP;
      }
      while (world.events.length > 0) playEvent(world.events.shift().type);
      if (world.screen === SCREEN_OVER) {
        saveBest();
        announce();
        playEvent('over');
      }
    }
    renderFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
