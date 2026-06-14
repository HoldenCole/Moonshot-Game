import { useGame } from "@/state/store";
import { canExplore, ipoEligible } from "@/engine/exit";
import { Panel } from "@/ui/components/Panel";
import { Button } from "@/ui/components/controls";

/** Exit CTAs, shown on the dashboard once an exit is on the table. */
export function ExitActions() {
  const game = useGame((s) => s.game);
  const openIpo = useGame((s) => s.openIpo);
  const exploreSale = useGame((s) => s.exploreSale);
  if (!game) return null;

  const ipoOk = ipoEligible(game);
  const saleOk = canExplore(game);
  if (!ipoOk && !saleOk) return null;

  return (
    <Panel className="exit-actions">
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
