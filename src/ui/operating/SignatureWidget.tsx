import { useState } from "react";
import { useGame } from "@/state/store";
import {
  accumulatedUnits,
  commitCost,
  processMetric,
  processProgress,
  signatureApproaches,
  signatureConfig,
  winChance,
  type SignatureConfig,
} from "@/engine/signature";
import { formatMoney } from "@/engine/format";
import { Panel } from "@/ui/components/Panel";
import { Button } from "@/ui/components/controls";

/** The sub-industry signature process — the thing you advance toward. You pick an
 *  approach (a real risk/reward lever), commit cash, and live with the outcome;
 *  some industries also build up a persistent edge (heritage, fleet, moat). */
export function SignatureWidget() {
  const game = useGame((s) => s.game);
  const commit = useGame((s) => s.commitSignature);
  const cfg = game ? signatureConfig(game.company.subIndustry) : null;
  const [approachId, setApproachId] = useState<string>(cfg?.defaultApproachId ?? "");
  if (!game || !cfg) return null;

  const sig = game.company.signature;
  const week = game.clock.week;
  const units = accumulatedUnits(game);
  const accBadge = cfg.accumulator ? `${cfg.accumulator.label} ${unitStr(cfg, units)}` : null;

  if (sig.status === "running") {
    const progress = processProgress(sig, week);
    const weeksLeft = Math.max(0, sig.endWeek - week);
    const appr = cfg.approaches.find((a) => a.id === sig.approach);
    return (
      <Panel className="sigwidget" coach="signature">
        <div className="sigwidget__head">
          <div className="sigwidget__title">
            {sig.name} <span className="live-dot" />
          </div>
          <div className="sigwidget__meta num">
            {appr ? `${appr.label} · ` : ""}
            {processMetric(sig, week)} · {Math.round(progress * 100)}% · resolves ~{weeksLeft}w
          </div>
        </div>
        <div className="sigwidget__bar">
          <div className="sigwidget__fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <p className="sigwidget__note">{cfg.flavorRunning}</p>
        {accBadge && <div className="sigwidget__acc">{accBadge}</div>}
      </Panel>
    );
  }

  const approaches = signatureApproaches(game.company.subIndustry);
  const selected = approaches.find((a) => a.id === approachId) ?? approaches[0]!;
  const cost = commitCost(game, selected.id);
  const canAfford = game.company.financials.cash >= cost;
  const odds = winChance(game, selected.id);

  return (
    <Panel className="sigwidget" coach="signature">
      <div className="sigwidget__head">
        <div className="sigwidget__title">{cap(cfg.noun)}</div>
        <div className="sigwidget__meta">{accBadge ?? "your signature mechanic"}</div>
      </div>
      {sig.lastOutcome && (
        <p className={`sigwidget__outcome sigwidget__outcome--${sig.lastOutcome.kind}`}>{sig.lastOutcome.summary}</p>
      )}

      <div className="sig-approach" role="radiogroup" aria-label="Approach">
        {approaches.map((a) => (
          <button
            key={a.id}
            type="button"
            role="radio"
            aria-checked={a.id === selected.id}
            className={`sig-approach__opt${a.id === selected.id ? " is-active" : ""}`}
            onClick={() => setApproachId(a.id)}
          >
            {a.label}
          </button>
        ))}
      </div>
      <p className="sigwidget__note">{selected.blurb}</p>

      <div className="sig-commit">
        <span className={`sig-commit__odds sig-commit__odds--${oddsTone(odds)}`} title="Estimated odds of a strong outcome">
          {oddsLabel(odds)}
        </span>
        <Button
          variant="primary"
          size="md"
          data-guide="signature-action-button"
          disabled={!canAfford}
          onClick={() => commit(selected.id)}
        >
          {cfg.commitVerb} — {formatMoney(cost)}
        </Button>
      </div>
    </Panel>
  );
}

function unitStr(cfg: SignatureConfig, units: number): string {
  const u = cfg.accumulator?.unit ?? "";
  if (u === "%") return `${Math.round(units)}%`;
  if (u === "") return `${Math.round(units * 10) / 10}`;
  return `${Math.round(units)} ${u}`;
}

function oddsLabel(p: number): string {
  if (p >= 0.72) return "Strong odds";
  if (p >= 0.55) return "Favorable";
  if (p >= 0.42) return "Even money";
  if (p >= 0.28) return "Long shot";
  return "Hail Mary";
}
function oddsTone(p: number): "up" | "mid" | "down" {
  if (p >= 0.55) return "up";
  if (p >= 0.42) return "mid";
  return "down";
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
