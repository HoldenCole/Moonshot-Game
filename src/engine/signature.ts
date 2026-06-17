// The sub-industry signature mechanic (Phase 9). Every sub-industry shares one
// commit→anticipate→resolve lifecycle, but plays distinctly: at commit time you
// pick an *approach* (a real strategic lever tailored to the industry — scale a
// training run, push an aggressive process node, fly conservative vs. push the
// window, batch small vs. large, pick a tenant), and four of the six carry a
// persistent *accumulator* with its own meaning: flight heritage that compounds
// your odds, a satellite fleet / station occupancy that compounds recurring
// revenue, or moat depth that buys down commoditization risk. Pure + deterministic.

import type { GameState, SignatureState } from "@/domain/state";
import type { Money } from "@/domain/captable";
import type { LogEntry } from "@/domain/log";
import { stageRank, type SubIndustry } from "@/domain/ids";
import { opsExecutionBoost } from "./operations";
import { type Rng, nextFloat, nextInt } from "./rng";

/** A commit-time strategic lever. Shifts cost/time/odds/reward and accumulator
 *  gain, so "safe vs. swing" is a genuine decision, distinct per sub-industry. */
export interface SignatureApproach {
  id: string;
  label: string;
  blurb: string;
  costMult: number;
  durationMult: number;
  /** Added to the base win probability. */
  oddsShift: number;
  /** Scales the hype / revenue / reputation reward. */
  rewardMult: number;
  /** Scales how much the accumulator gains on a good outcome. */
  gainMult: number;
  /** Widens the failure tail on graded processes (eats into the "partial" band). */
  variance: number;
}

/** A persistent quantity the signature builds up. Its semantics vary: heritage /
 *  moat feed `oddsPerUnit` (a learning curve / downside buy-down); a fleet /
 *  occupancy feed `revenuePerUnit` (a recurring-revenue ramp). */
export interface SignatureAccumulator {
  key: string;
  label: string;
  unit: string;
  gainOnSuccess: number;
  gainOnPartial: number;
  loseOnFailure: number;
  /** Each accumulated unit adds this to the win probability (0 = none). */
  oddsPerUnit: number;
  /** Each accumulated unit adds this to annual revenue, $M (0 = none). */
  revenuePerUnit: number;
  max: number;
}

export interface SignatureConfig {
  noun: string;
  /** Verb phrase for the commit CTA, e.g. "Commit a training run". */
  commitVerb: string;
  metricLabel: string;
  durationWeeks: [number, number];
  /** Fraction of cash committed (with a floor), the base bet size. */
  costFraction: number;
  costFloor: Money;
  /** Binary success/failure (launches) vs. graded (training, fabs). */
  binary: boolean;
  /** What a win does at the baseline approach, scaled later by company quality. */
  reward: { hype: number; revenue: number; reputation: number };
  approaches: SignatureApproach[];
  defaultApproachId: string;
  /** The build-up quantity, if this sub-industry has one. */
  accumulator?: SignatureAccumulator;
  flavorRunning: string;
  flavorWin: string;
  flavorPartial: string;
  flavorLoss: string;
}

