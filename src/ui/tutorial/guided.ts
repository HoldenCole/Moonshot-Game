// Pure core of the guided first-run tutorial: slot interpolation, the gate
// context the beats are checked against, and the small predicates the driver
// uses to decide when a beat advances. Kept DOM-free so it's unit-testable.

import type { GameState } from "@/domain/state";
import type { TutorialStep } from "@/domain/content";
import { evalCondition, type CtxValue } from "@/engine/eventConditions";
import { signatureConfig } from "@/engine/signature";

/** The screen id gates compare against. Before founding there's no view, so the
 *  new-game screen is its own id; afterwards it's the active workspace view. */
export function guidedScreen(hasGame: boolean, view: string): string {
  return hasGame ? view : "new_game";
}

/** The sub-industry's signature noun (training run / launch / tape-out …), used
 *  to fill `{signature_label}` in the signature beat. */
export function signatureLabel(game: GameState | null): string {
  return game ? signatureConfig(game.company.subIndustry).noun : "signature move";
}

/** Fill `{slot}` tokens in beat copy. Unknown tokens are left untouched. */
export function interpolate(text: string, slots: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (m, key) => slots[key] ?? m);
}

/** The flat context the guided gates ("screen == dashboard", "company.can_raise
 *  == true", …) are evaluated against. */
export function gateContext(hasGame: boolean, view: string, game: GameState | null): Record<string, CtxValue> {
  return {
    screen: guidedScreen(hasGame, view),
    // Raising is always optional but always available until you're public — a
    // founder with cash can still open a seed / pre-seed whenever they like.
    "company.can_raise": game ? game.company.stage !== "public" : false,
    // You can kick off a signature whenever one isn't already running.
    "company.signature_available": game ? game.company.signature.status !== "running" : false,
  };
}

/** Whether a beat's gate currently holds (an empty gate always holds). */
export function gatePasses(step: TutorialStep, ctx: Record<string, CtxValue>): boolean {
  return !step.gate.trim() || evalCondition(step.gate, ctx);
}

/** A beat that advances when the player taps "Got it" rather than acting. */
export function isAck(step: TutorialStep): boolean {
  return step.advance_on.trim() === "ack";
}

/** Whether an observed action satisfies this beat's `action:<evt>` contract. */
export function advancesOn(step: TutorialStep, action: string): boolean {
  return step.advance_on.trim() === `action:${action}`;
}

/** The next reachable beat when skipping forward from `from`: skips over beats
 *  whose gate can't hold in the current context (e.g. the term-sheet beats when
 *  the player declines to raise), so a skip never strands the tour. Returns an
 *  index past the end when nothing further is reachable. */
export function nextReachable(
  steps: TutorialStep[],
  from: number,
  ctx: Record<string, CtxValue>,
): number {
  let n = from + 1;
  while (n < steps.length && !gatePasses(steps[n]!, ctx)) n++;
  return n;
}
