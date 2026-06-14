import { useEffect, useState } from "react";
import { useGame } from "@/state/store";
import { usePrefs } from "@/state/prefs";
import { HINTS, eligibleHints, type HintCtx } from "./hints";
import { Coachmark } from "./Coachmark";
import type { View } from "@/ui/frame/types";

/** Drives the contextual onboarding: each frame, pick the highest-priority
 *  unseen hint whose condition holds and whose anchor is actually on screen,
 *  and show one coachmark for it. One at a time, never spam. */
export function TutorialLayer({ view }: { view: View }) {
  const game = useGame((s) => s.game);
  const enabled = usePrefs((s) => s.tutorialEnabled);
  const seen = usePrefs((s) => s.seenHints);
  const markSeen = usePrefs((s) => s.markHintSeen);
  const setEnabled = usePrefs((s) => s.setTutorialEnabled);

  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled || !game) {
      setResolvedId(null);
      setAnchorEl(null);
      return;
    }
    const ctx: HintCtx = { view, game };
    const candidates = eligibleHints(ctx, seen);
    if (candidates.length === 0) {
      setResolvedId(null);
      return;
    }
    let raf = 0;
    let raf2 = 0;
    const find = () => {
      for (const h of candidates) {
        const el = document.querySelector<HTMLElement>(`[data-coach="${h.anchor}"]`);
        // A laid-out, visible element has a non-zero rect (robust to position:
        // fixed, where offsetParent would be null even when visible).
        if (el) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            setResolvedId(h.id);
            setAnchorEl(el);
            return;
          }
        }
      }
      setResolvedId(null);
      setAnchorEl(null);
    };
    // Wait two frames so the freshly-switched view has painted its anchors.
    raf = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(find);
    });
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(raf2);
    };
  }, [enabled, game, view, seen]);

  if (!resolvedId || !anchorEl) return null;
  const hint = HINTS.find((h) => h.id === resolvedId);
  if (!hint) return null;

  return (
    <Coachmark
      key={hint.id}
      anchorEl={anchorEl}
      title={hint.title}
      body={hint.body}
      placement={hint.placement}
      index={seen.length}
      total={HINTS.length}
      onDismiss={() => markSeen(hint.id)}
      onDisable={() => setEnabled(false)}
    />
  );
}
