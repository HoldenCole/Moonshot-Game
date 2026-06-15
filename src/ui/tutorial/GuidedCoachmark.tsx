import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/ui/components/Icon";
import type { GuidedPlacement } from "@/domain/content";

interface Props {
  anchorEl: HTMLElement;
  kicker: string;
  title: string;
  body: string;
  placement: GuidedPlacement;
  /** 0-based beat index / total, for the "Step 3 of 11" readout. */
  index: number;
  total: number;
  /** "ack" beats show a Got it / Finish button; "action" beats wait on the player. */
  mode: "ack" | "action";
  last: boolean;
  allowSkipStep: boolean;
  /** Nudge shown under an action beat if the player stalls. */
  actionHint: string;
  onAck: () => void;
  onSkipStep: () => void;
  onSkipTour: () => void;
}

const GAP = 12; // distance from the anchor
const MARGIN = 10; // keep this far from the viewport edge

/** A coachmark for the guided first-run tour: same hairline ring + pinned card
 *  as the ambient hints, but with tour chrome (step counter, skip controls) and
 *  a "do it to continue" affordance on action beats. */
export function GuidedCoachmark({
  anchorEl,
  kicker,
  title,
  body,
  placement,
  index,
  total,
  mode,
  last,
  allowSkipStep,
  actionHint,
  onAck,
  onSkipStep,
  onSkipTour,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const okRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [ring, setRing] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useLayoutEffect(() => {
    function place() {
      const a = anchorEl.getBoundingClientRect();
      const card = cardRef.current;
      const cw = card?.offsetWidth ?? 320;
      const ch = card?.offsetHeight ?? 150;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      if (placement === "center") {
        // No ring for a whole-workspace beat; float the card in the middle.
        setRing(null);
        setPos({ top: Math.max(MARGIN, (vh - ch) / 2), left: Math.max(MARGIN, (vw - cw) / 2) });
        return;
      }

      setRing({ top: a.top, left: a.left, width: a.width, height: a.height });
      let top: number;
      let left: number;
      if (placement === "bottom" || placement === "top") {
        left = a.left + a.width / 2 - cw / 2;
        top = placement === "bottom" ? a.bottom + GAP : a.top - ch - GAP;
        if (placement === "bottom" && top + ch > vh - MARGIN) top = a.top - ch - GAP;
        if (placement === "top" && top < MARGIN) top = a.bottom + GAP;
      } else {
        top = a.top + a.height / 2 - ch / 2;
        left = placement === "right" ? a.right + GAP : a.left - cw - GAP;
        if (placement === "right" && left + cw > vw - MARGIN) left = a.left - cw - GAP;
        if (placement === "left" && left < MARGIN) left = a.right + GAP;
      }
      left = Math.max(MARGIN, Math.min(left, vw - cw - MARGIN));
      top = Math.max(MARGIN, Math.min(top, vh - ch - MARGIN));
      setPos({ top, left });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true); // capture: catch scrolls in any container
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchorEl, placement, title, body, mode]);

  // Focus the primary action on ack beats so keyboard users can advance.
  useEffect(() => {
    if (mode === "ack") okRef.current?.focus();
  }, [mode, index]);

  return createPortal(
    <>
      {ring && (
        <div
          className="coach-ring"
          style={{ top: ring.top, left: ring.left, width: ring.width, height: ring.height }}
          aria-hidden
        />
      )}
      <div
        ref={cardRef}
        className={`coachmark coachmark--guided coachmark--${placement}`}
        style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, visibility: pos ? "visible" : "hidden" }}
        role="dialog"
        aria-modal="false"
        aria-labelledby="guided-title"
        aria-describedby="guided-body"
      >
        <div className="coachmark__head">
          <span className="coachmark__kicker">
            <Icon name="rocket" size={12} /> {kicker}
          </span>
          <span className="coachmark__step num">
            Step {index + 1} of {total}
          </span>
        </div>
        <h4 className="coachmark__title" id="guided-title">
          {title}
        </h4>
        <p className="coachmark__body" id="guided-body">
          {body}
        </p>
        {mode === "action" && actionHint && (
          <p className="coachmark__hintline">
            <Icon name="chevron-right" size={12} /> {actionHint}
          </p>
        )}
        <div className="coachmark__foot">
          {!last && (
            <button className="coachmark__skip" onClick={onSkipTour}>
              Skip tour
            </button>
          )}
          <div className="coachmark__actions">
            {mode === "action" && allowSkipStep && (
              <button className="coachmark__off" onClick={onSkipStep}>
                Skip
              </button>
            )}
            {mode === "ack" && (
              <button className="coachmark__ok" ref={okRef} onClick={onAck}>
                {last ? "Finish" : "Got it"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
