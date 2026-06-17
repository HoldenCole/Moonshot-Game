import { useState } from "react";
import { useGame } from "@/state/store";
import { holdingGain, type InvestAccount } from "@/engine/investing";
import { formatMoney } from "@/engine/format";
import { Panel, PanelHeader } from "@/ui/components/Panel";
import { Segmented } from "@/ui/components/controls";

/** Stakes held in other public companies, marked to market — switchable between
 *  the founder's personal portfolio and the company treasury's. */
export function PortfolioPanel() {
  const game = useGame((s) => s.game);
  const content = useGame((s) => s.content);
  const [acct, setAcct] = useState<InvestAccount>("personal");
  if (!game) return null;
  const isCo = acct === "company";
  const pf = (isCo ? game.company.portfolio : game.founder.portfolio) ?? [];
  const nameOf = (id: string) =>
    content.companyById.get(id)?.name ?? game.market.companies.find((c) => c.id === id)?.name ?? id;
  const total = pf.reduce((s, h) => s + h.value, 0);
  const gain = Math.round((total - pf.reduce((s, h) => s + h.costBasis, 0)) * 100) / 100;

  return (
    <Panel className="portfolio-panel">
      <PanelHeader
        title="Portfolio"
        sub={isCo ? `${game.company.name}'s strategic stakes` : "Your personal stakes in other companies"}
        right={
          <Segmented
            size="sm"
            value={acct}
            onChange={setAcct}
            options={[
              { value: "personal", label: "Personal" },
              { value: "company", label: "Company" },
            ]}
          />
        }
      />
      {pf.length === 0 ? (
        <p className="portfolio__empty dim">
          {isCo
            ? "No treasury holdings yet — your company can take strategic stakes from the Market tab."
            : "No personal holdings yet — open a company in the Market tab and buy a stake."}
        </p>
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
