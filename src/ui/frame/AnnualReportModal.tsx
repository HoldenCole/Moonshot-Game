// The year-end review — the genre's beloved beat: every 52 weeks, the year in
// numbers (with arrows), what shipped, what closed, and the headlines worth
// keeping. Dismiss with "Onward."
import { useEffect } from "react";
import { useGame } from "@/state/store";
import { formatMoney } from "@/engine/format";
import { Button } from "@/ui/components/controls";
import { play } from "@/audio/sfx";

function Delta({ now, ago, money = true }: { now: number; ago: number | null; money?: boolean }) {
  if (ago == null || ago === 0) return <span className="annual__delta dim">first year</span>;
  const pct = ((now - ago) / Math.abs(ago)) * 100;
  return (
    <span className={`annual__delta ${pct >= 0 ? "up" : "down"}`}>
      {pct >= 0 ? "▲" : "▼"} {Math.abs(pct).toFixed(0)}% {money ? `(${formatMoney(ago)} → ${formatMoney(now)})` : `(${ago} → ${now})`}
    </span>
  );
}

export function AnnualReportModal() {
  const report = useGame((s) => s.annualReport);
  const clear = useGame((s) => s.clearAnnualReport);

  useEffect(() => {
    if (report) play("milestone");
  }, [report]);

  if (!report) return null;

  return (
    <div className="overlay-backdrop">
      <div className="annual" role="dialog" aria-label={`Year ${report.year} in review`}>
        <div className="annual__kicker">Annual report</div>
        <div className="annual__title">Year {report.year} closes the books</div>

        <div className="annual__rows">
          <div className="annual__row">
            <span className="annual__label">Revenue</span>
            <b className="num">{formatMoney(report.revenue)}/yr</b>
            <Delta now={report.revenue} ago={report.revenueAgo} />
          </div>
          <div className="annual__row">
            <span className="annual__label">Valuation</span>
            <b className="num">{formatMoney(report.valuation)}</b>
            <Delta now={report.valuation} ago={report.valuationAgo} />
          </div>
          <div className="annual__row">
            <span className="annual__label">Net worth</span>
            <b className="num">{formatMoney(report.netWorth)}</b>
            <Delta now={report.netWorth} ago={report.netWorthAgo} />
          </div>
          <div className="annual__row">
            <span className="annual__label">Headcount</span>
            <b className="num">{report.headcount}</b>
            <Delta now={report.headcount} ago={report.headcountAgo} money={false} />
          </div>
        </div>

        <div className="annual__facts">
          <span>{report.shipped} shipped</span>
          <span>{report.roundsClosed} {report.roundsClosed === 1 ? "round" : "rounds"} closed</span>
          <span>{formatMoney(report.cash)} in the bank</span>
        </div>

        {report.highlights.length > 0 && (
          <div className="annual__highlights">
            <div className="section-label">The year's headlines</div>
            {report.highlights.map((h) => (
              <div key={h} className="annual__highlight">— {h}</div>
            ))}
          </div>
        )}

        <div className="annual__foot">
          <Button variant="primary" size="md" onClick={() => { play("click"); clear(); }}>
            Onward
          </Button>
        </div>
      </div>
    </div>
  );
}