const CONFIG: Record<string, SignatureConfig> = {
  frontier_model_lab: {
    noun: "training run", commitVerb: "Commit a training run", metricLabel: "loss",
    durationWeeks: [8, 12], costFraction: 0.35, costFloor: 0.3, binary: false,
    // The shortest, cheapest, most reliable cadence of any sub-industry, so its
    // per-win revenue is the lowest — it stays the easiest path without the
    // top line running away from a couple of training runs.
    reward: { hype: 8, revenue: 0.4, reputation: 6 },
    defaultApproachId: "scaling",
    approaches: [
      { id: "targeted", label: "Targeted run", blurb: "A focused, cheaper run — reliable, incremental capability.", costMult: 0.55, durationMult: 0.8, oddsShift: 0.13, rewardMult: 0.55, gainMult: 1, variance: 0 },
      { id: "scaling", label: "Scaling run", blurb: "The standard bet — balanced compute, balanced payoff.", costMult: 1, durationMult: 1, oddsShift: 0, rewardMult: 1, gainMult: 1, variance: 0 },
      { id: "frontier", label: "Frontier run", blurb: "Push the scaling laws — enormous compute, a real shot at a leap, a real chance of a dud.", costMult: 1.7, durationMult: 1.25, oddsShift: -0.08, rewardMult: 1.9, gainMult: 1, variance: 0.16 },
    ],
    flavorRunning: "Compute is burning; the loss curve is tracking toward your capability target.",
    flavorWin: "The run beat target — a real capability jump. Benchmarks move and the calls get returned.",
    flavorPartial: "The run landed roughly on target. Incremental, useful, not headline-making.",
    flavorLoss: "The run missed. The compute is spent and the timeline's blown — a negative result the deck never mentions.",
  },
  vertical_ai_saas: {
    noun: "vertical-moat push", commitVerb: "Push the vertical moat", metricLabel: "NRR",
    durationWeeks: [12, 20], costFraction: 0.25, costFloor: 0.2, binary: false,
    reward: { hype: 4, revenue: 1.4, reputation: 4 },
    defaultApproachId: "deepen",
    approaches: [
      { id: "deepen", label: "Deepen the workflow", blurb: "Dig into the vertical — widens your moat and buys down platform risk.", costMult: 1, durationMult: 1, oddsShift: 0.05, rewardMult: 0.85, gainMult: 1.7, variance: 0 },
      { id: "expand", label: "Land-grab", blurb: "Race for revenue and logos — faster top-line, but you leave the moat thin and exposed.", costMult: 1.1, durationMult: 0.9, oddsShift: -0.05, rewardMult: 1.5, gainMult: 0.4, variance: 0.08 },
    ],
    accumulator: { key: "moat", label: "Moat depth", unit: "", gainOnSuccess: 1, gainOnPartial: 0.5, loseOnFailure: 1, oddsPerUnit: 0.03, revenuePerUnit: 0, max: 10 },
    flavorRunning: "You're racing to deepen the workflow before a foundation model commoditizes the layer beneath you.",
    flavorWin: "The moat held and widened — retention climbs and the platform can't easily eat you now.",
    flavorPartial: "You held the line. Net retention is steady; the race continues.",
    flavorLoss: "A foundation model absorbed a slice of your value. The thinner your moat, the deeper it cut.",
  },
  ai_chips: {
    noun: "fab tape-out", commitVerb: "Commit a tape-out", metricLabel: "yield",
    durationWeeks: [40, 72], costFraction: 0.6, costFloor: 2, binary: false,
    reward: { hype: 10, revenue: 3, reputation: 9 },
    defaultApproachId: "proven",
    approaches: [
      { id: "proven", label: "Proven node", blurb: "Tape out on a mature process — dependable yields, a measured step.", costMult: 1, durationMult: 1, oddsShift: 0.1, rewardMult: 0.8, gainMult: 1, variance: 0 },
      { id: "aggressive", label: "Bleeding-edge node", blurb: "Chase the next architecture — a generational lead if it yields, the silicon nightmare if it doesn't.", costMult: 1.4, durationMult: 1.15, oddsShift: -0.12, rewardMult: 2, gainMult: 1, variance: 0.2 },
    ],
    flavorRunning: "A multi-year, bet-the-company tape-out is in the fab. Yield is the whole game.",
    flavorWin: "Yields came in strong — a generational architecture lead and a demand queue out the door.",
    flavorPartial: "Yields are workable. Not a leap, but the line keeps moving.",
    flavorLoss: "The tape-out came back low-yield. Years and capital, gone — the silicon nightmare.",
  },
  launch_services: {
    noun: "launch", commitVerb: "Attempt a launch", metricLabel: "countdown",
    durationWeeks: [6, 12], costFraction: 0.3, costFloor: 0.4, binary: true,
    reward: { hype: 9, revenue: 1.0, reputation: 8 },
    defaultApproachId: "conservative",
    approaches: [
      { id: "conservative", label: "Fly conservative", blurb: "Scrub on any anomaly — higher odds of a clean flight, a smaller headline.", costMult: 0.9, durationMult: 1, oddsShift: 0.12, rewardMult: 0.8, gainMult: 1, variance: 0 },
      { id: "aggressive", label: "Push the window", blurb: "Fly through marginal conditions — a bigger moment and more heritage, a real shot at a RUD.", costMult: 1.1, durationMult: 0.9, oddsShift: -0.1, rewardMult: 1.5, gainMult: 1.4, variance: 0 },
    ],
    accumulator: { key: "heritage", label: "Flight heritage", unit: "flights", gainOnSuccess: 1, gainOnPartial: 0.5, loseOnFailure: 1, oddsPerUnit: 0.02, revenuePerUnit: 0, max: 12 },
    flavorRunning: "Vehicle's on the pad. Every launch is a binary success-or-failure moment, in public.",
    flavorWin: "Nominal flight, payload deployed. The manifest fills and the stock notices.",
    flavorPartial: "A scrubbed-and-recovered flight — late, but it flew.",
    flavorLoss: "A RUD on ascent. The vehicle and payload are gone, and the stock takes the hit.",
  },
  satellite_constellations: {
    noun: "deployment batch", commitVerb: "Deploy a batch", metricLabel: "sats live",
    durationWeeks: [16, 28], costFraction: 0.45, costFloor: 1, binary: false,
    reward: { hype: 5, revenue: 0.3, reputation: 5 },
    defaultApproachId: "small",
    approaches: [
      { id: "small", label: "Small batch", blurb: "A handful of birds — cheap, low anomaly risk, a steady ramp.", costMult: 0.75, durationMult: 0.85, oddsShift: 0.08, rewardMult: 0.8, gainMult: 0.6, variance: 0 },
      { id: "large", label: "Full stack", blurb: "Pack the fairing — far more capacity per launch, but more to go wrong.", costMult: 1.4, durationMult: 1.15, oddsShift: -0.06, rewardMult: 1.2, gainMult: 1.6, variance: 0.1 },
    ],
    accumulator: { key: "fleet", label: "Fleet", unit: "sats", gainOnSuccess: 14, gainOnPartial: 7, loseOnFailure: 3, oddsPerUnit: 0, revenuePerUnit: 0.05, max: 240 },
    flavorRunning: "A batch is climbing toward its operational shells; the recurring-revenue ramp follows the buildout curve.",
    flavorWin: "The batch is live and healthy — subscriber capacity and recurring revenue both step up.",
    flavorPartial: "Most of the batch is operational. The ramp continues, a little behind plan.",
    flavorLoss: "Deployment anomalies cost you units. The capex hump just got steeper.",
  },
  space_stations: {
    noun: "tenant build-out", commitVerb: "Sign a tenant build-out", metricLabel: "occupancy",
    durationWeeks: [20, 36], costFraction: 0.4, costFloor: 1, binary: false,
    reward: { hype: 5, revenue: 0.3, reputation: 6 },
    defaultApproachId: "research",
    approaches: [
      { id: "research", label: "Research tenant", blurb: "Anchor with national labs and pharma — dependable, lower margin.", costMult: 1, durationMult: 1, oddsShift: 0.05, rewardMult: 0.95, gainMult: 1, variance: 0 },
      { id: "manufacturing", label: "In-orbit manufacturing", blurb: "Fiber, alloys, organs — higher value, trickier to stand up.", costMult: 1.15, durationMult: 1.05, oddsShift: -0.02, rewardMult: 1.2, gainMult: 1.1, variance: 0.05 },
      { id: "tourism", label: "Tourism module", blurb: "Private astronauts — marquee revenue, marquee ways to embarrass yourself.", costMult: 1.1, durationMult: 1, oddsShift: -0.04, rewardMult: 1.35, gainMult: 1, variance: 0.09 },
    ],
    accumulator: { key: "occupancy", label: "Occupancy", unit: "%", gainOnSuccess: 14, gainOnPartial: 7, loseOnFailure: 5, oddsPerUnit: 0, revenuePerUnit: 0.11, max: 100 },
    flavorRunning: "You're orchestrating a tenant mix — research, manufacturing, tourism — toward a profitable occupancy.",
    flavorWin: "The tenant mix clicked — occupancy and margins both up, the orbital economy made real.",
    flavorPartial: "Occupancy ticked up. A workable mix, not yet a thriving one.",
    flavorLoss: "A marquee tenant pulled out. Occupancy slips and the module sits half-empty.",
  },
};

