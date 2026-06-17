import { useGame } from "@/state/store";
import {
  capacityLabel,
  capacityLevel,
  capacityTiers,
  hireCost,
  hireToTargetCount,
  nextCapacityTier,
  staffingState,
  targetHeadcount,
  trimToTargetCount,
  type StaffingState,
} from "@/engine/operations";
import { formatMoney } from "@/engine/format";
import { Panel, PanelHeader } from "@/ui/components/Panel";
import { Button } from "@/ui/components/controls";

const STATE_COPY: Record<StaffingState, { label: string; tone: string; note: string }> = {
  understaffed: {
    label: "Understaffed",
    tone: "down",
    note: "You're leaving execution on the table — staff up to your scale to land your bets reliably.",
  },
  right: {
    label: "Right-sized",
    tone: "up",
    note: "Staffed for your scale — execution is at full strength. As revenue grows, the bar rises with it.",
  },
  overstaffed: {
    label: "Overstaffed",
    tone: "warn",
    note: "A bench bigger than your scale needs is pure burn — trimming buys back runway with no loss of execution.",
  },
};

/** Operations — right-size the team and build out compute. Both raise burn and
 *  lift execution, but each has a clear optimum: staff to your scale (no more),
 *  and climb the build-out ladder one rung at a time. */
export function OperationsPanel() {
  const game = useGame((s) => s.game);
  const hire = useGame((s) => s.hireStaff);
  const trim = useGame((s) => s.trimTeam);
  const invest = useGame((s) => s.investCapacity);
  if (!game) return null;

  const c = game.company;
  const f = c.financials;
  const target = targetHeadcount(c);
  const state = staffingState(c);
  const copy = STATE_COPY[state];
  const fillPct = Math.min(100, Math.round((f.headcount / Math.max(1, target)) * 100));
  const hireN = hireToTargetCount(c);
  const trimN = trimToTargetCount(c);

  const tiers = capacityTiers(game);
  const level = capacityLevel(c);
  const next = nextCapacityTier(game);
  const capLabel = capacityLabel(c.industry);

  return (
    <Panel className="ops">
      <PanelHeader title="Operations" sub="Right-size the team and build out compute — both make your bets land" />
      <div className="ops-grid">
        <div className="ops-block">
          <div className="ops-block__head">
            <span>Team</span>
            <span className="ops-block__stat num">{f.headcount} people</span>
          </div>
          <div className="ops-gauge">
            <div className="ops-gauge__track">
              <div className={`ops-gauge__fill is-${state}`} style={{ width: `${fillPct}%` }} />
            </div>
            <div className="ops-gauge__legend">
              <span className={`ops-gauge__state ops-gauge__state--${copy.tone}`}>{copy.label}</span>
              <span className="ops-gauge__target num">target {target}</span>
            </div>
          </div>
          <p className="ops-note">{copy.note}</p>
          <div className="ops-actions">
            {state === "overstaffed" ? (
              <Button variant="primary" size="sm" disabled={trimN <= 0} onClick={() => trim(trimN)}>
                Trim {trimN} → right-sized
              </Button>
            ) : hireN > 0 ? (
              <Button variant="primary" size="sm" onClick={() => hire(hireN)}>
                Hire {hireN} · {formatMoney(hireCost(hireN))}
              </Button>
            ) : state === "understaffed" ? (
              <Button variant="subtle" size="sm" disabled>
                Raise capital to staff up
              </Button>
            ) : (
              <Button variant="subtle" size="sm" disabled>
                Right-sized
              </Button>
            )}
          </div>
        </div>

        <div className="ops-block">
          <div className="ops-block__head">
            <span>{capLabel}</span>
            <span className="ops-block__stat">{level > 0 ? tiers[level - 1]!.label : "—"}</span>
          </div>
          <div className="ops-ladder">
            {tiers.map((t, i) => {
              const owned = i < level;
              const isNext = i === level;
              return (
                <div key={t.id} className={`ops-rung${owned ? " is-owned" : ""}${isNext ? " is-next" : ""}`}>
                  <span className="ops-rung__dot" />
                  <span className="ops-rung__name">{t.label}</span>
                  <span className="ops-rung__cost num">
                    {owned ? "online" : `${formatMoney(t.capex)} · +${formatMoney(t.burn)}/mo`}
                  </span>
                </div>
              );
            })}
          </div>
          {next ? (
            <>
              <p className="ops-note">{next.blurb}</p>
              <div className="ops-actions">
                <Button variant="primary" size="sm" disabled={f.cash < next.capex} onClick={() => invest()}>
                  Build {next.label} · {formatMoney(next.capex)}
                </Button>
              </div>
            </>
          ) : (
            <p className="ops-note">Fully built out — your {capLabel.toLowerCase()} base is best-in-class.</p>
          )}
        </div>
      </div>
    </Panel>
  );
}
