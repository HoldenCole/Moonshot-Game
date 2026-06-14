// Personal wealth — the motivational spine made legible. Net worth splits into
// your equity stake (illiquid, marked at the latest post-money) and personal
// liquid cash; milestones are the founder→magnate ladder.

import type { GameState } from "@/domain/state";
import type { Money } from "@/domain/captable";
import type { Tuning } from "@/domain/tuning";
import { founderOwnership, latestPostMoney } from "./captable";

export interface WealthBreakdown {
  /** Value of your company stake at the latest post-money, $M (illiquid). */
  equity: Money;
  /** Personal liquid wealth, $M. */
  cash: Money;
  total: Money;
}

export function wealthBreakdown(state: GameState): WealthBreakdown {
  const equity = founderOwnership(state.company.capTable) * latestPostMoney(state.company.capTable);
  const cash = state.founder.personalCash;
  return { equity, cash, total: equity + cash };
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
