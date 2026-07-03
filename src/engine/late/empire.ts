// ============================================================================
// empire.ts — Sub-economies (13) + synergies (14): the tick, the resource
// pool, flow/presence synergies with the anti-spiral floors. Pure & seeded.
// ============================================================================

// ---------------- SUB-ECONOMIES ----------------
export interface SubEconomyDef {
  id: string; opened_by: string; branch: "space" | "intelligence" | "energy" | "economic";
  scale: { starting_scale: number; scale_cap: number; growth_rate: number; exec_domain: string };
  produces: { revenue_per_scale: number; resources: Record<string, number> };
  consumes: { upkeep_per_scale: number; resources?: Record<string, number> };
  power_tiers: [number, number][];       // [scale_threshold, cumulative_power]
  crisis_chance: number; events_pool: string;
}
export type Posture = "grow" | "harvest" | "balanced";

export interface SubEconState {
  instances: Record<string, SubEconInstance>;
  resource_pool: Record<string, number>;  // last-tick production (read by synergies)
}
export interface SubEconInstance {
  def_id: string; scale: number; cap: number; posture: Posture;
  preview: boolean;                        // 0.4 output until mega completes
}

export const SUBECON_TUNING = {
  grow_growth_mult: 1.6, harvest_growth_mult: 0.5, harvest_revenue_mult: 1.4,
  preview_output_mult: 0.4, invest_raise_cap_cost: 50,
  branch_pacing: { space: 1.0, intelligence: 1.4, energy: 1.0, economic: 1.5 } as Record<string, number>,
};

export function openSubEconomy(s: SubEconState, def: SubEconomyDef, preview = false): void {
  if (s.instances[def.id]) { s.instances[def.id]!.preview = false; return; } // preview → full
  s.instances[def.id] = { def_id: def.id, scale: def.scale.starting_scale, cap: def.scale.scale_cap, posture: "balanced", preview };
}
/** A repeat megaproject build step-grows its sub-economy (outputAdd% of base scale). */
export function scaleSubEconomy(s: SubEconState, defId: string, outputAddPct: number, def: SubEconomyDef): void {
  const inst = s.instances[defId]; if (!inst) return;
  inst.cap = Math.round(inst.cap * (1 + outputAddPct / 200));   // repeats also raise the ceiling
  inst.scale = Math.min(inst.cap, inst.scale + def.scale.starting_scale * (outputAddPct / 100) * 5);
}

export interface SubEconTick { revenue: number; upkeep: number; power: number;
  crises: { def_id: string; pool: string }[] }

export function tickSubEconomies(
  s: SubEconState, defs: Record<string, SubEconomyDef>, weeksElapsed: number,
  execQualityByDomain: Record<string, number>, rng: () => number, growthMult = 1
): SubEconTick {
  const out: SubEconTick = { revenue: 0, upkeep: 0, power: 0, crises: [] };
  const pool: Record<string, number> = {};
  // Pass 1: production (fills the pool this tick).
  for (const inst of Object.values(s.instances)) {
    const d = defs[inst.def_id];
    const mult = inst.preview ? SUBECON_TUNING.preview_output_mult : 1;
    for (const [res, per] of Object.entries(d!.produces.resources))
      pool[res] = (pool[res] ?? 0) + inst.scale * per * mult;
  }
  // Pass 2: consumption, growth, revenue, power.
  for (const inst of Object.values(s.instances)) {
    const d = defs[inst.def_id];
    const yearFrac = weeksElapsed / 52;
    // Input satisfaction: starved inputs throttle output (the interlocking machine).
    let inputSat = 1;
    for (const [res, per] of Object.entries(d!.consumes.resources ?? {})) {
      const need = inst.scale * per;
      const have = pool[res] ?? 0;
      if (need > 0) { const sat = Math.min(1, have / need); inputSat = Math.min(inputSat, sat);
        pool[res] = Math.max(0, have - need); }
    }
    const outMult = (inst.preview ? SUBECON_TUNING.preview_output_mult : 1) * inputSat
      * (inst.posture === "harvest" ? SUBECON_TUNING.harvest_revenue_mult : 1);
    out.revenue += inst.scale * d!.produces.revenue_per_scale * outMult * yearFrac * 1000; // $M
    out.upkeep  += inst.scale * d!.consumes.upkeep_per_scale * yearFrac * 1000;
    // Growth toward cap: posture × branch pacing × exec quality.
    const g = growthMult * d!.scale.growth_rate
      * (inst.posture === "grow" ? SUBECON_TUNING.grow_growth_mult : inst.posture === "harvest" ? SUBECON_TUNING.harvest_growth_mult : 1)
      * (SUBECON_TUNING.branch_pacing[d!.branch] ?? 1)
      * (0.7 + 0.6 * (execQualityByDomain[d!.scale.exec_domain] ?? 0.5))
      * inputSat;
    inst.scale = Math.min(inst.cap, inst.scale * (1 + g * weeksElapsed / 52));
    // Ongoing power from scale tiers.
    let p = 0; for (const [th, pw] of d!.power_tiers) if (inst.scale >= th) p = pw;
    out.power += p;
    // Crisis roll.
    if (rng() < d!.crisis_chance * weeksElapsed / 4) out.crises.push({ def_id: d!.id, pool: d!.events_pool });
  }
  s.resource_pool = pool;
  return out;
}

