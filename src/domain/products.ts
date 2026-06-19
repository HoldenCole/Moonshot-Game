// Runtime state for the Products / R&D / Capacity system (doc 07 §2). These live
// on the operating company and serialize into saves. The pure engine modules
// (rd.ts, capacity.ts, products.ts) read and return these; integration into the
// tick + PlayerCompany comes in a later phase.

/** R&D lines accumulate tech levels from the weekly budget you split across them. */
export interface RDState {
  /** Current tech level per line id. */
  levels: Record<string, number>;
  /** The player's budget split per line id — fractions summing to ~1. */
  allocation: Record<string, number>;
  /** $M/week committed to R&D overall (divided by the allocation). */
  rd_budget_per_week: number;
}

/** A capacity rung being built; completes when weeks_left hits 0. */
export interface RungBuild {
  cap_id: string;
  rung_index: number;
  weeks_left: number;
}

/** Per capacity type: total units available, the highest rung purchased, and any
 *  in-flight rung builds. */
export interface CapacityState {
  owned: Record<string, number>;
  /** Highest rung purchased per cap id (-1 = base only). */
  rung_index: Record<string, number>;
  builds_in_progress: RungBuild[];
}

/** A bet in flight — creating or upgrading a product. Holds build capacity until
 *  it ships, then becomes a LiveProduct. */
export interface ActiveBet {
  id: string;
  archetype_id: string;
  instance_name: string;
  kind: "create" | "upgrade";
  weeks_left: number;
  /** The build's full length at commit (weeks_left starts here). Lets the rush
   *  quote price against the original schedule even as weeks_left ticks down. */
  build_weeks_total: number;
  /** = archetype.economics.capacity_to_build; released on ship. */
  capacity_held: number;
  cap_id: string;
  /** Tech levels snapshotted at commit, for the ship-time quality computation. */
  committed_levels: Record<string, number>;
}

export type ProductLifecycle = "ramping" | "mature" | "declining";

/** A shipped product, earning revenue and occupying run capacity. */
export interface LiveProduct {
  id: string;
  archetype_id: string;
  instance_name: string;
  shipped_week: number;
  /** 0–100, computed at ship; an upgrade bet raises it. */
  quality: number;
  age_weeks: number;
  state: ProductLifecycle;
  /** 0–1 of the addressable market, evolving vs. rivals. */
  share: number;
  /** $M/yr, derived; cached for the UI. */
  revenue_run_rate: number;
  /** = archetype.economics.capacity_to_run. */
  capacity_run: number;
}

/** The whole depth-system runtime for one company. */
export interface ProductsRuntime {
  rd: RDState;
  capacity: CapacityState;
  bets: ActiveBet[];
  products: LiveProduct[];
  /** The sector's TAM multiplier, compounding from 1.0 as the market grows. */
  tam_scale?: number;
}
