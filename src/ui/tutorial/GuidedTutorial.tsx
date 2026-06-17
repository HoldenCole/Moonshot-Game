import { useCallback, useEffect, useRef, useState } from "react";
import { useGame } from "@/state/store";
import { useUi } from "@/state/ui";
import { usePrefs } from "@/state/prefs";
import { GuidedCoachmark } from "./GuidedCoachmark";
import { onGuided } from "./guidedBus";
import { advancesOn, gateContext, gatePasses, interpolate, isAck, nextReachable, signatureLabel } from "./guided";

/** Drives the guided first-run tour: shows the current beat anchored to its
 *  `data-guide` element, advances on the player's real actions (or a tap on ack
 *  beats), and hands off to the ambient hint system when the tour ends. Mounted
 *  once at the app root so it spans the new-game screen and the game shell. */
export function GuidedTutorial() {
  const game = useGame((s) => s.game);
  const script = useGame((s) => s.content.tutorial);
  const view = useUi((s) => s.view);
  const newGameStep = useUi((s) => s.newGameStep);
  const tutorialEnabled = usePrefs((s) => s.tutorialEnabled);
  const guidedDone = usePrefs((s) => s.guidedDone);
  const guidedStep = usePrefs((s) => s.guidedStep);
  const advanceGuided = usePrefs((s) => s.advanceGuided);
  const setGuidedStep = usePrefs((s) => s.setGuidedStep);
  const finishGuided = usePrefs((s) => s.finishGuided);

  const steps = script?.steps ?? [];
  const active = tutorialEnabled && !guidedDone && steps.length > 0;
  const step = active ? steps[guidedStep] : undefined;
  // An open event modal owns the screen — the beat waits behind it, then resumes.
  const blocked = !!game?.pendingEvent;

  const hasGame = !!game;
  const week = game?.clock.week ?? 0;
  const rounds = game?.company.capTable.rounds.length ?? 0;
  const sigRunning = game?.company.signature.status === "running";
  const ctx = gateContext(hasGame, view, game);

  // Advance one beat; finishing the last beat ends the tour.
  const advance = useCallback(() => {
    if (guidedStep + 1 >= steps.length) finishGuided();
    else advanceGuided();
  }, [guidedStep, steps.length, advanceGuided, finishGuided]);

  // Skip forward over any beats that can't be reached from here (e.g. the
  // term-sheet beats when the founder chooses not to raise).
  const skipStep = useCallback(() => {
    const n = nextReachable(steps, guidedStep, ctx);
    if (n >= steps.length) finishGuided();
    else setGuidedStep(n);
  }, [steps, guidedStep, ctx, setGuidedStep, finishGuided]);

  // Keep the latest step/handlers reachable from the once-bound bus listener.
  const stepRef = useRef(step);
  stepRef.current = step;
  const advanceRef = useRef(advance);
  advanceRef.current = advance;
  const maybeAdvance = useCallback((action: string) => {
    const s = stepRef.current;
    if (s && advancesOn(s, action)) advanceRef.current();
  }, []);

  // A continued, already-progressed save shouldn't be dragged through the
  // first-run script — hand straight off to ambient hints.
  useEffect(() => {
    if (!active || guidedStep !== 0 || !game) return;
    const progressed =
      game.clock.week > 0 || game.company.capTable.rounds.length > 0 || game.company.stage !== "pre_seed";
    if (progressed) finishGuided();
  }, [active, guidedStep, game, finishGuided]);

  // State- and screen-derived actions. Founding always lands the player on the
  // dashboard, so it fast-forwards past any unfinished pre-founding beats (the
  // player may have quick-started past the archetype beat).
  const prev = useRef({ hasGame, week, rounds, sigRunning, view });
  useEffect(() => {
    const p = prev.current;
    if (hasGame && !p.hasGame) {
      const firstDash = steps.findIndex((s) => /screen\s*==\s*dashboard/.test(s.gate));
      const here = stepRef.current ? steps.indexOf(stepRef.current) : -1;
      if (firstDash >= 0 && here >= 0 && here < firstDash) setGuidedStep(firstDash);
    }
    if (week > p.week) maybeAdvance("advanced_week");
    if (rounds > p.rounds) maybeAdvance("round_closed");
    if (sigRunning && !p.sigRunning) maybeAdvance("signature_committed");
    if (view === "fundraising" && p.view !== "fundraising") maybeAdvance("fundraise_opened");
    prev.current = { hasGame, week, rounds, sigRunning, view };
  }, [hasGame, week, rounds, sigRunning, view, steps, setGuidedStep, maybeAdvance]);

  // Actions emitted from local component state (archetype selection).
  useEffect(() => onGuided(maybeAdvance), [maybeAdvance]);

  // Resolve the anchor element once the beat's gate holds and it has painted.
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const gateOk = step ? gatePasses(step, ctx) : false;
  const anchor = step?.anchor;
  useEffect(() => {
    if (!step || !gateOk || !anchor) {
      setAnchorEl(null);
      return;
    }
    let raf1 = 0;
    let raf2 = 0;
    const find = () => {
      const el = document.querySelector<HTMLElement>(`[data-guide="${anchor}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          setAnchorEl(el);
          return;
        }
      }
      setAnchorEl(null);
    };
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(find);
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [step, gateOk, anchor, view, newGameStep, hasGame, week, rounds, sigRunning]);

  if (!active || blocked || !step || !gateOk || !anchorEl) return null;

  const slots = { signature_label: signatureLabel(game) };
  return (
    <GuidedCoachmark
      key={step.id}
      anchorEl={anchorEl}
      kicker={script!.title}
      title={interpolate(step.title, slots)}
      body={interpolate(step.body, slots)}
      placement={step.placement}
      index={guidedStep}
      total={steps.length}
      mode={isAck(step) ? "ack" : "action"}
      last={guidedStep + 1 >= steps.length}
      allowSkipStep={step.allow_skip}
      actionHint={interpolate(step.hint_fallback ?? "", slots)}
      onAck={advance}
      onSkipStep={skipStep}
      onSkipTour={finishGuided}
    />
  );
}
