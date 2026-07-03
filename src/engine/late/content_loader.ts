// ============================================================================
// content_loader.ts — Adapters from the TOML content shapes (content/*.toml,
// parsed to JSON/objects by the app's TOML loader) into the engine types.
// Pure mapping; validation happens at authoring time (the Python validators).
// ============================================================================
import { SubEconomyDef, SynergyDef } from "./empire";
import { ContractTemplate, CustomerDef, ClearanceDef, PowerEventDef } from "./contracts";

type Raw = Record<string, any>;

// ---- sub-economies: content/sub_economies/*.toml ----
export function loadSubEconomies(files: Raw): Record<string, SubEconomyDef> {
  const out: Record<string, SubEconomyDef> = {};
  for (const [key, file] of Object.entries(files)) {
    if (key === "_tuning") continue;
    for (const [id, t] of Object.entries(file as Raw)) {
      const d = t as Raw;
      out[id] = {
        id, opened_by: d.opened_by, branch: d.branch,
        scale: { starting_scale: d.scale.starting_scale, scale_cap: d.scale.scale_cap,
                 growth_rate: d.scale.growth_rate, exec_domain: d.scale.exec_domain },
        produces: { revenue_per_scale: d.produces.revenue_per_scale,
                    resources: d.produces.resources ?? {} },
        consumes: { upkeep_per_scale: d.consumes.upkeep_per_scale,
                    resources: d.consumes.resources },
        power_tiers: (d.power.power_per_scale_tier as [number, number][]),
        crisis_chance: d.events.crisis_chance, events_pool: d.events.pool,
      };
    }
  }
  return out;
}

// ---- synergies: content/synergies/*.toml ----
export function loadSynergies(files: Raw): SynergyDef[] {
  const out: SynergyDef[] = [];
  for (const [key, file] of Object.entries(files)) {
    if (key === "_tuning") continue;
    for (const [id, t] of Object.entries(file as Raw)) {
      const d = t as Raw;
      const effects: SynergyDef["effects"] = {};
      for (const k of ["build_cost_mult", "rd_speed_mult", "opex_mult", "ops_cost_mult",
                       "megaproject_cost_mult", "megaproject_time_mult"] as const) {
        if (d.effect[k]) (effects as Raw)[k] = d.effect[k];
      }
      if (d.effect.power_bonus) {
        // power_bonus authored as { all = N } or scalar
        effects.power_bonus = typeof d.effect.power_bonus === "number"
          ? d.effect.power_bonus : Object.values(d.effect.power_bonus as Raw)[0] as number;
      }
      if (d.effect.retention_bonus) {
        effects.retention_bonus = typeof d.effect.retention_bonus === "number"
          ? d.effect.retention_bonus : Object.values(d.effect.retention_bonus as Raw)[0] as number;
      }
      out.push({
        id, activation: d.activation,
        fed_by_resources: d.source?.fed_by_resources,
        requires_fronts: d.source?.requires_fronts,
        requires_research: d.source?.requires_research,
        effects, cap: d.effect.cap,
        full_strength_at: d.tuning?.full_strength_at,
      });
    }
  }
  return out;
}

