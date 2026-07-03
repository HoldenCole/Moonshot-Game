// ============================================================================
// contracts.ts — The contract market, entanglement, mix identity, and the
// power axis (docs 16 + 17). The mid-game power converter. Pure & seeded.
// ============================================================================

export interface CustomerDef {
  id: string; channel: "commercial" | "government";
  entanglement_per_contract: number; power_per_contract: number;
  reputation_effect: number; requires_clearance: string;
}
export interface ContractTemplate {
  id: string; customer: string; name: string; sub_industry: string;
  requires: { rd_levels?: Record<string, number>; product_tier?: number; stature_min?: number; clearance?: string };
  payment: { upfront: number; recurring_per_year: number; term_weeks: number };
  effects: { power: number; entanglement: number; reputation: number };
  has_leak_risk?: boolean;
}
export interface ClearanceDef { id: string; cost: number; weeks: number; entanglement_on_grant: number;
  requires: { stature_min: number; prior_clearance?: string } }

export interface ContractsState {
  market: string[];                       // template ids currently offered
  active: ActiveContract[];
  clearances: string[];                   // held clearance ids
  entanglement: number;                   // 0..100
  weeks_since_refresh: number;
}
export interface ActiveContract { template_id: string; weeks_left: number }

export const TUNING = {
  commercial_pool: 8, government_pool: 3, refresh_weeks: 13,
  entanglement_decay_per_year: 6,
  identity: [
    { below: 0.10, label: "Independent" },
    { below: 0.35, label: "Government Partner" },
    { below: 0.60, label: "National Champion" },
    { below: 1.01, label: "State-Entangled" },
  ],
  criticality_share: 0.4, criticality_power: 2,
};

export function initContracts(): ContractsState {
  return { market: [], active: [], clearances: [], entanglement: 0, weeks_since_refresh: TUNING.refresh_weeks };
}

function eligible(t: ContractTemplate, ctx: Ctx): boolean {
  const r = t.requires;
  if (r.stature_min && ctx.stature < r.stature_min) return false;
  if (r.product_tier != null && (ctx.productTiers[t.sub_industry] ?? -1) < r.product_tier) return false;
  if (r.clearance && !ctx.clearances.includes(r.clearance)) return true; // shown LOCKED, not hidden (foreshadow)
  if (r.rd_levels) {
    const lv = ctx.rdLevels[t.sub_industry] ?? {};
    if (!Object.entries(r.rd_levels).every(([l, m]) => (lv[l] ?? 0) >= m)) return false;
  }
  return ctx.frontsOperated.includes(t.sub_industry);
}
interface Ctx { stature: number; productTiers: Record<string, number>;
  rdLevels: Record<string, Record<string, number>>; frontsOperated: string[]; clearances: string[] }

/** Refresh the market (seeded): plentiful commercial, rare government. */
export function refreshMarket(
  s: ContractsState, templates: Record<string, ContractTemplate>,
  customers: Record<string, CustomerDef>, ctx: Ctx, rng: () => number
): void {
  const pool = Object.values(templates).filter(t => eligible(t, { ...ctx, clearances: s.clearances })
    && !s.active.some(a => a.template_id === t.id));
  const comm = pool.filter(t => customers[t.customer]!.channel === "commercial");
  const gov  = pool.filter(t => customers[t.customer]!.channel === "government");
  const pick = (arr: ContractTemplate[], n: number) => {
    const a = [...arr]; const out: string[] = [];
    while (a.length && out.length < n) out.push(a.splice(Math.floor(rng() * a.length), 1)[0]!.id);
    return out;
  };
  s.market = [...pick(comm, TUNING.commercial_pool), ...pick(gov, TUNING.government_pool)];
  s.weeks_since_refresh = 0;
}

