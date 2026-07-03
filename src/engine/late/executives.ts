// ============================================================================
// executives.ts — The executive layer (12): procedural candidate generation
// (archetypes × traits × names, stature-gated), hiring, comp, retention/
// defection, and the competence→quality feed the other engines consume.
// Pure + seeded, like every other engine.
// ============================================================================

export interface DomainDef {
  id: string; name: string; runs: string;
  unlock_stature: number; gates_megaprojects: string[];
}
export interface TraitDef {
  id: string; name: string;
  effects: Record<string, number>;
  applies_to: string[]; comp_premium: number; flight_risk?: number;
}
export interface ArchetypeDef {
  id: string; domain: string; name: string;
  competence_range: [number, number];
  trait_pool: string[]; trait_count: [number, number];
  min_stature: number; flavor_titles: string[];
}
export interface ExecTuning {
  candidate_pool_size: number; market_refresh_weeks: number; headhunt_cost: number;
  base_salary_by_competence: number; equity_range: [number, number];
  underpay_defection_per_quarter: number; star_poach_multiplier: number; fire_morale_hit: number;
}
export interface Candidate {
  id: string; name: string; domain: string; archetype: string; flavor: string;
  competence: number; traits: string[];
  ask_salary: number;            // $M/yr
  ask_equity: number;            // fraction
}
export interface SeatedExec extends Candidate {
  paid_salary: number; hired_week: number; morale: number;   // 0..1
}
export interface ExecState {
  seats: Record<string, SeatedExec>;       // domain -> exec
  market: Candidate[];
  weeks_since_refresh: number;
  departures: { exec: SeatedExec; week: number; reason: string }[];
}

export function initExecs(): ExecState {
  return { seats: {}, market: [], weeks_since_refresh: 0, departures: [] };
}

export function generateCandidates(
  archetypes: Record<string, ArchetypeDef>, traits: Record<string, TraitDef>,
  names: { first: string[]; last: string[] }, domains: Record<string, DomainDef>,
  stature: number, tuning: ExecTuning, rng: () => number
): Candidate[] {
  const eligible = Object.values(archetypes).filter(a =>
    stature >= a.min_stature && stature >= domains[a.domain]!.unlock_stature);
  const out: Candidate[] = [];
  for (let i = 0; i < tuning.candidate_pool_size && eligible.length; i++) {
    const a = eligible[Math.floor(rng() * eligible.length)]!;
    const [lo, hi] = a!.competence_range;
    const competence = Math.round(lo + rng() * (hi - lo));
    const nTraits = a!.trait_count[0] + Math.floor(rng() * (a!.trait_count[1] - a!.trait_count[0] + 1));
    const pool = [...a!.trait_pool];
    const picked: string[] = [];
    for (let k = 0; k < nTraits && pool.length; k++)
      picked.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]!);
    const premium = picked.reduce((s, t) => s + (traits[t]?.comp_premium ?? 0), 0);
    const name = `${names.first[Math.floor(rng() * names.first.length)]} ${names.last[Math.floor(rng() * names.last.length)]}`;
    out.push({
      id: `${a!.id}_${Math.floor(rng() * 1e6)}`, name, domain: a!.domain, archetype: a!.id,
      flavor: a.flavor_titles[Math.floor(rng() * a.flavor_titles.length)]!,
      competence, traits: picked,
      ask_salary: Math.round(competence * tuning.base_salary_by_competence * (1 + premium) * 10) / 10,
      ask_equity: Math.round((tuning.equity_range[0] + (competence / 100) *
        (tuning.equity_range[1] - tuning.equity_range[0])) * (1 + premium) * 1000) / 1000,
    });
  }
  return out;
}

export function hireExec(s: ExecState, cand: Candidate, paidSalary: number, week: number):
  { ok: boolean; reason?: string } {
  if (s.seats[cand.domain]) return { ok: false, reason: `the ${cand.domain} seat is filled` };
  s.seats[cand.domain] = { ...cand, paid_salary: paidSalary, hired_week: week, morale: 0.8 };
  s.market = s.market.filter(c => c.id !== cand.id);
  return { ok: true };
}

export function fireExec(s: ExecState, domain: string, week: number, tuning: ExecTuning):
  { severance: number; morale_hit: number } | null {
  const e = s.seats[domain];
  if (!e) return null;
  delete s.seats[domain];
  s.departures.push({ exec: e, week, reason: "fired" });
  return { severance: Math.round(e.paid_salary * 1.5 * 10) / 10, morale_hit: tuning.fire_morale_hit };
}

// quarterly retention roll: underpaid execs may defect (stars x2, loyalists x0.3)
export function tickRetention(
  s: ExecState, traits: Record<string, TraitDef>, tuning: ExecTuning,
  week: number, weeksElapsed: number, rng: () => number
): SeatedExec[] {
  const gone: SeatedExec[] = [];
  const quarterFrac = weeksElapsed / 13;
  for (const [domain, e] of Object.entries(s.seats)) {
    if (e.paid_salary >= e.ask_salary) { e.morale = Math.min(1, e.morale + 0.02 * quarterFrac); continue; }
    let p = tuning.underpay_defection_per_quarter * quarterFrac;
    if (e.traits.includes("star")) p *= tuning.star_poach_multiplier;
    for (const t of e.traits) {
      const dm = traits[t]?.effects?.defection_mult;
      if (dm !== undefined) p *= dm;
    }
    e.morale = Math.max(0, e.morale - 0.05 * quarterFrac);
    if (rng() < p) {
      delete s.seats[domain];
      s.departures.push({ exec: e, week, reason: e.traits.includes("star") ? "poached" : "resigned" });
      gone.push(e);
    }
  }
  return gone;
}

// the feed the other engines consume: exec quality per domain (0..1)
export function execQuality(s: ExecState, traits: Record<string, TraitDef>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [domain, e] of Object.entries(s.seats)) {
    let q = e.competence / 100;
    for (const t of e.traits) q += traits[t]?.effects?.competence_bonus ?? 0;
    out[domain] = Math.min(1, Math.round(q * (0.7 + 0.3 * e.morale) * 100) / 100);
  }
  return out;
}
