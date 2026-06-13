import type { RoundTerms } from "@/domain/captable";
import type { TermKey } from "@/domain/negotiation";
import { formatMoney, formatPct } from "@/engine/format";

/** The investor's counter, shown term-by-term against the player's last offer
 *  so the movement is legible at a glance. */
export function CounterCard({ yours, theirs }: { yours: RoundTerms; theirs: RoundTerms }) {
  const rows: { term: TermKey; label: string; you: string; them: string; worse: boolean }[] = [
    {
      term: "valuation",
      label: "Pre-money",
      you: formatMoney(yours.valuation),
      them: formatMoney(theirs.valuation),
      worse: theirs.valuation < yours.valuation,
    },
    {
      term: "roundSize",
      label: "Round size",
      you: formatMoney(yours.roundSize),
      them: formatMoney(theirs.roundSize),
      worse: false,
    },
    {
      term: "liquidationPref",
      label: "Liq. pref",
      you: `${yours.liquidationPref.toFixed(2)}×`,
      them: `${theirs.liquidationPref.toFixed(2)}×`,
      worse: theirs.liquidationPref > yours.liquidationPref,
    },
    {
      term: "boardSeats",
      label: "Board seats",
      you: String(yours.boardSeats),
      them: String(theirs.boardSeats),
      worse: theirs.boardSeats > yours.boardSeats,
    },
    {
      term: "optionPoolPct",
      label: "Option pool",
      you: formatPct(yours.optionPoolPct, 1),
      them: formatPct(theirs.optionPoolPct, 1),
      worse: theirs.optionPoolPct > yours.optionPoolPct,
    },
  ];

  return (
    <div className="counter-card">
      <div className="counter-card__head">Their counter</div>
      <table className="counter-table">
        <thead>
          <tr>
            <th>Term</th>
            <th className="ar">You asked</th>
            <th className="ar">They counter</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.term}>
              <td>{r.label}</td>
              <td className="ar num dim">{r.you}</td>
              <td className={`ar num strong${r.worse ? " counter-worse" : ""}`}>
                {r.them}
                {r.you !== r.them && <span className="counter-arrow">{r.worse ? "▾" : "▴"}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
