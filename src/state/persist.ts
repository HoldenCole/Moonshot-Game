// Save / load with schema versioning + a migration pipeline (Phase 11). The
// whole GameState is plain, serializable data (deterministic by design), so a
// save is just a JSON envelope. The migration framework is in place now so
// future schema changes don't strand old saves — the Steam-Cloud requirement.

import type { GameState } from "@/domain/state";
import { SCHEMA_VERSION } from "@/domain/state";
import { INITIAL_EVENT_STATE } from "@/domain/events";
import { normalizeDifficulty } from "@/engine/difficulty";
import { netWorth as computeNetWorth } from "@/engine/finance";
import { IDLE_SIGNATURE } from "@/engine/signature";
import { saveBackend } from "./saveBackend";

interface SaveEnvelope {
  version: number;
  savedAt: string;
  game: GameState;
}

export function saveGame(game: GameState): void {
  const env: SaveEnvelope = { version: SCHEMA_VERSION, savedAt: new Date().toISOString(), game };
  try {
    saveBackend.write(JSON.stringify(env));
  } catch {
    // Quota or serialization failure — non-fatal; the run continues in memory.
  }
}

export function hasSave(): boolean {
  return saveBackend.read() != null;
}

export function clearSave(): void {
  saveBackend.clear();
}

/** Load + migrate the save, or null if absent/unreadable/incompatible. */
export function loadGame(): GameState | null {
  const raw = saveBackend.read();
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
  return { company: game.company.name, week: game.clock.week, netWorth: computeNetWorth(game), savedAt: readSavedAt() ?? "" };
}

function readSavedAt(): string | null {
  try {
    return (JSON.parse(saveBackend.read() ?? "{}") as SaveEnvelope).savedAt ?? null;
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
  if (version !== SCHEMA_VERSION) return null;
  // Backfill any fields added since this save was written, so an older v1 save
  // (fields added in place without a version bump) can't crash on a missing
  // array/object the engine spreads or maps.
  return withDefaults(game);
}

/** Defensive default-fill for a loaded save, covering every field added across
 *  phases. Existing values always win. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withDefaults(g: any): GameState {
  const company = g.company ?? {};
  const world = g.world ?? {};
  return {
    ...g,
    difficulty: normalizeDifficulty(g.difficulty),
    founder: { reputation: 30, personalCash: 0, ethics: 60, ...g.founder },
    // Regime-transition memory (added for the macro event wiring) — backfill so
    // an older save reads as "settled" until the next real transition.
    world: { ...world, weeksInPhase: world.weeksInPhase ?? 12, macroPrevPhase: world.macroPrevPhase ?? world.macroPhase ?? "expansion" },
    market: g.market ?? { companies: [] },
    worldHistory: g.worldHistory ?? [],
    log: g.log ?? [],
    alerts: g.alerts ?? [],
    achievedMilestones: g.achievedMilestones ?? [],
    relationships: g.relationships ?? {},
    eventState: g.eventState ?? INITIAL_EVENT_STATE,
    pendingEvent: g.pendingEvent ?? null,
    runOutcome: g.runOutcome ?? null,
    achievements: g.achievements ?? [],
    company: {
      ...company,
      signature: company.signature ?? IDLE_SIGNATURE,
      executives: company.executives ?? {},
      delegation: company.delegation ?? { finance: "decide", operations: "decide", revenue: "decide", technical: "decide" },
    },
  };
}
