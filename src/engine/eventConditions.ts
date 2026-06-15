// Event condition evaluation. Conditions are authored as simple
// "lhs op rhs" strings (e.g. "company.stage >= series_a", "sector.hype > 70").
// We build a flat context of every referenced path from game state + the market,
// then compare. Paths whose systems don't exist yet resolve to safe defaults so
// their events simply don't fire.

import type { GameState, WorldSnapshot } from "@/domain/state";
import type { Company } from "@/content/load";
import { stageRank } from "@/domain/ids";
import { netWorth } from "./finance";
import { regimeOf } from "./world";

export type CtxValue = string | number | boolean;

/** Ordinal enums used by `>=` / `<=` comparisons beyond stages. */
const SCALE = ["small", "medium", "large"];
const INTENSITY = ["low", "elevated", "high"];
const MATURITY = ["nascent", "growing", "mature"];

/** Weeks a freshly-entered regime / window stays "just changed" for triggers. */
const TRANSITION_WINDOW = 3;

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
  const w = state.world;
  const year = Math.floor(state.clock.week / 52);

  // ── World transitions, derived from regime memory + the world-history tape so
  //    events keyed to "the cycle just turned" fire within a short window ──
  const regime = regimeOf(w);
  const enteredPhase = w.weeksInPhase <= TRANSITION_WINDOW;
  const qtrAgo = historyAgo(state, 13);
  const rateMoveAbs = qtrAgo ? Math.abs(w.interestRate - qtrAgo.interestRate) : 0;
  const monthAgo = historyAgo(state, 4);
  const sentimentDrop = monthAgo ? monthAgo.marketSentiment - w.marketSentiment : 0;
  const hypeNow = w.hype[ind] ?? 50;
  const hypeThen = monthAgo?.hype[ind] ?? hypeNow;
  const hypeBandMoved = Math.floor(hypeNow / 10) !== Math.floor(hypeThen / 10);

  // ── Sector maturity + recent-failure pressure (proxies for systems the Mogul
  //    DLC will deepen) ──
  const maturity = year >= 3 ? "mature" : year >= 1 ? "growing" : "nascent";
  const lastSig = c.signature.lastOutcome;
  const sinceFailure = lastSig && lastSig.kind === "failure" ? state.clock.week - lastSig.week : Infinity;
  const failureDensity = sinceFailure <= 6 ? "high" : sinceFailure <= 16 ? "elevated" : "low";
  // A signature process that just resolved (the launch/deploy "binary moment").
  const sigRecent = !!lastSig && state.clock.week - lastSig.week <= 2;

  // Founder strain, derived from the crisis-tone record over two windows, so the
  // burnout beat (p1) can fire after a genuinely rough stretch.
  const crisesIn = (weeks: number) =>
    state.log.filter((e) => e.tone === "crisis" && state.clock.week - e.week <= weeks).length;
  const recentCrises = crisesIn(12);
  const sustainedCrises = crisesIn(26);

  const isSpace = ind === "space";

  return {
    "company.industry": ind,
    "company.sub_industry": sub,
    "company.stage": c.stage,
    "sector.hype": hypeNow,
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
    // Strain from the recent crisis record (feeds p1 burnout).
    "founder.sustained_intensity": sustainedCrises >= 3 ? "high" : sustainedCrises >= 1 ? "elevated" : "low",
    "founder.recent_crisis_density": recentCrises >= 2 ? "high" : recentCrises >= 1 ? "elevated" : "low",
    "game.year": year,

    // ── Macro regime + transitions (the m-series economic events) ──
    "macro.cycle_phase": regime,
    "macro.entered_phase_this_tick": enteredPhase,
    "macro.prev_phase": w.macroPrevPhase,
    "macro.rate_move_qtr_abs": rateMoveAbs,
    "macro.ipo_window_changed": w.weeksInIpoWindow <= TRANSITION_WINDOW,
    "macro.correction_triggered": sentimentDrop >= 6,
    "macro.tax_review_due": state.clock.week > 8 && state.clock.week % 52 < 4,

    // ── Sector state ──
    "sector.hype_moved_band": hypeBandMoved,
    "sector.maturity": maturity,
    "sector.recent_failure_density": failureDensity,

    // ── Space-business facts (persistent proxies that light up the s-series) ──
    "company.has_anchor_customer": isSpace && customers.length > 0 && stageR >= stageRank("series_a"),
    "company.fleet_on_orbit": sub === "satellite_constellations" && stageR >= stageRank("seed"),
    "company.reusability_program": sub === "launch_services" && stageR >= stageRank("seed"),
    "company.has_tenant": sub === "space_stations" && stageR >= stageRank("seed"),
    "company.demand_exceeds_capacity": sub === "launch_services" && (hypeNow >= 65 || stageR >= stageRank("series_b")),
    // Signature "binary moment" results — dramatize a launch/deploy the tick it
    // resolves (s1/s2/s6).
    "company.launch_committed": sub === "launch_services" && lastSig != null,
    "company.launch_outcome": sub === "launch_services" && sigRecent ? lastSig!.kind : "none",
    "company.deployment_batch_ready": sub === "satellite_constellations" && sigRecent && lastSig!.kind !== "failure",
  };
}

/** The latest world snapshot at or before `weeksBack` weeks ago (or null when
 *  history is too short). Snapshots are appended in week order. */
function historyAgo(state: GameState, weeksBack: number): WorldSnapshot | null {
  const h = state.worldHistory;
  if (h.length === 0) return null;
  const target = state.clock.week - weeksBack;
  for (let i = h.length - 1; i >= 0; i--) {
    if (h[i]!.week <= target) return h[i]!;
  }
  return null;
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
  if (MATURITY.includes(v)) return MATURITY.indexOf(v);
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