export function takeContract(s: ContractsState, t: ContractTemplate):
  { cash_delta: number; power_delta: number; reputation_delta: number } {
  s.market = s.market.filter(id => id !== t.id);
  s.active.push({ template_id: t.id, weeks_left: t.payment.term_weeks });
  s.entanglement = Math.min(100, s.entanglement + t.effects.entanglement);
  return { cash_delta: t.payment.upfront, power_delta: t.effects.power, reputation_delta: t.effects.reputation };
}

/** Exiting a binding government contract early: the obligation has teeth. */
export function exitContract(s: ContractsState, t: ContractTemplate, customers: Record<string, CustomerDef>):
  { power_delta: number; reputation_delta: number } {
  s.active = s.active.filter(a => a.template_id !== t.id);
  const gov = customers[t.customer]!.channel === "government";
  return gov ? { power_delta: -Math.max(1, t.effects.power), reputation_delta: -2 }
             : { power_delta: 0, reputation_delta: 0 };
}

export function tickContracts(
  s: ContractsState, templates: Record<string, ContractTemplate>, weeksElapsed: number
): { revenue: number; expired: string[] } {
  let revenue = 0; const expired: string[] = [];
  for (let i = s.active.length - 1; i >= 0; i--) {
    const a = s.active[i]; const t = templates[a!.template_id];
    revenue += (t!.payment.recurring_per_year / 52) * weeksElapsed;
    a!.weeks_left -= weeksElapsed;
    if (a!.weeks_left <= 0) { expired.push(a!.template_id); s.active.splice(i, 1); }
  }
  s.entanglement = Math.max(0, s.entanglement - (TUNING.entanglement_decay_per_year / 52) * weeksElapsed);
  s.weeks_since_refresh += weeksElapsed;
  return { revenue, expired };
}

// ---- the identity + power axis ----
export function govShare(s: ContractsState, templates: Record<string, ContractTemplate>,
  customers: Record<string, CustomerDef>): number {
  let comm = 0, gov = 0;
  for (const a of s.active) {
    const t = templates[a.template_id];
    (customers[t!.customer]!.channel === "government" ? (gov += t!.payment.recurring_per_year) : (comm += t!.payment.recurring_per_year));
  }
  return comm + gov === 0 ? 0 : gov / (comm + gov);
}
export function mixIdentity(share: number): string {
  for (const t of TUNING.identity) if (share < t.below) return t.label;
  return "State-Entangled";
}
/** Contract-sourced power + emergent strategic criticality (the TSMC effect). */
export function powerFromBusiness(s: ContractsState, templates: Record<string, ContractTemplate>,
  maxMarketShare: number): number {
  let p = 0;
  for (const a of s.active) p += templates[a.template_id]!.effects.power;
  if (maxMarketShare >= TUNING.criticality_share) p += TUNING.criticality_power;
  return p;
}

// ---- power/gov event gating (doc 17) ----
export interface PowerEventDef { id: string; category: "scrutiny" | "entanglement" | "lobbying" | "sovereignty";
  gates: { power_min?: number; entanglement_min?: number; stature_min?: number };
  requires_active_contract_customer?: string; cooldown_weeks: number; weight: number }

export function eligiblePowerEvents(
  defs: PowerEventDef[], power: number, entanglement: number, stature: number,
  activeCustomers: Set<string>, cooldowns: Record<string, number>
): PowerEventDef[] {
  return defs.filter(d =>
    (d.gates.power_min == null || power >= d.gates.power_min) &&
    (d.gates.entanglement_min == null || entanglement >= d.gates.entanglement_min) &&
    (d.gates.stature_min == null || stature >= d.gates.stature_min) &&
    (!d.requires_active_contract_customer || activeCustomers.has(d.requires_active_contract_customer)) &&
    (cooldowns[d.id] ?? 0) <= 0);
}
/** Frequency scales with exposure: fire chance per turn grows with the gated meter. */
export function powerEventChance(category: PowerEventDef["category"], power: number, entanglement: number): number {
  const base = 0.02;
  const scale = category === "entanglement" ? entanglement / 100 : power / 7;
  return Math.min(0.12, base + 0.08 * scale);
}
