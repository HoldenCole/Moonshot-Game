// Debt financing — non-dilutive capital from the bank roster (the same banks
// that underwrite IPOs). A lender's capacity scales with revenue / enterprise
// value; the rate is the global policy rate plus a credit spread that widens
// when the macro climate sours, fixed at origination. Interest services weekly;
// the principal is a balloon due at maturity. Pure + deterministic.

import type { GameState, Loan, PlayerCompany, WorldState } from "@/domain/state";
import type { Money } from "@/domain/captable";
import type { LogEntry } from "@/domain/log";
import type { Bank } from "@/content/load";
import { formatMoney } from "./format";

export const MIN_TERM_WEEKS = 26; // ~6 months
export const MAX_TERM_WEEKS = 156; // ~3 years
export const DEFAULT_TERM_WEEKS = 104; // ~2 years
export const MIN_LOAN: Money = 0.5; // $M — below this a facility isn't worth it

const OVERDUE_RATE_BUMP = 4; // penalty points added to an unpaid loan's rate
const OVERDUE_REP_HIT = 3;

export interface DebtOffer {
  bankId: string;
  bankName: string;
  /** Maximum principal this lender will extend right now, $M. */
  capacity: Money;
  /** Annual rate, percent, at the current macro environment (fixed at signing). */
  rateAnnual: number;
  minTerm: number;
  maxTerm: number;
  defaultTerm: number;
  covenantStrictness: number;
  prefersProfitable: boolean;
}

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const round1 = (x: number) => Math.round(x * 10) / 10;
const round2 = (x: number) => Math.round(x * 100) / 100;

/** Credit spreads widen when the climate is cold and tighten when it's hot — so
 *  the same lender's rate scales with the macro environment. */
export function creditSpreadMult(world: WorldState): number {
  return clamp(1.6 - world.vcClimate / 100, 0.8, 1.8);
}

/** Annual rate (percent): the global policy rate + the bank's spread, the spread
 *  scaled by the credit climate. */
export function loanRate(world: WorldState, bank: Bank): number {
  const spreadPct = bank.debt.base_rate_spread * 100;
  return round2(world.interestRate + spreadPct * creditSpreadMult(world));
}

export function isProfitable(c: PlayerCompany): boolean {
  return c.financials.burnMonthly <= c.financials.revenue / 12;
}

/** How much this lender will extend: the larger of a revenue multiple and a
 *  slice of enterprise value, cut for money-losers at cash-flow lenders. */
export function debtCapacity(c: PlayerCompany, bank: Bank): Money {
  const revCap = bank.debt.max_loan_multiple * c.financials.revenue;
  const ventureCap = c.financials.valuation * 0.15 * (bank.debt.prefers_profitable ? 0.4 : 1);
  let cap = Math.max(revCap, ventureCap);
  if (bank.debt.prefers_profitable && !isProfitable(c)) cap *= 0.5;
  return round1(cap);
}

export function debtOffer(c: PlayerCompany, bank: Bank, world: WorldState): DebtOffer | null {
  if (!bank.debt.offers_debt) return null;
  const capacity = debtCapacity(c, bank);
  if (capacity < MIN_LOAN) return null;
  return {
    bankId: bank.id,
    bankName: bank.name,
    capacity,
    rateAnnual: loanRate(world, bank),
    minTerm: MIN_TERM_WEEKS,
    maxTerm: MAX_TERM_WEEKS,
    defaultTerm: DEFAULT_TERM_WEEKS,
    covenantStrictness: bank.debt.covenant_strictness,
    prefersProfitable: bank.debt.prefers_profitable,
  };
}

/** Lenders open to the company right now, cheapest first. */
export function availableLenders(c: PlayerCompany, banks: Bank[], world: WorldState): DebtOffer[] {
  return banks
    .map((b) => debtOffer(c, b, world))
    .filter((o): o is DebtOffer => o != null)
    .sort((a, b) => a.rateAnnual - b.rateAnnual);
}

export function weeklyInterest(loan: Loan): Money {
  return (loan.principal * (loan.rateAnnual / 100)) / 52;
}

/** Monthly debt service across all loans — folds into the runway calc. */
export function monthlyDebtService(c: PlayerCompany): Money {
  return (c.loans ?? []).reduce((s, l) => s + (l.principal * (l.rateAnnual / 100)) / 12, 0);
}

