import { test } from "node:test";
import assert from "node:assert/strict";

import { createNewGame } from "./newgame.ts";
import type { FounderContent } from "@/domain/content";

const seller: FounderContent = {
  id: "seller",
  name: "The Seller",
  blurb: "",
  playstyle_hint: "",
  modifiers: { starting_reputation: 4, starting_cash_mult: 1.0, investor_warmth: 12, integrity_baseline: -5, signature_lean: 0, exec_quality_floor: 0, sub_system_lean: "fundraising" },
};
const bootstrapper: FounderContent = {
  id: "bootstrapper",
  name: "The Bootstrapper",
  blurb: "",
  playstyle_hint: "",
  modifiers: { starting_reputation: 2, starting_cash_mult: 0.9, investor_warmth: -10, integrity_baseline: 6, signature_lean: 4, exec_quality_floor: 3, sub_system_lean: "burn_efficiency" },
};

const mk = (arch?: FounderContent) =>
  createNewGame(
    { founderName: "You", companyName: "Co", industry: "ai", subIndustry: "frontier_model_lab", color: "#fff", seed: 1, archetype: arch },
    "2026-01-01T00:00:00Z",
  );

test("an archetype tilts the opening state over the baselines; neutral is untilted", () => {
  const n = mk();
  assert.equal(n.founder.archetype, undefined);
  assert.equal(n.founder.reputation, 30);
  assert.equal(n.founder.investorWarmth, 0);

  const s = mk(seller);
  assert.equal(s.founder.archetype, "seller");
  assert.equal(s.founder.reputation, 34); // +4
  assert.equal(s.founder.ethics, 55); // -5
  assert.equal(s.founder.investorWarmth, 12);
});

test("burn-efficiency lowers opening burn; the cash multiplier scales the start", () => {
  const n = mk();
  const b = mk(bootstrapper);
  assert.ok(b.company.financials.burnMonthly < n.company.financials.burnMonthly); // ×0.92
  assert.ok(b.company.financials.cash < n.company.financials.cash); // ×0.9
  assert.equal(b.founder.signatureLean, 4);
  assert.equal(b.founder.execQualityFloor, 3);
});

test("a custom founder produces the same opening state as an equivalent preset", () => {
  const mods = seller.modifiers;
  const asPreset = mk({ ...seller, id: "seller" });
  const asCustom = createNewGame(
    { founderName: "You", companyName: "Co", industry: "ai", subIndustry: "frontier_model_lab", color: "#fff", seed: 1, archetype: { id: "custom", name: "", blurb: "", playstyle_hint: "", modifiers: mods }, age: 40 },
    "2026-01-01T00:00:00Z",
  );
  // Equivalent inputs → identical DERIVED state (the §4a invariant).
  assert.equal(asCustom.founder.reputation, asPreset.founder.reputation);
  assert.equal(asCustom.founder.ethics, asPreset.founder.ethics);
  assert.equal(asCustom.founder.investorWarmth, asPreset.founder.investorWarmth);
  assert.equal(asCustom.founder.signatureLean, asPreset.founder.signatureLean);
  assert.equal(asCustom.founder.execQualityFloor, asPreset.founder.execQualityFloor);
  assert.equal(asCustom.company.financials.cash, asPreset.company.financials.cash);
  assert.equal(asCustom.company.financials.burnMonthly, asPreset.company.financials.burnMonthly);
  // The custom build records its own id + age.
  assert.equal(asCustom.founder.archetype, "custom");
  assert.equal(asCustom.founder.age, 40);
});

test("archetype deltas clamp into the valid range", () => {
  const harsh: FounderContent = {
    id: "x",
    name: "",
    blurb: "",
    playstyle_hint: "",
    modifiers: { starting_reputation: -50, starting_cash_mult: 1, investor_warmth: 0, integrity_baseline: -80, signature_lean: 0, exec_quality_floor: 0, sub_system_lean: "" },
  };
  const g = mk(harsh);
  assert.ok(g.founder.reputation >= 0 && g.founder.ethics >= 0);
});

test("reinvesting carried wealth funds the company and leaves the rest personal", () => {
  const choices = {
    founderName: "You",
    companyName: "Co",
    industry: "ai" as const,
    subIndustry: "frontier_model_lab" as const,
    color: "#fff",
    seed: 1,
    carryOver: { reputation: 50, personalCash: 100 },
  };
  const baseline = createNewGame({ ...choices, carryOver: undefined }, "2026-01-01T00:00:00Z");

  const g = createNewGame({ ...choices, reinvest: 60 }, "2026-01-01T00:00:00Z");
  assert.equal(g.founder.personalCash, 40); // 100 carried − 60 reinvested
  assert.ok(Math.abs(g.company.financials.cash - (baseline.company.financials.cash + 60)) < 1e-6);

  // Reinvest is clamped to what was actually carried over.
  const over = createNewGame({ ...choices, reinvest: 999 }, "2026-01-01T00:00:00Z");
  assert.equal(over.founder.personalCash, 0);
  assert.ok(Math.abs(over.company.financials.cash - (baseline.company.financials.cash + 100)) < 1e-6);
});
