// Personal wealth — the motivational spine made legible. Net worth splits into
// your equity stake (illiquid, marked at the live valuation) and personal
// liquid cash; milestones are the founder→magnate ladder.

import type { GameState } from "@/domain/state";
import type { Money } from "@/domain/captable";
import type { Tuning } from "@/domain/tuning";
import { founderOwnership } from "./captable";
import { valuationMark } from "./finance";

export interface WealthBreakdown {
  /** Value of your company stake at the live valuation, $M (illiquid). */
  equity: Money;
  /** Personal liquid wealth, $M. */
  cash: Money;
  /** Marked value of personal stakes in other public companies, $M. */
  portfolio: Money;
  total: Money;
}

export function wealthBreakdown(state: GameState): WealthBreakdown {
  const equity = founderOwnership(state.company.capTable) * valuationMark(state.company);
  const cash = state.founder.personalCash;
  const portfolio = (state.founder.portfolio ?? []).reduce((s, h) => s + h.value, 0);
  return { equity, cash, portfolio, total: equity + cash + portfolio };
}

export interface MilestoneProgress {
  prev: Money;
  target: Money;
  /** 0–1 between the previously crossed milestone and the next. */
  progress: number;
}

/** Progress toward the next net-worth milestone (null once all are crossed). */
export function nextMilestone(total: Money, tuning: Tuning): MilestoneProgress | null {
  const ladder = tuning.milestones.netWorth;
  const target = ladder.find((m) => m > total);
  if (target == null) return null;
  const prev = [...ladder].reverse().find((m) => m <= total) ?? 0;
  const span = target - prev || 1;
  return { prev, target, progress: Math.min(1, Math.max(0, (total - prev) / span)) };
}
