import { useGame } from "@/state/store";
import {
  capacityLabel,
  capacityTiers,
  headcountBurn,
  hireBatch,
  hireCost,
} from "@/engine/operations";
import { formatMoney } from "@/engine/format";
import { Panel, PanelHeader } from "@/ui/components/Panel";
import { Button } from "@/ui/components/controls";

/** Operations — the money sinks. Grow the team and invest in compute/facilities;
 *  both raise burn (growth costs something) and make your signature bets land. */
export function OperationsPanel() {
  const game = useGame((s) => s.game);
  const hire = useGame((s) => s.hireStaff);
  const trim = useGame((s) => s.trimTeam);
  const invest = useGame((s) => s.investCapacity);
  if (!game) return null;

  const f = game.company.financials;
  const batch = hireBatch(game);
  const batchCost = hireCost(batch);
  const tiers = capacityTiers(game);
  const capLabel = capacityLabel(game.company.industry);
  const capacity = game.company.capacity ?? 0;

  return (
    <Panel className="ops">
      <PanelHeader title="Operations" sub="Spend to scale — a deeper team and more compute make your bets land" />
      <div className="ops-grid">
        <div className="ops-block">
          <div className="ops-block__head">
            <span>Team</span>
            <span className="ops-block__stat num">{f.headcount} people</span>
          </div>
          <p className="ops-note">
            Hiring {batch} adds {formatMoney(headcountBurn(batch))}/mo to payroll. A bigger bench executes more reliably.
          </p>
          <div className="ops-actions">
            <Button variant="primary" size="sm" disabled={f.cash < batchCost} onClick={() => hire(batch)}>
              Hire {batch} · {formatMoney(batchCost)}
            </Button>
            <Button variant="subtle" size="sm" disabled={f.headcount <= 2} onClick={() => trim(batch)}>
              Trim {Math.min(batch, Math.max(0, f.headcount - 2))}
            </Button>
          </div>
        </div>

        <div className="ops-block">
          <div className="ops-block__head">
            <span>{capLabel}</span>
            <span className="ops-block__stat num">{capacity}</span>
          </div>
          <div className="ops-tiers">
            {tiers.map((t) => (
              <button
                key={t.id}
                type="button"
                className="ops-tier"
                disabled={f.cash < t.capex}
                onClick={() => invest(t.id)}
                title={t.blurb}
              >
                <span className="ops-tier__name">{t.label}</span>
                <span className="ops-tier__cost num">
                  {formatMoney(t.capex)} · +{formatMoney(t.burn)}/mo
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}
