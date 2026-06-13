import type { InvestorEvaluation, ReactionSignal, TermKey, TermStance } from "@/domain/negotiation";

const SIGNAL: Record<ReactionSignal, { tone: string; label: string }> = {
  warm: { tone: "up", label: "Warm" },
  receptive: { tone: "up", label: "Receptive" },
  pushing: { tone: "warn", label: "Pushing back" },
  cool: { tone: "down", label: "Cool" },
  walking: { tone: "down", label: "Walking" },
};

const TERM_SHORT: Record<TermKey, string> = {
  valuation: "Valuation",
  roundSize: "Round size",
  liquidationPref: "Liq. pref",
  boardSeats: "Board seat",
  optionPoolPct: "Option pool",
};

const STANCE_TONE: Record<TermStance, string> = {
  loves: "up",
  fine: "neutral",
  pushing: "warn",
  dealbreaker: "down",
};

/** The investor's soft reaction — a qualitative signal, the partner's words,
 *  and which terms are sore. Never a probability (decision G). */
export function ReactionBanner({
  evaluation,
  competingInterest,
}: {
  evaluation: InvestorEvaluation;
  competingInterest?: { firmName: string };
}) {
  const sig = SIGNAL[evaluation.signal];
  const sore = evaluation.termReactions.filter((r) => r.stance !== "fine");

  return (
    <div className="reaction-banner">
      {competingInterest && (
        <div className="hotdeal">
          <span className="hotdeal__spark">◆</span>
          Competing interest — {competingInterest.firmName} is circling. Your hand is stronger.
        </div>
      )}
      <div className={`reaction-banner__signal reaction--${sig.tone}`}>
        <span className="reaction__dot" />
        <span className="reaction-banner__label">{sig.label}</span>
        <span className="reaction-banner__line">{evaluation.line}</span>
      </div>
      {sore.length > 0 && (
        <div className="stance-chips">
          {sore.map((r) => (
            <span key={r.term} className={`stance-chip stance-chip--${STANCE_TONE[r.stance]}`}>
              {TERM_SHORT[r.term]}: {r.stance}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
