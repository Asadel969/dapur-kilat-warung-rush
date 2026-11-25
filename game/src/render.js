// Dapur Kilat drawing: one canvas, flat warm colours, everything drawn by hand
// (no image files, no network). The layout comes from config; this file only
// turns the world into pixels, and reports where the clickable things are.

import {
  FIELD, INGREDIENTS, INGREDIENT_BY_ID, RECIPE_BY_ID, LAYOUT, PALETTE, FONT,
} from './config.js';
import {
  SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER, PAN_EMPTY, PAN_ASSEMBLING, PAN_COOKING,
  PAN_READY, PAN_SPOILED,
} from './world.js';

const PAN_STOVE_PAN = '#4a4a55';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align = 'left', weight = 600) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}

/** One ingredient's little icon, drawn as a bowl of it. */
export function drawIngredient(ctx, id, cx, cy, r) {
  const ing = INGREDIENT_BY_ID[id];
  ctx.save();
  ctx.translate(cx, cy);
  // Bowl.
  ctx.fillStyle = '#e8e0cc';
  ctx.beginPath();
  ctx.arc(0, r * 0.15, r * 0.95, 0, Math.PI);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c9bfa5';
  ctx.fillRect(-r * 0.95, r * 0.1, r * 1.9, r * 0.16);
  if (id === 'rice') {
    ctx.fillStyle = '#fffdf5';
    ctx.beginPath();
    ctx.arc(0, -r * 0.1, r * 0.62, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#e8e0cc';
    for (const dx of [-0.3, 0, 0.3]) { ctx.beginPath(); ctx.arc(dx * r, -r * 0.28, r * 0.14, 0, Math.PI * 2); ctx.fill(); }
  } else if (id === 'noodle') {
    ctx.strokeStyle = '#f2c14e';
    ctx.lineWidth = r * 0.22;
    ctx.lineCap = 'round';
    for (const [dy, w] of [[-0.35, 0.9], [-0.12, 1.1], [0.08, 0.9]]) {
      ctx.beginPath();
      ctx.moveTo(-w * r, dy * r);
      ctx.quadraticCurveTo(0, (dy - 0.25) * r, w * r, dy * r);
      ctx.stroke();
    }
  } else if (id === 'egg') {
    ctx.fillStyle = '#fffdf5';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.15, r * 0.62, r * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2a93b';
    ctx.beginPath();
    ctx.arc(r * 0.1, -r * 0.12, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'chicken') {
    ctx.fillStyle = '#d98a4e';
    ctx.beginPath();
    ctx.arc(-r * 0.1, -r * 0.2, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f5f1e6';
    ctx.lineWidth = r * 0.18;
    ctx.beginPath();
    ctx.moveTo(r * 0.25, r * 0.05);
    ctx.lineTo(r * 0.62, r * 0.42);
    ctx.stroke();
    ctx.fillStyle = '#f5f1e6';
    ctx.beginPath();
    ctx.arc(r * 0.66, r * 0.46, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'chili') {
    ctx.fillStyle = '#e5534b';
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, -r * 0.1);
    ctx.quadraticCurveTo(0, -r * 0.75, r * 0.7, -r * 0.05);
    ctx.quadraticCurveTo(r * 0.2, r * 0.35, -r * 0.45, r * 0.3);
    ctx.quadraticCurveTo(-r * 0.85, r * 0.2, -r * 0.7, -r * 0.1);
    ctx.fill();
    ctx.strokeStyle = '#3f7d46';
    ctx.lineWidth = r * 0.14;
    ctx.beginPath();
    ctx.moveTo(r * 0.55, -r * 0.15);
    ctx.quadraticCurveTo(r * 0.85, -r * 0.45, r * 0.95, -r * 0.6);
    ctx.stroke();
  } else if (id === 'greens') {
    ctx.fillStyle = '#5da864';
    for (const [dx, dy, rot] of [[-0.35, -0.1, -0.5], [0.05, -0.35, 0.2], [0.4, -0.05, 0.7]]) {
      ctx.save();
      ctx.translate(dx * r, dy * r);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.34, r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
  return ing;
}

/** A finished dish on a plate: the plate plus its three ingredients. */
function drawDish(ctx, dishId, cx, cy, r) {
  const recipe = RECIPE_BY_ID[dishId];
  ctx.save();
  ctx.fillStyle = PALETTE.plate;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d9cfae';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  const spots = [[-0.34, -0.15], [0.34, -0.15], [0, 0.34]];
  recipe.needs.forEach((ingId, i) => {
    drawIngredient(ctx, ingId, cx + spots[i][0] * r, cy + spots[i][1] * r, r * 0.42);
  });
  ctx.restore();
}

function bar(ctx, x, y, w, h, frac, fill, back = 'rgba(0,0,0,0.4)') {
  ctx.fillStyle = back;
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  if (frac > 0) {
    ctx.fillStyle = fill;
    rr(ctx, x, y, Math.max(h, w * Math.min(1, frac)), h, h / 2);
    ctx.fill();
  }
}

function hearts(ctx, x, y, n) {
  for (let i = 0; i < 3; i += 1) {
    const hx = x + i * 30;
    ctx.fillStyle = i < n ? '#e5534b' : 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(hx, y + 8);
    ctx.bezierCurveTo(hx - 10, y - 2, hx - 14, y + 8, hx, y + 16);
    ctx.bezierCurveTo(hx + 14, y + 8, hx + 10, y - 2, hx, y + 8);
    ctx.fill();
  }
}

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Every clickable rectangle, named, so input can hit-test without guessing. */
export function layoutRegions(world) {
  const regions = { tickets: [], pans: [], bins: [], plates: [], dumps: [], buttons: {} };
  const board = LAYOUT.board;
  world.orders.forEach((order, i) => {
    regions.tickets.push({ id: order.id, rect: { x: board.x + 12, y: board.y + 44 + i * 96, w: board.w - 24, h: 86 } });
  });
  const stove = LAYOUT.stove;
  for (let i = 0; i < 2; i += 1) {
    const px = stove.x + 24 + i * 300;
    regions.pans.push({ index: i, rect: { x: px, y: stove.y + 40, w: 252, h: 200 } });
    regions.dumps.push({ index: i, rect: { x: px + 176, y: stove.y + 252, w: 76, h: 34 } });
  }
  const shelf = LAYOUT.shelf;
  for (let i = 0; i < 2; i += 1) {
    regions.plates.push({ index: i, rect: { x: shelf.x + 24 + i * 136, y: shelf.y + 96, w: 124, h: 150 } });
  }
  const counter = LAYOUT.counter;
  INGREDIENTS.forEach((ing, i) => {
    const bx = counter.x + 24 + i * 200;
    regions.bins.push({ id: ing.id, rect: { x: bx, y: counter.y + 44, w: 176, h: 116 } });
  });
  regions.buttons.start = { x: FIELD.width / 2 - 130, y: 470, w: 260, h: 64 };
  regions.buttons.restart = { x: FIELD.width / 2 - 130, y: 500, w: 260, h: 64 };
  return regions;
}

export function draw(ctx, world, hover = null, best = 0) {
  const regions = layoutRegions(world);
  ctx.clearRect(0, 0, FIELD.width, FIELD.height);

  // Kitchen walls and floor.
  ctx.fillStyle = PALETTE.wallTop;
  ctx.fillRect(0, 0, FIELD.width, 440);
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 440, FIELD.width, 280);
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let x = 0; x < FIELD.width; x += 96) ctx.fillRect(x, 0, 2, 440);
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 640, FIELD.width, 80);

  drawTopBar(ctx, world);
  drawBoard(ctx, world, regions);
  drawStove(ctx, world, regions, hover);
  drawShelf(ctx, world, regions, hover);
  drawCounter(ctx, world, regions, hover);
  drawHint(ctx, world);
  drawFloats(ctx, world);

  if (world.screen === SCREEN_TITLE) drawTitle(ctx, world, regions, hover, best);
  if (world.screen === SCREEN_OVER) drawOver(ctx, world, regions, hover, best);
  return regions;
}

function drawTopBar(ctx, world) {
  const b = LAYOUT.topBar;
  ctx.fillStyle = '#1d130c';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  text(ctx, 'DAPUR KILAT', 24, 40, 26, PALETTE.accent, 'left', 800);
  text(ctx, '· warung rush', 190, 40, 16, PALETTE.muted, 'left', 600);
  // Shift timer.
  const frac = world.screen === SCREEN_PLAY ? world.shiftLeft / 100 : 1;
  const tw = 220;
  const tx = FIELD.width / 2 - tw / 2;
  text(ctx, 'SHIFT', tx + tw / 2, 24, 12, PALETTE.muted, 'center', 700);
  bar(ctx, tx, 30, tw, 12, frac, frac < 0.25 ? PALETTE.bad : PALETTE.timer);
  text(ctx, formatTime(world.shiftLeft), tx + tw / 2, 58, 15, PALETTE.text, 'center', 700);
  // Coins, hearts, combo.
  text(ctx, `🪙 ${world.coins}`, FIELD.width - 320, 40, 22, '#ffd76a', 'left', 800);
  hearts(ctx, FIELD.width - 200, 26, world.hearts);
  if (world.combo >= 2) text(ctx, `COMBO x${world.combo}`, FIELD.width - 120, 40, 16, PALETTE.good, 'left', 800);
}

function drawBoard(ctx, world, regions) {
  const b = LAYOUT.board;
  ctx.fillStyle = PALETTE.board;
  rr(ctx, b.x, b.y, b.w, b.h, 14);
  ctx.fill();
  ctx.strokeStyle = PALETTE.boardEdge;
  ctx.lineWidth = 3;
  rr(ctx, b.x, b.y, b.w, b.h, 14);
  ctx.stroke();
  text(ctx, 'ORDER BOARD', b.x + 16, b.y + 30, 16, PALETTE.accent, 'left', 800);
  text(ctx, `${world.orders.length}/${3} waiting`, b.x + b.w - 16, b.y + 30, 13, PALETTE.muted, 'right', 600);
  if (world.orders.length === 0) {
    text(ctx, 'No orders yet —', b.x + b.w / 2, b.y + 150, 15, PALETTE.muted, 'center', 600);
    text(ctx, 'customers are coming!', b.x + b.w / 2, b.y + 174, 15, PALETTE.muted, 'center', 600);
  }
  world.orders.forEach((order, i) => {
    const r = regions.tickets[i].rect;
    const recipe = RECIPE_BY_ID[order.dishId];
    const frac = Math.max(0, order.patience / order.patienceMax);
    const targeted = world.pans.some((p) => p.target === order.id);
    ctx.fillStyle = targeted ? '#4a3626' : PALETTE.paper;
    rr(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fill();
    if (targeted) {
      ctx.strokeStyle = PALETTE.accent;
      ctx.lineWidth = 3;
      rr(ctx, r.x, r.y, r.w, r.h, 10);
      ctx.stroke();
    }
    text(ctx, recipe.name, r.x + 12, r.y + 26, 17, targeted ? PALETTE.text : PALETTE.ink, 'left', 800);
    text(ctx, `Rp ${recipe.price}`, r.x + r.w - 12, r.y + 26, 14, targeted ? PALETTE.accent : '#8a6d3b', 'right', 700);
    recipe.needs.forEach((ingId, j) => {
      drawIngredient(ctx, ingId, r.x + 30 + j * 44, r.y + 52, 15);
    });
    bar(ctx, r.x + 12, r.y + 72, r.w - 24, 8, frac, frac < 0.3 ? PALETTE.bad : PALETTE.good);
    if (targeted) text(ctx, 'COOKING', r.x + r.w - 12, r.y + 56, 11, PALETTE.accent, 'right', 800);
  });
}

function drawStove(ctx, world, regions, hover) {
  const s = LAYOUT.stove;
  ctx.fillStyle = PALETTE.stove;
  rr(ctx, s.x, s.y, s.w, s.h, 14);
  ctx.fill();
  text(ctx, 'STOVE', s.x + 16, s.y + 30, 16, '#c8ccd4', 'left', 800);
  text(ctx, 'tap a pan to pick it · tap a ticket to cook it', s.x + s.w - 16, s.y + 30, 12, '#8b93a3', 'right', 600);
  world.pans.forEach((pan, i) => {
    const r = regions.pans[i].rect;
    const selected = world.selectedPan === i;
    const hovered = hover === `pan${i}`;
    // Burner.
    ctx.fillStyle = PALETTE.stoveTop;
    rr(ctx, r.x, r.y, r.w, r.h, 12);
    ctx.fill();
    if (selected) {
      ctx.strokeStyle = PALETTE.accent;
      ctx.lineWidth = 3;
      rr(ctx, r.x - 3, r.y - 3, r.w + 6, r.h + 6, 14);
      ctx.stroke();
    } else if (hovered) {
      ctx.strokeStyle = 'rgba(255,176,58,0.5)';
      ctx.lineWidth = 2;
      rr(ctx, r.x - 2, r.y - 2, r.w + 4, r.h + 4, 14);
      ctx.stroke();
    }
    const cx = r.x + r.w / 2;
    const cy = r.y + 92;
    // Pan body.
    const hot = pan.state === PAN_COOKING || pan.state === PAN_READY;
    ctx.fillStyle = hot ? '#5a3a2a' : PAN_STOVE_PAN;
    ctx.beginPath();
    ctx.arc(cx, cy, 74, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2b2b33';
    ctx.beginPath();
    ctx.arc(cx, cy, 62, 0, Math.PI * 2);
    ctx.fill();
    // Flame under a cooking pan.
    if (pan.state === PAN_COOKING) {
      const flick = 0.5 + 0.5 * Math.sin(world.time * 9 + i * 2);
      ctx.fillStyle = `rgba(255,${140 + Math.round(60 * flick)},40,0.85)`;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 84, 46, 10 + 6 * flick, 0, 0, Math.PI * 2);
      ctx.fill();
      drawSteam(ctx, cx, cy - 70, world.time + i);
    }
    if (pan.state === PAN_EMPTY) {
      text(ctx, 'empty pan', cx, cy + 6, 15, '#8b93a3', 'center', 600);
      text(ctx, `PAN ${i + 1}`, cx, r.y + 24, 13, '#8b93a3', 'center', 800);
    } else if (pan.state === PAN_SPOILED) {
      text(ctx, 'SPOILED!', cx, cy - 6, 18, PALETTE.bad, 'center', 800);
      text(ctx, 'dump it ↓', cx, cy + 20, 13, '#c8ccd4', 'center', 600);
    } else {
      const order = world.orders.find((o) => o.id === pan.target);
      const dishId = order ? order.dishId : pan.readyDish;
      const recipe = dishId ? RECIPE_BY_ID[dishId] : null;
      if (recipe) {
        text(ctx, recipe.name, cx, r.y + 24, 15, '#eef1f5', 'center', 800);
        recipe.needs.forEach((ingId, j) => {
          const done = pan.contents.includes(ingId);
          const ix = cx + (j - 1) * 52;
          ctx.globalAlpha = done ? 1 : 0.28;
          drawIngredient(ctx, ingId, ix, cy - 6, 20);
          ctx.globalAlpha = 1;
          if (done) {
            ctx.fillStyle = PALETTE.good;
            ctx.beginPath();
            ctx.arc(ix + 14, cy - 26, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#12351a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(ix + 10, cy - 26);
            ctx.lineTo(ix + 13, cy - 22);
            ctx.lineTo(ix + 19, cy - 30);
            ctx.stroke();
          }
        });
        if (pan.state === PAN_COOKING) {
          const frac = Math.min(1, pan.cookT / pan.cookDur);
          bar(ctx, cx - 60, cy + 34, 120, 10, frac, PALETTE.accent);
          text(ctx, 'cooking…', cx, cy + 58, 13, '#ffb03a', 'center', 700);
        } else if (pan.state === PAN_READY) {
          text(ctx, 'READY — on the shelf →', cx, cy + 52, 14, PALETTE.good, 'center', 800);
        }
      }
    }
    // Dump button.
    const d = regions.dumps[i].rect;
    const canDump = pan.state !== PAN_EMPTY;
    ctx.fillStyle = hover === `dump${i}` && canDump ? '#5a4632' : '#2b2b33';
    rr(ctx, d.x, d.y, d.w, d.h, 8);
    ctx.fill();
    ctx.fillStyle = canDump ? '#e8b4a0' : '#5a5a64';
    ctx.font = `700 13px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('🗑 dump', d.x + d.w / 2, d.y + 22);
  });
}


function drawSteam(ctx, x, y, t) {
  ctx.save();
  ctx.fillStyle = 'rgba(240,240,240,0.35)';
  for (let i = 0; i < 3; i += 1) {
    const ph = (t * 0.6 + i / 3) % 1;
    const sx = x + Math.sin((t + i * 2) * 2) * 8 * ph;
    const sy = y - ph * 46;
    ctx.globalAlpha = 0.35 * (1 - ph);
    ctx.beginPath();
    ctx.arc(sx, sy, 5 + ph * 7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawShelf(ctx, world, regions, hover) {
  const s = LAYOUT.shelf;
  ctx.fillStyle = PALETTE.shelf;
  rr(ctx, s.x, s.y, s.w, s.h, 14);
  ctx.fill();
  text(ctx, 'READY TO SERVE', s.x + 16, s.y + 30, 16, PALETTE.accent, 'left', 800);
  text(ctx, 'tap a plate to serve it', s.x + s.w - 16, s.y + 30, 12, PALETTE.muted, 'right', 600);
  world.pans.forEach((pan, i) => {
    const r = regions.plates[i].rect;
    ctx.fillStyle = '#241812';
    rr(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fill();
    if (pan.state === PAN_READY && pan.readyDish) {
      const recipe = RECIPE_BY_ID[pan.readyDish];
      drawDish(ctx, pan.readyDish, r.x + r.w / 2, r.y + 62, 44);
      text(ctx, recipe.name, r.x + r.w / 2, r.y + 128, 14, PALETTE.text, 'center', 800);
      if (hover === `plate${i}`) {
        ctx.strokeStyle = PALETTE.good;
        ctx.lineWidth = 3;
        rr(ctx, r.x - 2, r.y - 2, r.w + 4, r.h + 4, 12);
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.14)';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      rr(ctx, r.x + 8, r.y + 14, r.w - 16, 92, 10);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'empty plate', r.x + r.w / 2, r.y + 66, 13, PALETTE.muted, 'center', 600);
    }
  });
  // Served tally.
  text(ctx, `Served today: ${world.served}`, s.x + 16, s.y + s.h - 66, 15, PALETTE.text, 'left', 700);
  text(ctx, `Walked out: ${world.lost}`, s.x + 16, s.y + s.h - 40, 15, PALETTE.muted, 'left', 600);
  text(ctx, `Best combo: x${world.bestCombo}`, s.x + s.w - 16, s.y + s.h - 40, 15, PALETTE.muted, 'right', 600);
}

function drawCounter(ctx, world, regions, hover) {
  const c = LAYOUT.counter;
  ctx.fillStyle = PALETTE.counterWood;
  rr(ctx, c.x, c.y, c.w, c.h, 14);
  ctx.fill();
  ctx.fillStyle = PALETTE.counterTop;
  rr(ctx, c.x, c.y, c.w, 26, 12);
  ctx.fill();
  text(ctx, 'INGREDIENTS — tap one, or press its key', c.x + 16, c.y + 22, 13, '#f7ead0', 'left', 800);
  INGREDIENTS.forEach((ing, i) => {
    const r = regions.bins[i].rect;
    const usable = world.screen === SCREEN_PLAY && world.pans[world.selectedPan].target;
    ctx.fillStyle = hover === `bin${ing.id}` ? '#8a5f36' : '#5d3d22';
    rr(ctx, r.x, r.y, r.w, r.h, 12);
    ctx.fill();
    ctx.globalAlpha = usable ? 1 : 0.55;
    drawIngredient(ctx, ing.id, r.x + r.w / 2, r.y + 46, 26);
    text(ctx, ing.label, r.x + r.w / 2, r.y + 92, 16, PALETTE.text, 'center', 800);
    text(ctx, `[${ing.key}]`, r.x + r.w - 12, r.y + 22, 12, PALETTE.muted, 'right', 700);
    ctx.globalAlpha = 1;
  });
}

function drawHint(ctx, world) {
  const h = LAYOUT.hint;
  const hint = world.hintT > 0 ? world.hint
    : 'How to play: tap an order → tap its 3 ingredients → wait for the pan → tap the plate to serve. Tab switches pans · B dumps a pan · Space serves.';
  ctx.fillStyle = '#1d130c';
  rr(ctx, h.x, h.y, h.w, h.h, 12);
  ctx.fill();
  text(ctx, hint, h.x + 18, h.y + 32, 15, world.hintT > 0 ? PALETTE.accent : PALETTE.muted, 'left', 600);
}

function drawFloats(ctx, world) {
  for (const f of world.floats) {
    const a = 1 - f.age / f.life;
    ctx.globalAlpha = Math.max(0, a);
    text(ctx, f.text, f.x, f.y - f.age * 34, 17, f.color, 'center', 800);
    ctx.globalAlpha = 1;
  }
}

function overlay(ctx) {
  ctx.fillStyle = 'rgba(12,7,4,0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
}

function drawTitle(ctx, world, regions, hover, best) {
  overlay(ctx);
  const b = regions.buttons.start;
  text(ctx, 'DAPUR KILAT', FIELD.width / 2, 190, 64, PALETTE.accent, 'center', 900);
  text(ctx, '· warung rush ·', FIELD.width / 2, 232, 22, PALETTE.text, 'center', 600);
  text(ctx, 'Orders pile up on the board. You are the whole kitchen:', FIELD.width / 2, 300, 19, PALETTE.text, 'center', 600);
  text(ctx, 'tap a ticket, toss in its 3 ingredients, cook, serve — before patience runs out.', FIELD.width / 2, 330, 19, PALETTE.text, 'center', 600);
  text(ctx, '100-second shift · 3 hearts · 4 dishes on the menu', FIELD.width / 2, 372, 16, PALETTE.muted, 'center', 600);
  ctx.fillStyle = hover === 'start' ? '#ffc95e' : PALETTE.accent;
  rr(ctx, b.x, b.y, b.w, b.h, 14);
  ctx.fill();
  text(ctx, '▶  START SHIFT', b.x + b.w / 2, b.y + 41, 22, '#2b2118', 'center', 800);
  if (best > 0) text(ctx, `Best shift: ${best} coins`, FIELD.width / 2, b.y + b.h + 36, 16, PALETTE.muted, 'center', 700);
  text(ctx, 'mouse + keys 1–6 · Tab pan · Space serve · B dump · M mute', FIELD.width / 2, 620, 14, PALETTE.muted, 'center', 600);
}

function drawOver(ctx, world, regions, hover, best) {
  overlay(ctx);
  const b = regions.buttons.restart;
  const stars = world.served >= 12 ? 3 : world.served >= 8 ? 2 : world.served >= 4 ? 1 : 0;
  text(ctx, world.overReason === 'hearts' ? 'THE WARUNG CLOSED EARLY' : 'SHIFT COMPLETE!', FIELD.width / 2, 170, 40, PALETTE.accent, 'center', 900);
  text(ctx, '★'.repeat(stars) + '☆'.repeat(3 - stars), FIELD.width / 2, 226, 34, '#ffd76a', 'center', 700);
  text(ctx, `${world.coins} coins`, FIELD.width / 2, 300, 52, PALETTE.text, 'center', 900);
  text(ctx, `Dishes served: ${world.served}    Walked out: ${world.lost}    Best combo: x${world.bestCombo}`, FIELD.width / 2, 352, 18, PALETTE.text, 'center', 600);
  if (world.coins >= best && world.coins > 0) text(ctx, 'New best shift!', FIELD.width / 2, 392, 18, PALETTE.good, 'center', 800);
  else if (best > 0) text(ctx, `Best shift: ${best} coins`, FIELD.width / 2, 392, 18, PALETTE.muted, 'center', 600);
  ctx.fillStyle = hover === 'restart' ? '#ffc95e' : PALETTE.accent;
  rr(ctx, b.x, b.y, b.w, b.h, 14);
  ctx.fill();
  text(ctx, '↻  PLAY AGAIN', b.x + b.w / 2, b.y + 41, 22, '#2b2118', 'center', 800);
}
