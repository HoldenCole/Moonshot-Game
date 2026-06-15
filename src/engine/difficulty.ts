// Difficulty (decision I). The axes are authoritative on the save — a preset
// just pre-fills them, and the Advanced sliders edit them directly. Each axis is
// a multiplier (1.0 = Realistic baseline) wired to a real lever: world swing,
// cycle speed, round pricing, founder capital, opening burn, event bite. A
// separate News Cycle governs how much the UI tells you. All locks at founding.

import type { Tuning } from "@/domain/tuning";
import type { Difficulty, DifficultyAxes, DifficultyPreset, NewsCycle } from "@/domain/state";

export const PRESET_AXES: Record<DifficultyPreset, DifficultyAxes> = {
  forgiving: { volatility: 0.7, cycleSpeed: 0.85, capitalClimate: 1.18, startingCapital: 1.6, burnRate: 0.85, eventSeverity: 0.7 },
  realistic: { volatility: 1.0, cycleSpeed: 1.0, capitalClimate: 1.0, startingCapital: 1.0, burnRate: 1.0, eventSeverity: 1.0 },
  brutal: { volatility: 1.45, cycleSpeed: 1.25, capitalClimate: 0.82, startingCapital: 0.6, burnRate: 1.25, eventSeverity: 1.4 },
};

export const DEFAULT_DIFFICULTY: Difficulty = { preset: "realistic", newsCycle: "medium", axes: PRESET_AXES.realistic };

/** The resolved axes for a difficulty, with a safe fallback for older/partial
 *  saves (derive from the preset, else Realistic). */
export function difficultyProfile(d: Difficulty | undefined): DifficultyAxes {
  return d?.axes ?? PRESET_AXES[(d?.preset as DifficultyPreset) ?? "realistic"] ?? PRESET_AXES.realistic;
}

/** Fill in axes (and defaults) so a loaded or partial difficulty is complete. */
export function normalizeDifficulty(d: Partial<Difficulty> | undefined): Difficulty {
  if (!d) return DEFAULT_DIFFICULTY;
  const preset = d.preset ?? "realistic";
  const base = preset !== "custom" ? PRESET_AXES[preset] : PRESET_AXES.realistic;
  return { preset, newsCycle: d.newsCycle ?? "medium", axes: { ...base, ...d.axes } };
}

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

export interface AxisMeta {
  key: keyof DifficultyAxes;
  label: string;
  hint: string;
  min: number;
  max: number;
  /** Whether a higher value makes the run harder (for the live "feel" read). */
  harderWhenHigh: boolean;
}

/** The Advanced sliders, in display order. Every one is wired to a real effect. */
export const AXES: AxisMeta[] = [
  { key: "volatility", label: "Market volatility", hint: "How violently the cycle, rates, and hype swing.", min: 0.5, max: 1.6, harderWhenHigh: true },
  { key: "cycleSpeed", label: "Cycle speed", hint: "How quickly booms turn to busts and back.", min: 0.6, max: 1.6, harderWhenHigh: true },
  { key: "capitalClimate", label: "Capital climate", hint: "How generously investors price your rounds.", min: 0.7, max: 1.3, harderWhenHigh: false },
  { key: "startingCapital", label: "Starting capital", hint: "The founder cash you open with.", min: 0.5, max: 1.8, harderWhenHigh: false },
  { key: "burnRate", label: "Opening burn", hint: "How fast your starting costs eat that cash.", min: 0.6, max: 1.6, harderWhenHigh: true },
  { key: "eventSeverity", label: "Event severity", hint: "How hard a bad decision or crisis hits.", min: 0.6, max: 1.6, harderWhenHigh: true },
];

/** Whether a set of axes matches a named preset exactly (so the UI can show the
 *  preset as selected vs. "Custom"). */
export function matchingPreset(axes: DifficultyAxes): DifficultyPreset | "custom" {
  for (const id of ["forgiving", "realistic", "brutal"] as DifficultyPreset[]) {
    if (AXES.every((a) => Math.abs(PRESET_AXES[id][a.key] - axes[a.key]) < 1e-6)) return id;
  }
  return "custom";
}

/** Apply the world levers of difficulty (volatility, shock odds, cycle speed) to
 *  the tuning the tick reads. Other axes apply at their own sites. Pure. */
export function applyWorldDifficulty(tuning: Tuning, d: Difficulty | undefined): Tuning {
  const p = difficultyProfile(d);
  if (p.volatility === 1 && p.cycleSpeed === 1) return tuning;
  return {
    ...tuning,
    world: {
      ...tuning.world,
      difficulty: { volatility: tuning.world.difficulty.volatility * p.volatility },
      macro: {
        ...tuning.world.macro,
        shockWeeklyProb: tuning.world.macro.shockWeeklyProb * p.volatility,
        cycleWeeks: tuning.world.macro.cycleWeeks / p.cycleSpeed,
      },
    },
  };
}

/** Scale the negative side of an event outcome by event severity; gains are left
 *  alone — difficulty makes bad news worse, not good news better. */
export function biteFor(d: Difficulty | undefined, value: number): number {
  return value < 0 ? value * difficultyProfile(d).eventSeverity : value;
}

/** The forward runway forecast ("~N wks to pressure") — Easy news cycle only. */
export function showsRunwayForecast(d: Difficulty | undefined): boolean {
  return (d?.newsCycle ?? "medium") === "easy";
}

/** Forward-looking projections (world sparkline forecasts) — Easy/Medium only. */
export function showsForecasts(d: Difficulty | undefined): boolean {
  return (d?.newsCycle ?? "medium") !== "hard";
}

/** Exact gauge numbers vs. qualitative bands. Hard makes you read the room. */
export function showsExactGauges(d: Difficulty | undefined): boolean {
  return (d?.newsCycle ?? "medium") !== "hard";
}

// ── New-game world preview ────────────────────────────────────────────────────

export interface PreviewBar {
  label: string;
  /** 0–1 fill for the profile bar. */
  fill: number;
  hint: string;
}

const norm = (x: number, lo: number, hi: number) => Math.max(0, Math.min(1, (x - lo) / (hi - lo)));

/** Tangible, player-legible bars describing the world a set of axes produces. */
export function previewBars(axes: DifficultyAxes): PreviewBar[] {
  return [
    { label: "Market turbulence", fill: norm((axes.volatility + axes.cycleSpeed) / 2, 0.6, 1.5), hint: "How violently and how often the world swings." },
    { label: "Capital availability", fill: norm((axes.startingCapital + axes.capitalClimate) / 2, 0.6, 1.5), hint: "Opening cash and how generously rounds price." },
    { label: "Event severity", fill: norm(axes.eventSeverity, 0.6, 1.5), hint: "How hard a bad decision or crisis hits." },
    { label: "Opening runway", fill: norm(axes.startingCapital / axes.burnRate, 0.4, 2.2), hint: "Starting capital set against your opening burn." },
  ];
}
