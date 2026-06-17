// Capacity accounting (doc 07 §3.2). Capacity is the shared constraint: bets
// hold build capacity while they run, shipped products hold run capacity while
// live, and you buy ladder rungs to grow the pool. Pure — no RNG.

import type { CapacityRung, CapacityType, ProductArchetype, ProductTuning } from "@/domain/content";
import type { ActiveBet, CapacityState, LiveProduct } from "@/domain/products";

/** Starting capacity for a sub-industry: the tuning's base for every type, no
 *  rungs built yet. */
export function initCapacityState(capacityTypes: CapacityType[], tuning: ProductTuning): CapacityState {
  const owned: Record<string, number> = {};
  const rung_index: Record<string, number> = {};
  for (const cap of capacityTypes) {
    owned[cap.id] = tuning.starting_capacity;
    rung_index[cap.id] = -1;
  }
  return { owned, rung_index, builds_in_progress: [] };
}

/** Free capacity of a type right now: owned, minus what in-flight bets hold and
 *  what shipped products occupy. */
export function available(
  cap: CapacityState,
  capId: string,
  bets: ActiveBet[],
  products: LiveProduct[],
  productById: Map<string, ProductArchetype>,
): number {
  const owned = cap.owned[capId] ?? 0;
  const held = bets.reduce((s, b) => (b.cap_id === capId ? s + b.capacity_held : s), 0);
  const run = products.reduce(
    (s, p) => (productById.get(p.archetype_id)?.economics.capacity_type === capId ? s + p.capacity_run : s),
    0,
  );
  return owned - held - run;
}

/** The next rung to build for a capacity type, or null once fully laddered. */
export function nextRung(cap: CapacityState, type: CapacityType): { rung: CapacityRung; index: number } | null {
  const index = (cap.rung_index[type.id] ?? -1) + 1;
  return index < type.rungs.length ? { rung: type.rungs[index]!, index } : null;
}

/** True while a rung of this capacity type is being built. */
export function isBuilding(cap: CapacityState, capId: string): boolean {
  return cap.builds_in_progress.some((b) => b.cap_id === capId);
}

/** Commit the next rung: mark it purchased and schedule the build. The caller
 *  pays nextRung().rung.cost. A no-op when fully laddered. */
export function startRungBuild(cap: CapacityState, type: CapacityType): CapacityState {
  const next = nextRung(cap, type);
  if (!next) return cap;
  return {
    ...cap,
    rung_index: { ...cap.rung_index, [type.id]: next.index },
    builds_in_progress: [...cap.builds_in_progress, { cap_id: type.id, rung_index: next.index, weeks_left: next.rung.build_weeks }],
  };
}

/** Tick rung builds one week; completed rungs add their authored capacity delta. */
export function tickCapacityBuilds(cap: CapacityState, typeById: Map<string, CapacityType>): CapacityState {
  if (cap.builds_in_progress.length === 0) return cap;
  const owned = { ...cap.owned };
  const remaining: CapacityState["builds_in_progress"] = [];
  for (const b of cap.builds_in_progress) {
    const weeks_left = b.weeks_left - 1;
    if (weeks_left <= 0) {
      const rung = typeById.get(b.cap_id)?.rungs[b.rung_index];
      if (rung) owned[b.cap_id] = (owned[b.cap_id] ?? 0) + rung.capacity;
    } else {
      remaining.push({ ...b, weeks_left });
    }
  }
  return { ...cap, owned, builds_in_progress: remaining };
}

/** Whether a new bet may start: enough free build capacity, and under the
 *  concurrency cap. */
export function canStartBet(args: {
  cap: CapacityState;
  capId: string;
  bets: ActiveBet[];
  products: LiveProduct[];
  productById: Map<string, ProductArchetype>;
  capacityToBuild: number;
  maxConcurrentBets: number;
}): boolean {
  if (args.bets.length >= args.maxConcurrentBets) return false;
  return available(args.cap, args.capId, args.bets, args.products, args.productById) >= args.capacityToBuild;
}
