// The Ledger — the finance screen every business sim keeps: the run's whole
// financial history as one big chart (pick your series), the income statement
// at run-rate, where the money goes, and this year against last.
import { useState } from "react";
import { useGame } from "@/state/store";
import { formatMoney } from "@/engine/format";
import { monthlyDebtService } from "@/engine/debt";
import { Panel, PanelHeader } from "@/ui/components/Panel";
import { Segmented } from "@/ui/components/controls";
import type { RunSnapshot } from "@/engine/history";

type Series = "netWorth" | "valuation" | "revenue" | "cash";

const SERIES: { id: Series; label: string; color: string }[] = [
  { id: "netWorth", label: "Net worth", color: "#e8c76a" },
  { id: "valuation", label: "Valuation", color: "#6f9cff" },
  { id: "revenue", label: "Revenue", color: "#3ad29a" },
  { id: "cash", label: "Cash", color: "#46d6c8" },
];

const W = 920;
const H = 210;

function BigChart({ history, series }: { history: RunSnapshot[]; series: Series }) {
  const meta = SERIES.find((s) => s.id === series)!;
  const pts = history.length > 1 ? history : [...history, ...history];
  if (pts.length < 2) {
    return <div className="ledger-empty dim">The first weeks are still being written — advance time and the chart draws itself.</div>;
  }
  const vals = pts.map((p) => p[series]);
  const min = Math.min(...vals, 0);
  const max = Math.max(...vals) * 1.06 + 0.001;
  const px = (i: number) => (i / (pts.length - 1)) * W;
  const py = (v: number) => H - 18 - ((v - min) / (max - min)) * (H - 30);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${px(i).toFixed(1)} ${py(p[series]).toFixed(1)}`).join(" ");
  const last = vals[vals.length - 1]!;
  const yearTicks: number[] = [];
  for (let w = 52; w <= pts[pts.length - 1]!.week; w += 52) {
    const idx = pts.findIndex((p) => p.week >= w);
    if (idx > 0) yearTicks.push(idx);
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ledger-chart" aria-label={`${meta.label} over the whole run`}>
      <defs>
        <linearGradient id={`ledger-fill-${series}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={meta.color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={meta.color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((t) => (
        <line key={t} x1={0} y1={H * t} x2={W} y2={H * t} stroke="rgba(255,255,255,0.05)" />
      ))}
      {yearTicks.map((idx, i) => (
        <g key={idx}>
          <line x1={px(idx)} y1={0} x2={px(idx)} y2={H - 14} stroke="rgba(255,255,255,0.07)" strokeDasharray="2 5" />
          <text x={px(idx) + 4} y={H - 4} className="xch-axis">Y{i + 1}</text>
        </g>
      ))}
      <path d={`${path} L ${W} ${H - 18} L 0 ${H - 18} Z`} fill={`url(#ledger-fill-${series})`} />
      <path d={path} fill="none" stroke={meta.color} strokeWidth={2} className="exchange__line" />
      <circle cx={px(pts.length - 1)} cy={py(last)} r={3.4} fill={meta.color} className="exchange__dot" />
      <text x={W - 4} y={14} textAnchor="end" className="ledger-chart__last num" fill={meta.color}>
        {formatMoney(last)}
      </text>
    </svg>
  );
}