// ---------------- SYNERGIES ----------------
export interface SynergyDef {
  id: string; activation: "flow" | "presence";
  fed_by_resources?: string[];
  requires_fronts?: string[]; requires_research?: string[];
  effects: { build_cost_mult?: Record<string, number>; rd_speed_mult?: Record<string, number>;
             opex_mult?: Record<string, number>; ops_cost_mult?: Record<string, number>;
             power_bonus?: number; share_defense?: number; retention_bonus?: number;
             megaproject_cost_mult?: Record<string, number>; megaproject_time_mult?: Record<string, number> };
  cap: number; full_strength_at?: number;
}
export const SYNERGY_FLOORS = { min_build_cost: 0.45, min_opex: 0.5, max_rd_speed: 2.5, max_power: 6 };

export interface ActiveSynergy { id: string; strength: number }  // presence: 1.0

export function evalSynergies(
  defs: SynergyDef[], resourcePool: Record<string, number>,
  frontsOperated: string[], researchDone: Set<string>
): ActiveSynergy[] {
  const out: ActiveSynergy[] = [];
  for (const d of defs) {
    if (d.activation === "presence") {
      const ok = (d.requires_fronts ?? []).every(f => frontsOperated.includes(f))
        && (d.requires_research ?? []).every(r => researchDone.has(r));
      if (ok) out.push({ id: d.id, strength: 1 });
    } else {
      const output = (d.fed_by_resources ?? []).reduce((s, r) => s + (resourcePool[r] ?? 0), 0);
      if (output > 0) {
        const full = d.full_strength_at ?? 1;
        out.push({ id: d.id, strength: output / (output + full) });   // diminishing, →1
      }
    }
  }
  return out;
}

/** Composite modifiers with the global anti-spiral floors. target = sub-industry | branch | "all". */
export function compositeModifiers(active: ActiveSynergy[], defs: Record<string, SynergyDef>, target: string, branch: string) {
  let build = 1, rd = 1, opex = 1, power = 0;
  const applies = (m?: Record<string, number>) =>
    m ? (m[target] ?? m[branch] ?? m["all"]) : undefined;
  for (const a of active) {
    const d = defs[a.id];
    const lerp = (full: number) => 1 + (full - 1) * a.strength;      // scale toward the full effect by strength
    const b = applies(d!.effects.build_cost_mult); if (b != null) build *= Math.max(d!.cap, lerp(b));
    const r = applies(d!.effects.rd_speed_mult);   if (r != null) rd    *= Math.min(d!.cap, lerp(r));
    const o = applies(d!.effects.opex_mult) ?? applies(d!.effects.ops_cost_mult);
    if (o != null) opex *= Math.max(d!.cap, lerp(o));
    if (d!.effects.power_bonus) power += d!.effects.power_bonus * a.strength;
  }
  return {
    build_cost_mult: Math.max(SYNERGY_FLOORS.min_build_cost, build),
    rd_speed_mult:   Math.min(SYNERGY_FLOORS.max_rd_speed, rd),
    opex_mult:       Math.max(SYNERGY_FLOORS.min_opex, opex),
    power_bonus:     Math.min(SYNERGY_FLOORS.max_power, Math.round(power * 10) / 10),
  };
}
