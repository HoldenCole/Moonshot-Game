// The Advance heartbeat. A week resolves in the canonical order
// (world → company → checks → recap), deterministically from the save's RNG
// state. Three advance flavors sit on top: Week, Month, and the
// Crusader-Kings-style "Advance to Next Decision" that skips quiet weeks.

import type { GameState } from "@/domain/state";
import type { Alert, LogEntry, RunwayBand, StopReason } from "@/domain/log";
import type { Tuning } from "@/domain/tuning";
import type { EventContent, EventTone } from "@/domain/content";
import type { Company } from "@/content/load";
import { makeRng } from "./rng";
import { snapshotWorld, stepWorld } from "./world";
import { repricePublic } from "./exit";
import { serviceDebt } from "./debt";
import { bandWorsened, netBurnMonthly, netWorth, privateValuationMark, runwayBand, runwayMonths } from "./finance";
import { difficultyProfile } from "./difficulty";
import { evaluateEvents } from "./events";
import { advanceProducts, productsOperatingRevenue, type SubContent } from "./productsRuntime";
import { tamGrowthRoll } from "./products";
import { justClosedQuarter, marketReaction, quarterIndex, resultVerbose, settleQuarter } from "./earnings";
import { markPortfolios } from "./investing";
import { applyOutcome as applyEventOutcome, resolveOutcome, scaleByExec } from "./eventOutcomes";
import { autoResolveChoice, delegationReport, eventArea, isDelegated, shouldEscalate } from "./delegation";

/** What the events engine + depth system need to run inside a tick. */
export interface EventEnv {
  events: EventContent[];
  market: Company[];
  /** The player sub-industry's Products/R&D/Capacity content (null if none). */
  subContent?: SubContent | null;
}

const EVENT_TONE: Record<EventTone, LogEntry["tone"]> = {
  opportunity: "opportunity",
  threat: "warn",
  crisis: "crisis",
  neutral: "neutral",
};

export const WEEKS_PER_MONTH = 13 / 3; // ≈ 4.333

/** How many world samples to retain for the World view's sparklines. */
export const WORLD_HISTORY_CAP = 160;

export interface AdvanceMode {
  type: "weeks" | "nextDecision";
  /** Number of weeks for `type: "weeks"`. */
  weeks?: number;
}

export interface AdvanceResult {
  state: GameState;
  weeks: number;
  stopReason: StopReason;
  /** Log entries produced during this advance (already appended to state.log). */
  produced: LogEntry[];
  /** Alerts newly raised during this advance. */
  newAlerts: Alert[];
}

interface WeekResult {
  state: GameState;
  entries: LogEntry[];
  alerts: Alert[];
  /** A decision-worthy alert fired this week (stops "next decision"). */
  decision: boolean;
  outOfCash: boolean;
  /** An event surfaced this week (a hard stop — blocks advance until resolved). */
  eventFired: boolean;
}

