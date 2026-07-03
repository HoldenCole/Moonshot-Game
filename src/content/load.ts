// Content loader. Reads the hand-authored TOML in `content/`, parses it, and
// exposes typed, id-indexed collections. Bundled eagerly at build time via
// Vite's glob import so the content set is deterministic and offline.

import { parse } from "smol-toml";
import type {
  BankContent,
  CapacityType,
  CompanyContent,
  EventContent,
  EventFile,
  FounderContent,
  FounderFile,
  InvestorContent,
  ProductArchetype,
  ProductTuning,
  RDLine,
  TutorialFile,
  TutorialScript,
} from "@/domain/content";
import type { Tuning } from "@/domain/tuning";
import { PLAYABLE_SUB_INDUSTRIES } from "@/domain/ids";
import { generateInvestors } from "@/engine/investorgen";
import { isCapacityType, isProductArchetype, isRDLine, validateProducts } from "./productsValidation";
import { assembleLateContent, buildLateContent, buildLateExecContent } from "@/engine/late/viteContent";
import type { GameContent } from "@/engine/late/turn";
import type { ExecContent } from "@/engine/late/content_loader";

/** The roster grows from the 7 hand-authored anchors to this many firms by
 *  procedurally generating the rest from the anchors as archetypes (a fixed seed
 *  → a stable roster, so every firm-id reference resolves). */
const INVESTOR_SEED = 0x5eed1701;
const INVESTOR_TARGET = 18;

// Convenience aliases for the unwrapped inner records.
export type Company = CompanyContent["company"];
export type Investor = InvestorContent["firm"];
export type Bank = BankContent["bank"];
export type GameEvent = EventContent;
export type Founder = FounderContent;

