// Operations — turning capital into capability, framed as *right-sizing* rather
// than accumulation (decision: spending should be a judgment call with a clear
// optimum, not a clicker). Two levers:
//   • Team — every company has a headcount its scale calls for (driven by stage
//     and revenue). Staffing up to that target lifts execution; over-hiring just
//     burns cash for no gain, so there's a reason to stop.
//   • Compute / facilities — a finite build-out ladder (pod → cluster → data
//     center), each tier a one-time commitment gated on the previous, so it's a
//     progression you complete, not an identical button you spam.
// Both deduct cash, raise monthly burn, and feed execution (capped) so the
// signature bets land more reliably. Pure + deterministic.

import type { GameState, PlayerCompany } from "@/domain/state";
import type { Industry, Stage } from "@/domain/ids";
import type { Money } from "@/domain/captable";
import type { LogEntry } from "@/domain/log";
import { formatMoney } from "./format";

const SALARY_PER_HEAD: Money = 0.0175; // $M/mo fully loaded (~$210K/yr)
const HIRE_RAMP_COST: Money = 0.03; // $M one-time per head (recruiting + ramp)
const MIN_HEADCOUNT = 2;
const MIN_BURN: Money = 0.02;
const REV_PER_HEAD: Money = 0.4; // ~$400K of revenue supports one head at scale

const round = (x: number, p = 1000) => Math.round(x * p) / p;

// ── Right-sizing the team ───────────────────────────────────────────────────

/** The smallest sensible team at each stage, so a target exists pre-revenue. */
const STAGE_FLOOR: Record<Stage, number> = {
  idea: 3,
  pre_seed: 5,
  seed: 10,
  series_a: 28,
  series_b: 65,
  series_c: 130,
  growth: 220,
  late_stage: 320,
  public: 400,
};

/** The headcount this company's scale calls for — the larger of its stage floor
 *  and what its revenue can support. The target you hire toward. */
export function targetHeadcount(c: PlayerCompany): number {
  const floor = STAGE_FLOOR[c.stage] ?? 6;
  return Math.max(floor, Math.round(c.financials.revenue / REV_PER_HEAD));
}

export type StaffingState = "understaffed" | "right" | "overstaffed";

/** How the team sits against the target it should be at. */
export function staffingState(c: PlayerCompany): StaffingState {
  const ratio = c.financials.headcount / Math.max(1, targetHeadcount(c));
  if (ratio < 0.85) return "understaffed";
  if (ratio > 1.3) return "overstaffed";
  return "right";
}

export function hireCost(count: number): Money {
  return round(count * HIRE_RAMP_COST, 100);
}

/** Monthly payroll added by `count` heads. */
export function headcountBurn(count: number): Money {
  return round(count * SALARY_PER_HEAD);
}

/** How many heads short of the target (0 once you're there or above). */
export function hireGap(c: PlayerCompany): number {
  return Math.max(0, targetHeadcount(c) - c.financials.headcount);
}

/** The hire that moves you toward right-sized — the full gap, capped by cash. */
export function hireToTargetCount(c: PlayerCompany): number {
  const affordable = Math.floor(c.financials.cash / HIRE_RAMP_COST);
  return Math.max(0, Math.min(hireGap(c), affordable));
}

/** How many to let go to come back to the target (0 unless overstaffed). */
export function trimToTargetCount(c: PlayerCompany): number {
  return Math.max(0, Math.min(c.financials.headcount - targetHeadcount(c), c.financials.headcount - MIN_HEADCOUNT));
}

export function hireStaff(state: GameState, count: number): GameState {
  const cost = hireCost(count);
  const f = state.company.financials;
  if (count <= 0 || f.cash < cost) return state;
  const entry: LogEntry = {
    id: `hire-${state.clock.week}-${f.headcount}`,
    week: state.clock.week,
    kind: "company",
    tone: "neutral",
    headline: `Hired ${count} — headcount ${f.headcount + count}`,
    detail: `Recruiting cost ${formatMoney(cost)}; payroll up ${formatMoney(headcountBurn(count))}/mo. Staffing to your scale lands your big bets more reliably.`,
  };
  return {
    ...state,
    company: {
      ...state.company,
      financials: {
        ...f,
        cash: f.cash - cost,
        headcount: f.headcount + count,
        burnMonthly: round(f.burnMonthly + headcountBurn(count)),
      },
    },
    log: [...state.log, entry],
  };
}

