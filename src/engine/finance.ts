// Shared, pure financial readouts used by both the tick engine and the UI.

import type { GameState, PlayerCompany, WorldState } from "@/domain/state";
import type { Money } from "@/domain/captable";
import type { RunwayBand } from "@/domain/log";
import type { Tuning } from "@/domain/tuning";
import { founderOwnership, latestPostMoney } from "./captable";
import { monthlyDebtService } from "./debt";

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

/** The live equity mark used for net worth and exit gating: the marked valuation,
 *  never below the last round. (Robust when `financials.valuation` is stale.) */
export function valuationMark(c: PlayerCompany): Money {
  return Math.max(latestPostMoney(c.capTable), c.financials.valuation);
}

/** Founder net worth ($M): equity stake at the live mark + personal cash. */
export function netWorth(state: GameState): Money {
  return founderOwnership(state.company.capTable) * valuationMark(state.company) + state.founder.personalCash;
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
