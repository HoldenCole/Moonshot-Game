// Shared, pure financial readouts used by both the tick engine and the UI.

import type { GameState, PlayerCompany, WorldState } from "@/domain/state";
import type { Money } from "@/domain/captable";
import type { RunwayBand } from "@/domain/log";
import type { Tuning } from "@/domain/tuning";
import { founderOwnership, latestPostMoney, totalShares } from "./captable";
import { monthlyDebtService } from "./debt";

/** Shares are absolute integers; valuation/income are $M — bridge to per-share $. */
const PER_M = 1_000_000;

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Net monthly cash burn ($M); negative means cash-generative. Includes debt
 *  service, so carrying a loan shortens the runway. */
export function netBurnMonthly(c: PlayerCompany): Money {
  return c.financials.burnMonthly - c.financials.revenue / 12 + monthlyDebtService(c);
}

/** Months of runway; Infinity when the company is cash-flow positive. */
export function runwayMonths(c: PlayerCompany): number {
  const nb = netBurnMonthly(c);
  return nb > 0 ? c.financials.cash / nb : Infinity;
}

/** Revenue multiple a private company marks at, widening with sector hype. */
export function revenueMultiple(hype: number): number {
  return clamp(4 + (hype / 100) * 9, 4, 14);
}

/** A live valuation for a *private* company: a revenue/hype multiple, floored at
 *  the last priced round (so a fresh raise still anchors the mark, and growing
 *  revenue lifts it between rounds). The tick stamps this onto financials. */
export function privateValuationMark(c: PlayerCompany, world: WorldState): Money {
  const hype = world.hype[c.industry] ?? 55;
  const revMark = c.financials.revenue * revenueMultiple(hype);
  return Math.round(Math.max(latestPostMoney(c.capTable), revMark));
}

/** The live equity mark used for net worth and exit gating. For a public company
 *  the repriced market cap is authoritative (it can fall below the IPO price). For
 *  a private company it's the live mark, floored at the last round (and robust
 *  when `financials.valuation` hasn't been stamped by a tick yet). */
export function valuationMark(c: PlayerCompany): Money {
  if (c.stage === "public") return c.financials.valuation;
  return Math.max(latestPostMoney(c.capTable), c.financials.valuation);
}

/** Founder net worth ($M): equity stake at the live mark + personal cash. */
export function netWorth(state: GameState): Money {
  return founderOwnership(state.company.capTable) * valuationMark(state.company) + state.founder.personalCash;
}

/** Annual net income ($M): revenue minus operating costs and debt service.
 *  (Net burn is costs−revenue, so income is its negative, annualized.) */
export function netIncomeAnnual(c: PlayerCompany): Money {
  return Math.round(-netBurnMonthly(c) * 12 * 100) / 100;
}

/** Price per share, in dollars, at the live mark. */
export function stockPrice(c: PlayerCompany): number {
  const sh = totalShares(c.capTable);
  return sh > 0 ? (valuationMark(c) * PER_M) / sh : 0;
}

/** Trailing earnings per share, in dollars (negative while loss-making). */
export function eps(c: PlayerCompany): number {
  const sh = totalShares(c.capTable);
  return sh > 0 ? (netIncomeAnnual(c) * PER_M) / sh : 0;
}

/** Price/earnings multiple, or null until the company is profitable. */
export function peRatio(c: PlayerCompany): number | null {
  const ni = netIncomeAnnual(c);
  return ni > 0 ? valuationMark(c) / ni : null;
}

/** Revenue growth over the trailing ~quarter (13 weeks); null without history. */
export function revenueGrowth(c: PlayerCompany): number | null {
  const log = c.financials.revenueLog;
  if (!log || log.length < 14) return null;
  const base = log[log.length - 14]!;
  if (base <= 0) return c.financials.revenue > 0 ? 1 : null;
  return (c.financials.revenue - base) / base;
}

export function runwayBand(c: PlayerCompany, tuning: Tuning): RunwayBand {
  if (c.financials.cash <= 0) return "empty";
  const months = runwayMonths(c);
  if (months <= tuning.runway.criticalMonths) return "critical";
  if (months <= tuning.runway.lowMonths) return "low";
  return "ok";
}

const BAND_RANK: Record<RunwayBand, number> = { ok: 0, low: 1, critical: 2, empty: 3 };

/** True when `next` is a worse runway band than `prev` (alerts fire on worsening). */
export function bandWorsened(prev: RunwayBand, next: RunwayBand): boolean {
  return BAND_RANK[next] > BAND_RANK[prev];
}