/** Resolve exactly one week. Pure: same input state + tuning → same output. */
export function tickWeek(state: GameState, tuning: Tuning, env?: EventEnv): WeekResult {
  const week = state.clock.week + 1;
  const rng = makeRng(state.meta.rngState);
  const entries: LogEntry[] = [];
  const alerts: Alert[] = [];
  let decision = false;

  // 1 — World advances: the six master-variable engines.
  const drift = stepWorld(state.world, rng, tuning.world, state.company.industry);
  drift.news.forEach((n, i) =>
    entries.push({ id: `w${week}-world-${i}`, week, kind: "world", tone: n.tone, headline: n.headline, detail: n.detail }),
  );

  // 2 — Products / R&D / Capacity: advance the depth system, ship completed bets,
  //     and derive operating revenue from the live product portfolio.
  let company = state.company;
  let shipped = false;
  if (company.products && env?.subContent) {
    const sub = env.subContent;
    const rivals = env.market.filter((c) => c.sub_industry === company.subIndustry);
    const tamMult = tamGrowthRoll(state.meta.seed, company.subIndustry);
    const pa = advanceProducts(company.products, sub, rivals, week, difficultyProfile(state.difficulty).competition, drift.world.macroStrength, tamMult);
    // The weekly R&D budget is spent (the core cash competition each turn).
    const rdSpend = pa.runtime.rd.rd_budget_per_week;
    company = {
      ...company,
      products: pa.runtime,
      financials: {
        ...company.financials,
        revenue: productsOperatingRevenue(pa.runtime, sub.productById, sub.tuning),
        cash: company.financials.cash - rdSpend,
      },
      // The signature noun now labels "a bet in flight" (event-condition compat).
      signature: { ...company.signature, status: pa.runtime.bets.length > 0 ? "running" : "idle" },
    };
    for (const s of pa.shipped) {
      entries.push({ id: `w${week}-ship-${s.archetypeId}-${s.name}`, week, kind: "company", tone: "opportunity", headline: `Shipped ${s.name}`, detail: "A new product is live and ramping into the market." });
      shipped = true;
      decision = true;
    }
  }

  // 3 — Company financials: accrue one week of net burn (the fresh product
  //     revenue offsets it), and re-mark the valuation with the world.
  const f = company.financials;
  const months = 1 / WEEKS_PER_MONTH;
  const netBurn = (f.burnMonthly - f.revenue / 12) * months;
  const valuation =
    company.stage === "public"
      ? repricePublic(company, drift.world)
      : privateValuationMark(company, drift.world);
  company = { ...company, financials: { ...f, cash: f.cash - netBurn, valuation } };

  const worldHistory = [...state.worldHistory, snapshotWorld(drift.world, week)].slice(-WORLD_HISTORY_CAP);

  let next: GameState = {
    ...state,
    clock: { week },
    world: drift.world,
    worldHistory,
    company,
    meta: { ...state.meta, rngState: rng.state },
  };

  // 2c — Debt service: weekly interest, and principal due at maturity (an
  //      overdue loan is a decision-worthy stop).
  const ds = serviceDebt(next);
  next = ds.state;
  entries.push(...ds.entries);
  if (ds.entries.some((e) => e.tone === "crisis")) decision = true;

  // 3 — Threshold checks: fire an alert only when the runway band worsens.
  const newBand = runwayBand(next.company, tuning);
  if (bandWorsened(state.lastRunwayBand, newBand)) {
    const alert = runwayAlert(newBand, week);
    if (alert) {
      alerts.push(alert);
      entries.push({ id: `w${week}-alert-${alert.kind}`, week, kind: "alert", tone: alert.tone, headline: alert.headline, detail: alert.body });
      decision = true;
    }
  }
  next = { ...next, lastRunwayBand: newBand };

  // 4 — Milestones (net worth is the spine; mostly moves on raises).
  const milestone = checkMilestones(next, tuning, week);
  next = milestone.state;
  entries.push(...milestone.entries);

  // 5 — Events evaluate (the connective tissue). At most one surfaces; it's a
  //     hard stop that blocks advance until the player resolves it.
  let eventFired = false;
  if (env && !next.pendingEvent) {
    const et = evaluateEvents(next, env.events, env.market, rng);
    next = { ...next, eventState: et.eventState };
    if (et.event) {
      const area = eventArea(et.event);
      if (isDelegated(next, area) && !shouldEscalate(et.event)) {
        // A delegated exec handles it automatically — a report, not a pause — and
        // their quality shapes how well it lands (a crisis escalates instead).
        const exec = next.company.executives[area!]!;
        const idx = autoResolveChoice(exec, et.event);
        const choice = et.event.choices[idx]!;
        next = applyEventOutcome(next, scaleByExec(resolveOutcome(choice, next), exec.quality));
        entries.push({ id: `w${week}-deleg-${et.event.id}`, week, kind: "company", tone: "neutral", headline: et.event.headline, detail: delegationReport(exec, et.event, idx) });
      } else {
        next = { ...next, pendingEvent: et.event };
        entries.push({ id: `w${week}-event-${et.event.id}`, week, kind: "company", tone: EVENT_TONE[et.event.tone], headline: et.event.headline });
        eventFired = true;
        decision = true;
      }
    }
  }

  // 6 — Earnings: at a public company's quarter close, lock in the print, react
  //     the stock, and log it (the report surfaces it). A stop-worthy beat/miss.
  if (justClosedQuarter(next)) {
    next = settleQuarter(next);
    const e = next.company.earnings!;
    const r = e.lastResult!;
    entries.push({
      id: `w${week}-earnings-${quarterIndex(next)}`,
      week,
      kind: "company",
      tone: r === "beat" ? "opportunity" : r === "missed" ? "crisis" : "neutral",
      headline: `Q${quarterIndex(next) - 1} earnings — ${resultVerbose(r)}`,
      detail: `${marketReaction(r)} ${e.lastMove! >= 0 ? "+" : ""}${Math.round(e.lastMove! * 100)}% on the print.`,
    });
    if (r !== "met") decision = true;
  }

  // 7 — Revenue + valuation history (capped to a trailing year) for growth and
  //     the trend charts.
  const fin = next.company.financials;
  const revLog = [...(fin.revenueLog ?? []), fin.revenue].slice(-52);
  const valLog = [...(fin.valuationLog ?? []), fin.valuation].slice(-52);
  next = { ...next, company: { ...next.company, financials: { ...fin, revenueLog: revLog, valuationLog: valLog } } };

  // 8 — Mark both the personal and company portfolios to the live market.
  if (env) next = markPortfolios(next, env.market, next.world, week);

  next = { ...next, log: [...next.log, ...entries], alerts: mergeAlerts(next.alerts, alerts) };
  return { state: next, entries, alerts, decision, outOfCash: newBand === "empty", eventFired: eventFired || shipped };
}

