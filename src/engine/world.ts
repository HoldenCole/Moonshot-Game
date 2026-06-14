// The six master-variable engines — the world's "weather", a three-layer model.
//
//   Universal layer   macro cycle · interest rate (Taylor) · market sentiment
//   Derived layer      VC climate · IPO window · per-industry hype
//
// Effects cascade top-down: the macro cycle and rates move sentiment; sentiment
// (plus rates and hype) moves VC climate; sentiment and macro set the IPO
// window; sentiment lifts or depresses every industry's hype, which then
// mean-reverts at its own rate. Pure and deterministic from the save's RNG.

import type { Industry } from "@/domain/ids";
import { industryLabel } from "@/domain/ids";
import type { IpoWindow, MacroPhase, WorldSnapshot, WorldState } from "@/domain/state";
import type { LogTone } from "@/domain/log";
import type { WorldTuning } from "@/domain/tuning";
import { type Rng, chance, nextNoise } from "./rng";

export interface WorldNews {
  tone: LogTone;
  headline: string;
  detail?: string;
}

const TAU = Math.PI * 2;
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Advance every master variable one week. Pure: same state + rng + tuning →
 *  same result. `playerIndustry` only filters which hype news surfaces. */
export function stepWorld(
  world: WorldState,
  rng: Rng,
  tuning: WorldTuning,
  playerIndustry: Industry,
): { world: WorldState; news: WorldNews[] } {
  const vol = tuning.difficulty.volatility;
  const news: WorldNews[] = [];

  // 1 ── Macro cycle (oscillator + recession shocks) ─────────────────────────
  const position = world.macroPosition + TAU / tuning.macro.cycleWeeks + nextNoise(rng, tuning.macro.positionNoise * vol);
  const cycleTarget = Math.sin(position);
  let strength = lerp(world.macroStrength, cycleTarget, 0.08);
  if (chance(rng, tuning.macro.shockWeeklyProb * vol)) {
    strength -= tuning.macro.shockMagnitude;
    news.push({ tone: "crisis", headline: "A shock rattles the economy", detail: "Markets reprice risk sharply." });
  }
  strength = clamp(strength, -1.2, 1.2);
  const slope = Math.cos(position);
  const macroPhase = phaseFrom(strength, slope);
  if (macroPhase !== world.macroPhase) {
    news.push({ tone: phaseTone(macroPhase), headline: `Macro cycle turns to ${cap(macroPhase)}` });
  }

  // 2 ── Interest rate (Taylor rule, quarterly review) ───────────────────────
  let interestRate = world.interestRate;
  let rateTarget = world.rateTarget;
  let weeksSinceRateReview = world.weeksSinceRateReview + 1;
  if (weeksSinceRateReview >= tuning.rates.reviewWeeks) {
    weeksSinceRateReview = 0;
    const inflationProxy = Math.max(0, strength);
    rateTarget = Math.max(
      tuning.rates.min,
      tuning.rates.neutral + tuning.rates.taylorOutput * strength + tuning.rates.taylorInflation * inflationProxy,
    );
    const move = clamp(rateTarget - interestRate, -tuning.rates.maxMovePerReview, tuning.rates.maxMovePerReview);
    const prev = interestRate;
    interestRate = Math.max(tuning.rates.min, interestRate + move);
    if (Math.abs(interestRate - prev) >= 0.24) {
      news.push({
        tone: interestRate > prev ? "down" : "up",
        headline: `Central bank ${interestRate > prev ? "hikes" : "cuts"} to ${interestRate.toFixed(2)}%`,
      });
    }
  }

  // 3 ── Market sentiment (animal spirits) ───────────────────────────────────
  const sTarget =
    tuning.sentiment.baseline +
    tuning.sentiment.macroWeight * strength -
    tuning.sentiment.rateWeight * (interestRate - tuning.rates.neutral);
  const marketSentiment = clamp(
    lerp(world.marketSentiment, sTarget, tuning.sentiment.reversion) + nextNoise(rng, tuning.sentiment.noise * vol),
    0,
    100,
  );
  pushBandNews(news, world.marketSentiment, marketSentiment, [
    { at: 85, up: { tone: "warn", headline: "Euphoria grips the markets" }, down: { tone: "neutral", headline: "Froth comes off the top" } },
    { at: 25, up: { tone: "up", headline: "Markets steady after a fearful stretch" }, down: { tone: "crisis", headline: "Fear takes hold of markets" } },
  ]);

  // 4 ── Industry hype (per-industry mean reversion + waves) ─────────────────
  const lift = ((marketSentiment - tuning.sentiment.baseline) / 50) * tuning.hype.macroLift;
  const industries = Object.keys(world.hype) as Industry[];
  const hype: Partial<Record<Industry, number>> = { ...world.hype };
  let wave: Industry | null = null;
  if (chance(rng, tuning.hype.waveWeeklyProb * vol)) {
    wave = industries[Math.floor((rng.state >>> 8) % industries.length)] ?? null;
  }
  for (const ind of industries) {
    const baseline = tuning.hype.baseline[ind] ?? 50;
    const reversion = tuning.hype.reversion[ind] ?? 0.04;
    const cur = hype[ind] ?? baseline;
    let next = cur + (baseline + lift - cur) * reversion + nextNoise(rng, tuning.hype.noise * vol);
    if (ind === wave) {
      next += tuning.hype.waveMagnitude;
      news.push({ tone: "opportunity", headline: `A hype wave lifts ${industryLabel(ind)}` });
    }
    next = clamp(next, 0, 100);
    if (ind === playerIndustry && Math.round(next / 10) !== Math.round(cur / 10)) {
      news.push({
        tone: next > cur ? "opportunity" : "warn",
        headline: `${industryLabel(ind)} hype ${next > cur ? "climbs into the" : "cools into the"} ${Math.round(next / 10) * 10}s`,
      });
    }
    hype[ind] = next;
  }
  const avgHype = industries.reduce((s, i) => s + (hype[i] ?? 50), 0) / Math.max(1, industries.length);

  // 5 ── VC climate ──────────────────────────────────────────────────────────
  const cTarget =
    tuning.climate.base +
    tuning.climate.sentimentWeight * (marketSentiment - tuning.sentiment.baseline) -
    tuning.climate.rateWeight * (interestRate - tuning.rates.neutral) +
    tuning.climate.hypeWeight * (avgHype - 55);
  const vcClimate = clamp(
    lerp(world.vcClimate, cTarget, tuning.climate.reversion) + nextNoise(rng, tuning.climate.noise * vol),
    0,
    100,
  );
  if (climateLabel(world.vcClimate) !== climateLabel(vcClimate)) {
    news.push({ tone: vcClimate > world.vcClimate ? "up" : "warn", headline: `VC climate turns ${climateLabel(vcClimate)}` });
  }

  // 6 ── IPO window (openness + hysteresis + min persistence) ────────────────
  const openTarget = clamp(
    marketSentiment * tuning.ipo.sentimentWeight + (strength * 0.5 + 0.5) * tuning.ipo.macroWeight,
    0,
    100,
  );
  const ipoOpenness = lerp(world.ipoOpenness, openTarget, 0.1);
  let ipoWindow = world.ipoWindow;
  let weeksInIpoWindow = world.weeksInIpoWindow + 1;
  const desired = windowFrom(ipoOpenness, tuning);
  if (desired !== ipoWindow && weeksInIpoWindow >= tuning.ipo.minPersistWeeks) {
    ipoWindow = desired;
    weeksInIpoWindow = 0;
    news.push({
      tone: desired === "open" ? "up" : desired === "closed" ? "down" : "warn",
      headline: `IPO window ${desired === "open" ? "swings open" : desired === "closed" ? "slams shut" : "starts to crack"}`,
    });
  }

  return {
    world: {
      macroPhase,
      macroPosition: position % TAU,
      macroStrength: clamp(strength, -1, 1),
      interestRate,
      rateTarget,
      weeksSinceRateReview,
      marketSentiment,
      vcClimate,
      ipoWindow,
      ipoOpenness,
      weeksInIpoWindow,
      hype,
    },
    news,
  };
}

