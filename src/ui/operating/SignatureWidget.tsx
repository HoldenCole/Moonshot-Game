import { useGame } from "@/state/store";
import { commitCost, processMetric, processProgress, signatureConfig } from "@/engine/signature";
import { formatMoney } from "@/engine/format";
import { Panel } from "@/ui/components/Panel";
import { Button } from "@/ui/components/controls";

/** The sub-industry signature process — the thing you advance toward. While it
 *  runs it creeps forward with a live metric; idle, it offers the commit. */
export function SignatureWidget() {
  const game = useGame((s) => s.game);
  const commit = useGame((s) => s.commitSignature);
  if (!game) return null;

  const sig = game.company.signature;
  const cfg = signatureConfig(game.company.subIndustry);
  const week = game.clock.week;
  const cost = commitCost(game);
  const canAfford = game.company.financials.cash >= cost;

  if (sig.status === "running") {
    const progress = processProgress(sig, week);
    const weeksLeft = Math.max(0, sig.endWeek - week);
    return (
      <Panel className="sigwidget">
        <div className="sigwidget__head">
          <div className="sigwidget__title">
            {sig.name} <span className="live-dot" />
          </div>
          <div className="sigwidget__meta num">
            {processMetric(sig, week)} · {Math.round(progress * 100)}% · resolves ~{weeksLeft}w
          </div>
        </div>
        <div className="sigwidget__bar">
          <div className="sigwidget__fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <p className="sigwidget__note">{cfg.flavorRunning}</p>
      </Panel>
    );
  }

  return (
    <Panel className="sigwidget">
      <div className="sigwidget__head">
        <div className="sigwidget__title">{cap(cfg.noun)}</div>
        <div className="sigwidget__meta">your signature mechanic</div>
      </div>
      {sig.lastOutcome && (
        <p className={`sigwidget__outcome sigwidget__outcome--${sig.lastOutcome.kind}`}>{sig.lastOutcome.summary}</p>
      )}
      <p className="sigwidget__note">
        Commit cash and weeks to a {cfg.noun}; advance time to see it resolve. Bigger bets and a
        stronger team raise your odds.
      </p>
      <Button variant="primary" size="md" disabled={!canAfford} onClick={commit}>
        {cfg.commitVerb} — {formatMoney(cost)}
      </Button>
    </Panel>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
