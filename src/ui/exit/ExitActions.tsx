import { useGame } from "@/state/store";
import { canExplore, cashOutProceeds, ipoEligible, lockupExpired, weeksToUnlock } from "@/engine/exit";
import { formatMoney } from "@/engine/format";
import { Panel } from "@/ui/components/Panel";
import { Button } from "@/ui/components/controls";

/** Exit CTAs. Pre-IPO: take the company public or field a sale. Post-IPO: a
 *  live public company you can ride, cash out of (after lockup), or sell. */
export function ExitActions() {
  const game = useGame((s) => s.game);
  const openIpo = useGame((s) => s.openIpo);
  const exploreSale = useGame((s) => s.exploreSale);
  const cashOut = useGame((s) => s.cashOut);
  if (!game) return null;

  if (game.company.stage === "public") {
    const unlocked = lockupExpired(game);
    const wks = weeksToUnlock(game);
    const proceeds = cashOutProceeds(game);
    return (
      <Panel className="exit-actions" coach="exit">
        <div className="exit-actions__row">
          <div>
            <div className="section-label">Public company</div>
            <p className="exit-actions__note">
              {unlocked
                ? `Your shares are unlocked. Sell your stake to walk with ${formatMoney(proceeds)} — it ends the run.`
                : `Shares lock for ${wks} more week${wks === 1 ? "" : "s"}. The market re-prices you every week until you can sell.`}
            </p>
          </div>
          <div className="exit-actions__btns">
            <Button variant="primary" size="md" disabled={!unlocked} onClick={cashOut}>
              {unlocked ? `Sell your stake — ${formatMoney(proceeds)}` : `Locked · ${wks}w`}
            </Button>
            <Button variant="subtle" size="md" onClick={exploreSale}>
              Field an acquisition
            </Button>
          </div>
        </div>
      </Panel>
    );
  }

  const ipoOk = ipoEligible(game);
  const saleOk = canExplore(game);
  if (!ipoOk && !saleOk) return null;

  return (
    <Panel className="exit-actions" coach="exit">
      <div className="exit-actions__row">
        <div>
          <div className="section-label">Exit</div>
          <p className="exit-actions__note">
            {ipoOk
              ? "You're public-ready and the window is open. Or take an offer."
              : "Not yet IPO-ready, but a buyer may still come knocking."}
          </p>
        </div>
        <div className="exit-actions__btns">
          {ipoOk && (
            <Button variant="primary" size="md" onClick={openIpo}>
              Take {game.company.name} public
            </Button>
          )}
          <Button variant="subtle" size="md" onClick={exploreSale}>
            Explore a sale
          </Button>
        </div>
      </div>
    </Panel>
  );
}
