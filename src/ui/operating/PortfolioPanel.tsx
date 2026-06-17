import { useGame } from "@/state/store";
import { holdingGain } from "@/engine/investing";
import { formatMoney } from "@/engine/format";
import { Panel, PanelHeader } from "@/ui/components/Panel";

/** The founder's personal stakes in other public companies, marked to market. */
export function PortfolioPanel() {
  const game = useGame((s) => s.game);
  const content = useGame((s) => s.content);
  if (!game) return null;
  const pf = game.founder.portfolio ?? [];
  const nameOf = (id: string) =>
    content.companyById.get(id)?.name ?? game.market.companies.find((c) => c.id === id)?.name ?? id;
  const total = pf.reduce((s, h) => s + h.value, 0);
  const gain = Math.round((total - pf.reduce((s, h) => s + h.costBasis, 0)) * 100) / 100;

  return (
    <Panel className="portfolio-panel">
      <PanelHeader title="Portfolio" sub="Your personal stakes in other public companies" />
      {pf.length === 0 ? (
        <p className="portfolio__empty dim">No holdings yet — open a company in the Market tab and buy a stake.</p>
      ) : (
        <>
          <div className="portfolio__total">
            <span className="portfolio__total-v num">{formatMoney(total)}</span>
            <span className={`portfolio__total-g num ${gain >= 0 ? "up" : "down"}`}>
              {gain >= 0 ? "+" : ""}
              {formatMoney(gain)}
            </span>
          </div>
          <div className="portfolio__rows">
            {pf.map((h) => (
              <div key={h.companyId} className="portfolio__row">
                <span className="portfolio__name">{nameOf(h.companyId)}</span>
                <span className="portfolio__val num">{formatMoney(h.value)}</span>
                <span className={`portfolio__gain num ${holdingGain(h) >= 0 ? "up" : "down"}`}>
                  {holdingGain(h) >= 0 ? "+" : ""}
                  {formatMoney(holdingGain(h))}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}
