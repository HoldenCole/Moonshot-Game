// ============================================================================
// viteContent.ts — the app-side twin of nodeContent.ts: assembles the same
// raw shape from content/late/**.toml via Vite's glob import (eager, raw),
// so the content ships in the bundle exactly like the base game's loader.
// ============================================================================
import { parse } from "smol-toml";
import type { GameContent } from "./turn";
import {
  loadSubEconomies, loadSynergies, loadContracts, loadPowerEvents, loadSubEvents,
  loadResearchNodes, loadMegaprojects, loadRivals, megaMetaFrom, loadEras,
  loadCycleTuning, loadPressures, loadExecutives, type ExecContent,
} from "./content_loader";
import { pressureTriggerMap } from "./pacing";

type Raw = Record<string, unknown>;
const files = import.meta.glob("/content/late/**/*.toml", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

function pick(prefix: string): Raw {
  const out: Raw = {};
  for (const [path, text] of Object.entries(files)) {
    const m = path.match(new RegExp(`/content/late/${prefix}/([^/]+)\\.toml$`));
    if (!m) continue;
    out[m[1] === "_tuning" ? "_tuning" : m[1]!] = parse(text);
  }
  return out;
}
const one = (rel: string): Raw => parse(files[`/content/late/${rel}`]!) as Raw;

export function assembleLateContent(): Record<string, Raw> {
  return {
    research: pick("research"),
    megaprojects: one("megaprojects/megaprojects.toml"),
    sub_economies: pick("sub_economies"),
    synergies: pick("synergies"),
    contracts: { customers: one("contracts/_customers.toml"), clearances: one("contracts/_clearances.toml"),
      tuning: one("contracts/_tuning.toml"), templates: one("contracts/templates.toml") },
    infrastructure: pick("infrastructure"),
    events_sub: pick("events/sub_economies"),
    events_power: pick("events/power"),
    events_world: pick("events/world"),
    executives: { domains: one("executives/_domains.toml"), traits: one("executives/_traits.toml"),
      archetypes: one("executives/archetypes.toml"), names: one("executives/_names.toml"),
      tuning: one("executives/_tuning.toml") },
    rivals: { rivals: one("rivals/rivals.toml"), tuning: one("rivals/_tuning.toml") },
    eras: one("eras/eras.toml"),
    cycles: one("eras/cycles.toml"),
    pressures: one("pressures/pressures.toml"),
    ui: { loading_lines: one("ui/loading_lines.toml") },
  };
}

/** Assemble the typed late-game GameContent the turn engine consumes, from the
 *  raw TOML shape (the same wiring the integration test performs). */
export function buildLateContent(raw: Record<string, Raw> = assembleLateContent()): GameContent {
  const contracts = loadContracts(raw.contracts as never);
  const megaprojects = loadMegaprojects(raw.megaprojects as never);
  const rivals = loadRivals(raw.rivals as never);
  const pressures = loadPressures(raw.pressures as never);
  return {
    researchNodes: loadResearchNodes(raw.research as never),
    megaprojects,
    subEconomies: loadSubEconomies(raw.sub_economies as never),
    synergies: loadSynergies(raw.synergies as never),
    contractTemplates: contracts.templates,
    customers: contracts.customers,
    powerEvents: loadPowerEvents(raw.events_power as never),
    subEvents: loadSubEvents(raw.events_sub as never),
    worldEvents: loadSubEvents(raw.events_world as never),
    rivalDefs: rivals.defs,
    rivalTuning: rivals.tuning,
    megaMeta: megaMetaFrom(megaprojects),
    eras: loadEras(raw.eras as never),
    cycleTuning: loadCycleTuning(raw.cycles as never),
    pressures,
    pressureTriggers: pressureTriggerMap(Object.values(pressures)),
  };
}

/** The executive-system content (domains, traits, archetypes, names, tuning). */
export function buildLateExecContent(raw: Record<string, Raw> = assembleLateContent()): ExecContent {
  return loadExecutives(raw.executives as never);
}
