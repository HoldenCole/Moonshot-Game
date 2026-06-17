import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parse } from "smol-toml";

import { isCapacityType, isProductArchetype, isRDLine, validateProducts } from "./productsValidation.ts";
import { PLAYABLE_SUB_INDUSTRIES } from "@/domain/ids";
import type { CapacityType, ProductArchetype, ProductTuning, RDLine } from "@/domain/content";

// Read straight from disk (the test runner is plain node + tsx, so it can't use
// Vite's import.meta.glob the loader relies on). Mirrors guided.test.ts.
const contentDir = (rel: string) => fileURLToPath(new URL(`../../content/${rel}`, import.meta.url));

function readKeyed<T>(rel: string, isT: (v: unknown) => v is T): T[] {
  const dir = contentDir(rel);
  if (!existsSync(dir)) return [];
  const out: T[] = [];
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".toml") || file === "_tuning.toml") continue;
    const parsed = parse(readFileSync(`${dir}/${file}`, "utf8")) as Record<string, unknown>;
    for (const v of Object.values(parsed)) if (isT(v)) out.push(v);
  }
  return out;
}

function readTuning(): Map<string, ProductTuning> {
  const file = contentDir("products/_tuning.toml");
  const m = new Map<string, ProductTuning>();
  if (!existsSync(file)) return m;
  const parsed = parse(readFileSync(file, "utf8")) as unknown as Record<string, ProductTuning>;
  for (const [sub, t] of Object.entries(parsed)) if (t && typeof t === "object") m.set(sub, t);
  return m;
}

const rdLines: RDLine[] = readKeyed("rd_lines", isRDLine);
const products: ProductArchetype[] = readKeyed("products", isProductArchetype);
const capacityTypes: CapacityType[] = readKeyed("capacity", isCapacityType);
const tuningBySub = readTuning();
const present = rdLines.length > 0 || products.length > 0 || capacityTypes.length > 0 || tuningBySub.size > 0;

// Skips cleanly until the authored TOML is dropped in; becomes a real guard the
// moment it lands.
test(
  "shipped Products/R&D/Capacity content passes the §1.3 checklist",
  { skip: present ? false : "content not authored yet" },
  () => {
    const warnings = validateProducts({ rdLines, products, capacityTypes, tuningBySub, subIndustries: PLAYABLE_SUB_INDUSTRIES });
    assert.deepEqual(warnings, [], `content validation warnings:\n${warnings.join("\n")}`);
  },
);

test(
  "every playable sub-industry ships a full content set",
  { skip: present ? false : "content not authored yet" },
  () => {
    for (const sub of PLAYABLE_SUB_INDUSTRIES) {
      assert.ok(rdLines.some((l) => l.sub_industry === sub), `${sub}: has R&D lines`);
      assert.ok(products.some((p) => p.sub_industry === sub), `${sub}: has products`);
      assert.ok(capacityTypes.some((c) => c.sub_industry === sub), `${sub}: has capacity types`);
      assert.ok(tuningBySub.has(sub), `${sub}: has a _tuning block`);
    }
  },
);
