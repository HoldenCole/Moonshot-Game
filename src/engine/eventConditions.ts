// Event condition evaluation. Conditions are authored as simple
// "lhs op rhs" strings (e.g. "company.stage >= series_a", "sector.hype > 70").
// We build a flat context of every referenced path from game state + the market,
// then compare. Paths whose systems don't exist yet resolve to safe defaults so
// their events simply don't fire.

import type { GameState } from "@/domain/state";
import type { Company } from "@/content/load";
import { stageRank } from "@/domain/ids";
import { netWorth } from "./finance";

export type CtxValue = string | number | boolean;

/** Ordinal enums used by `>=` / `<=` comparisons beyond stages. */
const SCALE = ["small", "medium", "large"];
const INTENSITY = ["low", "elevated", "high"];

/** Per-path "milestone" thresholds (rhs literal `milestone`). */
const MILESTONE: Record<string, number> = {
  "founder.reputation": 55,
  "founder.personal_wealth": 5,
};

export function buildEventContext(state: GameState, market: Company[]): Record<string, CtxValue> {
  const c = state.company;
  const sub = c.subIndustry;
  const ind = c.industry;
  const stageR = stageRank(c.stage);

  const sameSubPeers = market.filter((m) => m.sub_industry === sub && m.industry === ind);
  const suppliers = market.filter((m) => isSupplierSector(ind, sub, m));
  const customers = market.filter((m) => isCustomerSector(ind, sub, m));
  const hasCofounder = c.capTable.lots.some((l) => l.holderType === "cofounder");

  return {
    "company.industry": ind,
    "company.sub_industry": sub,
    "company.stage": c.stage,
    "sector.hype": state.world.hype[ind] ?? 50,
    "company.has_competitor": sameSubPeers.length > 0,
    "company.has_supplier": suppliers.length > 0,
    "company.has_customer": customers.length > 0,
    "company.has_key_researcher": c.financials.headcount >= 2,
    "company.has_cofounder": hasCofounder,
    "company.compute_dependent": sub === "frontier_model_lab" || sub === "ai_chips",
    "company.trains_models": sub === "frontier_model_lab",
    "company.has_public_model": sub === "frontier_model_lab" && stageR >= stageRank("seed"),
    "company.deployment_scale": stageR >= stageRank("series_b") ? "large" : stageR >= stageRank("seed") ? "medium" : "small",
    // True while a signature process is running (feeds the a4/a5 run events).
    "company.training_run_committed": sub === "frontier_model_lab" && c.signature.status === "running",
    "world.star_talent_available": true,
    "founder.reputation": state.founder.reputation,
    "founder.personal_wealth": netWorth(state),
    // Burnout/intensity tracking arrives with delegation (Phase 9).
    "founder.sustained_intensity": "low",
    "founder.recent_crisis_density": "normal",
    "game.year": Math.floor(state.clock.week / 52),
  };
}

/** True when every condition holds in the given context. */
export function conditionsPass(conditions: string[], ctx: Record<string, CtxValue>): boolean {
  return conditions.every((cond) => evalCondition(cond, ctx));
}

export function evalCondition(cond: string, ctx: Record<string, CtxValue>): boolean {
  const m = cond.trim().match(/^(\S+)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
  if (!m) return true; // unparseable → don't block
  const [, lhs, op, rhsRaw] = m;
  if (!(lhs! in ctx)) return false; // unknown path → don't fire
  const left = ctx[lhs!]!;
  const right = parseRhs(rhsRaw!.trim());

  // Equality on strings / bools / numbers.
  if (op === "==") return eq(left, right);
  if (op === "!=") return !eq(left, right);

  // Ordered comparisons: resolve both sides to a rank.
  const lr = rankOf(lhs!, left);
  const rr = rankOf(lhs!, right);
  switch (op) {
    case ">":
      return lr > rr;
    case "<":
      return lr < rr;
    case ">=":
      return lr >= rr;
    case "<=":
      return lr <= rr;
    default:
      return false;
  }
}

function eq(a: CtxValue, b: CtxValue): boolean {
  return String(a) === String(b);
}

function parseRhs(raw: string): CtxValue {
  if (raw === "true") return true;
  if (raw === "false") return false;
  const n = Number(raw);
  return Number.isNaN(n) ? raw : n;
}

/** Map a value to a comparable rank for `<`/`>` operators. */
function rankOf(path: string, v: CtxValue): number {
  if (v === "milestone") return MILESTONE[path] ?? 0;
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  // ordinal enums
  if (SCALE.includes(v)) return SCALE.indexOf(v);
  if (INTENSITY.includes(v)) return INTENSITY.indexOf(v);
  // stage names
  const sr = stageRank(v as never);
  if (sr >= 0) return sr;
  return 0;
}

// Light sector adjacency used to test for plausible suppliers / customers.
function isSupplierSector(ind: string, sub: string, m: Company): boolean {
  if (ind === "ai" && sub !== "ai_chips") return m.sub_industry === "ai_chips";
  if (ind === "space") return m.industry === "advanced_mfg";
  return false;
}
function isCustomerSector(ind: string, sub: string, m: Company): boolean {
  if (ind === "ai" && sub === "frontier_model_lab") return m.sub_industry === "vertical_ai_saas";
  if (ind === "space") return m.sub_industry === "satellite_constellations";
  return m.industry === ind && m.sub_industry !== sub;
}