const DEFAULT: SignatureConfig = CONFIG.frontier_model_lab!;

export function signatureConfig(sub: SubIndustry): SignatureConfig {
  return CONFIG[sub] ?? DEFAULT;
}

/** The approaches offered for a sub-industry (risk-ordered for the UI). */
export function signatureApproaches(sub: SubIndustry): SignatureApproach[] {
  return signatureConfig(sub).approaches;
}

function approachById(cfg: SignatureConfig, id: string | undefined): SignatureApproach {
  return cfg.approaches.find((a) => a.id === id) ?? cfg.approaches.find((a) => a.id === cfg.defaultApproachId) ?? cfg.approaches[0]!;
}

/** Current accumulated units (fleet / heritage / occupancy / moat), 0 if none. */
export function accumulatedUnits(state: GameState): number {
  const acc = signatureConfig(state.company.subIndustry).accumulator;
  if (!acc) return 0;
  return state.company.signatureStats?.[acc.key] ?? 0;
}

export const IDLE_SIGNATURE: SignatureState = {
  status: "idle",
  noun: "",
  name: "",
  metricLabel: "",
  startWeek: 0,
  endWeek: 0,
  committed: 0,
};

/** Cost to commit at the current cash level under the chosen approach. */
export function commitCost(state: GameState, approachId?: string): Money {
  const cfg = signatureConfig(state.company.subIndustry);
  const appr = approachById(cfg, approachId);
  const cash = state.company.financials.cash;
  return Math.round(Math.max(cfg.costFloor, cash * cfg.costFraction) * appr.costMult * 100) / 100;
}

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

