import type { CapTable } from "@/domain/captable";
import { latestPostMoney, ownership } from "@/engine/captable";
import { formatMoney, formatPct, formatShares } from "@/engine/format";
import { holderColors } from "./colors";

const TYPE_LABEL: Record<string, string> = {
  founder: "Founder",
  cofounder: "Co-founder",
  investor: "Investor",
  self: "Self",
  pool: "Option Pool",
  employee: "Employee",
};

export function HoldersTab({ capTable }: { capTable: CapTable }) {
  const post = latestPostMoney(capTable);
  const rows = ownership(capTable, post);
  const colors = holderColors(rows);

  return (
    <div className="captable-tab rise">
      <table className="data-table">
        <thead>
          <tr>
            <th>Holder</th>
            <th>Type</th>
            <th>Class</th>
            <th className="ar">Shares</th>
            <th className="ar">Ownership</th>
            <th className="ar">Invested</th>
            <th className="ar">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.holderId}>
              <td>
                <span className="swatch swatch--sm" style={{ background: colors.get(r.holderId) }} />
                {r.holderName}
              </td>
              <td className="dim">{TYPE_LABEL[r.holderType] ?? r.holderType}</td>
              <td className="dim">{r.shareClass === "mixed" ? "Mixed" : cap(r.shareClass)}</td>
              <td className="ar num">{formatShares(r.shares)}</td>
              <td className="ar num strong">{formatPct(r.ownership)}</td>
              <td className="ar num dim">{r.investedAmount > 0 ? formatMoney(r.investedAmount) : "—"}</td>
              <td className="ar num">{post > 0 ? formatMoney(r.currentValue) : "—"}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3}>Fully diluted</td>
            <td className="ar num">{formatShares(rows.reduce((s, r) => s + r.shares, 0))}</td>
            <td className="ar num strong">100.0%</td>
            <td className="ar num dim">
              {formatMoney(rows.reduce((s, r) => s + r.investedAmount, 0))}
            </td>
            <td className="ar num">{post > 0 ? formatMoney(post) : "—"}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
