// Founder/team equity vesting: a standard 4-year schedule with a 1-year cliff,
// measured from founding. Pure + derived (no stored state) — the cap table holds
// the grants; this projects how much of each is earned at the current week, and
// flags the flight risk of an unvested co-founder.

import type { CapTable, HolderType } from "@/domain/captable";

export const CLIFF_WEEKS = 52; // nothing vests in the first year
export const VEST_WEEKS = 208; // fully vested after four years

/** Fraction of a grant vested after `weeksElapsed` (cliff, then linear to 4y). */
export function vestedFraction(weeksElapsed: number): number {
  if (weeksElapsed < CLIFF_WEEKS) return 0;
  return Math.min(1, weeksElapsed / VEST_WEEKS);
}

/** Holder types whose grants vest (investors own their shares outright). */
const VESTS: ReadonlySet<HolderType> = new Set<HolderType>(["founder", "cofounder", "employee", "self"]);

export interface VestingRow {
  holderId: string;
  holderName: string;
  holderType: HolderType;
  shares: number;
  vested: number;
  unvested: number;
  fraction: number;
  /** Real flight risk: an unvested co-founder walking away forfeits unvested shares. */
  flightRisk: boolean;
}

export function vestingRows(capTable: CapTable, foundedWeek: number, week: number): VestingRow[] {
  const elapsed = Math.max(0, week - foundedWeek);
  const fraction = vestedFraction(elapsed);
  return capTable.lots
    .filter((l) => VESTS.has(l.holderType))
    .map((l) => {
      const vested = Math.round(l.shares * fraction);
      return {
        holderId: l.holderId,
        holderName: l.holderName,
        holderType: l.holderType,
        shares: l.shares,
        vested,
        unvested: l.shares - vested,
        fraction,
        flightRisk: l.holderType === "cofounder" && fraction < 1,
      };
    });
}

/** Weeks until a grant founded at `foundedWeek` is fully vested. */
export function weeksToFullyVested(foundedWeek: number, week: number): number {
  return Math.max(0, foundedWeek + VEST_WEEKS - week);
}