/** Estimated win probability for an approach (the same math the resolve uses),
 *  for the pre-commit odds readout. */
export function winChance(state: GameState, approachId?: string): number {
  const cfg = signatureConfig(state.company.subIndustry);
  const appr = approachById(cfg, approachId);
  const cost = commitCost(state, appr.id);
  const exec = companyExecution(state);
  // committed/(cash_after+committed) == cost/cash_now (commit just moves cash → committed).
  const betBoost = Math.min(0.18, (cost / Math.max(1, state.company.financials.cash)) * 0.3);
  const acc = cfg.accumulator;
  const accBoost = acc ? acc.oddsPerUnit * (state.company.signatureStats?.[acc.key] ?? 0) : 0;
  return clamp(0.32 + exec * 0.45 + betBoost + appr.oddsShift + accBoost, 0.05, 0.95);
}

/** Begin a signature process (commit phase) under the chosen approach. */
export function commitProcess(state: GameState, rng: Rng, approachId?: string): GameState {
  const cfg = signatureConfig(state.company.subIndustry);
  const appr = approachById(cfg, approachId);
  const cost = commitCost(state, appr.id);
  const span = nextInt(rng, cfg.durationWeeks[0], cfg.durationWeeks[1]);
  const duration = Math.max(2, Math.round(span * appr.durationMult));
  const gen = countResolved(state) + 1;
  const name = processName(state.company.name, cfg, gen);

  return {
    ...state,
    company: {
      ...state.company,
      financials: { ...state.company.financials, cash: Math.max(0, state.company.financials.cash - cost) },
      signature: {
        status: "running",
        noun: cfg.noun,
        name,
        metricLabel: cfg.metricLabel,
        startWeek: state.clock.week,
        endWeek: state.clock.week + duration,
        committed: cost,
        approach: appr.id,
        lastOutcome: state.company.signature.lastOutcome,
      },
    },
  };
}

/** Advance the process one tick. When it reaches its end week, resolve it. */
export function tickProcess(state: GameState, rng: Rng): { state: GameState; resolved: LogEntry | null } {
  const sig = state.company.signature;
  if (sig.status !== "running" || state.clock.week < sig.endWeek) {
    return { state, resolved: null };
  }
  const cfg = signatureConfig(state.company.subIndustry);
  const appr = approachById(cfg, sig.approach);
  const acc = cfg.accumulator;

  // Odds rise with execution, the size of the bet, the approach, and any
  // accumulated edge (flight heritage / moat depth).
  const exec = companyExecution(state);
  const betBoost = Math.min(0.18, (sig.committed / Math.max(1, state.company.financials.cash + sig.committed)) * 0.3);
  const accBoost = acc ? acc.oddsPerUnit * (state.company.signatureStats?.[acc.key] ?? 0) : 0;
  const pWin = clamp(0.32 + exec * 0.45 + betBoost + appr.oddsShift + accBoost, 0.05, 0.95);
  const roll = nextFloat(rng);

  let kind: "success" | "partial" | "failure";
  if (cfg.binary) {
    kind = roll < pWin ? "success" : "failure";
  } else {
    const partialBand = Math.max(0.05, 0.3 - appr.variance);
    if (roll < pWin) kind = "success";
    else if (roll < pWin + partialBand) kind = "partial";
    else kind = "failure";
  }

  const next = applyResolution(state, cfg, appr, kind);
  const summary = kind === "success" ? cfg.flavorWin : kind === "partial" ? cfg.flavorPartial : cfg.flavorLoss;
  const resolved: LogEntry = {
    id: `sig-${sig.name}-${state.clock.week}`,
    week: state.clock.week,
    kind: "company",
    tone: kind === "success" ? "opportunity" : kind === "partial" ? "neutral" : "crisis",
    headline: `${sig.name}: ${kind === "success" ? "beat target" : kind === "partial" ? "on target" : "missed"}`,
    detail: summary,
  };
  return { state: next, resolved };
}

