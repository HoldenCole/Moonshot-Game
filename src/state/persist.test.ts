import { test } from "node:test";
import assert from "node:assert/strict";

// In-memory localStorage for the node test environment.
const mem = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
};

const { saveGame, loadGame, hasSave, clearSave, saveSummary } = await import("./persist.ts");
const { createNewGame } = await import("./newgame.ts");
const { SCHEMA_VERSION } = await import("@/domain/state");

function game() {
  const g = createNewGame(
    { founderName: "You", companyName: "Helion Labs", industry: "ai", subIndustry: "frontier_model_lab", color: "#fff", seed: 9 },
    "2026-01-01T00:00:00Z",
  );
  g.clock.week = 42;
  return g;
}

test("a saved run round-trips losslessly", () => {
  clearSave();
  const g = game();
  saveGame(g);
  assert.ok(hasSave());
  const loaded = loadGame()!;
  assert.equal(loaded.company.name, "Helion Labs");
  assert.equal(loaded.clock.week, 42);
  // Lossless = deep-equal. (loadGame backfills defaults, which can reorder object
  // keys without changing any value, so a byte-for-byte JSON compare is too strict.)
  assert.deepEqual(loaded, g);
});

test("the save summary reads back the headline facts", () => {
  saveGame(game());
  const s = saveSummary()!;
  assert.equal(s.company, "Helion Labs");
  assert.equal(s.week, 42);
});

test("clearing removes the save", () => {
  saveGame(game());
  clearSave();
  assert.equal(hasSave(), false);
  assert.equal(loadGame(), null);
});

test("a save from a newer schema is rejected, not corrupted", () => {
  mem.set("moonshot.save", JSON.stringify({ version: SCHEMA_VERSION + 1, savedAt: "x", game: game() }));
  assert.equal(loadGame(), null);
  clearSave();
});
