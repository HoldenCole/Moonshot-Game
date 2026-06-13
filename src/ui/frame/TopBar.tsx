import { useGame } from "@/state/store";
import { latestPostMoney, founderOwnership } from "@/engine/captable";
import { runwayMonths } from "@/engine/finance";
import { WEEKS_PER_MONTH, weeksToCritical } from "@/engine/tick";
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
  const tuning = useGame((s) => s.content.tuning);
  const advance = useGame((s) => s.advance);
  if (!game) return null;

  const { world, company, founder, clock } = game;
  const post = latestPostMoney(company.capTable);
  const nw = founderOwnership(company.capTable) * post + founder.personalCash;
  const hype = world.hype[company.industry] ?? 50;
  const runway = runwayMonths(company);

  const ipoTone = world.ipoWindow === "open" ? "up" : world.ipoWindow === "closed" ? "down" : "warn";

  const pendingDecision = game.alerts.length > 0;
  const wksCritical = weeksToCritical(game, tuning);
  const hint = pendingDecision
    ? "Decision pending"
    : runway === Infinity
      ? "Cash-flow positive"
      : wksCritical > tuning.advance.nextDecisionCapWeeks
        ? "Runway healthy"
        : `~${wksCritical} wks to runway pressure`;

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <div className="topbar__company">
          <span className="topbar__dot" style={{ background: company.color }} />
          <div>
            <div className="topbar__company-name">{company.name}</div>
            <div className="topbar__company-sub">{industryLabel(company.industry)}</div>
          </div>
        </div>
      </div>

      <div className="topbar__time">
        <button className="time-btn" onClick={() => advance({ type: "weeks", weeks: 1 })}>
          <Icon name="chevron-right" size={15} /> Week
        </button>
        <button className="time-btn" onClick={() => advance({ type: "weeks", weeks: Math.round(WEEKS_PER_MONTH) })}>
          <Icon name="chevron-right" size={15} /> Month
        </button>
        <button
          className={`time-btn time-btn--primary${pendingDecision ? " is-blocked" : ""}`}
          onClick={() => advance({ type: "nextDecision" })}
          disabled={pendingDecision}
          title={pendingDecision ? "Resolve the open decision first" : "Skip quiet weeks to the next decision"}
        >
          <Icon name="chevron-right" size={15} /> Next decision
        </button>
        <div className="time-clock num" title="Weeks since founding">
          <Icon name="clock" size={14} />
          W{clock.week}
        </div>
        <span className={`time-hint${pendingDecision ? " time-hint--alert" : ""}`}>{hint}</span>
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
          <span className="topbar__networth-value num">{nw > 0 ? formatMoney(nw) : "—"}</span>
        </div>
        <div className="topbar__runway">
          <span className="topbar__networth-label">Runway</span>
          <span className={`topbar__networth-value num${runway !== Infinity && runway <= tuning.runway.criticalMonths ? " gauge__value--down" : ""}`}>
            {runway === Infinity ? "∞" : `${Math.max(0, Math.floor(runway))}mo`}
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
