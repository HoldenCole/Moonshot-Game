// Shared, pure financial readouts used by both the tick engine and the UI.

import type { GameState, PlayerCompany } from "@/domain/state";
import type { Money } from "@/domain/captable";
import type { RunwayBand } from "@/domain/log";
import type { Tuning } from "@/domain/tuning";
import { founderOwnership, latestPostMoney } from "./captable";

/** Net monthly cash burn ($M); negative means cash-generative. */
export function netBurnMonthly(c: PlayerCompany): Money {
  return c.financials.burnMonthly - c.financials.revenue / 12;
}

/** Months of runway; Infinity when the company is cash-flow positive. */
export function runwayMonths(c: PlayerCompany): number {
  const nb = netBurnMonthly(c);
  return nb > 0 ? c.financials.cash / nb : Infinity;
}

/** Founder net worth ($M): equity stake at the latest post-money + personal cash. */
export function netWorth(state: GameState): Money {
  const stake = founderOwnership(state.company.capTable) * latestPostMoney(state.company.capTable);
  return stake + state.founder.personalCash;
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