// ---- contracts: content/contracts/*.toml ----
export interface ContractContent {
  customers: Record<string, CustomerDef>;
  clearances: Record<string, ClearanceDef>;
  templates: Record<string, ContractTemplate>;
  identityThresholds: { below: number; label: string }[];
}
export function loadContracts(raw: { customers: Raw; clearances: Raw; templates: Raw; tuning: Raw }): ContractContent {
  const customers: Record<string, CustomerDef> = {};
  for (const [id, c] of Object.entries(raw.customers)) {
    const d = c as Raw;
    customers[id] = { id, channel: d.channel,
      entanglement_per_contract: d.entanglement_per_contract,
      power_per_contract: d.power_per_contract,
      reputation_effect: d.reputation_effect,
      requires_clearance: d.requires_clearance ?? "" };
  }
  const clearances: Record<string, ClearanceDef> = {};
  for (const [id, c] of Object.entries(raw.clearances)) {
    const d = c as Raw;
    clearances[id] = { id, cost: d.cost, weeks: d.weeks,
      entanglement_on_grant: d.entanglement_on_grant,
      requires: { stature_min: d.requires.stature_min, prior_clearance: d.requires.prior_clearance } };
  }
  const templates: Record<string, ContractTemplate> = {};
  for (const [id, c] of Object.entries(raw.templates)) {
    const d = c as Raw;
    templates[id] = { id, customer: d.customer, name: d.name, sub_industry: d.sub_industry,
      requires: { rd_levels: d.requires?.rd_levels, product_tier: d.requires?.product_tier,
                  stature_min: d.requires?.stature_min, clearance: d.requires?.clearance },
      payment: d.payment, effects: d.effects, has_leak_risk: d.has_leak_risk };
  }
  const identityThresholds = (raw.tuning.mix_identity?.thresholds ?? []).map((t: Raw) => ({
    below: t.gov_share_below ?? 1.01, label: t.label }));
  return { customers, clearances, templates, identityThresholds };
}

// ---- power events: content/events/power/*.toml ----
export function loadPowerEvents(files: Raw): PowerEventDef[] {
  const out: PowerEventDef[] = [];
  for (const file of Object.values(files)) {
    for (const [id, t] of Object.entries(file as Raw)) {
      const d = t as Raw;
      out.push({ id, category: d.category,
        gates: { power_min: d.gates?.power_min, entanglement_min: d.gates?.entanglement_min,
                 stature_min: d.gates?.stature_min },
        requires_active_contract_customer: d.requires_active_contract_customer,
        cooldown_weeks: d.cooldown_weeks, weight: d.weight });
    }
  }
  return out;
}

// ---- sub-economy events: content/events/sub_economies/*.toml ----
export interface SubEventDef {
  id: string; pool: string; kind: "flavor" | "opportunity" | "crisis";
  weight: number; cooldown_weeks: number; headline: string; body: string;
  gates?: { power_min?: number };
  effects?: Record<string, number | string>;
  choices?: { label: string; effects?: Record<string, number | string> }[];
}
export function loadSubEvents(files: Raw): SubEventDef[] {
  const out: SubEventDef[] = [];
  for (const file of Object.values(files)) {
    for (const [id, t] of Object.entries(file as Raw)) {
      const d = t as Raw;
      out.push({ id, pool: d.pool, kind: d.kind, weight: d.weight,
        cooldown_weeks: d.cooldown_weeks, headline: d.headline, body: d.body,
        gates: d.gates, effects: d.effects, choices: d.choices });
    }
  }
  return out;
}

// ---- research nodes: content/research/*.toml ----
import { ResearchNode } from "./research";
export function loadResearchNodes(files: Raw): Record<string, ResearchNode> {
  const out: Record<string, ResearchNode> = {};
  for (const [key, file] of Object.entries(files)) {
    if (key === "_tuning") continue;
    for (const [id, t] of Object.entries(file as Raw)) {
      const d = t as Raw;
      out[id] = {
        id, name: d.name,
        kind: d.tier === "cross_domain" ? "cross_domain" : d.tier,
        sub_industry: d.sub_industry ?? "cross_domain",
        prereqs: d.requires?.projects ?? [],
        cost: d.cost.budget, weeks: d.cost.weeks,
        gates_megaproject: (d.unlocks?.megaproject_unlock ?? [])[0],
      };
    }
  }
  return out;
}

// ---- megaprojects: content/megaprojects/megaprojects.toml ----
import { MegaprojectDef } from "./megaprojects";
export function loadMegaprojects(file: Raw): Record<string, MegaprojectDef> {
  const out: Record<string, MegaprojectDef> = {};
  for (const [id, t] of Object.entries(file)) {
    const d = t as Raw;
    out[id] = {
      id, name: d.name, branch: d.branch, repeatable: d.repeatable,
      gate: { research: d.gate.research, stature_min: d.gate.stature_min,
              capital: d.gate.capital, exec_domain: d.gate.exec_domain },
      stages: (d.stages as Raw[]).map(s => ({ id: s.id, name: s.name, weeks: s.weeks,
        cost: s.cost, setback_chance: s.setback_chance, catastrophe_chance: s.catastrophe_chance })),
      on_complete: { sub_economy: d.on_complete.sub_economy, power: d.on_complete.power },
      base_output: d.on_complete.base_output,
    };
    (out[id] as Raw).legacy_victory = d.on_complete.legacy_victory;
  }
  return out;
}

