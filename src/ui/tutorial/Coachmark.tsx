import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/ui/components/Icon";

type Placement = "top" | "bottom" | "left" | "right";

interface Props {
  anchorEl: HTMLElement;
  title: string;
  body: string;
  placement: Placement;
  /** index / total, for the "2 of 7" progress dots. */
  index: number;
  total: number;
  onDismiss: () => void;
  onDisable: () => void;
}

const GAP = 12; // distance from the anchor
const MARGIN = 10; // keep this far from the viewport edge

/** A small, borderless callout pinned beside a real UI element, with a hairline
 *  ring drawn over the target so the eye lands on what's being explained. */
export function Coachmark({ anchorEl, title, body, placement, index, total, onDismiss, onDisable }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const okRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [ring, setRing] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useLayoutEffect(() => {
    function place() {
      const a = anchorEl.getBoundingClientRect();
      setRing({ top: a.top, left: a.left, width: a.width, height: a.height });
      const card = cardRef.current;
      const cw = card?.offsetWidth ?? 320;
      const ch = card?.offsetHeight ?? 140;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let top: number;
      let left: number;
      if (placement === "bottom" || placement === "top") {
        left = a.left + a.width / 2 - cw / 2;
        top = placement === "bottom" ? a.bottom + GAP : a.top - ch - GAP;
        // flip if it would clip off-screen vertically
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
  }, [anchorEl, placement, title, body]);

  // Focus the primary action and let ESC dismiss — keyboard users aren't trapped.
  useEffect(() => {
    okRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onDismiss();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

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
        className={`coachmark coachmark--${placement}`}
        style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, visibility: pos ? "visible" : "hidden" }}
        role="dialog"
        aria-modal="false"
        aria-labelledby="coach-title"
        aria-describedby="coach-body"
      >
        <div className="coachmark__head">
          <span className="coachmark__kicker">
            <Icon name="info" size={13} /> Tip
          </span>
          <button className="coachmark__x" onClick={onDismiss} aria-label="Dismiss tip">
            ✕
          </button>
        </div>
        <h4 className="coachmark__title" id="coach-title">
          {title}
        </h4>
        <p className="coachmark__body" id="coach-body">
          {body}
        </p>
        <div className="coachmark__foot">
          <div className="coachmark__dots" aria-hidden>
            {Array.from({ length: total }, (_, i) => (
              <span key={i} className={`coachmark__dot${i < index ? " is-done" : i === index ? " is-active" : ""}`} />
            ))}
          </div>
          <div className="coachmark__actions">
            <button className="coachmark__off" onClick={onDisable}>
              Turn off tips
            </button>
            <button className="coachmark__ok" ref={okRef} onClick={onDismiss}>
              Got it
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
