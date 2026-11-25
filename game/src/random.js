// Seeded random numbers (mulberry32), so a screenshot seed always replays
// the same shift: same orders, same spawn times, same frames.

export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick one item of `list` with the rng. */
export function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

/** A number in [min, max) from the rng. */
export function range(rng, min, max) {
  return min + rng() * (max - min);
}