// ---- executives: content/executives/*.toml ----
import { DomainDef, TraitDef, ArchetypeDef, ExecTuning } from "./executives";
export interface ExecContent {
  domains: Record<string, DomainDef>; traits: Record<string, TraitDef>;
  archetypes: Record<string, ArchetypeDef>;
  names: { first: string[]; last: string[] }; tuning: ExecTuning;
}
export function loadExecutives(raw: { domains: Raw; traits: Raw; archetypes: Raw; names: Raw; tuning: Raw }): ExecContent {
  const domains: Record<string, DomainDef> = {};
  for (const [id, d] of Object.entries(raw.domains)) {
    const t = d as Raw;
    domains[id] = { id, name: t.name, runs: t.runs, unlock_stature: t.unlock_stature,
      gates_megaprojects: t.gates_megaprojects ?? [] };
  }
  const traits: Record<string, TraitDef> = {};
  for (const [id, d] of Object.entries(raw.traits)) {
    const t = d as Raw;
    traits[id] = { id, name: t.name, effects: t.effects, applies_to: t.applies_to ?? [],
      comp_premium: t.comp_premium ?? 0, flight_risk: t.flight_risk };
  }
  const archetypes: Record<string, ArchetypeDef> = {};
  for (const [id, d] of Object.entries(raw.archetypes)) {
    const t = d as Raw;
    archetypes[id] = { id, domain: t.domain, name: t.name,
      competence_range: t.competence_range, trait_pool: t.trait_pool,
      trait_count: t.trait_count, min_stature: t.min_stature, flavor_titles: t.flavor_titles };
  }
  return { domains, traits, archetypes,
    names: { first: raw.names.pools.first, last: raw.names.pools.last },
    tuning: { candidate_pool_size: raw.tuning.global.candidate_pool_size,
      market_refresh_weeks: raw.tuning.global.market_refresh_weeks,
      headhunt_cost: raw.tuning.global.headhunt_cost,
      base_salary_by_competence: raw.tuning.comp.base_salary_by_competence,
      equity_range: raw.tuning.comp.equity_expectation_range,
      underpay_defection_per_quarter: raw.tuning.retention.underpay_defection_per_quarter,
      star_poach_multiplier: raw.tuning.retention.star_poach_multiplier,
      fire_morale_hit: raw.tuning.retention.fire_morale_hit } };
}

// ---- rivals: content/rivals/*.toml ----
import { RivalDef, RivalTuning, MegaMeta } from "./rivals";
export function loadRivals(raw: { rivals: Raw; tuning: Raw }): { defs: Record<string, RivalDef>; tuning: RivalTuning } {
  const defs: Record<string, RivalDef> = {};
  for (const [id, t] of Object.entries(raw.rivals)) {
    const d = t as Raw;
    defs[id] = { id, name: d.name, ceo: d.ceo, tagline: d.tagline, branches: d.branches,
      home_subs: d.home_subs, aggression: d.aggression, variance: d.variance,
      starting_stature: d.starting_stature, stature_growth_per_year: d.stature_growth_per_year,
      ambitions: d.ambitions, news_style: d.news_style, description: d.description };
  }
  const g = raw.tuning.global;
  return { defs, tuning: { research_weeks_base: g.research_weeks_base, build_time_mult: g.build_time_mult,
    setback_chance: g.setback_chance, setback_delay_weeks: g.setback_delay_weeks,
    ambient_beats_per_year: g.ambient_beats_per_year, poach_attribution: g.poach_attribution,
    surge_chance_per_year: g.surge_chance_per_year, surge_weeks: g.surge_weeks,
    surge_mult: g.surge_mult, pressure_per_player_legacy: g.pressure_per_player_legacy,
    poach_attempt_per_year: g.poach_attempt_per_year, poach_base_success: g.poach_base_success } };
}
export function megaMetaFrom(megas: Record<string, import("./megaprojects").MegaprojectDef>): Record<string, MegaMeta> {
  const out: Record<string, MegaMeta> = {};
  for (const [id, m] of Object.entries(megas))
    out[id] = { total_weeks: m.stages.reduce((s, st) => s + st.weeks, 0),
      n_stages: m.stages.length, legacy: (m as Raw).legacy_victory, name: m.name };
  return out;
}