export function LedgerView() {
  const game = useGame((s) => s.game);
  const [series, setSeries] = useState<Series>("netWorth");
  if (!game) return null;
  const c = game.company;
  const f = c.financials;
  const history = game.history ?? [];

  // The run-rate income statement: what a full year at this week's pace does.
  const opex = f.burnMonthly * 12;
  const rd = (c.products?.rd.rd_budget_per_week ?? 0) * 52;
  const debt = monthlyDebtService(c) * 12;
  const net = f.revenue - opex - rd - debt;
  const spend = [
    { label: "Operations", v: opex, color: "#6f9cff" },
    { label: "R&D", v: rd, color: "#46d6c8" },
    { label: "Debt service", v: debt, color: "#f0b54e" },
  ].filter((s) => s.v > 0);
  const spendTotal = spend.reduce((s, x) => s + x.v, 0);

  // This year against last, from the history buffer.
  const now = history[history.length - 1];
  const ago = history.length > 52 ? history[history.length - 53] : null;
  const yoy = (a: number, b: number | undefined) => (b == null || b === 0 ? null : ((a - b) / Math.abs(b)) * 100);
  const rows: { label: string; now: string; ago: string; delta: number | null }[] = now
    ? [
        { label: "Revenue", now: `${formatMoney(now.revenue)}/yr`, ago: ago ? `${formatMoney(ago.revenue)}/yr` : "—", delta: yoy(now.revenue, ago?.revenue) },
        { label: "Valuation", now: formatMoney(now.valuation), ago: ago ? formatMoney(ago.valuation) : "—", delta: yoy(now.valuation, ago?.valuation) },
        { label: "Net worth", now: formatMoney(now.netWorth), ago: ago ? formatMoney(ago.netWorth) : "—", delta: yoy(now.netWorth, ago?.netWorth) },
        { label: "Headcount", now: String(now.headcount), ago: ago ? String(ago.headcount) : "—", delta: yoy(now.headcount, ago?.headcount) },
      ]
    : [];

  return (
    <div className="workspace-scroll">
      <section className="hero-panel ledger-hero">
        <div className="observatory__head">
          <div className="hero-kicker">The Ledger · week {game.clock.week} · year {Math.floor(game.clock.week / 52) + 1}</div>
          <Segmented size="sm" value={series} onChange={(v) => setSeries(v as Series)} options={SERIES.map((s) => ({ value: s.id, label: s.label }))} />
        </div>
        <BigChart history={history} series={series} />
      </section>

      <Panel className="ledger-statement">
        <PanelHeader title="Income statement" sub="A full year at this week's pace — the run-rate truth" />
        <div className="ledger-lines">
          <div className="ledger-line"><span>Revenue</span><b className="num up">{formatMoney(f.revenue)}</b></div>
          <div className="ledger-line"><span>Operating costs</span><b className="num down">−{formatMoney(opex)}</b></div>
          {rd > 0 && <div className="ledger-line"><span>R&amp;D budget</span><b className="num down">−{formatMoney(rd)}</b></div>}
          {debt > 0 && <div className="ledger-line"><span>Debt service</span><b className="num down">−{formatMoney(debt)}</b></div>}
          <div className="ledger-line ledger-line--total"><span>Net, run-rate</span><b className={`num ${net >= 0 ? "up" : "down"}`}>{net >= 0 ? "" : "−"}{formatMoney(Math.abs(net))}/yr</b></div>
        </div>
        {spendTotal > 0 && (
          <div className="ledger-spend">
            <div className="section-label">Where the money goes</div>
            <div className="ledger-spend__bar">
              {spend.map((s) => (
                <span key={s.label} style={{ width: `${(s.v / spendTotal) * 100}%`, background: s.color }} title={`${s.label}: ${formatMoney(s.v)}/yr`} />
              ))}
            </div>
            <div className="ledger-spend__legend">
              {spend.map((s) => (
                <span key={s.label}><i style={{ background: s.color }} /> {s.label} · {formatMoney(s.v)}/yr</span>
              ))}
            </div>
          </div>
        )}
      </Panel>

      {rows.length > 0 && (
        <Panel className="ledger-yoy">
          <PanelHeader title="This year vs last" sub={ago ? "Fifty-two weeks of distance" : "The first year is still underway"} />
          <div className="ledger-yoy__grid">
            <span className="ledger-yoy__head" />
            <span className="ledger-yoy__head">Now</span>
            <span className="ledger-yoy__head">A year ago</span>
            <span className="ledger-yoy__head ar">Change</span>
            {rows.map((r) => (
              <>
                <span key={`${r.label}-l`} className="ledger-yoy__label">{r.label}</span>
                <span key={`${r.label}-n`} className="num">{r.now}</span>
                <span key={`${r.label}-a`} className="num dim">{r.ago}</span>
                <span key={`${r.label}-d`} className={`num ar ${r.delta == null ? "dim" : r.delta >= 0 ? "up" : "down"}`}>
                  {r.delta == null ? "—" : `${r.delta >= 0 ? "+" : ""}${r.delta.toFixed(0)}%`}
                </span>
              </>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
