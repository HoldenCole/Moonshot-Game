// Deterministic seeded PRNG (mulberry32). The generator state is a single
// 32-bit integer carried in the save, so advancing time is reproducible: the
// same seed + cursor always yields the same world. No Math.random in the engine.

export interface Rng {
  state: number;
}

export function makeRng(seed: number): Rng {
  return { state: seed >>> 0 };
}

/** Next float in [0, 1). Mutates the generator state. */
export function nextFloat(rng: Rng): number {
  let t = (rng.state = (rng.state + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Float in [min, max). */
export function nextRange(rng: Rng, min: number, max: number): number {
  return min + nextFloat(rng) * (max - min);
}

/** Symmetric noise in [-mag, +mag). */
export function nextNoise(rng: Rng, mag: number): number {
  return nextRange(rng, -mag, mag);
}

/** True with probability p. */
export function chance(rng: Rng, p: number): boolean {
  return nextFloat(rng) < p;
}

/** Pick one element uniformly (undefined for an empty array). */
export function pick<T>(rng: Rng, xs: readonly T[]): T | undefined {
  if (xs.length === 0) return undefined;
  return xs[Math.floor(nextFloat(rng) * xs.length)];
}
