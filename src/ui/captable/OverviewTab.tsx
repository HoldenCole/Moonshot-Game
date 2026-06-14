import type { CapTable } from "@/domain/captable";
import {
  founderOwnership,
  latestPostMoney,
  ownership,
  totalShares,
} from "@/engine/captable";
import { formatMoney, formatPct, formatShares } from "@/engine/format";
import { StackedBar } from "@/ui/charts/StackedBar";
import { Stat } from "@/ui/components/controls";
import { holderColors, isLightSeries } from "./colors";

export function OverviewTab({ capTable }: { capTable: CapTable }) {
  const post = latestPostMoney(capTable);
  const rows = ownership(capTable, post);
  const colors = holderColors(rows);
  const founderFrac = founderOwnership(capTable);
  const founderRow = rows.find((r) => r.holderType === "founder");
  const totalRaised = capTable.rounds.reduce((s, r) => s + r.amountRaised, 0);
  const pricedRounds = capTable.rounds.filter((r) => r.postMoney > 0).length;

  const segments = rows.map((r) => {
    const color = colors.get(r.holderId)!;
    return {
      key: r.holderId,
      label: r.holderName,
      value: r.ownership,
      color,
      labelDark: isLightSeries(color),
    };
  });

  return (
    <div className="captable-tab rise">
      <div className="glance">
        <Stat label="Your stake" value={formatPct(founderFrac)} tone="neutral" />
        <Stat
          label="Stake value"
          value={post > 0 ? formatMoney((founderRow?.ownership ?? founderFrac) * post) : "—"}
          sub={post > 0 ? `at ${formatMoney(post)} post` : "pre-raise"}
        />
        <Stat label="Total raised" value={totalRaised > 0 ? formatMoney(totalRaised) : "—"} />
        <Stat label="Post-money" value={post > 0 ? formatMoney(post) : "—"} />
        <Stat label="Rounds" value={String(pricedRounds)} sub="priced" />
        <Stat label="Shares out" value={formatShares(totalShares(capTable))} />
      </div>

      <div className="ownership-bar">
        <StackedBar segments={segments} height={34} />
      </div>

      <ul className="holder-legend">
        {rows.map((r) => (
          <li key={r.holderId} className="holder-legend__row">
            <span className="swatch" style={{ background: colors.get(r.holderId) }} />
            <span className="holder-legend__name">
              {r.holderName}
              {r.shareClass !== "common" && r.holderType !== "pool" && (
                <span className="holder-legend__class">{r.shareClass}</span>
              )}
            </span>
            <span className="holder-legend__pct num">{formatPct(r.ownership)}</span>
            <span className="holder-legend__val num">{post > 0 ? formatMoney(r.currentValue) : "—"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
