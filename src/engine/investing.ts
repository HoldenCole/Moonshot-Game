// Investing — the founder and the operating company can each take stakes in
// other public companies. Two pockets:
//   • personal — funded by the founder's personal cash. Part of net worth: cash
//     and holdings are both the founder's, so a buy is a wash and gains flow
//     straight through.
//   • company  — funded by the company treasury. A balance-sheet asset that does
//     NOT feed net worth (company cash is excluded to avoid double-counting
//     post-money rounds, so the holdings it buys are excluded too). Selling
//     realizes gains back into company cash to fund the operating business.
// Holdings are marked to the live market each tick. Pure + deterministic.

import type { GameState, Holding, WorldState } from "@/domain/state";
import type { Company } from "@/content/load";
import type { Money } from "@/domain/captable";
import type { LogEntry } from "@/domain/log";
import { marketPrice } from "./pricing";
import { formatMoney } from "./format";

/** Which pocket an investment is funded from / held in. */
export type InvestAccount = "personal" | "company";

/** Minimum trade size, $M. */
export const MIN_TRADE: Money = 0.1;

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Per-share price ($/share): market cap ($M) over shares out (millions). 0 for
 *  a private company (no public stock). */
export function pricePerShare(c: Company, world: WorldState, week: number): number {
  return c.financials.shares_out > 0 ? marketPrice(c, world, week) / c.financials.shares_out : 0;
}

/** The personal portfolio's market value — the only one that feeds net worth. */
export function portfolioValue(state: GameState): Money {
  return (state.founder.portfolio ?? []).reduce((s, h) => s + h.value, 0);
}

/** The company treasury portfolio's market value (a balance-sheet asset). */
export function companyPortfolioValue(state: GameState): Money {
  return (state.company.portfolio ?? []).reduce((s, h) => s + h.value, 0);
}

export function holdingGain(h: Holding): Money {
  return r2(h.value - h.costBasis);
}

interface Pocket {
  cash: Money;
  portfolio: Holding[];
}

function readPocket(state: GameState, acct: InvestAccount): Pocket {
  return acct === "company"
    ? { cash: state.company.financials.cash, portfolio: state.company.portfolio ?? [] }
    : { cash: state.founder.personalCash, portfolio: state.founder.portfolio ?? [] };
}

function writePocket(state: GameState, acct: InvestAccount, cash: Money, portfolio: Holding[]): GameState {
  if (acct === "company") {
    return { ...state, company: { ...state.company, portfolio, financials: { ...state.company.financials, cash } } };
  }
  return { ...state, founder: { ...state.founder, personalCash: cash, portfolio } };
}

/** Buy `$amount` of a public company from the chosen pocket's cash. */
export function buyStock(
  state: GameState,
  company: Company,
  amount: Money,
  acct: InvestAccount,
  world: WorldState,
  week: number,
): GameState {
  const pps = pricePerShare(company, world, week);
  if (pps <= 0) return state;
  const pocket = readPocket(state, acct);
  const spend = r2(Math.min(amount, pocket.cash));
  if (spend < MIN_TRADE) return state;
  const shares = spend / pps;
  const portfolio = [...pocket.portfolio];
  const i = portfolio.findIndex((h) => h.companyId === company.id);
  if (i >= 0) {
    const h = portfolio[i]!;
    portfolio[i] = { ...h, shares: h.shares + shares, costBasis: r2(h.costBasis + spend), value: r2(h.value + spend) };
  } else {
    portfolio.push({ companyId: company.id, shares, costBasis: spend, value: spend });
  }
  const next = writePocket(state, acct, r2(pocket.cash - spend), portfolio);
  const entry: LogEntry = {
    id: `buy-${acct}-${company.id}-${week}`,
    week,
    kind: "company",
    tone: "neutral",
    headline: `${who(state, acct)} bought ${formatMoney(spend)} of ${company.name}`,
    detail: `A ${acct === "company" ? "treasury" : "personal"} stake at ${dollars(pps)}/share. It will move with the market.`,
  };
  return { ...next, log: [...state.log, entry] };
}

/** Sell a fraction (0–1) of a holding from the chosen pocket, banking proceeds
 *  back into that pocket's cash. */
export function sellStock(
  state: GameState,
  companyId: string,
  fraction: number,
  acct: InvestAccount,
  market: Company[],
  world: WorldState,
  week: number,
): GameState {
  const pocket = readPocket(state, acct);
  const portfolio = [...pocket.portfolio];
  const i = portfolio.findIndex((h) => h.companyId === companyId);
  if (i < 0) return state;
  const h = portfolio[i]!;
  const f = Math.max(0, Math.min(1, fraction));
  const company = market.find((c) => c.id === companyId);
  const pps = company ? pricePerShare(company, world, week) : h.shares > 0 ? h.value / h.shares : 0;
  const proceeds = r2(h.shares * f * pps);
  const soldCost = h.costBasis * f;
  if (f >= 0.999 || h.shares * (1 - f) < 1e-6) {
    portfolio.splice(i, 1);
  } else {
    const shares = h.shares * (1 - f);
    portfolio[i] = { ...h, shares, costBasis: r2(h.costBasis * (1 - f)), value: r2(shares * pps) };
  }
  const next = writePocket(state, acct, r2(pocket.cash + proceeds), portfolio);
  const gain = r2(proceeds - soldCost);
  const entry: LogEntry = {
    id: `sell-${acct}-${companyId}-${week}-${Math.round(f * 100)}`,
    week,
    kind: "company",
    tone: gain >= 0 ? "up" : "warn",
    headline: `${who(state, acct)} sold ${company ? company.name : "a holding"} for ${formatMoney(proceeds)}`,
    detail: `${gain >= 0 ? "A gain" : "A loss"} of ${formatMoney(Math.abs(gain))} on the position.`,
  };
  return { ...next, log: [...state.log, entry] };
}

function markOne(state: GameState, acct: InvestAccount, byId: Map<string, Company>, world: WorldState, week: number): GameState {
  const pocket = readPocket(state, acct);
  if (pocket.portfolio.length === 0) return state;
  const portfolio = pocket.portfolio.map((h) => {
    const c = byId.get(h.companyId);
    return c ? { ...h, value: r2(h.shares * pricePerShare(c, world, week)) } : h;
  });
  return writePocket(state, acct, pocket.cash, portfolio);
}

/** Re-mark both pockets to the live market (called each tick). */
export function markPortfolios(state: GameState, market: Company[], world: WorldState, week: number): GameState {
  const byId = new Map(market.map((c) => [c.id, c]));
  let next = markOne(state, "personal", byId, world, week);
  next = markOne(next, "company", byId, world, week);
  return next;
}

const who = (state: GameState, acct: InvestAccount) => (acct === "company" ? state.company.name : "You");
const dollars = (n: number) => `$${n >= 100 ? Math.round(n) : n.toFixed(2)}`;
