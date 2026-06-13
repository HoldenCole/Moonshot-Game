import type { CapTable } from "@/domain/captable";
import { roundHistory } from "@/engine/captable";
import { formatMoney, formatPct, formatPricePerShare } from "@/engine/format";
import { DualLine, type DualPoint } from "@/ui/charts/DualLine";

export function RoundsTab({ capTable }: { capTable: CapTable }) {
  const history = roundHistory(capTable);
  const priced = capTable.rounds.filter((r) => r.postMoney > 0);

  // Chart from founding onward; founding seeds the 100% baseline.
  const points: DualPoint[] = history.map((h) => ({
    label: h.roundName === "Founding" ? "Found" : h.roundName,
    left: h.founderOwnershipAfter,
    right: h.founderValueAfter,
  }));

  return (
    <div className="captable-tab rise">
      {points.length > 1 ? (
        <DualLine
          points={points}
          formatLeft={(v) => formatPct(v, 0)}
          formatRight={(v) => formatMoney(v)}
          leftLabel="Your ownership"
          rightLabel="Your stake value"
        />
      ) : (
        <div className="empty-note">Raise your first round to chart dilution against value.</div>
      )}

      <table className="data-table data-table--tight">
        <thead>
          <tr>
            <th>Round</th>
            <th>Lead</th>
            <th className="ar">Pre-money</th>
            <th className="ar">Raised</th>
            <th className="ar">Post-money</th>
            <th className="ar">Price/sh</th>
            <th className="ar">Your %</th>
          </tr>
        </thead>
        <tbody>
          {priced.map((r) => {
            const h = history.find((x) => x.roundId === r.id);
            return (
              <tr key={r.id}>
                <td className="strong">{r.name}</td>
                <td className="dim">{r.leadInvestorName ?? "—"}</td>
                <td className="ar num">{formatMoney(r.preMoney)}</td>
                <td className="ar num">{formatMoney(r.amountRaised)}</td>
                <td className="ar num strong">{formatMoney(r.postMoney)}</td>
                <td className="ar num dim">{formatPricePerShare(r.pricePerShare)}</td>
                <td className="ar num">{h ? formatPct(h.founderOwnershipAfter) : "—"}</td>
              </tr>
            );
          })}
          {priced.length === 0 && (
            <tr>
              <td colSpan={7} className="dim center">
                No priced rounds yet — you own 100%.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