/** Advance multiple weeks or until the next decision. */
export function advance(state: GameState, tuning: Tuning, mode: AdvanceMode, env?: EventEnv): AdvanceResult {
  const produced: LogEntry[] = [];
  const newAlerts: Alert[] = [];
  let cur = state;
  let weeks = 0;
  let stopReason: StopReason = "weeks_elapsed";

  const cap = mode.type === "nextDecision" ? tuning.advance.nextDecisionCapWeeks : mode.weeks ?? 1;

  for (let i = 0; i < cap; i++) {
    const r = tickWeek(cur, tuning, env);
    cur = r.state;
    weeks++;
    produced.push(...r.entries);
    newAlerts.push(...r.alerts);

    if (r.outOfCash) {
      stopReason = "out_of_cash";
      break;
    }
    // A surfaced event is a hard stop for any advance mode.
    if (r.eventFired) {
      stopReason = "decision";
      break;
    }
    if (mode.type === "nextDecision") {
      if (r.decision) {
        stopReason = "decision";
        break;
      }
      if (i === cap - 1) stopReason = "cap_reached";
    }
  }

  return { state: cur, weeks, stopReason, produced, newAlerts };
}

/** Estimate weeks until runway crosses into the critical band (for the
 *  smart-advance hint). Infinity when cash-positive or already critical. */
export function weeksToCritical(state: GameState, tuning: Tuning): number {
  const netBurnMo = netBurnMonthly(state.company);
  if (netBurnMo <= 0) return Infinity;
  const monthsNow = runwayMonths(state.company);
  const target = tuning.runway.criticalMonths;
  if (monthsNow <= target) return 0;
  // cash falls linearly; months of runway above the critical reserve:
  const surplusMonths = monthsNow - target;
  return Math.max(0, Math.ceil(surplusMonths * WEEKS_PER_MONTH));
}

// ── helpers ──────────────────────────────────────────────────────────────────

function runwayAlert(band: RunwayBand, week: number): Alert | null {
  if (band === "empty") {
    return {
      id: `alert-out_of_cash-${week}`,
      kind: "out_of_cash",
      week,
      tone: "crisis",
      headline: "You're out of cash",
      body: "The account is empty. Close a round now or cut burn — the company can't operate on fumes.",
      action: { label: "Raise now", target: "fundraising" },
    };
  }
  if (band === "critical") {
    return {
      id: `alert-runway_critical-${week}`,
      kind: "runway_critical",
      week,
      tone: "crisis",
      headline: "Runway is critical",
      body: "Less than a quarter of cash left. This is the moment to raise — or to make hard cuts.",
      action: { label: "Go to fundraising", target: "fundraising" },
    };
  }
  if (band === "low") {
    return {
      id: `alert-raise_ready-${week}`,
      kind: "raise_ready",
      week,
      tone: "warn",
      headline: "Time to think about raising",
      body: "Runway is getting short. The best rounds are raised from strength, not desperation.",
      action: { label: "Go to fundraising", target: "fundraising" },
    };
  }
  return null;
}

/** Detect newly-crossed net-worth milestones. */
export function checkMilestones(
  state: GameState,
  tuning: Tuning,
  week: number,
): { state: GameState; entries: LogEntry[] } {
  const nw = netWorth(state);
  const entries: LogEntry[] = [];
  const achieved = new Set(state.achievedMilestones);
  for (const m of tuning.milestones.netWorth) {
    if (nw >= m && !achieved.has(m)) {
      achieved.add(m);
      entries.push({
        id: `milestone-${m}`,
        week,
        kind: "milestone",
        tone: "opportunity",
        headline: `Net worth crossed ${milestoneLabel(m)}`,
        detail: "A rung on the founder-to-magnate ladder.",
      });
    }
  }
  if (entries.length === 0) return { state, entries };
  return { state: { ...state, achievedMilestones: [...achieved] }, entries };
}

function mergeAlerts(existing: Alert[], incoming: Alert[]): Alert[] {
  const byKind = new Map(existing.map((a) => [a.kind, a]));
  for (const a of incoming) byKind.set(a.kind, a); // newest of a kind wins
  return [...byKind.values()];
}

function milestoneLabel(m: number): string {
  if (m >= 1_000_000) return `$${m / 1_000_000}T`;
  if (m >= 1000) return `$${m / 1000}B`;
  return `$${m}M`;
}