export function trimTeam(state: GameState, count: number): GameState {
  const f = state.company.financials;
  const actual = Math.min(count, Math.max(0, f.headcount - MIN_HEADCOUNT));
  if (actual <= 0) return state;
  const entry: LogEntry = {
    id: `trim-${state.clock.week}-${f.headcount}`,
    week: state.clock.week,
    kind: "company",
    tone: "warn",
    headline: `Cut ${actual} — headcount ${f.headcount - actual}`,
    detail: `Payroll down ${formatMoney(headcountBurn(actual))}/mo. Layoffs buy runway, but your reputation takes a small hit.`,
  };
  return {
    ...state,
    founder: { ...state.founder, reputation: Math.max(0, state.founder.reputation - 1) },
    company: {
      ...state.company,
      financials: {
        ...f,
        headcount: f.headcount - actual,
        burnMonthly: Math.max(MIN_BURN, round(f.burnMonthly - headcountBurn(actual))),
      },
    },
    log: [...state.log, entry],
  };
}

// ── Compute / facilities build-out ladder ─────────────────────────────────────

export interface CapacityTier {
  id: string;
  label: string;
  capex: Money;
  burn: Money;
  blurb: string;
}

const TIERS_AI: CapacityTier[] = [
  { id: "pod", label: "GPU pod", capex: 0.4, burn: 0.04, blurb: "A rack of accelerators — a modest, steady lift to every run." },
  { id: "cluster", label: "Compute cluster", capex: 2.2, burn: 0.16, blurb: "Real training capacity; your bets start landing more often." },
  { id: "datacenter", label: "Data center", capex: 13, burn: 0.75, blurb: "Bet-the-company compute — the frontier is yours to push." },
];
const TIERS_SPACE: CapacityTier[] = [
  { id: "pod", label: "Test stand", capex: 0.5, burn: 0.05, blurb: "A bench to iterate hardware faster." },
  { id: "cluster", label: "Integration hall", capex: 2.6, burn: 0.18, blurb: "Parallel builds — more shots on goal." },
  { id: "datacenter", label: "Launch complex", capex: 14, burn: 0.8, blurb: "Vertical integration; cadence and reliability climb." },
];

export function capacityTiers(state: GameState): CapacityTier[] {
  return state.company.industry === "space" ? TIERS_SPACE : TIERS_AI;
}

/** What the capacity stat is called for this industry. */
export function capacityLabel(industry: Industry): string {
  return industry === "space" ? "Facilities" : "Compute";
}

/** How many rungs of the build-out the company has committed to (0–3). */
export function capacityLevel(c: PlayerCompany): number {
  return c.capacityLevel ?? 0;
}

/** The next rung to build, or null once the build-out is complete. */
export function nextCapacityTier(state: GameState): CapacityTier | null {
  const tiers = capacityTiers(state);
  const lvl = capacityLevel(state.company);
  return lvl < tiers.length ? tiers[lvl]! : null;
}

/** Commit to the next rung of the ladder. */
export function investCapacity(state: GameState): GameState {
  const tier = nextCapacityTier(state);
  if (!tier) return state;
  const f = state.company.financials;
  if (f.cash < tier.capex) return state;
  const entry: LogEntry = {
    id: `cap-${tier.id}-${state.clock.week}`,
    week: state.clock.week,
    kind: "company",
    tone: "neutral",
    headline: `Brought a ${tier.label} online`,
    detail: `${formatMoney(tier.capex)} capex, ${formatMoney(tier.burn)}/mo to run. ${capacityLabel(state.company.industry)} steps up — and so do your odds.`,
  };
  return {
    ...state,
    company: {
      ...state.company,
      capacityLevel: capacityLevel(state.company) + 1,
      financials: { ...f, cash: f.cash - tier.capex, burnMonthly: round(f.burnMonthly + tier.burn) },
    },
    log: [...state.log, entry],
  };
}

// ── Execution payoff ──────────────────────────────────────────────────────────

const TEAM_MAX = 0.18;
/** Execution contribution by build-out level (0 = none … 3 = data center). */
const CAP_FACTOR = [0, 0.06, 0.11, 0.16];

/** Execution boost from a right-sized team + a built-out compute base — fed into
 *  the signature mechanic, so investing in people and capacity pays off in odds.
 *  Team contribution scales up to the target and no further (over-hiring is pure
 *  burn); capacity steps up the ladder. Bounded at 0.34, same as before. */
export function opsExecutionBoost(c: PlayerCompany): number {
  const teamRatio = Math.min(1, c.financials.headcount / Math.max(1, targetHeadcount(c)));
  const team = teamRatio * TEAM_MAX;
  const cap = CAP_FACTOR[Math.min(CAP_FACTOR.length - 1, capacityLevel(c))] ?? 0;
  return team + cap;
}
