// Personal portfolio — the founder allocates personal capital into other public
// companies (the capital-allocator / mogul arc). Funded by personal cash (so net
// worth stays clean: cash and holdings are both yours, a buy is a wash, and
// gains flow through). Holdings are marked to the live market each tick. Pure.

import type { GameState, Holding } from "@/domain/state";
import type { WorldState } from "@/domain/state";
import type { Company } from "@/content/load";
import type { Money } from "@/domain/captable";
import type { LogEntry } from "@/domain/log";
import { marketPrice } from "./pricing";
import { formatMoney } from "./format";

/** Minimum trade size, $M. */
export const MIN_TRADE: Money = 0.1;

/** Per-share price ($/share): market cap ($M) over shares out (millions). 0 for
 *  a private company (no public stock). */
export function pricePerShare(c: Company, world: WorldState, week: number): number {
  return c.financials.shares_out > 0 ? marketPrice(c, world, week) / c.financials.shares_out : 0;
}

export function portfolioValue(state: GameState): Money {
  return (state.founder.portfolio ?? []).reduce((s, h) => s + h.value, 0);
}

export function holdingGain(h: Holding): Money {
  return Math.round((h.value - h.costBasis) * 100) / 100;
}

/** Buy `$amount` of a public company with personal cash. */
export function buyStock(state: GameState, company: Company, amount: Money, world: WorldState, week: number): GameState {
  const pps = pricePerShare(company, world, week);
  if (pps <= 0) return state;
  const spend = Math.round(Math.min(amount, state.founder.personalCash) * 100) / 100;
  if (spend < MIN_TRADE) return state;
  const shares = spend / pps;
  const portfolio = [...(state.founder.portfolio ?? [])];
  const i = portfolio.findIndex((h) => h.companyId === company.id);
  if (i >= 0) {
    const h = portfolio[i]!;
    portfolio[i] = { ...h, shares: h.shares + shares, costBasis: h.costBasis + spend, value: h.value + spend };
  } else {
    portfolio.push({ companyId: company.id, shares, costBasis: spend, value: spend });
  }
  const entry: LogEntry = {
    id: `buy-${company.id}-${week}`,
    week,
    kind: "company",
    tone: "neutral",
    headline: `Bought ${formatMoney(spend)} of ${company.name}`,
    detail: `A personal stake at ${dollars(pps)}/share. Your portfolio will move with the market.`,
  };
  return { ...state, founder: { ...state.founder, personalCash: state.founder.personalCash - spend, portfolio }, log: [...state.log, entry] };
}

/** Sell a fraction (0–1) of a holding at the current price, banking the proceeds. */
export function sellStock(state: GameState, companyId: string, fraction: number, market: Company[], world: WorldState, week: number): GameState {
  const portfolio = [...(state.founder.portfolio ?? [])];
  const i = portfolio.findIndex((h) => h.companyId === companyId);
  if (i < 0) return state;
  const h = portfolio[i]!;
  const f = Math.max(0, Math.min(1, fraction));
  const company = market.find((c) => c.id === companyId);
  const pps = company ? pricePerShare(company, world, week) : h.shares > 0 ? h.value / h.shares : 0;
  const proceeds = Math.round(h.shares * f * pps * 100) / 100;
  const soldCost = h.costBasis * f;
  if (f >= 0.999 || h.shares * (1 - f) < 1e-6) {
    portfolio.splice(i, 1);
  } else {
    const shares = h.shares * (1 - f);
    portfolio[i] = { ...h, shares, costBasis: Math.round(h.costBasis * (1 - f) * 100) / 100, value: Math.round(shares * pps * 100) / 100 };
  }
  const gain = Math.round((proceeds - soldCost) * 100) / 100;
  const entry: LogEntry = {
    id: `sell-${companyId}-${week}-${Math.round(f * 100)}`,
    week,
    kind: "company",
    tone: gain >= 0 ? "up" : "warn",
    headline: `Sold ${company ? company.name : "a holding"} for ${formatMoney(proceeds)}`,
    detail: `${gain >= 0 ? "A gain" : "A loss"} of ${formatMoney(Math.abs(gain))} on the position.`,
  };
  return { ...state, founder: { ...state.founder, personalCash: state.founder.personalCash + proceeds, portfolio }, log: [...state.log, entry] };
}

/** Re-mark every holding to the live market (called each tick). */
export function markPortfolio(state: GameState, market: Company[], world: WorldState, week: number): GameState {
  const pf = state.founder.portfolio;
  if (!pf || pf.length === 0) return state;
  const byId = new Map(market.map((c) => [c.id, c]));
  const portfolio = pf.map((h) => {
    const c = byId.get(h.companyId);
    return c ? { ...h, value: Math.round(h.shares * pricePerShare(c, world, week) * 100) / 100 } : h;
  });
  return { ...state, founder: { ...state.founder, portfolio } };
}

const dollars = (n: number) => `$${n >= 100 ? Math.round(n) : n.toFixed(2)}`;