/** 0–1 progress through the running process (for the widget). */
export function processProgress(sig: SignatureState, week: number): number {
  if (sig.status !== "running") return sig.status === "resolved" ? 1 : 0;
  const span = sig.endWeek - sig.startWeek || 1;
  return Math.min(1, Math.max(0, (week - sig.startWeek) / span));
}

/** A live, creeping metric readout (e.g. falling loss, climbing yield). */
export function processMetric(sig: SignatureState, week: number): string {
  const p = processProgress(sig, week);
  switch (sig.metricLabel) {
    case "loss":
      return `loss ${(2.4 - p * 0.9).toFixed(3)}`;
    case "yield":
      return `yield ${Math.round(20 + p * 55)}%`;
    case "countdown":
      return p < 1 ? `T-${Math.max(0, Math.round((1 - p) * 10))}d` : "T-0";
    case "NRR":
      return `NRR ${Math.round(108 + p * 22)}%`;
    case "sats live":
      return `${Math.round(p * 48)} sats live`;
    case "occupancy":
      return `${Math.round(p * 80)}% occupancy`;
    default:
      return `${Math.round(p * 100)}%`;
  }
}

// ── internals ────────────────────────────────────────────────────────────────

function applyResolution(
  state: GameState,
  cfg: SignatureConfig,
  appr: SignatureApproach,
  kind: "success" | "partial" | "failure",
): GameState {
  const mult = kind === "success" ? 1 : kind === "partial" ? 0.4 : -0.6;
  const f = state.company.financials;
  const ind = state.company.industry;
  const hype = { ...state.world.hype };
  hype[ind] = clamp01to100((hype[ind] ?? 50) + cfg.reward.hype * mult * appr.rewardMult);

  // Accumulator update + any recurring-revenue contribution from new units.
  const acc = cfg.accumulator;
  const stats = { ...(state.company.signatureStats ?? {}) };
  let fleetRevenue = 0;
  if (acc) {
    const units = stats[acc.key] ?? 0;
    const gain =
      kind === "success" ? acc.gainOnSuccess * appr.gainMult : kind === "partial" ? acc.gainOnPartial * appr.gainMult : -acc.loseOnFailure;
    const nextUnits = clamp(units + gain, 0, acc.max);
    stats[acc.key] = Math.round(nextUnits * 10) / 10;
    fleetRevenue = acc.revenuePerUnit * Math.max(0, nextUnits - units);
  }

  // Annualize the reward, but more gently than before — signature wins shouldn't
  // vault a company cash-flow positive in a couple of bets.
  const baseRevenue = cfg.reward.revenue * Math.max(0, mult) * appr.rewardMult * 6;
  const revenue = Math.max(0, f.revenue + baseRevenue + fleetRevenue);

  return {
    ...state,
    company: {
      ...state.company,
      financials: { ...f, revenue },
      signatureStats: stats,
      signature: {
        ...state.company.signature,
        status: "resolved",
        lastOutcome: { kind, summary: kind === "success" ? cfg.flavorWin : kind === "partial" ? cfg.flavorPartial : cfg.flavorLoss, week: state.clock.week },
      },
    },
    founder: { ...state.founder, reputation: clamp01to100(state.founder.reputation + cfg.reward.reputation * mult * appr.rewardMult) },
    world: { ...state.world, hype },
  };
}

function companyExecution(state: GameState): number {
  // Proxy for execution quality, 0–1: a maturer company that's invested in team
  // and compute lands its big bets more reliably.
  const stageBoost = Math.min(0.35, stageRank(state.company.stage) / 22);
  // A technical founder (Engineer/Academic) gets a small head start in the lab.
  const founderLean = (state.founder.signatureLean ?? 0) / 100;
  return Math.min(0.9, 0.28 + stageBoost + opsExecutionBoost(state.company) + founderLean);
}

function processName(company: string, cfg: SignatureConfig, gen: number): string {
  if (cfg.metricLabel === "loss") return `${company.split(/\s+/)[0]}-${gen} training run`;
  if (cfg.metricLabel === "countdown") return `Flight ${gen}`;
  return `${cfg.noun.charAt(0).toUpperCase()}${cfg.noun.slice(1)} ${gen}`;
}

function countResolved(state: GameState): number {
  // Approximate generation index from elapsed time; stable enough for naming.
  return Math.floor(state.clock.week / 12);
}

function clamp01to100(x: number): number {
  return Math.min(100, Math.max(0, x));
}