export interface ContentDB {
  companies: Company[];
  investors: Investor[];
  banks: Bank[];
  events: GameEvent[];
  founders: Founder[];
  /** The guided first-run tutorial script, if a content file is present. */
  tutorial?: TutorialScript;
  tuning: Tuning;
  companyById: Map<string, Company>;
  investorById: Map<string, Investor>;
  bankById: Map<string, Bank>;
  eventById: Map<string, GameEvent>;
  founderById: Map<string, Founder>;
  // Products / R&D / Capacity (the depth system) — grouped per sub-industry,
  // plus flat id indexes. Empty until the content files are authored.
  rdLinesBySub: Map<string, RDLine[]>;
  productsBySub: Map<string, ProductArchetype[]>;
  capacityBySub: Map<string, CapacityType[]>;
  productTuningBySub: Map<string, ProductTuning>;
  rdLineById: Map<string, RDLine>;
  productById: Map<string, ProductArchetype>;
  capacityById: Map<string, CapacityType>;
  /** The late-game (v2) systems content — research tree, megaprojects, empire,
   *  contracts, rivals, eras. Consumed by the late turn engine once a run crosses
   *  the Scale-Up threshold. */
  late: GameContent;
  /** The executive-system content (domains, traits, archetypes) for the late game. */
  lateExec: ExecContent;
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

const founderGlob = import.meta.glob("/content/founders/*.toml", {
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

const tutorialGlob = import.meta.glob("/content/tutorial/*.toml", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const rdLinesGlob = import.meta.glob("/content/rd_lines/*.toml", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

// Both product archetypes and the shared _tuning.toml live here; split by name.
const productsGlob = import.meta.glob("/content/products/*.toml", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const capacityGlob = import.meta.glob("/content/capacity/*.toml", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

/** Parse keyed-table files, keeping only values that match the entity shape. */
function loadKeyed<T>(entries: [string, string][], isT: (v: unknown) => v is T): T[] {
  const out: T[] = [];
  for (const [path, raw] of entries) {
    let parsed: unknown;
    try {
      parsed = parse(raw);
    } catch (err) {
      throw new Error(`Failed to parse ${path}: ${(err as Error).message}`);
    }
    for (const v of Object.values(parsed as Record<string, unknown>)) if (isT(v)) out.push(v);
  }
  return out;
}

/** Parse content/products/_tuning.toml — one table per sub-industry. */
function loadProductTuning(glob: Record<string, string>): Map<string, ProductTuning> {
  const m = new Map<string, ProductTuning>();
  const entry = Object.entries(glob).find(([p]) => p.endsWith("_tuning.toml"));
  if (!entry) return m;
  let parsed: Record<string, ProductTuning>;
  try {
    parsed = parse(entry[1]) as unknown as Record<string, ProductTuning>;
  } catch (err) {
    throw new Error(`Failed to parse ${entry[0]}: ${(err as Error).message}`);
  }
  for (const [sub, t] of Object.entries(parsed)) if (t && typeof t === "object") m.set(sub, t);
  return m;
}

function groupBySub<T extends { sub_industry: string }>(items: T[]): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const it of items) {
    const arr = m.get(it.sub_industry);
    if (arr) arr.push(it);
    else m.set(it.sub_industry, [it]);
  }
  return m;
}

/** Map the snake_case tuning TOML into the camelCase `Tuning` shape. */
function loadTuning(glob: Record<string, string>): Tuning {
  const entry = Object.entries(glob).find(([p]) => p.endsWith("tuning.toml"));
  if (!entry) throw new Error("content/world/tuning.toml not found");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = parse(entry[1]) as any;
  const w = t.world;
  return {
    runway: { lowMonths: t.runway.low_months, criticalMonths: t.runway.critical_months },
    advance: { nextDecisionCapWeeks: t.advance.next_decision_cap_weeks },
    milestones: { netWorth: t.milestones.net_worth },
    world: {
      macro: {
        cycleWeeks: w.macro.cycle_weeks,
        positionNoise: w.macro.position_noise,
        shockWeeklyProb: w.macro.shock_weekly_prob,
        shockMagnitude: w.macro.shock_magnitude,
      },
      rates: {
        neutral: w.rates.neutral,
        taylorOutput: w.rates.taylor_output,
        taylorInflation: w.rates.taylor_inflation,
        reviewWeeks: w.rates.review_weeks,
        maxMovePerReview: w.rates.max_move_per_review,
        min: w.rates.min,
      },
      sentiment: {
        baseline: w.sentiment.baseline,
        reversion: w.sentiment.reversion,
        macroWeight: w.sentiment.macro_weight,
        rateWeight: w.sentiment.rate_weight,
        noise: w.sentiment.noise,
      },
      climate: {
        reversion: w.climate.reversion,
        base: w.climate.base,
        sentimentWeight: w.climate.sentiment_weight,
        rateWeight: w.climate.rate_weight,
        hypeWeight: w.climate.hype_weight,
        noise: w.climate.noise,
      },
      ipo: {
        minPersistWeeks: w.ipo.min_persist_weeks,
        openThreshold: w.ipo.open_threshold,
        closedThreshold: w.ipo.closed_threshold,
        sentimentWeight: w.ipo.sentiment_weight,
        macroWeight: w.ipo.macro_weight,
      },
      hype: {
        macroLift: w.hype.macro_lift,
        waveWeeklyProb: w.hype.wave_weekly_prob,
        waveMagnitude: w.hype.wave_magnitude,
        noise: w.hype.noise,
        baseline: w.hype.baseline ?? {},
        reversion: w.hype.reversion ?? {},
      },
      difficulty: { volatility: w.difficulty.volatility },
    },
  };
}

function indexBy<T extends { id: string }>(items: T[]): Map<string, T> {
  const m = new Map<string, T>();
  for (const it of items) m.set(it.id, it);
  return m;
}

/** Flatten the keyed event tables across all event files into one list. */
function loadFounders(glob: Record<string, string>): Founder[] {
  const out: Founder[] = [];
  for (const [path, raw] of Object.entries(glob)) {
    let parsed: FounderFile;
    try {
      parsed = parse(raw) as unknown as FounderFile;
    } catch (err) {
      throw new Error(`Failed to parse ${path}: ${(err as Error).message}`);
    }
    for (const value of Object.values(parsed)) {
      if (value && typeof value === "object" && "id" in value && "modifiers" in value) out.push(value);
    }
  }
  return out;
}

/** Parse the guided first-run tutorial (one file under content/tutorial/). */
function loadTutorial(glob: Record<string, string>): TutorialScript | undefined {
  const entry = Object.entries(glob)[0];
  if (!entry) return undefined;
  try {
    return (parse(entry[1]) as unknown as TutorialFile).tutorial;
  } catch (err) {
    throw new Error(`Failed to parse ${entry[0]}: ${(err as Error).message}`);
  }
}

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
  // The 7 authored anchors, plus a procedural roster generated from them as
  // archetypes — so fundraising has eligible leads at every stage.
  // Sort before generating so the procedural roster is deterministic regardless
  // of glob iteration order (not reliant on the bundler's key ordering).
  const anchorInvestors = loadDir<Investor>(investorGlob, (p) => (p as InvestorContent).firm).sort((a, b) => a.id.localeCompare(b.id));
  const investors = [...anchorInvestors, ...generateInvestors(INVESTOR_SEED, anchorInvestors, INVESTOR_TARGET)];
  const banks = loadDir<Bank>(bankGlob, (p) => (p as BankContent).bank);
  const events = loadEvents(eventGlob);
  const founders = loadFounders(founderGlob);

  // Products / R&D / Capacity. The products dir also holds _tuning.toml, so the
  // archetypes exclude it by name; tuning is parsed separately.
  const rdLines = loadKeyed<RDLine>(Object.entries(rdLinesGlob), isRDLine);
  const productEntries = Object.entries(productsGlob).filter(([p]) => !p.endsWith("_tuning.toml"));
  const products = loadKeyed<ProductArchetype>(productEntries, isProductArchetype);
  const capacityTypes = loadKeyed<CapacityType>(Object.entries(capacityGlob), isCapacityType);
  const productTuningBySub = loadProductTuning(productsGlob);

  // Late-game (v2) content — parsed once from content/late/**.toml.
  const lateRaw = assembleLateContent();
  const late = buildLateContent(lateRaw);
  const lateExec = buildLateExecContent(lateRaw);

  const base = {
    companies,
    investors,
    banks,
    events,
    founders,
    tutorial: loadTutorial(tutorialGlob),
    tuning: loadTuning(worldGlob),
    companyById: indexBy(companies),
    investorById: indexBy(investors),
    bankById: indexBy(banks),
    eventById: indexBy(events),
    founderById: indexBy(founders),
    rdLinesBySub: groupBySub(rdLines),
    productsBySub: groupBySub(products),
    capacityBySub: groupBySub(capacityTypes),
    productTuningBySub,
    rdLineById: indexBy(rdLines),
    productById: indexBy(products),
    capacityById: indexBy(capacityTypes),
    late,
    lateExec,
  };

  // Only validate the depth system once any of its content is present, so an
  // un-authored feature doesn't spew "missing" warnings.
  const hasProductContent = rdLines.length > 0 || products.length > 0 || capacityTypes.length > 0 || productTuningBySub.size > 0;
  const productWarnings = hasProductContent
    ? validateProducts({ rdLines, products, capacityTypes, tuningBySub: productTuningBySub, subIndustries: PLAYABLE_SUB_INDUSTRIES })
    : [];

  cached = { ...base, warnings: [...validate(base), ...productWarnings] };
  return cached;
}
