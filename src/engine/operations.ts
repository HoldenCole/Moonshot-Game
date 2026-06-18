// Team / headcount — a light flavor cost lever. The real capability + cost engine
// is the Products / R&D / Capacity system; payroll just colors how the company
// scales. Hiring adds to burn; trimming cuts it with a small reputation hit.
// Pure + deterministic.

import type { GameState } from "@/domain/state";
import type { Money } from "@/domain/captable";
import type { LogEntry } from "@/domain/log";
import { formatMoney } from "./format";

const SALARY_PER_HEAD: Money = 0.0175; // $M/mo fully loaded (~$210K/yr)
const HIRE_RAMP_COST: Money = 0.03; // $M one-time per head (recruiting + ramp)
const MIN_HEADCOUNT = 2;
const MIN_BURN: Money = 0.02;

const round = (x: number, p = 1000) => Math.round(x * p) / p;

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
    detail: `Recruiting cost ${formatMoney(cost)}; payroll up ${formatMoney(headcountBurn(count))}/mo.`,
  };
  return {
    ...state,
    company: {
      ...state.company,
      financials: { ...f, cash: f.cash - cost, headcount: f.headcount + count, burnMonthly: round(f.burnMonthly + headcountBurn(count)) },
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
      financials: { ...f, headcount: f.headcount - actual, burnMonthly: Math.max(MIN_BURN, round(f.burnMonthly - headcountBurn(actual))) },
    },
    log: [...state.log, entry],
  };
}
