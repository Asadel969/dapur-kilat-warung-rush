// Mouse and keyboard for Dapur Kilat: every click and key is routed to the
// world through the regions the renderer reported last frame.

import { INGREDIENTS } from './config.js';
import { SCREEN_TITLE, SCREEN_OVER } from './world.js';

function inside(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function toLogical(canvas, clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((clientX - r.left) / r.width) * 1280,
    y: ((clientY - r.top) / r.height) * 720,
  };
}

/**
 * Attach input to a canvas. `getRegions` returns the regions from the last
 * draw; `world` is the game state; `hooks` gets onStart/onRestart/onAction.
 * Returns { getHover, dispose }.
 */
export function createInput(canvas, world, getRegions, hooks = {}) {
  let hover = null;

  function hitName(x, y) {
    const regions = getRegions();
    if (!regions) return null;
    if (world.screen === SCREEN_TITLE && inside(regions.buttons.start, x, y)) return 'start';
    if (world.screen === SCREEN_OVER && inside(regions.buttons.restart, x, y)) return 'restart';
    for (const t of regions.tickets) if (inside(t.rect, x, y)) return `ticket${t.id}`;
    for (const p of regions.plates) if (inside(p.rect, x, y)) return `plate${p.index}`;
    for (const p of regions.pans) if (inside(p.rect, x, y)) return `pan${p.index}`;
    for (const d of regions.dumps) if (inside(d.rect, x, y)) return `dump${d.index}`;
    for (const b of regions.bins) if (inside(b.rect, x, y)) return `bin${b.id}`;
    return null;
  }

  function click(x, y) {
    const name = hitName(x, y);
    if (!name) return;
    if (name === 'start') { hooks.onStart?.(); return; }
    if (name === 'restart') { hooks.onRestart?.(); return; }
    if (world.screen !== 'play') return;
    if (name.startsWith('ticket')) {
      world.assignOrder(Number(name.slice(6)));
    } else if (name.startsWith('plate')) {
      world.servePan(Number(name.slice(5)));
    } else if (name.startsWith('pan')) {
      world.selectPan(Number(name.slice(3)));
    } else if (name.startsWith('dump')) {
      world.dumpPan(Number(name.slice(4)));
    } else if (name.startsWith('bin')) {
      world.addIngredient(name.slice(3));
    }
  }

  function onMouseMove(event) {
    const p = toLogical(canvas, event.clientX, event.clientY);
    hover = hitName(p.x, p.y);
    canvas.style.cursor = hover ? 'pointer' : 'default';
  }

  function onClick(event) {
    const p = toLogical(canvas, event.clientX, event.clientY);
    click(p.x, p.y);
  }

  function onKey(event) {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key === 'enter') {
      if (world.screen === SCREEN_TITLE) hooks.onStart?.();
      else if (world.screen === SCREEN_OVER) hooks.onRestart?.();
      return;
    }
    if (world.screen !== 'play') return;
    if (key === 'tab') {
      event.preventDefault();
      world.selectPan((world.selectedPan + 1) % 2);
      return;
    }
    if (key === ' ') {
      event.preventDefault();
      const ready = world.pans.findIndex((p) => p.state === 'ready');
      if (ready >= 0) world.servePan(ready);
      return;
    }
    if (key === 'b') { world.dumpPan(world.selectedPan); return; }
    if (key === 'm') { hooks.onMute?.(); return; }
    const ing = INGREDIENTS.find((g) => g.key === key);
    if (ing) world.addIngredient(ing.id);
  }

  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('click', onClick);
  window.addEventListener('keydown', onKey);

  return {
    getHover: () => hover,
    dispose() {
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('click', onClick);
      window.removeEventListener('keydown', onKey);
    },
  };
}
