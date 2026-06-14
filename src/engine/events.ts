// The events engine — the connective tissue. Each tick it gathers events whose
// conditions pass, that are off cooldown, and whose slots resolve against the
// real market/team, then fires at most one (weighted, gated, min-gap apart) so
// the world feels alive without spamming. Pure + deterministic from the tick RNG.

import type { GameState } from "@/domain/state";
import type { EventState, ResolvedChoice, ResolvedEvent } from "@/domain/events";
import type { EventContent } from "@/domain/content";
import type { Company } from "@/content/load";
import { type Rng, chance, nextFloat } from "./rng";
import { buildEventContext, conditionsPass, evalCondition, type CtxValue } from "./eventConditions";
import { resolveSlots } from "./eventSlots";

type Ctx = Record<string, CtxValue>;

/** Base per-week probability that an eligible event fires. */
const BASE_FIRE_CHANCE = 0.2;
/** Minimum weeks between events, so they don't cluster. */
const MIN_GAP_WEEKS = 3;

export interface EventTick {
  event: ResolvedEvent | null;
  eventState: EventState;
}

export function evaluateEvents(
  state: GameState,
  events: EventContent[],
  market: Company[],
  rng: Rng,
): EventTick {
  const es = state.eventState;
  const week = state.clock.week;

  // One decision at a time; respect the minimum gap.
  if (state.pendingEvent || week - es.lastEventWeek < MIN_GAP_WEEKS) {
    return { event: null, eventState: es };
  }

  const ctx = buildEventContext(state, market);
  const eligible: { ev: EventContent; weight: number }[] = [];
  for (const ev of events) {
    if (es.fired.includes(ev.id)) continue; // one-shot already fired
    const last = es.cooldowns[ev.id];
    if (last != null && week - last < ev.cooldown_weeks) continue;
    if (!conditionsPass(ev.trigger.conditions, ctx)) continue;
    const weight = effectiveWeight(ev, ctx);
    if (weight <= 0) continue;
    eligible.push({ ev, weight });
  }

  if (eligible.length === 0 || !chance(rng, BASE_FIRE_CHANCE)) {
    return { event: null, eventState: es };
  }

  // Weighted pick; if its slots can't resolve, drop it and try again.
  const pool = eligible.slice();
  for (let attempt = 0; attempt < 4 && pool.length > 0; attempt++) {
    const idx = weightedIndex(rng, pool);
    const ev = pool[idx]!.ev;
    const resolved = resolveEvent(ev, state, market, rng, ctx);
    if (resolved) {
      const eventState: EventState = {
        cooldowns: { ...es.cooldowns, [ev.id]: week },
        fired: ev.one_shot ? [...es.fired, ev.id] : es.fired,
        lastEventWeek: week,
      };
      return { event: resolved, eventState };
    }
    pool.splice(idx, 1);
  }

  return { event: null, eventState: es };
}

function resolveEvent(ev: EventContent, state: GameState, market: Company[], rng: Rng, ctx: Ctx): ResolvedEvent | null {
  // Only choices whose gate passes are offered.
  const choiceList = ev.choices.filter((c) => !c.condition || conditionsPass([c.condition], ctx));
  if (choiceList.length === 0) return null;
  // Scan headline + body + every offered choice for slots, so a {slot} in a
  // choice's detail/effects is filled too.
  const templates = [ev.framing.headline, ev.framing.body, ...choiceList.flatMap((c) => [c.label, c.detail, c.effects])];
  const slots = resolveSlots(templates, state, market, rng);
  if (!slots) return null;
  const choices: ResolvedChoice[] = choiceList.map((c) => ({
    label: slots.fill(c.label),
    detail: slots.fill(c.detail),
    effects: slots.fill(c.effects),
    outcomeRef: c.outcome_ref,
  }));
  return {
    id: ev.id,
    category: ev.category,
    tone: ev.framing.tone,
    headline: slots.fill(ev.framing.headline),
    body: slots.fill(ev.framing.body),
    choices,
    week: state.clock.week,
  };
}

/** Authored weight × applicable weight-mods. Threshold/scheduled events with a
 *  zero authored weight get a baseline so they can fire when conditions hold. */
function effectiveWeight(ev: EventContent, ctx: Record<string, CtxValue>): number {
  // A zero authored weight means "fire when conditions hold" (threshold-style),
  // not "never" — give it a baseline so weight-0 events (incl. the binary launch
  // moments) aren't silently disabled.
  let base = ev.weight > 0 ? ev.weight : 7;
  for (const mod of ev.trigger.weight_mods ?? []) {
    if (evalCondition(mod.when, ctx)) base *= mod.factor;
  }
  return base;
}

function weightedIndex(rng: Rng, pool: { weight: number }[]): number {
  const total = pool.reduce((s, p) => s + p.weight, 0);
  let r = nextFloat(rng) * total;
  for (let i = 0; i < pool.length; i++) {
    r -= pool[i]!.weight;
    if (r <= 0) return i;
  }
  return pool.length - 1;
}
