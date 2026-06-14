// Save / load with schema versioning + a migration pipeline (Phase 11). The
// whole GameState is plain, serializable data (deterministic by design), so a
// save is just a JSON envelope. The migration framework is in place now so
// future schema changes don't strand old saves — the Steam-Cloud requirement.

import type { GameState } from "@/domain/state";
import { SCHEMA_VERSION } from "@/domain/state";
import { founderOwnership, latestPostMoney } from "@/engine/captable";

const KEY = "moonshot.save";

interface SaveEnvelope {
  version: number;
  savedAt: string;
  game: GameState;
}

const available = (): boolean => typeof localStorage !== "undefined";

export function saveGame(game: GameState): void {
  if (!available()) return;
  const env: SaveEnvelope = { version: SCHEMA_VERSION, savedAt: new Date().toISOString(), game };
  try {
    localStorage.setItem(KEY, JSON.stringify(env));
  } catch {
    // Quota or serialization failure — non-fatal; the run continues in memory.
  }
}

export function hasSave(): boolean {
  return available() && localStorage.getItem(KEY) != null;
}

export function clearSave(): void {
  if (available()) localStorage.removeItem(KEY);
}

/** Load + migrate the save, or null if absent/unreadable/incompatible. */
export function loadGame(): GameState | null {
  if (!available()) return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const env = JSON.parse(raw) as SaveEnvelope;
    return migrate(env);
  } catch {
    return null;
  }
}

export interface SaveSummary {
  company: string;
  week: number;
  netWorth: number;
  savedAt: string;
}

export function saveSummary(): SaveSummary | null {
  const game = loadGame();
  if (!game) return null;
  const netWorth = founderOwnership(game.company.capTable) * latestPostMoney(game.company.capTable) + game.founder.personalCash;
  return { company: game.company.name, week: game.clock.week, netWorth, savedAt: readSavedAt() ?? "" };
}

function readSavedAt(): string | null {
  if (!available()) return null;
  try {
    return (JSON.parse(localStorage.getItem(KEY) ?? "{}") as SaveEnvelope).savedAt ?? null;
  } catch {
    return null;
  }
}

/** Each migration takes a vN game and returns a v(N+1) game. */
type Migration = (game: GameState) => GameState;

/** Registered by source version. V1 has none yet — the seam is here. */
const MIGRATIONS: Record<number, Migration> = {};

function migrate(env: SaveEnvelope): GameState | null {
  let version = env.version;
  let game = env.game;
  while (version < SCHEMA_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) return null; // no path forward → reject rather than corrupt
    game = step(game);
    version += 1;
  }
  // A save from a newer build than this one can't be safely loaded.
  return version === SCHEMA_VERSION ? game : null;
}
