import { type ReactNode, useMemo } from "react";
import { useGame } from "@/state/store";
import type { WorldSnapshot } from "@/domain/state";
import { climateLabel, MACRO_LABEL, sentimentLabel, valuationMultiplier } from "@/engine/world";
import { fundamentalValue } from "@/engine/pricing";
import { growthEraLabel, tamGrowthRoll } from "@/engine/products";
import { industryLabel, type Industry } from "@/domain/ids";
import { formatMoney, formatPct } from "@/engine/format";
import { Sparkline } from "@/ui/charts/Sparkline";

/** The World view — the six master-variable engines, read at a glance. Each
 *  gauge shows its level, a plain-language read, and a trend sparkline. */
export function WorldView() {
  const game = useGame((s) => s.game);
  const content = useGame((s) => s.content);
  const sectors = useMemo(() => {
    if (!game) return [];
    return (Object.keys(game.world.hype) as Industry[])
      .map((id) => {
        const cos = content.companies.filter((c) => c.industry === id);
        return {
          id,
          hype: game.world.hype[id] ?? 50,
          count: cos.length,
          cap: cos.reduce((s, c) => s + fundamentalValue(c, game.world.economyScale ?? 1), 0),
        };
      })
      .sort((a, b) => b.hype - a.hype);
  }, [game, content]);

  if (!game) return null;
  const w = game.world;
  const hist = game.worldHistory;
  const ind = game.company.industry;
  const series = (pick: (s: WorldSnapshot) => number) => hist.map(pick);
  const hype = w.hype[ind] ?? 50;
  const heat = valuationMultiplier(w, ind);
  // This run's TAM growth era for the player's sector (seeded — differs each game).
  const sub = game.company.subIndustry;
  const tamRoll = tamGrowthRoll(game.meta.seed, sub);
  const basePeak = content.productTuningBySub.get(sub)?.tam_growth_per_year ?? 0;
  const sectorEra = growthEraLabel(tamRoll);
  const sectorPeakPct = Math.round(basePeak * tamRoll * 100);

  return (
    <div className="workspace-scroll">
      <div className="panel">
        <div className="panel__head">
          <div className="panel__titles">
            <h3 className="panel__title">The World</h3>
            <div className="panel__sub">The weather your company operates in — six forces, top-down</div>
          </div>
          {basePeak > 0 && (
            <div className="world-heat">
              <span className="world-heat__label">Sector growth</span>
              <span className="world-heat__val num up">{sectorEra}{sectorPeakPct > 0 ? ` · ~${sectorPeakPct}%/yr` : ""}</span>
            </div>
          )}
          <div className="world-heat">
            <span className="world-heat__label">Round-price heat</span>
            <span className={`world-heat__val num ${heat >= 1 ? "up" : "down"}`}>{(heat).toFixed(2)}×</span>
          </div>
        </div>
      </div>

      <div className="world-grid">
        <Gauge
          label="Macro cycle"
          value={MACRO_LABEL[w.macroPhase]}
          read={macroRead(w.macroStrength)}
          data={series((s) => s.macroStrength)}
          color="var(--accent)"
        />
        <Gauge
          label="Interest rate"
          value={`${w.interestRate.toFixed(2)}%`}
          read={w.interestRate > 4 ? "Restrictive — capital costs more" : w.interestRate < 2.5 ? "Accommodative — cheap money" : "Near neutral"}
          data={series((s) => s.interestRate)}
          color="var(--warn)"
        />
        <Gauge
          label="Market sentiment"
          value={sentimentLabel(w.marketSentiment)}
          read={`Risk appetite ${Math.round(w.marketSentiment)} / 100`}
          data={series((s) => s.marketSentiment)}
          color="var(--data)"
        />
        <Gauge
          label="VC climate"
          value={climateLabel(w.vcClimate)}
          read={w.vcClimate >= 65 ? "Founders have leverage" : w.vcClimate < 40 ? "Capital is cautious" : "A normal market"}
          data={series((s) => s.vcClimate)}
          color="var(--up)"
        />
        <Gauge
          label="IPO window"
          value={cap(w.ipoWindow)}
          read={w.ipoWindow === "open" ? "Public exits are live" : w.ipoWindow === "closed" ? "Public exits are shut" : "Window is fragile"}
          data={series((s) => s.ipoOpenness)}
          color="var(--info)"
        />
        <Gauge
          label={`${industryLabel(ind)} hype`}
          value={String(Math.round(hype))}
          read={hype >= 75 ? "Hot — valuations detach from fundamentals" : hype < 45 ? "Cold — out of favor" : "Steady interest"}
          data={series((s) => s.hype[ind] ?? 50)}
          color="var(--series-2)"
        />
      </div>

      <div className="world-sectors">
        <p className="section-label" style={{ padding: "14px 20px 6px" }}>
          Sector hype — the industry layer
        </p>
        <div className="sector-list">
          {sectors.map((s) => (
            <div key={s.id} className={`sector-row${s.id === ind ? " sector-row--you" : ""}`}>
              <span className="sector-row__name">
                {industryLabel(s.id)}
                {s.id === ind && <span className="sector-row__you">your sector</span>}
              </span>
              <div className="sector-row__bar">
                <div className="sector-row__fill" style={{ width: `${s.hype}%` }} />
              </div>
              <span className="sector-row__hype num">{Math.round(s.hype)}</span>
              <span className="sector-row__meta num">
                {s.count} cos · {formatMoney(s.cap)}
              </span>
            </div>
          ))}
        </div>
        <p className="world-note">
          These six forces cascade top-down — the macro cycle and rates move sentiment; sentiment
          (with rates and hype) sets the VC climate and the IPO window; sentiment lifts or cools each
          sector's hype. Together they set the <strong>round-price heat</strong> above: at{" "}
          {heat.toFixed(2)}× a {industryLabel(ind)} round prices{" "}
          {heat >= 1 ? `${formatPct(heat - 1, 0)} richer` : `${formatPct(1 - heat, 0)} cheaper`} than its
          stage baseline.
        </p>
      </div>
    </div>
  );
}

function Gauge({
  label,
  value,
  read,
  data,
  color,
}: {
  label: string;
  value: ReactNode;
  read: ReactNode;
  data: number[];
  color: string;
}) {
  return (
    <div className="world-gauge">
      <div className="world-gauge__label">{label}</div>
      <div className="world-gauge__value">{value}</div>
      <div className="world-gauge__read">{read}</div>
      <Sparkline data={data.length ? data : [0, 0]} color={color} height={40} />
    </div>
  );
}

function macroRead(strength: number): string {
  if (strength > 0.5) return "Running hot — late cycle";
  if (strength > 0.1) return "Expanding";
  if (strength > -0.1) return "Turning";
  if (strength > -0.5) return "Slowing";
  return "Deep in the trough";
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
