// Operations — the money sinks that turn capital into capability (decision: give
// the player things to spend on so growth costs something). Two levers: grow the
// team and invest in compute / facilities. Both deduct cash, raise monthly burn
// (so a bigger company genuinely costs more to run), and lift execution — which
// makes the signature bets land more reliably. Pure + deterministic.

import type { GameState, PlayerCompany } from "@/domain/state";
import type { Industry } from "@/domain/ids";
import type { Money } from "@/domain/captable";
import type { LogEntry } from "@/domain/log";
import { stageRank } from "@/domain/ids";
import { formatMoney } from "./format";

const SALARY_PER_HEAD: Money = 0.0175; // $M/mo fully loaded (~$210K/yr)
const HIRE_RAMP_COST: Money = 0.03; // $M one-time per head (recruiting + ramp)
const MIN_HEADCOUNT = 2;
const MIN_BURN: Money = 0.02;

const round = (x: number, p = 1000) => Math.round(x * p) / p;

// ── Headcount ─────────────────────────────────────────────────────────────────

/** A hiring batch sized to the company's stage (you hire bigger as you scale). */
export function hireBatch(state: GameState): number {
  const r = stageRank(state.company.stage);
  if (r >= stageRank("series_c")) return 25;
  if (r >= stageRank("series_a")) return 10;
  if (r >= stageRank("seed")) return 5;
  return 2;
}

export function hireCost(count: number): Money {
  return round(count * HIRE_RAMP_COST, 100);
}

/** Monthly payroll added by `count` heads. */
export function headcountBurn(count: number): Money {
  return round(count * SALARY_PER_HEAD);
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
    detail: `Recruiting cost ${formatMoney(cost)}; payroll up ${formatMoney(headcountBurn(count))}/mo. A deeper bench lands your big bets more reliably.`,
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

// ── Compute / facilities capacity ─────────────────────────────────────────────

export interface CapacityTier {
  id: string;
  label: string;
  capex: Money;
  burn: Money;
  gain: number;
  blurb: string;
}

const TIERS_AI: CapacityTier[] = [
  { id: "pod", label: "GPU pod", capex: 0.4, burn: 0.04, gain: 15, blurb: "A rack of accelerators — a modest lift to every run." },
  { id: "cluster", label: "Compute cluster", capex: 2.2, burn: 0.16, gain: 48, blurb: "Real training capacity; your bets land more often." },
  { id: "datacenter", label: "Data center", capex: 13, burn: 0.75, gain: 135, blurb: "Bet-the-company compute — the frontier is yours to push." },
];
const TIERS_SPACE: CapacityTier[] = [
  { id: "pod", label: "Test stand", capex: 0.5, burn: 0.05, gain: 15, blurb: "A bench to iterate hardware faster." },
  { id: "cluster", label: "Integration hall", capex: 2.6, burn: 0.18, gain: 48, blurb: "Parallel builds — more shots on goal." },
  { id: "datacenter", label: "Launch complex", capex: 14, burn: 0.8, gain: 135, blurb: "Vertical integration; cadence and reliability climb." },
];

export function capacityTiers(state: GameState): CapacityTier[] {
  return state.company.industry === "space" ? TIERS_SPACE : TIERS_AI;
}

/** What the capacity stat is called for this industry. */
export function capacityLabel(industry: Industry): string {
  return industry === "space" ? "Facilities" : "Compute";
}

export function investCapacity(state: GameState, tierId: string): GameState {
  const tier = capacityTiers(state).find((t) => t.id === tierId);
  if (!tier) return state;
  const f = state.company.financials;
  if (f.cash < tier.capex) return state;
  const entry: LogEntry = {
    id: `cap-${tierId}-${state.clock.week}`,
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
      capacity: (state.company.capacity ?? 0) + tier.gain,
      financials: { ...f, cash: f.cash - tier.capex, burnMonthly: round(f.burnMonthly + tier.burn) },
    },
    log: [...state.log, entry],
  };
}

/** Execution boost from a deeper team + invested capacity — fed into the
 *  signature mechanic, so spending on people and compute pays off in odds. */
export function opsExecutionBoost(c: PlayerCompany): number {
  const team = Math.min(0.18, c.financials.headcount / 90);
  const capacity = Math.min(0.16, (c.capacity ?? 0) / 110);
  return team + capacity;
}
