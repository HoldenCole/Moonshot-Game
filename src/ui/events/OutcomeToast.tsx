// The consequence beat: after a decision resolves, its voiced result and the
// numbers it moved flash briefly — the "what just happened" the modal's close
// used to swallow.
import { useEffect } from "react";
import { useGame } from "@/state/store";
import { formatMoney } from "@/engine/format";

export function OutcomeToast() {
  const toast = useGame((s) => s.outcomeToast);
  const clear = useGame((s) => s.clearOutcomeToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clear, 4600);
    return () => clearTimeout(t);
  }, [toast, clear]);

  if (!toast) return null;
  const deltas: { text: string; tone: "up" | "down" }[] = [];
  if (toast.cash !== 0) deltas.push({ text: `${toast.cash > 0 ? "+" : "−"}${formatMoney(Math.abs(toast.cash))} cash`, tone: toast.cash > 0 ? "up" : "down" });
  if (toast.reputation !== 0) deltas.push({ text: `${toast.reputation > 0 ? "+" : ""}${toast.reputation} reputation`, tone: toast.reputation > 0 ? "up" : "down" });
  if (toast.ethics !== 0) deltas.push({ text: `${toast.ethics > 0 ? "+" : ""}${toast.ethics} integrity`, tone: toast.ethics > 0 ? "up" : "down" });

  return (
    <div className="outcome-toast rise" role="status">
      <div className="outcome-toast__kicker">You chose: {toast.label}</div>
      <div className="outcome-toast__result">{toast.result}</div>
      {deltas.length > 0 && (
        <div className="outcome-toast__deltas">
          {deltas.map((d) => (
            <span key={d.text} className={`outcome-delta outcome-delta--${d.tone} num`}>
              {d.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
