// The sub-industry signature mechanic (Phase 9). One deep, distinct process per
// sub-industry, all sharing a commit→anticipate→resolve shape: you commit
// cash/resources, the process creeps forward over weeks (the thing you advance
// toward), then it resolves into a graded or binary outcome. Pure + deterministic.

import type { GameState, SignatureState } from "@/domain/state";
import type { Money } from "@/domain/captable";
import type { LogEntry } from "@/domain/log";
import type { SubIndustry } from "@/domain/ids";
import { type Rng, nextFloat, nextInt } from "./rng";

export interface SignatureConfig {
  noun: string;
  /** Verb phrase for the commit CTA, e.g. "Commit a training run". */
  commitVerb: string;
  metricLabel: string;
  durationWeeks: [number, number];
  /** Fraction of cash committed (with a floor), the bet size. */
  costFraction: number;
  costFloor: Money;
  /** Binary success/failure (launches) vs. graded (training, fabs). */
  binary: boolean;
  /** What a win does, scaled later by company quality. */
  reward: { hype: number; revenue: number; reputation: number };
  flavorRunning: string;
  flavorWin: string;
  flavorPartial: string;
  flavorLoss: string;
}

const CONFIG: Record<string, SignatureConfig> = {
  frontier_model_lab: {
    noun: "training run", commitVerb: "Commit a training run", metricLabel: "loss",
    durationWeeks: [8, 12], costFraction: 0.35, costFloor: 0.3, binary: false,
    reward: { hype: 8, revenue: 0.6, reputation: 6 },
    flavorRunning: "Compute is burning; the loss curve is tracking toward your capability target.",
    flavorWin: "The run beat target — a real capability jump. Benchmarks move and the calls get returned.",
    flavorPartial: "The run landed roughly on target. Incremental, useful, not headline-making.",
    flavorLoss: "The run missed. The compute is spent and the timeline's blown — a negative result the deck never mentions.",
  },
  vertical_ai_saas: {
    noun: "vertical-moat push", commitVerb: "Push the vertical moat", metricLabel: "NRR",
    durationWeeks: [12, 20], costFraction: 0.25, costFloor: 0.2, binary: false,
    reward: { hype: 4, revenue: 1.4, reputation: 4 },
    flavorRunning: "You're racing to deepen the workflow before a foundation model commoditizes the layer beneath you.",
    flavorWin: "The moat held and widened — retention climbs and the platform can't easily eat you now.",
    flavorPartial: "You held the line. Net retention is steady; the race continues.",
    flavorLoss: "A foundation model absorbed a slice of your value mid-push. Painful, but survivable.",
  },
  ai_chips: {
    noun: "fab tape-out", commitVerb: "Commit a tape-out", metricLabel: "yield",
    durationWeeks: [40, 72], costFraction: 0.6, costFloor: 2, binary: false,
    reward: { hype: 10, revenue: 3, reputation: 9 },
    flavorRunning: "A multi-year, bet-the-company tape-out is in the fab. Yield is the whole game.",
    flavorWin: "Yields came in strong — a generational architecture lead and a demand queue out the door.",
    flavorPartial: "Yields are workable. Not a leap, but the line keeps moving.",
    flavorLoss: "The tape-out came back low-yield. Years and capital, gone — the silicon nightmare.",
  },
  launch_services: {
    noun: "launch", commitVerb: "Attempt a launch", metricLabel: "countdown",
    durationWeeks: [6, 12], costFraction: 0.3, costFloor: 0.4, binary: true,
    reward: { hype: 9, revenue: 1.0, reputation: 8 },
    flavorRunning: "Vehicle's on the pad. Every launch is a binary success-or-failure moment, in public.",
    flavorWin: "Nominal flight, payload deployed. The manifest fills and the stock notices.",
    flavorPartial: "A scrubbed-and-recovered flight — late, but it flew.",
    flavorLoss: "A RUD on ascent. The vehicle and payload are gone, and the stock takes the hit.",
  },
  satellite_constellations: {
    noun: "deployment batch", commitVerb: "Deploy a batch", metricLabel: "sats live",
    durationWeeks: [16, 28], costFraction: 0.45, costFloor: 1, binary: false,
    reward: { hype: 5, revenue: 2.2, reputation: 5 },
    flavorRunning: "A batch is climbing toward its operational shells; the recurring-revenue ramp follows the buildout curve.",
    flavorWin: "The batch is live and healthy — subscriber capacity and recurring revenue both step up.",
    flavorPartial: "Most of the batch is operational. The ramp continues, a little behind plan.",
    flavorLoss: "Deployment anomalies cost you units. The capex hump just got steeper.",
  },
  space_stations: {
    noun: "tenant build-out", commitVerb: "Sign a tenant build-out", metricLabel: "occupancy",
    durationWeeks: [20, 36], costFraction: 0.4, costFloor: 1, binary: false,
    reward: { hype: 5, revenue: 2.0, reputation: 6 },
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

export const IDLE_SIGNATURE: SignatureState = {
  status: "idle",
  noun: "",
  name: "",
  metricLabel: "",
  startWeek: 0,
  endWeek: 0,
  committed: 0,
};

/** Cost to commit the next process at the current cash level. */
export function commitCost(state: GameState): Money {
  const cfg = signatureConfig(state.company.subIndustry);
  const cash = state.company.financials.cash;
  return Math.round(Math.max(cfg.costFloor, cash * cfg.costFraction) * 100) / 100;
}

/** Begin a signature process (commit phase). */
export function commitProcess(state: GameState, rng: Rng): GameState {
  const cfg = signatureConfig(state.company.subIndustry);
  const cost = commitCost(state);
  const duration = nextInt(rng, cfg.durationWeeks[0], cfg.durationWeeks[1]);
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

  // Success odds rise with execution + the size of the bet; binary processes are
  // sharper (success or failure, little middle).
  const exec = companyExecution(state);
  const betBoost = Math.min(0.18, (sig.committed / Math.max(1, state.company.financials.cash + sig.committed)) * 0.3);
  const pWin = Math.min(0.9, 0.32 + exec * 0.45 + betBoost);
  const roll = nextFloat(rng);

  let kind: "success" | "partial" | "failure";
  if (cfg.binary) kind = roll < pWin ? "success" : "failure";
  else if (roll < pWin) kind = "success";
  else if (roll < pWin + 0.3) kind = "partial";
  else kind = "failure";

  const next = applyResolution(state, cfg, kind);
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

function applyResolution(state: GameState, cfg: SignatureConfig, kind: "success" | "partial" | "failure"): GameState {
  const mult = kind === "success" ? 1 : kind === "partial" ? 0.4 : -0.6;
  const f = state.company.financials;
  const ind = state.company.industry;
  const hype = { ...state.world.hype };
  hype[ind] = clamp01to100((hype[ind] ?? 50) + cfg.reward.hype * mult);

  return {
    ...state,
    company: {
      ...state.company,
      financials: {
        ...f,
        revenue: Math.max(0, f.revenue + cfg.reward.revenue * Math.max(0, mult) * 12),
      },
      signature: {
        ...state.company.signature,
        status: "resolved",
        lastOutcome: { kind, summary: kind === "success" ? cfg.flavorWin : kind === "partial" ? cfg.flavorPartial : cfg.flavorLoss, week: state.clock.week },
      },
    },
    founder: { ...state.founder, reputation: clamp01to100(state.founder.reputation + cfg.reward.reputation * mult) },
    world: { ...state.world, hype },
  };
}

function companyExecution(state: GameState): number {
  // Proxy: stage maturity + how much runway you can sustain. 0–1.
  const stageBoost = Math.min(0.5, state.company.financials.headcount / 40);
  return 0.3 + stageBoost;
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
