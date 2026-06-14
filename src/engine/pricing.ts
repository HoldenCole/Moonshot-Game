// Stock pricing (decision K): a company's market value is its fundamentals
// lifted or depressed by sector hype and the macro cycle, plus per-name noise —
// NOT a random walk. A player who reads fundamentals against hype can spot a
// mispriced name; that's the investment skill. Deterministic per company+week.

import type { Company } from "@/content/load";
import type { Money } from "@/domain/captable";
import type { WorldState } from "@/domain/state";

const HYPE_SENSITIVITY = 0.85;
const MACRO_SENSITIVITY = 0.16;
const NOISE_AMPLITUDE = 0.07;

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** The company's intrinsic fair value (authored / quality-derived), $M. */
export function fundamentalValue(c: Company): Money {
  return c.financials.valuation;
}

/** The live market value, $M — fair value × hype × macro × noise. */
export function marketPrice(c: Company, world: WorldState, week: number): Money {
  const hype = world.hype[c.industry] ?? 50;
  // Hype only moves names that are exposed to it; a 55 hype is "neutral".
  const hypePremium = c.quality.hype_exposure * ((hype - 55) / 100) * HYPE_SENSITIVITY;
  const macroAdj = world.macroStrength * MACRO_SENSITIVITY;
  const noise = seededNoise(c.id, week) * NOISE_AMPLITUDE;
  const mult = clamp(1 + hypePremium + macroAdj + noise, 0.3, 3.2);
  return fundamentalValue(c) * mult;
}

/** Premium (+) or discount (−) of market price to fair value, as a fraction. */
export function mispricing(c: Company, world: WorldState, week: number): number {
  const fair = fundamentalValue(c);
  if (fair <= 0) return 0;
  return marketPrice(c, world, week) / fair - 1;
}

/** Stable per-company, per-week noise in [-1, 1]. */
function seededNoise(id: string, week: number): number {
  let h = 2166136261 ^ Math.floor(week);
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) / 4294967296) * 2 - 1;
}
