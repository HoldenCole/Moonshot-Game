import { useGame } from "@/state/store";
import { eps, netIncomeAnnual, peRatio, revenueGrowth, stockPrice, valuationMark } from "@/engine/finance";
import { marketReaction, quarterIndex, resultVerbose } from "@/engine/earnings";
import { companyPortfolioValue, holdingGain } from "@/engine/investing";
import { formatMoney } from "@/engine/format";
import { Panel, PanelHeader } from "@/ui/components/Panel";
import { Stat } from "@/ui/components/controls";
import { Sparkline } from "@/ui/charts/Sparkline";

/** The numbers behind the valuation — stock price, revenue + growth, net income,
 *  EPS / P-E, and (when public) the quarter's earnings report. */
export function FinancialsPanel() {
  const game = useGame((s) => s.game);
  if (!game) return null;
  const c = game.company;
  const f = c.financials;
  const isPublic = c.stage === "public";
  const growth = revenueGrowth(c);
  const ni = netIncomeAnnual(c);
  const e = c.earnings;
  const invVal = companyPortfolioValue(game);
  const invGain = (c.portfolio ?? []).reduce((s, h) => s + holdingGain(h), 0);

  return (
    <Panel className="financials-panel" coach="company">
      <PanelHeader
        title="Financials"
        sub={isPublic ? "The numbers the street watches" : "The numbers behind your valuation"}
      />
      <div className="fin-grid">
        <Stat label={isPublic ? "Stock price" : "Valuation"} value={isPublic ? `$${stockPrice(c).toFixed(2)}` : formatMoney(valuationMark(c))} />
        <Stat label="Market cap" value={formatMoney(valuationMark(c))} />
        <Stat
          label="Revenue"
          value={f.revenue > 0 ? `${formatMoney(f.revenue)}/yr` : "Pre-rev"}
          sub={growth != null ? `${growth >= 0 ? "+" : ""}${Math.round(growth * 100)}% QoQ` : "growth: —"}
          tone={growth != null ? (growth >= 0 ? "up" : "down") : undefined}
        />
        <Stat label="Net income" value={`${formatMoney(ni)}/yr`} tone={ni >= 0 ? "up" : "down"} />
        {isPublic && <Stat label="EPS" value={`$${eps(c).toFixed(2)}`} tone={eps(c) >= 0 ? "up" : "down"} />}
        {isPublic && <Stat label="P/E" value={peRatio(c) != null ? `${peRatio(c)!.toFixed(0)}×` : "—"} />}
        {invVal > 0 && (
          <Stat
            label="Investments"
            value={formatMoney(invVal)}
            sub={`${invGain >= 0 ? "+" : ""}${formatMoney(invGain)} unrealized`}
            tone={invGain >= 0 ? "up" : "down"}
          />
        )}
      </div>

      {(() => {
        const revLog = f.revenueLog ?? [];
        const valLog = f.valuationLog ?? [];
        if (revLog.length < 2 && valLog.length < 2) return null;
        return (
          <div className="fin-charts">
            {revLog.length >= 2 && (
              <div className="fin-chart">
                <div className="fin-chart__head">
                  <span className="section-label">Revenue</span>
                  <span className="num dim">{formatMoney(revLog[revLog.length - 1]!)}/yr</span>
                </div>
                <Sparkline data={revLog} color="var(--up)" />
              </div>
            )}
            {valLog.length >= 2 && (
              <div className="fin-chart">
                <div className="fin-chart__head">
                  <span className="section-label">Valuation</span>
                  <span className="num dim">{formatMoney(valLog[valLog.length - 1]!)}</span>
                </div>
                <Sparkline data={valLog} color="var(--accent)" />
              </div>
            )}
          </div>
        );
      })()}

      {isPublic && e && (
        <div className="fin-earnings">
          <div className="fin-earnings__head">
            <span className="section-label">Latest earnings</span>
            <span className="fin-earnings__meta num">Q{Math.max(1, quarterIndex(game) - 1)} · guidance {e.guidance}</span>
          </div>
          {e.lastResult ? (
            <p className="fin-earnings__report">
              <strong className={`fin-result fin-result--${e.lastResult}`}>{e.lastResult.toUpperCase()}</strong> — {resultVerbose(e.lastResult)}.{" "}
              {marketReaction(e.lastResult)}{" "}
              <span className={`num ${(e.lastMove ?? 0) >= 0 ? "up" : "down"}`}>
                {(e.lastMove ?? 0) >= 0 ? "+" : ""}
                {Math.round((e.lastMove ?? 0) * 100)}%
              </span>{" "}
              on the print.
            </p>
          ) : (
            <p className="fin-earnings__report dim">Your first earnings report lands at the end of this quarter.</p>
          )}
        </div>
      )}
    </Panel>
  );
}
