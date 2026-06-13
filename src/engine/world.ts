// Light master-variable drift — the V1 "weather" tick. Hype mean-reverts,
// climate and rates wander, and the macro phase / IPO window occasionally
// shift. This is the seam the full six-engine model (Phase 5, Taylor-rule
// rates, industry-specific reversion) deepens; the shape stays the same.

import type { WorldState } from "@/domain/state";
import type { LogTone } from "@/domain/log";
import type { Tuning } from "@/domain/tuning";
import type { Industry } from "@/domain/ids";
import { industryLabel } from "@/domain/ids";
import { type Rng, chance, nextNoise } from "./rng";

/** A notable world change worth a news line (assembled into a LogEntry upstream). */
export interface WorldNews {
  tone: LogTone;
  headline: string;
  detail?: string;
}

const MACRO_ORDER: WorldState["macroPhase"][] = [
  "expansion",
  "peak",
  "contraction",
  "trough",
  "recovery",
];

const IPO_ORDER: WorldState["ipoWindow"][] = ["closed", "cracking", "open"];

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Advance the world one week. Returns the new world plus any news lines. */
export function driftWorld(world: WorldState, rng: Rng, tuning: Tuning): {
  world: WorldState;
  news: WorldNews[];
} {
  const news: WorldNews[] = [];
  const w = tuning.world;

  // Industry hype: mean-revert toward baseline + noise.
  const hype: Partial<Record<Industry, number>> = { ...world.hype };
  for (const key of Object.keys(hype) as Industry[]) {
    const base = w.hypeBaseline[key] ?? 50;
    const cur = hype[key] ?? base;
    const next = clamp(cur + (base - cur) * w.hypeReversion + nextNoise(rng, w.hypeNoise), 0, 100);
    // Headline only when hype settles into a new band (nearest-10 bucketing
    // gives hysteresis, so noise around a boundary doesn't spam the ticker).
    if (Math.round(next / 10) !== Math.round(cur / 10)) {
      const rising = next > cur;
      news.push({
        tone: rising ? "opportunity" : "warn",
        headline: `${industryLabel(key)} hype ${rising ? "climbs into the" : "cools into the"} ${Math.round(next / 10) * 10}s`,
      });
    }
    hype[key] = next;
  }

  // VC climate: revert toward baseline + noise.
  const vcClimate = clamp(
    world.vcClimate + (w.climateBaseline - world.vcClimate) * w.climateReversion + nextNoise(rng, w.climateNoise),
    0,
    100,
  );

  // Interest rate: small wander, floored at zero.
  const interestRate = Math.max(0, world.interestRate + nextNoise(rng, w.rateNoise));

  // Macro phase: occasionally step to the next phase in the cycle.
  let macroPhase = world.macroPhase;
  if (chance(rng, w.macroTransitionWeeklyProb)) {
    const i = MACRO_ORDER.indexOf(world.macroPhase);
    macroPhase = MACRO_ORDER[(i + 1) % MACRO_ORDER.length]!;
    news.push({
      tone: macroPhase === "contraction" || macroPhase === "trough" ? "down" : "up",
      headline: `Macro cycle tips into ${cap(macroPhase)}`,
    });
  }

  // IPO window: occasionally shift toward an adjacent state.
  let ipoWindow = world.ipoWindow;
  if (chance(rng, w.ipoWindowTransitionWeeklyProb)) {
    const i = IPO_ORDER.indexOf(world.ipoWindow);
    const step = chance(rng, 0.5) ? 1 : -1;
    ipoWindow = IPO_ORDER[clamp(i + step, 0, IPO_ORDER.length - 1)]!;
    if (ipoWindow !== world.ipoWindow) {
      news.push({
        tone: ipoWindow === "open" ? "up" : ipoWindow === "closed" ? "down" : "warn",
        headline: `IPO window ${ipoWindow === "open" ? "swings open" : ipoWindow === "closed" ? "slams shut" : "starts to crack"}`,
      });
    }
  }

  return {
    world: { macroPhase, interestRate, vcClimate, ipoWindow, hype },
    news,
  };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