// ============================================================================
// Content packs — the DLC foundation (21 §II). A pack is the same raw shape
// as base content; merging is ADDITIVE: new ids append, collisions are errors.
// ============================================================================
export interface PackReport { pack: string; added: number; collisions: string[] }

function mergeFamily(base: Raw, add: Raw, path: string, report: PackReport) {
  for (const [k, v] of Object.entries(add)) {
    if (k === "_tuning") continue;                    // packs may not override tuning
    if (v && typeof v === "object" && !Array.isArray(v)
        && base[k] && typeof base[k] === "object" && !Array.isArray(base[k])
        && !(v as Raw).id) {
      mergeFamily(base[k], v as Raw, `${path}.${k}`, report);   // nested group (e.g. events_sub pools)
    } else if (k in base) {
      report.collisions.push(`${path}.${k}`);
    } else {
      base[k] = v; report.added++;
    }
  }
}

/** Merge DLC/mod packs into base raw content. Returns per-pack reports; throws on collisions. */
export function mergeContentPacks(base: Raw, packs: { id: string; content: Raw }[]): PackReport[] {
  const reports: PackReport[] = [];
  for (const pack of packs) {
    const report: PackReport = { pack: pack.id, added: 0, collisions: [] };
    for (const [family, add] of Object.entries(pack.content)) {
      if (family === "manifest") continue;
      if (!(family in base)) { base[family] = add; report.added++; continue; }
      mergeFamily(base[family] as Raw, add as Raw, family, report);
    }
    if (report.collisions.length)
      throw new Error(`pack '${pack.id}' collides with existing ids: ${report.collisions.join(", ")}`);
    reports.push(report);
  }
  return reports;
}

// ---- pacing: content/eras/*.toml + content/pressures/*.toml ----
import { EraDef, CycleTuning, PressureDef } from "./pacing";
export function loadEras(raw: Raw): EraDef[] {
  return Object.entries(raw).map(([id, t]) => {
    const d = t as Raw;
    return { id, name: d.name, order: d.order, enter: d.enter,
      texture: d.texture, transition_prose: d.transition_prose };
  }).sort((a, b) => a.order - b.order);
}
export function loadCycleTuning(raw: Raw): CycleTuning {
  const t = raw.tuning;
  return { steady_weeks_range: t.steady_weeks_range, boom_weeks_range: t.boom_weeks_range,
    winter_weeks_range: t.winter_weeks_range, p_boom_from_steady: t.p_boom_from_steady,
    boom_payment_mult: t.boom_payment_mult, boom_growth_mult: t.boom_growth_mult,
    boom_extra_offers: t.boom_extra_offers, winter_payment_mult: t.winter_payment_mult,
    winter_growth_mult: t.winter_growth_mult, winter_offer_penalty: t.winter_offer_penalty,
    prose: raw.prose };
}
export function loadPressures(raw: Raw): Record<string, PressureDef> {
  const out: Record<string, PressureDef> = {};
  for (const [id, t] of Object.entries(raw)) {
    const d = t as Raw;
    out[id] = { id, name: d.name, duration_weeks: d.duration_weeks, modifiers: d.modifiers,
      on_start: d.on_start, on_end: d.on_end, triggered_by: d.triggered_by };
  }
  return out;
}
