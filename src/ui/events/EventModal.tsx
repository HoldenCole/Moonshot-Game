import { useRef } from "react";
import { useGame } from "@/state/store";
import { useModalA11y } from "@/ui/components/useModalA11y";
import { eventArea, recommendation } from "@/engine/delegation";
import { earningsReport, type EarningsReport } from "@/engine/earnings";
import { formatMoney } from "@/engine/format";
import type { ResolvedEvent } from "@/domain/events";
import type { EventTone } from "@/domain/content";

const QUALITY_LABEL: Record<EarningsReport["quality"], string> = {
  clean: "Clean print",
  managed: "Lightly managed",
  stretched: "Heavily engineered",
};

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
  const game = useGame((s) => s.game);
  const ref = useRef<HTMLDivElement>(null);
  // A decision is a hard stop — trap focus, but no Escape-to-dismiss (you must
  // choose). The choices are the focusable targets.
  useModalA11y(ref, { closeOnEsc: false });

  // If the relevant area is on "Recommend", flag the exec's suggested choice.
  const area = eventArea(event);
  const exec = area && game ? game.company.executives[area] : undefined;
  const recIdx = game ? recommendation(game, area, event) : null;
  // The quarterly earnings popup carries the actual print, not just prose.
  const report = game && event.id === "pub1_earnings_result" ? earningsReport(game) : null;

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
        {report && <EarningsReportCard report={report} />}
        <div className="event-modal__choices">
          {event.choices.map((c, i) => (
            <button
              key={c.outcomeRef + i}
              className={`event-choice${i === recIdx ? " is-recommended" : ""}`}
              onClick={() => resolveEvent(i)}
            >
              <div className="event-choice__label">
                {c.label}
                {i === recIdx && exec && <span className="event-choice__rec">{exec.role} suggests</span>}
              </div>
              <div className="event-choice__detail">{c.detail}</div>
              <div className="event-choice__effects">{c.effects}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The structured print behind the quarterly earnings event — the figures, the
 *  stock reaction, and a read on how engineered the number was. */
function EarningsReportCard({ report }: { report: EarningsReport }) {
  const up = report.move >= 0;
  return (
    <div className="earn-report">
      <div className="earn-report__head">
        <span className={`earn-report__chip earn-report__chip--${report.result}`}>{report.result.toUpperCase()}</span>
        <span className="earn-report__q">Q{report.quarter} · guidance {report.guidance}</span>
        <span className={`earn-report__move num ${up ? "up" : "down"}`}>
          {up ? "+" : ""}
          {Math.round(report.move * 100)}%
        </span>
      </div>
      <div className="earn-report__figs">
        <Fig label="Revenue" value={`${formatMoney(report.revenue)}/yr`} />
        <Fig label="EPS" value={`$${report.eps.toFixed(2)}`} />
        <Fig label="Stock" value={`$${report.stockPrice.toFixed(2)}`} />
        <Fig label="Quality" value={QUALITY_LABEL[report.quality]} tone={report.quality} />
      </div>
    </div>
  );
}

function Fig({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="earn-fig">
      <div className="earn-fig__label">{label}</div>
      <div className={`earn-fig__value num${tone ? ` earn-fig__value--${tone}` : ""}`}>{value}</div>
    </div>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
