// Dapur Kilat — every tuning number, colour and layout slot in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to
// the window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

/** Length of one work shift, in seconds. */
export const SHIFT_SECONDS = 100;

/** Hearts: a lost customer costs one; at zero the shift ends early. */
export const HEARTS = 3;

/** How many orders can wait on the board at once. */
export const MAX_ORDERS = 3;

/** Seconds a customer waits before storming off. */
export const PATIENCE_SECONDS = 26;

/** Order spawn timing: first order after 1s, then every interval, shrinking. */
export const SPAWN = { first: 1.0, start: 6.5, end: 3.6, shrinkPerServed: 0.12 };

/** Cooking time per dish, in seconds, from the recipe table. */
export const STOVE_COUNT = 2;

/** Coins for a served dish, before the patience bonus and combo. */
export const COMBO_STEP = 2;
export const COMBO_CAP = 10;

/** Where the best shift score is kept between visits (this browser only). */
export const BEST_KEY = 'dapur-kilat.best';

/** The six ingredients on the counter, in counter order, with their keys. */
export const INGREDIENTS = [
  { id: 'rice', label: 'Nasi', key: '1', color: '#f5efe0', dark: '#cbbf9d', emoji: '🍚' },
  { id: 'noodle', label: 'Mie', key: '2', color: '#f2c14e', dark: '#c08f1f', emoji: '🍜' },
  { id: 'egg', label: 'Telur', key: '3', color: '#fff3c4', dark: '#e0a92e', emoji: '🥚' },
  { id: 'chicken', label: 'Ayam', key: '4', color: '#e8a06a', dark: '#b45f2a', emoji: '🍗' },
  { id: 'chili', label: 'Sambal', key: '5', color: '#e5534b', dark: '#a02c26', emoji: '🌶️' },
  { id: 'greens', label: 'Sayur', key: '6', color: '#7dc383', dark: '#3f7d46', emoji: '🥬' },
];

export const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((ing) => [ing.id, ing]));

/** The menu: each dish is three ingredients, a cook time and a base price. */
export const RECIPES = [
  { id: 'nasi-goreng', name: 'Nasi Goreng', needs: ['rice', 'egg', 'chili'], cook: 4, price: 12 },
  { id: 'mie-ayam', name: 'Mie Ayam', needs: ['noodle', 'chicken', 'greens'], cook: 5, price: 14 },
  { id: 'soto-ayam', name: 'Soto Ayam', needs: ['chicken', 'egg', 'greens'], cook: 5, price: 14 },
  { id: 'ayam-geprek', name: 'Ayam Geprek', needs: ['rice', 'chicken', 'chili'], cook: 4, price: 12 },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

/** Layout: every drawn panel's rectangle, in logical pixels. */
export const LAYOUT = {
  topBar: { x: 0, y: 0, w: 1280, h: 62 },
  board: { x: 20, y: 78, w: 296, h: 348 },
  stove: { x: 340, y: 78, w: 600, h: 348 },
  shelf: { x: 964, y: 78, w: 296, h: 348 },
  counter: { x: 20, y: 446, w: 1240, h: 190 },
  hint: { x: 20, y: 652, w: 1240, h: 52 },
};

export const PALETTE = {
  wall: '#3a2a1e',
  wallTop: '#4a3626',
  floor: '#241812',
  board: '#2e2118',
  boardEdge: '#6b4a2c',
  paper: '#f7ead0',
  paperEdge: '#d9c39a',
  ink: '#2b2118',
  muted: '#8b7a68',
  stove: '#3d3d46',
  stoveTop: '#23232b',
  pan: '#4a4a55',
  panHot: '#c96a2e',
  counterWood: '#7a5230',
  counterTop: '#96683c',
  shelf: '#2e2118',
  plate: '#f5f1e6',
  accent: '#ffb03a',
  good: '#7dc383',
  bad: '#e5534b',
  timer: '#ffb03a',
  text: '#f7ead0',
  textDark: '#2b2118',
  shadow: 'rgba(0,0,0,0.35)',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
