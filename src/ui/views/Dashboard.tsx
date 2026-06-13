import { useGame } from "@/state/store";
import type { PlayerCompany } from "@/domain/state";
import { STAGE_LABELS, subIndustryLabel } from "@/domain/ids";
import { formatMoney } from "@/engine/format";
import { Panel } from "@/ui/components/Panel";
import { Stat, Tag } from "@/ui/components/controls";
import { CapTablePanel } from "@/ui/captable/CapTablePanel";
import { NegotiationPanel } from "@/ui/fundraising/NegotiationPanel";
import { ActiveDecisions } from "@/ui/decisions/ActiveDecisions";
import type { View } from "@/ui/frame/types";

function FinancialBand({ company }: { company: PlayerCompany }) {
  const f = company.financials;
  const netBurn = f.burnMonthly - f.revenue / 12;
  const runway = netBurn > 0 ? f.cash / netBurn : Infinity;
  return (
    <Panel className="finband">
      <div className="finband__id">
        <span className="finband__dot" style={{ background: company.color }} />
        <div>
          <div className="finband__name">{company.name}</div>
          <div className="finband__sub">
            {subIndustryLabel(company.subIndustry)} <Tag tone="accent">{STAGE_LABELS[company.stage]}</Tag>
          </div>
        </div>
      </div>
      <div className="finband__stats">
        <Stat label="Cash" value={formatMoney(f.cash)} tone={f.cash < 0.5 ? "warn" : "neutral"} />
        <Stat label="Runway" value={runway === Infinity ? "∞" : `${Math.max(0, Math.floor(runway))} mo`} />
        <Stat label="Revenue" value={f.revenue > 0 ? `${formatMoney(f.revenue)}/yr` : "Pre-rev"} />
        <Stat label="Burn" value={`${formatMoney(f.burnMonthly)}/mo`} />
        <Stat label="Valuation" value={f.valuation > 0 ? formatMoney(f.valuation) : "—"} />
        <Stat label="Headcount" value={String(f.headcount)} />
      </div>
    </Panel>
  );
}

export function Dashboard({ onNavigate }: { onNavigate: (v: View) => void }) {
  const game = useGame((s) => s.game);
  if (!game) return null;
  return (
    <div className="workspace-scroll">
      <ActiveDecisions onNavigate={onNavigate} />
      <FinancialBand company={game.company} />
      <CapTablePanel capTable={game.company.capTable} />
      <NegotiationPanel />
    </div>
  );
}
