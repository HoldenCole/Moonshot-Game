// Event slot resolution. Templates carry {rival}, {researcher}, {supplier},
// {customer}, {offer_amount}, {star_researcher}, {competitor_move}, {cofounder}.
// Slots resolve from the real market + team so events name actual entities
// ("Cerebra is poaching Dr. Okafor"). If a required slot can't resolve, the
// event is skipped (decision M).

import type { GameState } from "@/domain/state";
import type { Company } from "@/content/load";
import { industryLabel } from "@/domain/ids";
import { type Rng, nextRange, pick } from "./rng";
import { generateTeam } from "./narrative";
import { formatMoney } from "./format";

const FIRST = ["Lin", "Maya", "Sam", "Aria", "Marcus", "Priya", "Elena", "Sofia", "Omar", "Yuki", "Theo", "Nadia", "Raj", "Dana", "Ivo", "Mara"];
const LAST = ["Okafor", "Wei", "Chen", "Rao", "Cruz", "Park", "Adler", "Haddad", "Nguyen", "Boone", "Vos", "Mensah", "Iyer", "Kane", "Sato"];

const COMPETITOR_MOVES = [
  "A rival just shipped a capability jump.",
  "A new model release has reset expectations across the field.",
  "A competitor quietly leapfrogged the public benchmark.",
];

// Short, headline-friendly sector names for the {sector} slot (the full
// industryLabel — "Artificial Intelligence" — reads clumsily inline).
const SECTOR_SHORT: Record<string, string> = {
  ai: "AI",
  space: "space",
  biotech: "biotech",
  energy: "energy",
  defense: "defense",
  advanced_mfg: "advanced manufacturing",
  mobility: "mobility",
  quantum: "quantum",
};

// Flavor pools for macro/world slots (no mechanical link — they name the moment).
const BANKS = ["Meridian Capital", "Atlas Trust", "Sterling & Co.", "Calloway Brothers", "Granite Financial"];
const TAX_TARGETS = ["capital-gains treatment", "the R&D credit", "corporate tax rates", "stock-comp deductions", "carried interest"];
const PROGRAM_SUMMARIES = [
  "Budgets and priorities are being redrawn, and the contracts will follow.",
  "Procurement is reopening — and the incumbents aren't guaranteed a seat.",
  "It resets which capabilities get funded for the next decade.",
];

const BASE_COMP: Record<string, number> = {
  pre_seed: 0.3,
  seed: 0.45,
  series_a: 0.9,
  series_b: 1.6,
  series_c: 2.4,
  growth: 3.2,
  late_stage: 4.0,
  public: 4.0,
  idea: 0.3,
};

/** Resolve every {slot} used in the templates. Returns the filled strings, or
 *  null if a required slot can't be filled. */
export function resolveSlots(
  templates: string[],
  state: GameState,
  market: Company[],
  rng: Rng,
): { fill: (s: string) => string } | null {
  const text = templates.join(" ");
  const needed = new Set([...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!));
  const slots: Record<string, string> = {};

  for (const slot of needed) {
    const value = resolveSlot(slot, state, market, rng);
    if (value == null) return null; // required slot failed → skip event
    slots[slot] = value;
  }

  return {
    fill: (s: string) => s.replace(/\{(\w+)\}/g, (_, k: string) => slots[k] ?? `{${k}}`),
  };
}

function resolveSlot(slot: string, state: GameState, market: Company[], rng: Rng): string | null {
  const c = state.company;
  switch (slot) {
    case "rival": {
      const rivals = market.filter((m) => m.sub_industry === c.subIndustry && m.industry === c.industry);
      return pick(rng, rivals)?.name ?? null;
    }
    case "supplier": {
      const sup = market.filter((m) => (c.industry === "ai" ? m.sub_industry === "ai_chips" : m.industry === "advanced_mfg"));
      return pick(rng, sup)?.name ?? null;
    }
    case "customer": {
      const cust = market.filter((m) => m.industry === c.industry && m.sub_industry !== c.subIndustry);
      return pick(rng, cust)?.name ?? null;
    }
    case "researcher": {
      const team = generateTeam(state.meta.seed);
      return pick(rng, team)?.name ?? null;
    }
    case "star_researcher":
      return `Dr. ${pick(rng, FIRST)} ${pick(rng, LAST)}`;
    case "cofounder": {
      const lot = c.capTable.lots.find((l) => l.holderType === "cofounder");
      return lot?.holderName ?? null;
    }
    case "offer_amount": {
      const base = BASE_COMP[c.stage] ?? 0.5;
      const hype = state.world.hype[c.industry] ?? 50;
      return formatMoney(base * (1 + hype / 120) * nextRange(rng, 0.9, 1.3));
    }
    case "competitor_move":
      return pick(rng, COMPETITOR_MOVES) ?? null;

    // ── Macro / world slots (the m-series economic events) ──
    case "sector":
      return SECTOR_SHORT[c.industry] ?? industryLabel(c.industry);
    case "bank":
      return pick(rng, BANKS) ?? null;
    case "rate_move":
      return Math.max(0.25, Math.abs(rateMoveQtr(state))).toFixed(2);
    case "rate_direction":
      return rateMoveQtr(state) < 0 ? "lower" : "higher";
    case "tax_target":
      return pick(rng, TAX_TARGETS) ?? null;
    case "talent_direction":
      return hypeRising(state) ? "rising" : "easing";
    case "talent_summary":
      return hypeRising(state)
        ? "Comp expectations are spiking and recruiters are circling your best people."
        : "Talent that was untouchable a year ago is suddenly answering calls.";
    case "window_direction": {
      const wnd = state.world.ipoWindow;
      return wnd === "open" ? "swung open" : wnd === "closed" ? "slammed shut" : "started to crack";
    }
    case "window_summary": {
      const wnd = state.world.ipoWindow;
      return wnd === "open"
        ? "Bankers are calling and comparables are rich."
        : wnd === "closed"
          ? "Listings are being pulled and pricing has gone hostile."
          : "Sentiment is wobbling and underwriters are hedging.";
    }
    case "program_direction":
      return pick(rng, ["expanded", "realigned", "scaled back"]) ?? null;
    case "program_summary":
      return pick(rng, PROGRAM_SUMMARIES) ?? null;

    default:
      // An unhandled slot fails the resolution → the event is skipped, rather
      // than rendering a literal "{slot}" or a blank (decision M).
      return null;
  }
}

/** Signed change in the policy rate over roughly the last quarter, read off the
 *  world-history tape (0 when history is too short). */
function rateMoveQtr(state: GameState): number {
  const snap = snapAgo(state, 13);
  return snap ? state.world.interestRate - snap.interestRate : 0;
}

/** Whether the player sector's hype is higher than ~a month ago (talent demand). */
function hypeRising(state: GameState): boolean {
  const ind = state.company.industry;
  const now = state.world.hype[ind] ?? 50;
  const then = snapAgo(state, 4)?.hype[ind] ?? now;
  return now >= then;
}

function snapAgo(state: GameState, weeksBack: number) {
  const h = state.worldHistory;
  const target = state.clock.week - weeksBack;
  for (let i = h.length - 1; i >= 0; i--) if (h[i]!.week <= target) return h[i]!;
  return null;
}
