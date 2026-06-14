import { useGame } from "@/state/store";
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
  const resolveEvent = useGame((s) => s.resolveEvent);
  if (!event) return null;

  return (
    <div className="event-overlay">
      <div className={`event-modal event-modal--${event.tone} rise`}>
        <div className="event-modal__cat">
          {TONE_LABEL[event.tone]} · {cap(event.category)} · Week {event.week}
        </div>
        <h2 className="event-modal__headline">{event.headline}</h2>
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
