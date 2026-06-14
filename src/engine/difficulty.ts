// Difficulty (decision I). A preset picks a small set of multipliers that bend
// the run's shape — how violent the world is, how much capital you start with,
// how generous rounds price, how hard events bite. A separate News Cycle governs
// how much the UI tells you (information, not mechanics). All of it locks at
// founding. Pure: presets are data, the apply-functions return new values.

import type { Tuning } from "@/domain/tuning";
import type { Difficulty, DifficultyPreset, NewsCycle } from "@/domain/state";

export interface DifficultyProfile {
  /** World swing multiplier — volatility and shock frequency. */
  volatility: number;
  /** Founder's opening capital multiplier (starting runway). */
  startingCapital: number;
  /** Round-pricing generosity (× on the valuation heat at the table). */
  capitalClimate: number;
  /** How hard event outcomes bite (× on the negative side of an outcome). */
  eventSeverity: number;
}

const PROFILES: Record<DifficultyPreset, DifficultyProfile> = {
  forgiving: { volatility: 0.7, startingCapital: 1.6, capitalClimate: 1.18, eventSeverity: 0.7 },
  realistic: { volatility: 1.0, startingCapital: 1.0, capitalClimate: 1.0, eventSeverity: 1.0 },
  brutal: { volatility: 1.45, startingCapital: 0.6, capitalClimate: 0.82, eventSeverity: 1.4 },
};

export const DEFAULT_DIFFICULTY: Difficulty = { preset: "realistic", newsCycle: "medium" };

export interface PresetMeta {
  id: DifficultyPreset;
  label: string;
  tagline: string;
}

export const PRESETS: PresetMeta[] = [
  { id: "forgiving", label: "Forgiving", tagline: "A gentler frontier — capital flows and shocks are rare. Room to learn." },
  { id: "realistic", label: "Realistic", tagline: "A normal frontier economy. Cycles bite, but the rounds are there if you earn them." },
  { id: "brutal", label: "Brutal", tagline: "Capital is scarce, the world is violent, and every mistake compounds." },
];

export interface NewsCycleMeta {
  id: NewsCycle;
  label: string;
  blurb: string;
}

export const NEWS_CYCLES: NewsCycleMeta[] = [
  { id: "easy", label: "Easy", blurb: "Full instrumentation — forecasts, exact gauges, and runway warnings up front." },
  { id: "medium", label: "Medium", blurb: "The core readouts, with fewer forward-looking forecasts." },
  { id: "hard", label: "Hard", blurb: "Fly by feel. Minimal forecasting — you read the world yourself." },
];

export function difficultyProfile(d: Difficulty | undefined): DifficultyProfile {
  return PROFILES[d?.preset ?? "realistic"];
}

/** Apply the world-volatility part of difficulty to the tuning the tick reads.
 *  The other levers apply at their own sites (founding capital, round pricing,
 *  event outcomes). Returns a new tuning; never mutates. */
export function applyWorldDifficulty(tuning: Tuning, d: Difficulty | undefined): Tuning {
  const p = difficultyProfile(d);
  if (p.volatility === 1) return tuning;
  return {
    ...tuning,
    world: {
      ...tuning.world,
      difficulty: { volatility: tuning.world.difficulty.volatility * p.volatility },
      macro: { ...tuning.world.macro, shockWeeklyProb: tuning.world.macro.shockWeeklyProb * p.volatility },
    },
  };
}

/** Scale the negative side of an event outcome by the event-severity lever.
 *  Positive effects are left alone — difficulty makes bad news worse, not good
 *  news better. */
export function biteFor(d: Difficulty | undefined, value: number): number {
  return value < 0 ? value * difficultyProfile(d).eventSeverity : value;
}

// ── News-cycle gating (UI legibility, not mechanics) ──────────────────────────

/** The forward runway forecast ("~N wks to pressure") — easy only. */
export function showsRunwayForecast(d: Difficulty | undefined): boolean {
  return (d?.newsCycle ?? "medium") === "easy";
}

// ── New-game world preview ────────────────────────────────────────────────────

export interface PreviewBar {
  label: string;
  /** 0–1 fill for the profile bar. */
  fill: number;
  hint: string;
}

const norm = (x: number, lo: number, hi: number) => Math.max(0, Math.min(1, (x - lo) / (hi - lo)));

/** Tangible, player-legible bars describing the world a preset produces. */
export function previewBars(preset: DifficultyPreset): PreviewBar[] {
  const p = PROFILES[preset];
  return [
    { label: "Market volatility", fill: norm(p.volatility, 0.6, 1.5), hint: "How violently the cycle, rates, and hype swing." },
    { label: "Capital availability", fill: norm((p.startingCapital + p.capitalClimate) / 2, 0.6, 1.5), hint: "Starting runway and how generously rounds price." },
    { label: "Event severity", fill: norm(p.eventSeverity, 0.6, 1.5), hint: "How hard a bad decision or crisis hits." },
    { label: "Starting runway", fill: norm(p.startingCapital, 0.5, 1.7), hint: "The founder capital you open with." },
  ];
}