export function snapshotWorld(world: WorldState, week: number): WorldSnapshot {
  return {
    week,
    macroStrength: world.macroStrength,
    interestRate: world.interestRate,
    marketSentiment: world.marketSentiment,
    vcClimate: world.vcClimate,
    ipoOpenness: world.ipoOpenness,
    hype: { ...world.hype },
  };
}

/** Valuation heat: how much the market lifts (or cuts) round prices right now.
 *  This is how the world variables become load-bearing in fundraising. */
export function valuationMultiplier(world: WorldState, industry: Industry): number {
  const hype = world.hype[industry] ?? 55;
  return clamp(0.72 + (world.vcClimate - 55) / 120 + (hype - 60) / 170, 0.6, 1.65);
}

// ── Labels (shared by the UI) ────────────────────────────────────────────────

export function climateLabel(v: number): string {
  if (v < 20) return "Frozen";
  if (v < 40) return "Cool";
  if (v < 65) return "Normal";
  if (v < 85) return "Hot";
  return "Frothy";
}

export function sentimentLabel(v: number): string {
  if (v < 25) return "Fearful";
  if (v < 45) return "Cautious";
  if (v < 65) return "Steady";
  if (v < 85) return "Risk-on";
  return "Euphoric";
}

export const MACRO_LABEL: Record<MacroPhase, string> = {
  expansion: "Expansion",
  peak: "Peak",
  contraction: "Contraction",
  trough: "Trough",
  recovery: "Recovery",
};

// ── helpers ──────────────────────────────────────────────────────────────────

function phaseFrom(strength: number, slope: number): MacroPhase {
  if (strength > 0.55) return "peak";
  if (strength < -0.55) return "trough";
  if (slope >= 0) return strength > -0.15 ? "expansion" : "recovery";
  return "contraction";
}

function phaseTone(phase: MacroPhase): LogTone {
  if (phase === "contraction" || phase === "trough") return "down";
  if (phase === "peak") return "warn";
  return "up";
}

function windowFrom(openness: number, tuning: WorldTuning): IpoWindow {
  if (openness >= tuning.ipo.openThreshold) return "open";
  if (openness <= tuning.ipo.closedThreshold) return "closed";
  return "cracking";
}

interface BandRule {
  at: number;
  up: WorldNews;
  down: WorldNews;
}

/** Emit news when a value crosses a threshold (with direction). */
function pushBandNews(news: WorldNews[], prev: number, next: number, rules: BandRule[]): void {
  for (const r of rules) {
    if (prev < r.at && next >= r.at) news.push(r.up);
    else if (prev >= r.at && next < r.at) news.push(r.down);
  }
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
