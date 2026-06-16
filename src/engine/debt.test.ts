import { test } from "node:test";
import assert from "node:assert/strict";

import {
  availableLenders,
  debtCapacity,
  loanRate,
  monthlyDebtService,
  repayLoan,
  serviceDebt,
  takeLoan,
  totalDebt,
  weeklyInterest,
  debtOffer,
} from "./debt.ts";
import { createNewGame } from "@/state/newgame";
import type { GameState, Loan } from "@/domain/state";
import type { Bank } from "@/content/load";

function mkBank(id: string, debt: Partial<Bank["debt"]>): Bank {
  return {
    id,
    name: id,
    debt: {
      offers_debt: true,
      max_loan_multiple: 4,
      base_rate_spread: 0.015,
      covenant_strictness: 50,
      prefers_profitable: false,
      ...debt,
    },
  } as unknown as Bank;
}

function game(): GameState {
  return createNewGame(
    { founderName: "You", companyName: "Co", industry: "ai", subIndustry: "frontier_model_lab", color: "#fff", seed: 5 },
    "2026-01-01T00:00:00Z",
  );
}

test("the rate is the policy rate plus a spread that widens as the climate cools", () => {
  const g = game();
  g.world.interestRate = 4.5;
  const bank = mkBank("b", { base_rate_spread: 0.015 });

  g.world.vcClimate = 62;
  const warm = loanRate(g.world, bank); // 4.5 + 1.5×(1.6-0.62)
  g.world.vcClimate = 30;
  const cold = loanRate(g.world, bank); // 4.5 + 1.5×(1.6-0.30)

  assert.ok(cold > warm, "spreads blow out in a cold climate");
  assert.equal(warm, 5.97);
  assert.equal(cold, 6.45);
});

test("capacity is a revenue multiple or a slice of value, cut for money-losers", () => {
  const g = game();
  g.company.financials.revenue = 20;
  g.company.financials.valuation = 200;
  g.company.financials.burnMonthly = 0; // profitable

  assert.equal(debtCapacity(g.company, mkBank("x", { max_loan_multiple: 4 })), 80); // 4×20 beats value floor

  // A pre-revenue, money-losing startup at a cash-flow lender borrows little.
  g.company.financials.revenue = 0;
  g.company.financials.valuation = 100;
  g.company.financials.burnMonthly = 1; // not profitable
  assert.equal(debtCapacity(g.company, mkBank("y", { prefers_profitable: true })), 3); // 100×0.15×0.4×0.5
});

test("only debt-offering lenders above the floor appear, cheapest first", () => {
  const g = game();
  g.company.financials.revenue = 20;
  g.company.financials.valuation = 200;
  g.company.financials.burnMonthly = 0;
  const banks = [
    mkBank("equityOnly", { offers_debt: false }),
    mkBank("pricey", { base_rate_spread: 0.04 }),
    mkBank("cheap", { base_rate_spread: 0.01 }),
  ];
  const offers = availableLenders(g.company, banks, g.world);
  assert.deepEqual(offers.map((o) => o.bankId), ["cheap", "pricey"]); // equityOnly filtered, sorted by rate
});

test("drawing a loan banks the cash and clamps amount/term to the offer", () => {
  const g = game();
  g.company.financials.cash = 5;
  g.company.financials.revenue = 20;
  g.company.financials.valuation = 200;
  g.company.financials.burnMonthly = 0;
  const offer = debtOffer(g.company, mkBank("b", { max_loan_multiple: 4 }), g.world)!; // capacity 80

  const after = takeLoan(g, offer, 200, 999); // over capacity + over max term
  assert.equal(after.company.loans!.length, 1);
  assert.equal(after.company.loans![0]!.principal, 80); // clamped to capacity
  assert.equal(after.company.loans![0]!.termWeeks, 156); // clamped to max
  assert.equal(after.company.financials.cash, 85); // 5 + 80
});

test("repaying clears the loan and the cash; it's a no-op when unaffordable", () => {
  const g = game();
  const loan: Loan = { id: "L", lenderId: "b", lenderName: "Bank", principal: 10, rateAnnual: 6, startWeek: 0, termWeeks: 52 };
  g.company.loans = [loan];

  g.company.financials.cash = 15;
  const paid = repayLoan(g, "L");
  assert.equal(paid.company.loans!.length, 0);
  assert.equal(paid.company.financials.cash, 5);

  g.company.financials.cash = 4; // can't cover the principal
  assert.equal(repayLoan(g, "L").company.loans!.length, 1);
});

test("debt service charges weekly interest and a balloon at maturity", () => {
  const g = game();
  const loan: Loan = { id: "L", lenderId: "b", lenderName: "Bank", principal: 10, rateAnnual: 6, startWeek: 0, termWeeks: 4 };
  g.company.loans = [loan];
  assert.ok(Math.abs(weeklyInterest(loan) - 10 * 0.06 / 52) < 1e-9);
  assert.ok(Math.abs(monthlyDebtService(g.company) - 10 * 0.06 / 12) < 1e-9);

  // Mid-term week: interest only.
  g.clock.week = 1;
  g.company.financials.cash = 20;
  const mid = serviceDebt(g);
  assert.equal(mid.state.company.loans!.length, 1);
  assert.ok(Math.abs(mid.state.company.financials.cash - (20 - weeklyInterest(loan))) < 1e-9);

  // At maturity with cash on hand: auto-repaid.
  g.clock.week = 4;
  g.company.financials.cash = 20;
  const repaid = serviceDebt(g);
  assert.equal(repaid.state.company.loans!.length, 0);
  assert.ok(repaid.entries.some((e) => e.tone === "up"));
  assert.equal(totalDebt(repaid.state.company), 0);
});

test("a loan that can't be covered at maturity goes overdue at a penalty rate", () => {
  const g = game();
  g.company.loans = [{ id: "L", lenderId: "b", lenderName: "Bank", principal: 10, rateAnnual: 6, startWeek: 0, termWeeks: 4 }];
  g.clock.week = 4;
  g.company.financials.cash = 2; // can't cover the $10 principal
  const rep0 = g.founder.reputation;

  const out = serviceDebt(g);
  const loan = out.state.company.loans![0]!;
  assert.equal(loan.overdue, true);
  assert.equal(loan.rateAnnual, 10); // 6 + 4 penalty
  assert.ok(out.entries.some((e) => e.tone === "crisis"));
  assert.equal(out.state.founder.reputation, rep0 - 3);
});
