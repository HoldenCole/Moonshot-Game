import { useGame } from "@/state/store";
import { Button } from "@/ui/components/controls";
import type { Alert } from "@/domain/log";
import type { View } from "@/ui/frame/types";

// Stable empty reference so the selector never allocates (avoids re-render loops).
const NO_ALERTS: Alert[] = [];

/** Active alerts surfaced as in-context decision cards (decision E: decisions
 *  surface in-context, not in a separate queue). Phase 3 alerts are runway
 *  pressure + raise nudges; the branching event system layers on in Phase 7. */
export function ActiveDecisions({ onNavigate }: { onNavigate: (v: View) => void }) {
  const alerts = useGame((s) => s.game?.alerts) ?? NO_ALERTS;
  const dismiss = useGame((s) => s.dismissAlert);
  if (alerts.length === 0) return null;

  return (
    <div className="decisions">
      {alerts.map((a) => (
        <article key={a.id} className={`decision decision--${a.tone}`}>
          <span className="decision__bar" />
          <div className="decision__body">
            <div className="decision__headline">{a.headline}</div>
            <div className="decision__text">{a.body}</div>
          </div>
          <div className="decision__actions">
            {a.action && (
              <Button variant="primary" size="sm" onClick={() => onNavigate(a.action!.target)}>
                {a.action.label}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => dismiss(a.id)}>
              Dismiss
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
