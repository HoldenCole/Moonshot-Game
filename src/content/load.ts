// Content loader. Reads the hand-authored TOML in `content/`, parses it, and
// exposes typed, id-indexed collections. Bundled eagerly at build time via
// Vite's glob import so the content set is deterministic and offline.

import { parse } from "smol-toml";
import type {
  BankContent,
  CompanyContent,
  EventContent,
  EventFile,
  InvestorContent,
} from "@/domain/content";
import type { Tuning } from "@/domain/tuning";

// Convenience aliases for the unwrapped inner records.
export type Company = CompanyContent["company"];
export type Investor = InvestorContent["firm"];
export type Bank = BankContent["bank"];
export type GameEvent = EventContent;

export interface ContentDB {
  companies: Company[];
  investors: Investor[];
  banks: Bank[];
  events: GameEvent[];
  tuning: Tuning;
  companyById: Map<string, Company>;
  investorById: Map<string, Investor>;
  bankById: Map<string, Bank>;
  eventById: Map<string, GameEvent>;
  /** Cross-reference issues found at load (unresolved ids). Empty when clean. */
  warnings: string[];
}

function loadDir<T>(glob: Record<string, string>, unwrap: (parsed: unknown) => T): T[] {
  const out: T[] = [];
  for (const [path, raw] of Object.entries(glob)) {
    try {
      out.push(unwrap(parse(raw)));
    } catch (err) {
      throw new Error(`Failed to parse ${path}: ${(err as Error).message}`);
    }
  }
  return out;
}

const companyGlob = import.meta.glob("/content/companies/*.toml", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const investorGlob = import.meta.glob("/content/investors/*.toml", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const bankGlob = import.meta.glob("/content/banks/*.toml", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const eventGlob = import.meta.glob("/content/events/*.toml", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const worldGlob = import.meta.glob("/content/world/*.toml", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

/** Map the snake_case tuning TOML into the camelCase `Tuning` shape. */
function loadTuning(glob: Record<string, string>): Tuning {
  const entry = Object.entries(glob).find(([p]) => p.endsWith("tuning.toml"));
  if (!entry) throw new Error("content/world/tuning.toml not found");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = parse(entry[1]) as any;
  return {
    runway: { lowMonths: t.runway.low_months, criticalMonths: t.runway.critical_months },
    world: {
      hypeReversion: t.world.hype_reversion,
      hypeNoise: t.world.hype_noise,
      hypeBaseline: t.world.hype_baseline ?? {},
      climateReversion: t.world.climate_reversion,
      climateBaseline: t.world.climate_baseline,
      climateNoise: t.world.climate_noise,
      rateNoise: t.world.rate_noise,
      macroTransitionWeeklyProb: t.world.macro_transition_weekly_prob,
      ipoWindowTransitionWeeklyProb: t.world.ipo_window_transition_weekly_prob,
    },
    advance: { nextDecisionCapWeeks: t.advance.next_decision_cap_weeks },
    milestones: { netWorth: t.milestones.net_worth },
  };
}

function indexBy<T extends { id: string }>(items: T[]): Map<string, T> {
  const m = new Map<string, T>();
  for (const it of items) m.set(it.id, it);
  return m;
}

/** Flatten the keyed event tables across all event files into one list. */
function loadEvents(glob: Record<string, string>): GameEvent[] {
  const out: GameEvent[] = [];
  for (const [path, raw] of Object.entries(glob)) {
    let parsed: EventFile;
    try {
      parsed = parse(raw) as unknown as EventFile;
    } catch (err) {
      throw new Error(`Failed to parse ${path}: ${(err as Error).message}`);
    }
    for (const value of Object.values(parsed)) {
      // Guard against any non-event tables sneaking into a file.
      if (value && typeof value === "object" && "framing" in value && "choices" in value) {
        out.push(value);
      }
    }
  }
  return out;
}

function validate(db: Omit<ContentDB, "warnings">): string[] {
  const warnings: string[] = [];
  const has = (m: Map<string, unknown>, id: string) => m.has(id);

  for (const c of db.companies) {
    const refs = [
      ...(c.relationships.competitors ?? []),
      ...(c.relationships.suppliers ?? []),
      ...(c.relationships.customers ?? []),
    ];
    for (const r of refs) {
      if (!has(db.companyById, r)) {
        warnings.push(`company ${c.id}: unresolved company ref "${r}"`);
      }
    }
    for (const inv of c.relationships.investors) {
      if (!has(db.investorById, inv)) {
        warnings.push(`company ${c.id}: unresolved investor ref "${inv}"`);
      }
    }
  }

  for (const inv of db.investors) {
    for (const cid of inv.relationships?.signature_portfolio ?? []) {
      if (!has(db.companyById, cid)) {
        warnings.push(`investor ${inv.id}: unresolved portfolio company "${cid}"`);
      }
    }
    for (const rid of inv.relationships?.rival_firms ?? []) {
      if (!has(db.investorById, rid)) {
        warnings.push(`investor ${inv.id}: unresolved rival firm "${rid}"`);
      }
    }
  }

  return warnings;
}

let cached: ContentDB | null = null;

/** Parse and index all content (memoized). Safe to call from anywhere. */
export function loadContent(): ContentDB {
  if (cached) return cached;

  const companies = loadDir<Company>(companyGlob, (p) => (p as CompanyContent).company);
  const investors = loadDir<Investor>(investorGlob, (p) => (p as InvestorContent).firm);
  const banks = loadDir<Bank>(bankGlob, (p) => (p as BankContent).bank);
  const events = loadEvents(eventGlob);

  const base = {
    companies,
    investors,
    banks,
    events,
    tuning: loadTuning(worldGlob),
    companyById: indexBy(companies),
    investorById: indexBy(investors),
    bankById: indexBy(banks),
    eventById: indexBy(events),
  };

  cached = { ...base, warnings: validate(base) };
  return cached;
}
