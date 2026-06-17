// The public-company earnings-management mechanic (decision L). A public company
// runs on a 13-week clock: mid-quarter it sets guidance (the bar), at quarter
// close it reports against that bar, and the founder chooses how hard to engineer
// the print. Engineering flatters the quarter but widens a hidden gap between the
// reported and the real business — and when that gap gets too wide, the reckoning
// (a forced guidance cut) arrives. Pure + deterministic; ties into the ethics score.

import type { GameState, GuidanceStance } from "@/domain/state";
import { founderOwnership } from "./captable";

const QUARTER = 13;
const CLOSE_WINDOW = 2; // weeks 0..2 of a new quarter count as "just closed"
const GUIDE_FROM = 6;
const GUIDE_TO = 8;

export function weeksPublic(state: GameState): number {
  if (state.company.stage !== "public" || state.company.publicSince == null) return 0;
  return Math.max(0, state.clock.week - state.company.publicSince);
}

export function quarterIndex(state: GameState): number {
  return Math.floor(weeksPublic(state) / QUARTER) + 1;
}

/** True for a short window after a quarter closes (so the earnings event reliably
 *  catches its tick), but not before the first full quarter. */
export function quarterCloseTick(state: GameState): boolean {
  const wp = weeksPublic(state);
  return state.company.stage === "public" && wp >= QUARTER && wp % QUARTER <= CLOSE_WINDOW;
}

/** The mid-quarter guidance-setting window. */
export function guidanceWindowOpen(state: GameState): boolean {
  const wp = weeksPublic(state);
  const r = wp % QUARTER;
  return state.company.stage === "public" && wp >= GUIDE_FROM && r >= GUIDE_FROM && r <= GUIDE_TO;
}

/** This quarter's result vs. guidance — deterministic per quarter, shaped by the
 *  stance you set and the gap you've been running. */
export function earningsResult(state: GameState): "beat" | "met" | "missed" {
  const e = state.company.earnings;
  if (!e) return "met";
  let p = e.guidance === "sandbagged" ? 0.72 : e.guidance === "stretched" ? 0.32 : 0.54;
  p += e.gap * 0.3; // engineered books flatter the print — until the reckoning
  const roll = hashFloat(`${state.meta.seed}:${quarterIndex(state)}`);
  if (roll < p - 0.22) return "beat";
  if (roll < p + 0.18) return "met";
  return "missed";
}

export function resultVerbose(r: string): string {
  return r === "beat" ? "comfortably beat the number" : r === "met" ? "came in line with guidance" : "fell short of guidance";
}

export function marketReaction(r: string): string {
  return r === "beat" ? "The stock popped on the print." : r === "met" ? "Shares barely moved." : "The stock sold off after hours.";
}

/** The stock's move (fraction) in reaction to a print. */
export function earningsMove(r: "beat" | "met" | "missed"): number {
  return r === "beat" ? 0.08 : r === "missed" ? -0.1 : 0.01;
}

/** The exact week a quarter closes — fires once per quarter (vs. the 3-week
 *  window `quarterCloseTick` uses to reliably catch the earnings event). */
export function justClosedQuarter(state: GameState): boolean {
  const wp = weeksPublic(state);
  return state.company.stage === "public" && wp >= QUARTER && wp % QUARTER === 0;
}

/** Settle the quarter at close: lock in the print, react the stock to it, and
 *  record both for the earnings report. */
export function settleQuarter(state: GameState): GameState {
  const e = state.company.earnings;
  if (!e) return state;
  const result = earningsResult(state);
  const move = earningsMove(result);
  const valuation = Math.max(1, Math.round(state.company.financials.valuation * (1 + move)));
  return {
    ...state,
    company: {
      ...state.company,
      financials: { ...state.company.financials, valuation },
      earnings: { ...e, lastResult: result, lastMove: move },
    },
  };
}

export function cashSurplus(state: GameState): "none" | "modest" | "large" {
  const c = state.company.financials.cash;
  return c > 120 ? "large" : c > 35 ? "modest" : "none";
}

// ── Applying a public-event choice ────────────────────────────────────────────

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const clamp01 = (x: number) => clamp(x, 0, 1);

/** The hidden earnings/guidance/lockup effect of a public-event choice, on top of
 *  the generic text-based outcome. Unknown refs (incl. the dormant DLC ones) no-op. */
export function applyPublicChoice(state: GameState, ref: string): GameState {
  const e = state.company.earnings ?? { gap: 0, guidance: "inline" as GuidanceStance };
  const withGap = (gap: number) => withEarnings(state, { ...e, gap: clamp01(gap) });
  const withGuidance = (guidance: GuidanceStance) => withEarnings(state, { ...e, guidance });
  const withEthics = (s: GameState, d: number) => ({
    ...s,
    founder: { ...s.founder, ethics: clamp(s.founder.ethics + d, 0, 100) },
  });

  switch (ref) {
    case "earnings_invest_longterm":
      return withEthics(withGap(e.gap - 0.15), 4);
    case "earnings_smooth":
      return withGap(e.gap + 0.06);
    case "earnings_engineer_aggressive":
      return withEthics(withGap(e.gap + 0.22), -6);
    case "guidance_sandbag":
      return withGuidance("sandbagged");
    case "guidance_inline":
      return withGuidance("inline");
    case "guidance_stretch":
      return withGuidance("stretched");
    case "guide_down_clean_reset":
      return withEthics(withGap(Math.min(e.gap, 0.1)), 5);
    case "guide_down_partial":
      return withGap(e.gap * 0.6);
    case "guide_down_double_down":
      return withGap(e.gap + 0.15);
    case "lockup_sell_modest":
      return sellStake(state, 0.25);
    case "lockup_sell_heavy":
      return sellStake(state, 0.6);
    default:
      return state; // lockup_hold + the dormant DLC refs
  }
}

function withEarnings(state: GameState, earnings: { gap: number; guidance: GuidanceStance }): GameState {
  return { ...state, company: { ...state.company, earnings } };
}

/** Sell a fraction of the founder's public stake: bank the proceeds as personal
 *  wealth, shrink the founder lot, and pressure the stock on a heavy sale. */
function sellStake(state: GameState, fraction: number): GameState {
  const cap = state.company.capTable;
  const founderLot = cap.lots.find((l) => l.holderType === "founder");
  if (!founderLot) return state;
  const proceeds = founderOwnership(cap) * fraction * state.company.financials.valuation;
  const lots = cap.lots.map((l) => (l === founderLot ? { ...l, shares: Math.round(l.shares * (1 - fraction)) } : l));
  const drop = fraction >= 0.5 ? 0.92 : 1;
  return {
    ...state,
    company: {
      ...state.company,
      capTable: { ...cap, lots },
      financials: { ...state.company.financials, valuation: Math.round(state.company.financials.valuation * drop) },
    },
    founder: { ...state.founder, personalCash: state.founder.personalCash + proceeds },
  };
}

function hashFloat(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}
