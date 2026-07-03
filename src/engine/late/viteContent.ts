// ============================================================================
// viteContent.ts — the app-side twin of nodeContent.ts: assembles the same
// raw shape from content/late/**.toml via Vite's glob import (eager, raw),
// so the content ships in the bundle exactly like the base game's loader.
// ============================================================================
import { parse } from "smol-toml";

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
