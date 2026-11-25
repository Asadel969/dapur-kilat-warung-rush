// Dapur Kilat rules: orders arrive on the board, the cook fills a pan with the
// dish's three ingredients, the pan cooks, and the finished plate is served
// before the customer's patience runs out. One shift, three hearts.

import {
  FIELD, STEP, SHIFT_SECONDS, HEARTS, MAX_ORDERS, PATIENCE_SECONDS, SPAWN,
  STOVE_COUNT, COMBO_STEP, COMBO_CAP, RECIPES, RECIPE_BY_ID, LAYOUT,
} from './config.js';
import { makeRng, pick } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

export const PAN_EMPTY = 'empty';
export const PAN_ASSEMBLING = 'assembling';
export const PAN_COOKING = 'cooking';
export const PAN_READY = 'ready';
export const PAN_SPOILED = 'spoiled';

function blankPan() {
  return { target: null, dishId: null, contents: [], state: PAN_EMPTY, cookT: 0, cookDur: 0, readyDish: null, flash: 0 };
}

export class World {
  constructor(seed = 1) {
    this.seed = seed;
    this.reset(seed);
  }

  reset(seed = this.seed) {
    this.seed = seed;
    this.rng = makeRng(seed);
    this.screen = SCREEN_TITLE;
    this.time = 0;
    this.shiftLeft = SHIFT_SECONDS;
    this.hearts = HEARTS;
    this.coins = 0;
    this.served = 0;
    this.lost = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.orders = [];
    this.pans = Array.from({ length: STOVE_COUNT }, () => blankPan());
    this.selectedPan = 0;
    this.nextOrderId = 1;
    this.spawnT = SPAWN.first;
    this.overReason = null;
    this.floats = [];
    this.events = [];
    this.hint = '';
    this.hintT = 0;
  }

  start() {
    this.reset(this.seed);
    this.screen = SCREEN_PLAY;
  }

  get shiftDone() {
    return this.screen === SCREEN_OVER;
  }

  /** One fixed simulation step. */
  step(dt = STEP) {
    if (this.screen !== SCREEN_PLAY) return;
    this.time += dt;
    this.shiftLeft = Math.max(0, SHIFT_SECONDS - this.time);

    for (const f of this.floats) f.age += dt;
    this.floats = this.floats.filter((f) => f.age < f.life);
    if (this.hintT > 0) this.hintT -= dt;
    for (const pan of this.pans) if (pan.flash > 0) pan.flash -= dt;

    // New customers walk in.
    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.orders.length < MAX_ORDERS) {
      this.spawnOrder();
      const interval = Math.max(SPAWN.end, SPAWN.start - this.served * SPAWN.shrinkPerServed);
      this.spawnT = interval;
    }

    // Patience drains; an empty chair costs a heart.
    for (const order of this.orders) order.patience -= dt;
    const walked = this.orders.filter((o) => o.patience <= 0);
    if (walked.length > 0) {
      this.orders = this.orders.filter((o) => o.patience > 0);
      for (const order of walked) {
        this.lost += 1;
        this.hearts -= 1;
        this.combo = 0;
        this.events.push({ type: 'lost' });
        this.addFloat(`Walked out! ${RECIPE_BY_ID[order.dishId].name}`, 'board', '#e5534b');
        for (const pan of this.pans) if (pan.target === order.id) pan.target = null;
      }
      if (this.hearts <= 0) return this.endShift('hearts');
    }

    // Pans cook; a finished dish waits on its plate.
    for (const pan of this.pans) {
      if (pan.state === PAN_COOKING) {
        pan.cookT += dt;
        if (pan.cookT >= pan.cookDur) {
          pan.state = PAN_READY;
          pan.readyDish = pan.dishId;
          this.events.push({ type: 'ready' });
        }
      }
    }

