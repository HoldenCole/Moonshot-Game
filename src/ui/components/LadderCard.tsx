// The Ladder — the visible founder-to-magnate checklist (the genre's "goals"
// panel). It sits on the campus until every rung is climbed, then retires.
import { useGame } from "@/state/store";
import { ladder, ladderComplete } from "@/engine/history";

export function LadderCard() {
  const game = useGame((s) => s.game);
  if (!game) return null;
  const steps = ladder(game);
  if (ladderComplete(steps)) return null;
  const next = steps.find((s) => !s.done);

  return (
    <div className="ladder">
      <span className="ladder__kicker">The ladder</span>
      <div className="ladder__steps">
        {steps.map((s) => (
          <span key={s.id} className={`ladder-step${s.done ? " is-done" : ""}${s === next ? " is-next" : ""}`} title={s.done ? `${s.label} — done` : s.label}>
            <i>{s.done ? "✓" : "○"}</i> {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
