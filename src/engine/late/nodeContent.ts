// ============================================================================
// nodeContent.ts — assembles the late-game raw content object by reading
// content/late/**.toml from disk. Used by the node test runner (which can't
// use Vite's import.meta.glob) and by any tooling. The app uses viteContent.ts,
// which produces the IDENTICAL shape from the same files at build time.
// ============================================================================
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parse } from "smol-toml";

const lateDir = (rel: string) => fileURLToPath(new URL(`../../../content/late/${rel}`, import.meta.url));

type Raw = Record<string, unknown>;

function dirOfFiles(rel: string): Raw {
  const dir = lateDir(rel);
  if (!existsSync(dir)) return {};
  const out: Raw = {};
  for (const file of readdirSync(dir).sort()) {
    if (!file.endsWith(".toml")) continue;
    const key = file === "_tuning.toml" ? "_tuning" : file.replace(/\.toml$/, "");
    out[key] = parse(readFileSync(`${dir}/${file}`, "utf8"));
  }
  return out;
}
const one = (rel: string): Raw => parse(readFileSync(lateDir(rel), "utf8")) as Raw;

/** The exact raw shape content_loader.ts adapters expect (mirrors content.json). */
export function assembleLateContent(): Record<string, Raw> {
  return {
    research: dirOfFiles("research"),
    megaprojects: one("megaprojects/megaprojects.toml"),
    sub_economies: dirOfFiles("sub_economies"),
    synergies: dirOfFiles("synergies"),
    contracts: {
      customers: one("contracts/_customers.toml"),
      clearances: one("contracts/_clearances.toml"),
      tuning: one("contracts/_tuning.toml"),
      templates: one("contracts/templates.toml"),
    },
    infrastructure: dirOfFiles("infrastructure"),
    events_sub: dirOfFiles("events/sub_economies"),
    events_power: dirOfFiles("events/power"),
    events_world: dirOfFiles("events/world"),
    executives: {
      domains: one("executives/_domains.toml"),
      traits: one("executives/_traits.toml"),
      archetypes: one("executives/archetypes.toml"),
      names: one("executives/_names.toml"),
      tuning: one("executives/_tuning.toml"),
    },
    rivals: { rivals: one("rivals/rivals.toml"), tuning: one("rivals/_tuning.toml") },
    eras: one("eras/eras.toml"),
    cycles: one("eras/cycles.toml"),
    pressures: one("pressures/pressures.toml"),
    ui: { loading_lines: one("ui/loading_lines.toml") },
  };
}