    if (this.shiftLeft <= 0) this.endShift('time');
  }

  spawnOrder() {
    const waiting = this.orders.map((o) => o.dishId);
    let dish = pick(this.rng, RECIPES);
    // Don't stack the same dish more than twice on the board.
    for (let tries = 0; tries < 6 && waiting.filter((d) => d === dish.id).length >= 2; tries += 1) {
      dish = pick(this.rng, RECIPES);
    }
    this.orders.push({
      id: this.nextOrderId,
      dishId: dish.id,
      patience: PATIENCE_SECONDS,
      patienceMax: PATIENCE_SECONDS,
    });
    this.nextOrderId += 1;
    this.events.push({ type: 'order' });
  }

  /** Point a pan at an order ticket. Only an empty pan takes a new order. */
  assignOrder(orderId) {
    const pan = this.pans[this.selectedPan];
    if (pan.state !== PAN_EMPTY && pan.state !== PAN_ASSEMBLING) {
      this.say('That pan is busy — serve or dump it first');
      return false;
    }
    if (pan.contents.length > 0) {
      this.say('Dump the pan before a new order');
      return false;
    }
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return false;
    pan.target = order.id;
    pan.state = PAN_ASSEMBLING;
    this.events.push({ type: 'assign' });
    return true;
  }

  selectPan(index) {
    if (index >= 0 && index < this.pans.length) this.selectedPan = index;
  }

  /** Drop one ingredient into the selected pan. */
  addIngredient(ingId) {
    const pan = this.pans[this.selectedPan];
    if (pan.state === PAN_COOKING || pan.state === PAN_READY) {
      this.say('That pan is already cooking');
      return false;
    }
    if (!pan.target) {
      this.say('Tap an order ticket first, then add its ingredients');
      return false;
    }
    const order = this.orders.find((o) => o.id === pan.target);
    if (!order) {
      pan.target = null;
      pan.state = PAN_EMPTY;
      return false;
    }
    const recipe = RECIPE_BY_ID[order.dishId];
    if (!recipe.needs.includes(ingId) || pan.contents.includes(ingId)) {
      // Wrong ingredient or a duplicate: the pan is ruined.
      pan.state = PAN_SPOILED;
      pan.flash = 0.6;
      this.events.push({ type: 'spoiled' });
      this.addFloat('Wrong ingredient!', `pan${this.selectedPan}`, '#e5534b');
      return false;
    }
    pan.contents.push(ingId);
    pan.state = PAN_ASSEMBLING;
    this.events.push({ type: 'add' });
    if (pan.contents.length === recipe.needs.length) {
      pan.state = PAN_COOKING;
      pan.cookT = 0;
      pan.cookDur = recipe.cook;
      pan.dishId = recipe.id;
      this.events.push({ type: 'cook' });
    }
    return true;
  }

  /** Throw a pan's contents in the bin. */
  dumpPan(index) {
    const pan = this.pans[index];
    if (pan.state === PAN_EMPTY) return false;
    const had = pan.contents.length > 0 || pan.state === PAN_SPOILED;
    this.pans[index] = blankPan();
    if (had) this.events.push({ type: 'dump' });
    return true;
  }

  /** Serve a finished plate to the matching open order. */
  servePan(index) {
    const pan = this.pans[index];
    if (pan.state !== PAN_READY || !pan.readyDish) return false;
    const dish = RECIPE_BY_ID[pan.readyDish];
    const order = this.orders.find((o) => o.id === pan.target)
      || this.orders.find((o) => o.dishId === dish.id);
    this.pans[index] = blankPan();
    if (!order) {
      this.addFloat('Too late — no order!', `pan${index}`, '#e5534b');
      this.events.push({ type: 'wasted' });
      return false;
    }
    const patienceBonus = Math.round(6 * (order.patience / order.patienceMax));
    const comboBonus = Math.min(this.combo * COMBO_STEP, COMBO_CAP);
    const earned = dish.price + patienceBonus + comboBonus;
    this.coins += earned;
    this.served += 1;
    this.combo += 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.orders = this.orders.filter((o) => o.id !== order.id);
    this.addFloat(`+${earned} coins`, `pan${index}`, '#7dc383');
    this.events.push({ type: 'serve' });
    return true;
  }

  endShift(reason) {
    this.screen = SCREEN_OVER;
    this.overReason = reason;
    this.floats = [];
    this.events.push({ type: 'over' });
  }

  say(text) {
    this.hint = text;
    this.hintT = 2.2;
  }

  addFloat(text, place, color) {
    const spots = {
      board: { x: LAYOUT.board.x + LAYOUT.board.w / 2, y: LAYOUT.board.y + 30 },
      pan0: { x: LAYOUT.stove.x + 150, y: LAYOUT.stove.y + 120 },
      pan1: { x: LAYOUT.stove.x + 450, y: LAYOUT.stove.y + 120 },
      shelf: { x: LAYOUT.shelf.x + LAYOUT.shelf.w / 2, y: LAYOUT.shelf.y + 40 },
    };
    const at = spots[place] || spots.board;
    this.floats.push({ text, x: at.x, y: at.y, age: 0, life: 1.4, color });
  }
}

/** A fresh world for one screenshot seed. */
export function freshWorld(seed) {
  return new World(seed);
}

export { FIELD };
