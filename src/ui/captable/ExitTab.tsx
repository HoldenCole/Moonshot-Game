import { useMemo, useState } from "react";
import type { CapTable } from "@/domain/captable";
import { exitWaterfall, latestPostMoney, ownership } from "@/engine/captable";
import { formatMoney, formatMultiple, formatPct } from "@/engine/format";
import { PayoutCurve, type CurvePoint } from "@/ui/charts/PayoutCurve";
import { Slider, Tag } from "@/ui/components/controls";
import { holderColors } from "./colors";

function founderTake(rows: ReturnType<typeof exitWaterfall>): number {
  return rows
    .filter((r) => r.holderType === "founder" || r.holderType === "cofounder")
    .reduce((s, r) => s + r.payout, 0);
}

export function ExitTab({ capTable }: { capTable: CapTable }) {
  const post = Math.max(latestPostMoney(capTable), 10);
  const maxExit = Math.round(post * 6);
  const [exitValue, setExitValue] = useState(Math.round(post * 1.5));

  const series: CurvePoint[] = useMemo(() => {
    const pts: CurvePoint[] = [];
    const steps = 48;
    for (let i = 0; i <= steps; i++) {
      const x = (maxExit / steps) * i;
      pts.push({ x, y: founderTake(exitWaterfall(capTable, x)) });
    }
    return pts;
  }, [capTable, maxExit]);

  const breakdown = useMemo(() => exitWaterfall(capTable, exitValue), [capTable, exitValue]);
  const colors = holderColors(ownership(capTable));
  const yourTake = founderTake(breakdown);

  return (
    <div className="captable-tab rise">
      <div className="exit-controls">
        <Slider
          label="Exit value"
          value={exitValue}
          min={0}
          max={maxExit}
          step={Math.max(1, Math.round(maxExit / 200))}
          onChange={setExitValue}
          format={(v) => formatMoney(v)}
          hint="Drag to model an acquisition or IPO at different valuations."
        />
        <div className="exit-take">
          <div className="exit-take__label">Your take-home</div>
          <div className="exit-take__value num">{formatMoney(yourTake)}</div>
          <div className="exit-take__sub">
            {formatPct(exitValue > 0 ? yourTake / exitValue : 0)} of exit
          </div>
        </div>
      </div>

      <PayoutCurve
        series={series}
        markerX={exitValue}
        formatX={(v) => formatMoney(v)}
        formatY={(v) => formatMoney(v)}
      />

      <table className="data-table data-table--tight">
        <thead>
          <tr>
            <th>Holder</th>
            <th className="ar">Proceeds</th>
            <th className="ar">MOIC</th>
            <th>Outcome</th>
          </tr>
        </thead>
        <tbody>
          {breakdown.map((r) => (
            <tr key={r.holderId}>
              <td>
                <span className="swatch swatch--sm" style={{ background: colors.get(r.holderId) }} />
                {r.holderName}
              </td>
              <td className="ar num strong">{formatMoney(r.payout)}</td>
              <td className="ar num dim">
                {r.multipleOnInvested != null ? formatMultiple(r.multipleOnInvested) : "—"}
              </td>
              <td>
                {r.holderType === "investor" ? (
                  r.tookPreference ? (
                    <Tag tone="warn">Took preference</Tag>
                  ) : (
                    <Tag tone="up">Converted to common</Tag>
                  )
                ) : (
                  <span className="dim">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