export function totalDebt(c: PlayerCompany): Money {
  return (c.loans ?? []).reduce((s, l) => s + l.principal, 0);
}

export function weeksToMaturity(loan: Loan, week: number): number {
  return loan.startWeek + loan.termWeeks - week;
}

/** Draw a loan: cash in now, a balloon principal due at maturity. */
export function takeLoan(state: GameState, offer: DebtOffer, amount: Money, termWeeks: number): GameState {
  const principal = round1(clamp(amount, MIN_LOAN, offer.capacity));
  const term = clamp(Math.round(termWeeks), offer.minTerm, offer.maxTerm);
  const loan: Loan = {
    id: `loan-${state.clock.week}-${state.company.loans?.length ?? 0}`,
    lenderId: offer.bankId,
    lenderName: offer.bankName,
    principal,
    rateAnnual: offer.rateAnnual,
    startWeek: state.clock.week,
    termWeeks: term,
  };
  const f = state.company.financials;
  const entry: LogEntry = {
    id: loan.id,
    week: state.clock.week,
    kind: "company",
    tone: "neutral",
    headline: `Drew ${formatMoney(principal)} in debt from ${offer.bankName}`,
    detail: `${loan.rateAnnual.toFixed(1)}% over ~${Math.round((term * 12) / 52)} months. Non-dilutive — the interest meter starts now, and the principal is due at maturity.`,
  };
  return {
    ...state,
    company: {
      ...state.company,
      loans: [...(state.company.loans ?? []), loan],
      financials: { ...f, cash: f.cash + principal },
    },
    log: [...state.log, entry],
  };
}

/** Repay a loan's principal in full now (early payoff). No-op if unaffordable. */
export function repayLoan(state: GameState, loanId: string): GameState {
  const loan = (state.company.loans ?? []).find((l) => l.id === loanId);
  if (!loan) return state;
  const f = state.company.financials;
  if (f.cash < loan.principal) return state;
  const entry: LogEntry = {
    id: `repay-${loanId}-${state.clock.week}`,
    week: state.clock.week,
    kind: "company",
    tone: "up",
    headline: `Repaid ${formatMoney(loan.principal)} to ${loan.lenderName}`,
    detail: "Loan cleared. The interest meter stops.",
  };
  return {
    ...state,
    company: {
      ...state.company,
      loans: (state.company.loans ?? []).filter((l) => l.id !== loanId),
      financials: { ...f, cash: f.cash - loan.principal },
    },
    log: [...state.log, entry],
  };
}

/** One week of debt service: weekly interest on every loan, plus principal due
 *  at maturity (auto-repaid if affordable, else overdue at a penalty rate). */
export function serviceDebt(state: GameState): { state: GameState; entries: LogEntry[] } {
  const loans = state.company.loans;
  if (!loans || loans.length === 0) return { state, entries: [] };
  const week = state.clock.week;
  let cash = state.company.financials.cash;
  let reputation = state.founder.reputation;
  const entries: LogEntry[] = [];
  const next: Loan[] = [];
  for (const loan of loans) {
    cash -= weeklyInterest(loan);
    if (week >= loan.startWeek + loan.termWeeks) {
      if (cash >= loan.principal) {
        cash -= loan.principal;
        entries.push({
          id: `loanmature-${loan.id}-${week}`,
          week,
          kind: "company",
          tone: "up",
          headline: `Repaid ${formatMoney(loan.principal)} to ${loan.lenderName} at maturity`,
          detail: "The facility is cleared on schedule.",
        });
      } else if (!loan.overdue) {
        reputation = clamp(reputation - OVERDUE_REP_HIT, 0, 100);
        entries.push({
          id: `loanoverdue-${loan.id}-${week}`,
          week,
          kind: "company",
          tone: "crisis",
          headline: `Loan from ${loan.lenderName} is past due`,
          detail: `You can't cover the ${formatMoney(loan.principal)} principal. It now accrues at a penalty rate until repaid — and your lenders are watching.`,
        });
        next.push({ ...loan, overdue: true, rateAnnual: loan.rateAnnual + OVERDUE_RATE_BUMP });
      } else {
        next.push(loan);
      }
    } else {
      next.push(loan);
    }
  }
  return {
    state: {
      ...state,
      founder: { ...state.founder, reputation },
      company: { ...state.company, loans: next, financials: { ...state.company.financials, cash } },
    },
    entries,
  };
}
