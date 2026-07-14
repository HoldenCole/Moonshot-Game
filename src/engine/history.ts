// The run's financial memory: one snapshot per week for the Ledger's full-run
// charts, the annual report each year-end, and the visible objectives ladder.
// (Genre staples — the income statement, the year-end review, the goal list.)

import type { GameState } from "@/domain/state";
import { netWorth } from "./finance";

export interface RunSnapshot {
  week: number;
  cash: number;
  revenue: number;
  valuation: number;
  netWorth: number;
  headcount: number;
}

/** ~30 in-game years of weekly snapshots; beyond that the run is legend. */
export const HISTORY_CAP = 1560;

/** Take this week's snapshot (call once per tick, after financials settle). */
export function snapshotRun(state: GameState): RunSnapshot {
  const f = state.company.financials;
  return {
    week: state.clock.week,
    cash: Math.round(f.cash * 100) / 100,
    revenue: Math.round(f.revenue * 100) / 100,
    valuation: Math.round(f.valuation * 100) / 100,
    netWorth: Math.round(netWorth(state) * 100) / 100,
    headcount: f.headcount,
  };
}

/** The value a series had ~`weeksAgo`, from the history buffer (null if the
 *  run is younger than that). */
function lookback(history: RunSnapshot[], week: number, weeksAgo: number): RunSnapshot | null {
  const target = week - weeksAgo;
  if (target < 0) return null;
  // History is appended weekly; scan from the end for the closest ≤ target.
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i]!.week <= target) return history[i]!;
  }
  return null;
}

export interface AnnualReport {
  year: number; // 1-based
  week: number;
  revenue: number;
  revenueAgo: number | null;
  valuation: number;
  valuationAgo: number | null;
  netWorth: number;
  netWorthAgo: number | null;
  headcount: number;
  headcountAgo: number | null;
  cash: number;
  shipped: number;
  roundsClosed: number;
  highlights: string[];
}

/** Build the year-end report when an advance crosses a 52-week boundary
 *  (null otherwise). `prevWeek` is the clock before the advance. */
export function annualReport(state: GameState, prevWeek: number): AnnualReport | null {
  const week = state.clock.week;
  const prevYear = Math.floor(prevWeek / 52);
  const year = Math.floor(week / 52);
  if (year <= prevYear || week < 52) return null;

  const history = state.history ?? [];
  const now = history[history.length - 1] ?? snapshotRun(state);
  const ago = lookback(history, week, 52);
  const yearStart = week - 52;
  const yearLog = state.log.filter((e) => e.week > yearStart && e.week <= week);
  const highlights = yearLog
    .filter((e) => e.kind === "milestone" || e.celebrate)
    .slice(-3)
    .map((e) => e.headline);

  return {
    year,
    week,
    revenue: now.revenue,
    revenueAgo: ago ? ago.revenue : null,
    valuation: now.valuation,
    valuationAgo: ago ? ago.valuation : null,
    netWorth: now.netWorth,
    netWorthAgo: ago ? ago.netWorth : null,
    headcount: now.headcount,
    headcountAgo: ago ? ago.headcount : null,
    cash: now.cash,
    shipped: yearLog.filter((e) => e.headline.startsWith("Shipped ")).length,
    roundsClosed: yearLog.filter((e) => e.headline.startsWith("Closed the ")).length,
    highlights,
  };
}

// ── The Ladder: the visible early-game objectives ─────────────────────────────

export interface LadderStep {
  id: string;
  label: string;
  done: boolean;
}

/** The founder-to-magnate checklist. Steps derive from durable evidence (the
 *  log, the cap table, history maxima) so they stay checked once earned. */
export function ladder(state: GameState): LadderStep[] {
  const c = state.company;
  const rt = c.products;
  const history = state.history ?? [];
  const maxNetWorth = history.reduce((m, s) => Math.max(m, s.netWorth), netWorth(state));
  const maxValuation = history.reduce((m, s) => Math.max(m, s.valuation), c.financials.valuation);
  const committedEver = (rt && (rt.bets.length > 0 || rt.products.length > 0)) || state.log.some((e) => e.headline.startsWith("Committed "));
  const shippedEver = (rt?.products.length ?? 0) > 0 || state.log.some((e) => e.headline.startsWith("Shipped "));

  return [
    { id: "fund", label: "Fund R&D", done: (rt?.rd.rd_budget_per_week ?? 0) > 0 || committedEver },
    { id: "commit", label: "Commit a build", done: committedEver },
    { id: "ship", label: "Ship a product", done: shippedEver },
    { id: "round", label: "Close a round", done: c.capTable.rounds.some((r) => r.postMoney > 0) },
    { id: "ten", label: "$10M net worth", done: maxNetWorth >= 10 },
    { id: "hundred", label: "$100M company", done: maxValuation >= 100 },
    { id: "frontier", label: "Open the Frontier ($2B)", done: !!state.late },
  ];
}

/** The whole ladder is climbed — the card retires. */
export function ladderComplete(steps: LadderStep[]): boolean {
  return steps.every((s) => s.done);
}
