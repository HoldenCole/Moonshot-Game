import { useGame } from "@/state/store";
import type { CapTable } from "@/domain/captable";
import { vestedFraction, vestingRows, weeksToFullyVested } from "@/engine/vesting";
import { formatPct, formatShares } from "@/engine/format";
import { Tag } from "@/ui/components/controls";

/** Who's earned their equity, and who could still walk with less. */
export function VestingTab({ capTable }: { capTable: CapTable }) {
  const game = useGame((s) => s.game);
  if (!game) return null;
  const { foundedWeek } = game.company;
  const week = game.clock.week;
  const rows = vestingRows(capTable, foundedWeek, week);
  const wks = weeksToFullyVested(foundedWeek, week);
  const frac = vestedFraction(Math.max(0, week - foundedWeek));

  return (
    <div className="captable-tab rise">
      <p className="panel__sub vesting__intro">
        Grants vest over four years with a one-year cliff. You're {formatPct(frac)} vested
        {wks > 0 ? ` — fully vested in ${wks} weeks.` : " — fully vested."}
      </p>
      <table className="data-table">
        <thead>
          <tr>
            <th>Holder</th>
            <th className="ar">Vested</th>
            <th className="ar">Unvested</th>
            <th className="vesting__progress-h">Progress</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.holderId}>
              <td>
                {r.holderName} {r.flightRisk && <Tag tone="warn">flight risk</Tag>}
              </td>
              <td className="ar num">{formatShares(r.vested)}</td>
              <td className="ar num">{formatShares(r.unvested)}</td>
              <td>
                <span className="vestbar" title={`${Math.round(r.fraction * 100)}% vested`}>
                  <span className="vestbar__fill" style={{ width: `${Math.round(r.fraction * 100)}%` }} />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.some((r) => r.flightRisk) && (
        <p className="vesting__note">
          A co-founder who leaves before fully vesting forfeits their unvested shares back to the company —
          your effective ownership rises if they walk early.
        </p>
      )}
    </div>
  );
}
