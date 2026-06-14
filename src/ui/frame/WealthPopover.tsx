import { useGame } from "@/state/store";
import { founderOwnership } from "@/engine/captable";
import { nextMilestone, wealthBreakdown } from "@/engine/wealth";
import { formatMoney, formatPct } from "@/engine/format";

/** Net-worth breakdown popover (Phase 8): equity vs. cash, and progress along
 *  the founder→magnate milestone ladder. */
export function WealthPopover({ onClose }: { onClose: () => void }) {
  const game = useGame((s) => s.game);
  const tuning = useGame((s) => s.content.tuning);
  if (!game) return null;

  const w = wealthBreakdown(game);
  const stakePct = founderOwnership(game.company.capTable);
  const ms = nextMilestone(w.total, tuning);
  const ladder = tuning.milestones.netWorth;
  const achieved = new Set(game.achievedMilestones);

  return (
    <>
      <div className="popover-scrim" onClick={onClose} />
      <div className="wealth-pop rise">
        <div className="wealth-pop__total">
          <span className="kv__label">Net worth</span>
          <span className="wealth-pop__big num">{w.total > 0 ? formatMoney(w.total) : "—"}</span>
        </div>

        <div className="wealth-pop__rows">
          <div className="wealth-pop__row">
            <span className="wealth-pop__k">Equity stake</span>
            <span className="wealth-pop__sub">{formatPct(stakePct)} of {game.company.name}</span>
            <span className="wealth-pop__v num">{formatMoney(w.equity)}</span>
          </div>
          <div className="wealth-pop__row">
            <span className="wealth-pop__k">Personal cash</span>
            <span className="wealth-pop__sub">liquid</span>
            <span className="wealth-pop__v num">{formatMoney(w.cash)}</span>
          </div>
        </div>

        {ms ? (
          <div className="wealth-pop__ms">
            <div className="wealth-pop__ms-head">
              <span>Next milestone</span>
              <span className="num">{formatMoney(ms.target)}</span>
            </div>
            <div className="wealth-pop__bar">
              <div className="wealth-pop__fill" style={{ width: `${ms.progress * 100}%` }} />
            </div>
          </div>
        ) : (
          <div className="wealth-pop__ms-done">Every milestone crossed. You move markets now.</div>
        )}

        <div className="wealth-pop__ladder">
          {ladder.map((m) => (
            <div key={m} className={`wealth-rung${achieved.has(m) ? " is-done" : ""}`}>
              <span className="wealth-rung__dot" />
              <span className="wealth-rung__label num">{formatMoney(m)}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
