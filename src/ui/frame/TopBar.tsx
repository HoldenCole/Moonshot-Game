import { useGame } from "@/state/store";
import { founderOwnership, latestPostMoney } from "@/engine/captable";
import { formatMoney } from "@/engine/format";
import { industryLabel } from "@/domain/ids";
import { Icon } from "@/ui/components/Icon";

const MACRO_LABEL: Record<string, string> = {
  expansion: "Expansion",
  peak: "Peak",
  contraction: "Contraction",
  trough: "Trough",
  recovery: "Recovery",
};

function climateLabel(v: number): string {
  if (v < 20) return "Frozen";
  if (v < 40) return "Cool";
  if (v < 65) return "Normal";
  if (v < 85) return "Hot";
  return "Frothy";
}

function Gauge({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" | "warn" }) {
  return (
    <div className="gauge">
      <span className="gauge__label">{label}</span>
      <span className={`gauge__value num${tone ? " gauge__value--" + tone : ""}`}>{value}</span>
    </div>
  );
}

export function TopBar() {
  const game = useGame((s) => s.game);
  const advanceWeeks = useGame((s) => s.advanceWeeks);
  if (!game) return null;

  const { world, company, founder, clock } = game;
  const post = latestPostMoney(company.capTable);
  const stakeValue = founderOwnership(company.capTable) * post;
  const netWorth = stakeValue + founder.personalCash;
  const hype = world.hype[company.industry] ?? 50;

  const ipoTone = world.ipoWindow === "open" ? "up" : world.ipoWindow === "closed" ? "down" : "warn";
  const runwayMonths =
    company.financials.burnMonthly > company.financials.revenue / 12
      ? company.financials.cash / (company.financials.burnMonthly - company.financials.revenue / 12)
      : Infinity;

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <div className="topbar__company" style={{ ["--brand" as string]: company.color }}>
          <span className="topbar__dot" style={{ background: company.color }} />
          <div>
            <div className="topbar__company-name">{company.name}</div>
            <div className="topbar__company-sub">{industryLabel(company.industry)}</div>
          </div>
        </div>
      </div>

      <div className="topbar__time">
        <button className="time-btn" onClick={() => advanceWeeks(1)}>
          <Icon name="chevron-right" size={15} /> Week
        </button>
        <button className="time-btn" onClick={() => advanceWeeks(Math.round(13 / 3))}>
          <Icon name="chevron-right" size={15} /> Month
        </button>
        <div className="time-clock num" title="Weeks since founding">
          <Icon name="clock" size={14} />
          W{clock.week}
        </div>
      </div>

      <div className="topbar__gauges">
        <Gauge label="Macro" value={MACRO_LABEL[world.macroPhase] ?? world.macroPhase} />
        <Gauge label="Rates" value={`${world.interestRate.toFixed(1)}%`} />
        <Gauge label="VC Climate" value={climateLabel(world.vcClimate)} tone={world.vcClimate >= 65 ? "up" : undefined} />
        <Gauge label="IPO Window" value={cap(world.ipoWindow)} tone={ipoTone} />
        <Gauge label={`${industryLabel(company.industry)} Hype`} value={String(Math.round(hype))} tone={hype >= 70 ? "warn" : undefined} />
      </div>

      <div className="topbar__right">
        <div className="topbar__networth">
          <span className="topbar__networth-label">Net worth</span>
          <span className="topbar__networth-value num">{netWorth > 0 ? formatMoney(netWorth) : "—"}</span>
        </div>
        <div className="topbar__runway">
          <span className="topbar__networth-label">Runway</span>
          <span className="topbar__networth-value num">
            {runwayMonths === Infinity ? "∞" : `${Math.max(0, Math.floor(runwayMonths))}mo`}
          </span>
        </div>
        <button className="cmdk" title="Command palette (coming soon)">
          <Icon name="command" size={14} />K
        </button>
      </div>
    </header>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
