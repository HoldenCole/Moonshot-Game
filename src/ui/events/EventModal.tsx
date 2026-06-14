import { useRef } from "react";
import { useGame } from "@/state/store";
import { useModalA11y } from "@/ui/components/useModalA11y";
import type { ResolvedEvent } from "@/domain/events";
import type { EventTone } from "@/domain/content";

const TONE_LABEL: Record<EventTone, string> = {
  opportunity: "Opportunity",
  threat: "Threat",
  crisis: "Crisis",
  neutral: "Decision",
};

/** A surfaced event — the connective-tissue decision. A flat scrim + a
 *  borderless modal with a tone accent; choosing applies its soft outcome. */
export function EventModal() {
  const event = useGame((s) => s.game?.pendingEvent ?? null);
  // Mount the dialog only when an event exists, so its focus-trap engages on
  // appear and restores focus on dismiss.
  return event ? <EventDialog event={event} /> : null;
}

function EventDialog({ event }: { event: ResolvedEvent }) {
  const resolveEvent = useGame((s) => s.resolveEvent);
  const ref = useRef<HTMLDivElement>(null);
  // A decision is a hard stop — trap focus, but no Escape-to-dismiss (you must
  // choose). The choices are the focusable targets.
  useModalA11y(ref, { closeOnEsc: false });

  return (
    <div className="event-overlay">
      <div
        ref={ref}
        className={`event-modal event-modal--${event.tone} rise`}
        data-coach="event"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-headline"
        tabIndex={-1}
      >
        <div className="event-modal__cat">
          {TONE_LABEL[event.tone]} · {cap(event.category)} · Week {event.week}
        </div>
        <h2 className="event-modal__headline" id="event-headline">
          {event.headline}
        </h2>
        <p className="event-modal__body">{event.body}</p>
        <div className="event-modal__choices">
          {event.choices.map((c, i) => (
            <button key={c.outcomeRef + i} className="event-choice" onClick={() => resolveEvent(i)}>
              <div className="event-choice__label">{c.label}</div>
              <div className="event-choice__detail">{c.detail}</div>
              <div className="event-choice__effects">{c.effects}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
