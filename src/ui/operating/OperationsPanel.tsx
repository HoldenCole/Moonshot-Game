import { useGame } from "@/state/store";
import { hireCost } from "@/engine/operations";
import { formatMoney } from "@/engine/format";
import { Panel, PanelHeader } from "@/ui/components/Panel";
import { Button } from "@/ui/components/controls";

const BATCH = 5;

/** Team — headcount as a light flavor lever. The real engine is R&D, capacity,
 *  and shipping products; payroll just colors how the company scales. */
export function OperationsPanel() {
  const game = useGame((s) => s.game);
  const hire = useGame((s) => s.hireStaff);
  const trim = useGame((s) => s.trimTeam);
  if (!game) return null;
  const f = game.company.financials;
  const cost = hireCost(BATCH);

  return (
    <Panel className="ops">
      <PanelHeader title="Team" sub="Headcount sets your pace — and your payroll" />
      <div className="ops-team">
        <div className="ops-team__stat">
          <span className="ops-team__count num">{f.headcount}</span>
          <span className="ops-team__label">people · {formatMoney(f.burnMonthly)}/mo burn</span>
        </div>
        <div className="ops-actions">
          <Button variant="primary" size="sm" disabled={f.cash < cost} onClick={() => hire(BATCH)}>
            Hire {BATCH} · {formatMoney(cost)}
          </Button>
          <Button variant="subtle" size="sm" disabled={f.headcount <= 2} onClick={() => trim(BATCH)}>
            Trim {BATCH}
          </Button>
        </div>
      </div>
      <p className="ops-note">A bigger team adds payroll now — but your real engine is R&amp;D, capacity, and shipping products.</p>
    </Panel>
  );
}
