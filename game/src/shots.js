// The screenshot scenes behind ?shot=start|play|serve|end. Each one plays the
// real rules forward from a fresh world for a fixed stretch, steered by a
// simple autopilot (serve what is ready, dump what is spoiled, cook the
// oldest order, add its missing ingredients), so the frame is what a short
// game really looks like and the same seed always gives the same frame.

import { STEP, RECIPE_BY_ID } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, PAN_READY, PAN_SPOILED } from './world.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 26;
const SERVE_LIMIT_SECONDS = 70;
const END_LIMIT_SECONDS = 120;
/** The autopilot acts at most once per this many sim seconds, like a player. */
const ACT_COOLDOWN = 0.45;

/** One autopilot decision: serve, dump, assign, or add the next ingredient. */
function autopilot(world) {
  // Serve a finished plate first.
  for (let i = 0; i < world.pans.length; i += 1) {
    if (world.pans[i].state === PAN_READY) { world.servePan(i); return; }
  }
  // Dump a ruined pan.
  for (let i = 0; i < world.pans.length; i += 1) {
    if (world.pans[i].state === PAN_SPOILED) { world.dumpPan(i); return; }
  }
  // Work the first pan that is free; the other one may already be cooking.
  for (let i = 0; i < world.pans.length; i += 1) {
    const pan = world.pans[i];
    if (pan.state === 'cooking' || pan.state === 'ready') continue;
    world.selectPan(i);
    if (!pan.target) {
      const order = world.orders[0];
      if (order) world.assignOrder(order.id);
      return;
    }
    const order = world.orders.find((o) => o.id === pan.target);
    if (!order) return;
    const recipe = RECIPE_BY_ID[order.dishId];
    const next = recipe.needs.find((ing) => !pan.contents.includes(ing));
    if (next) world.addIngredient(next);
    return;
  }
}

function runFor(world, seconds, until) {
  let cooldown = 0;
  for (let t = 0; t < seconds / STEP; t += 1) {
    world.step(STEP);
    if (until && until(world)) break;
    if (world.screen === SCREEN_OVER) break;
    cooldown -= STEP;
    if (cooldown <= 0) {
      autopilot(world);
      cooldown = ACT_COOLDOWN;
    }
  }
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * Any unknown name is the title scene.
 */
export function stageShot(name, world) {
  world.reset(world.seed);
  world.screen = SCREEN_PLAY;
  if (name !== 'play' && name !== 'serve' && name !== 'end') {
    runFor(world, START_SECONDS);
    world.screen = SCREEN_TITLE;
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'play') {
    runFor(world, PLAY_SECONDS);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'serve') {
    runFor(world, SERVE_LIMIT_SECONDS, (w) => w.pans.some((p) => p.state === PAN_READY));
    return { screen: SCREEN_PLAY, best: 0 };
  }
  runFor(world, END_LIMIT_SECONDS);
  return { screen: SCREEN_OVER, best: 0 };
}
