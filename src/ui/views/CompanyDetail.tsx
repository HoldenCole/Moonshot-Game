import { useState } from "react";
import { useGame } from "@/state/store";
import type { Company } from "@/content/load";
import type { CompanyGraph } from "@/engine/companyGraph";
import { fundamentalValue, marketPrice, mispricing } from "@/engine/pricing";
import { holdingGain, type InvestAccount } from "@/engine/investing";
import { formatMoney, formatPct } from "@/engine/format";
import { industryLabel, subIndustryLabel } from "@/domain/ids";
import { Icon } from "@/ui/components/Icon";
import { Button, Segmented } from "@/ui/components/controls";

/** The detail drawer for a selected market company: live price vs. fair value
 *  (the mispricing skill signal), quality, and its place in the relationship
 *  graph — including any investor it shares with you. */
export function CompanyDetail({
  company,
  graph,
  byId,
  playerInvestorIds,
  onClose,
}: {
  company: Company;
  graph: CompanyGraph;
  byId: Map<string, Company>;
  playerInvestorIds: Set<string>;
  onClose: () => void;
}) {
  const game = useGame((s) => s.game)!;
  const firmById = useGame((s) => s.content.investorById);

  const fair = fundamentalValue(company);
  const price = marketPrice(company, game.world, game.clock.week);
  const mis = mispricing(company, game.world, game.clock.week);
  // shares_out is in millions, so cap ($M) / shares (M) is $/share. Private
  // companies carry 0 shares out — no public stock price.
  const perShare = company.financials.shares_out > 0 ? price / company.financials.shares_out : null;
  const names = (ids: string[]) => ids.map((id) => byId.get(id)?.name ?? id);

  const investors = graph.investorsOf(company.id);
  const sharedWithYou = investors.filter((f) => playerInvestorIds.has(f));

  return (
    <aside className="market-detail">
      <div className="market-detail__head">
        <span className="swatch" style={{ background: company.color }} />
        <div className="market-detail__id">
          <div className="market-detail__name">{company.name}</div>
          <div className="market-detail__sub">
            {subIndustryLabel(company.sub_industry)} · {industryLabel(company.industry)}
          </div>
        </div>
        <button className="iconbtn" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <p className="market-detail__tag">{company.identity.tagline}</p>

      <div className="market-detail__price">
        {perShare != null && (
          <div>
            <div className="kv__label">Stock price</div>
            <div className="kv__big num">${perShare.toFixed(2)}</div>
          </div>
        )}
        <div>
          <div className="kv__label">Market cap</div>
          <div className="kv__big num">{formatMoney(price)}</div>
        </div>
        <div>
          <div className="kv__label">Fair value</div>
          <div className="kv__big num">{formatMoney(fair)}</div>
        </div>
        <div>
          <div className="kv__label">vs. fair</div>
          <div className={`kv__big num ${mis >= 0 ? "down" : "up"}`}>
            {mis >= 0 ? "+" : ""}
            {formatPct(mis, 0)}
          </div>
        </div>
      </div>
      <p className="market-detail__read">
        {Math.abs(mis) < 0.06
          ? "Trading near fair value."
          : mis > 0
            ? "The market is paying a premium — hype is running ahead of fundamentals."
            : "Trading at a discount to fundamentals — potentially mispriced."}
      </p>

      {perShare != null && <InvestSection company={company} />}

      <Section label="Quality">
        <Bar label="Fundamentals" value={company.quality.fundamentals} />
        <Bar label="Moat" value={company.quality.moat} />
        <Bar label="Execution" value={company.quality.execution} />
        <Bar label="Hype exposure" value={Math.round(company.quality.hype_exposure * 100)} />
      </Section>

      {sharedWithYou.length > 0 && (
        <div className="market-detail__shared">
          <Icon name="fundraising" size={14} />
          {sharedWithYou.map((f) => firmById.get(f)?.name ?? f).join(", ")} also{" "}
          {sharedWithYou.length > 1 ? "back" : "backs"} you.
        </div>
      )}

      <RelRow label="Competitors" names={names(graph.competitorsOf(company.id))} />
      <RelRow label="Suppliers" names={names(graph.suppliersOf(company.id))} />
      <RelRow label="Customers" names={names(graph.customersOf(company.id))} />
      <RelRow label="Investors" names={investors.map((f) => firmById.get(f)?.name ?? f)} highlight={sharedWithYou.map((f) => firmById.get(f)?.name ?? f)} />
    </aside>
  );
}

/** Buy / sell a stake, from either personal cash or the company treasury. */
function InvestSection({ company }: { company: Company }) {
  const game = useGame((s) => s.game)!;
  const buy = useGame((s) => s.buyStock);
  const sell = useGame((s) => s.sellStock);
  const [acct, setAcct] = useState<InvestAccount>("personal");
  const isCo = acct === "company";
  const cash = isCo ? game.company.financials.cash : game.founder.personalCash;
  const holding = (isCo ? game.company.portfolio : game.founder.portfolio)?.find((h) => h.companyId === company.id);
  const canInvest = cash >= 0.1;
  const amt = (frac: number) => Math.round(cash * frac * 100) / 100;

  return (
    <div className="invest-box">
      <div className="invest-box__head">
        <span className="section-label">Invest</span>
        <Segmented
          size="sm"
          value={acct}
          onChange={setAcct}
          options={[
            { value: "personal", label: "Personal" },
            { value: "company", label: "Company" },
          ]}
        />
      </div>
      <div className="invest-box__sub">
        <span className="invest-box__cash num">{formatMoney(cash)}</span>{" "}
        {isCo ? `in ${game.company.name}'s treasury` : "personal cash"} to invest
      </div>
      {holding && (
        <div className="invest-pos">
          <span className="invest-pos__own">
            {isCo ? game.company.name : "You"} hold <strong className="num">{formatMoney(holding.value)}</strong>
          </span>
          <span className={`invest-pos__gain num ${holdingGain(holding) >= 0 ? "up" : "down"}`}>
            {holdingGain(holding) >= 0 ? "+" : ""}
            {formatMoney(holdingGain(holding))}
          </span>
          <div className="invest-pos__sell">
            <Button variant="subtle" size="sm" onClick={() => sell(company.id, 0.5, acct)}>
              Sell half
            </Button>
            <Button variant="subtle" size="sm" onClick={() => sell(company.id, 1, acct)}>
              Sell all
            </Button>
          </div>
        </div>
      )}
      {canInvest ? (
        <div className="invest-buy">
          {[0.1, 0.25, 0.5].map((frac) => (
            <Button key={frac} variant="primary" size="sm" onClick={() => buy(company.id, amt(frac), acct)} disabled={amt(frac) < 0.1}>
              Buy {formatMoney(amt(frac))}
            </Button>
          ))}
        </div>
      ) : (
        <p className="invest-box__none dim">
          {isCo
            ? "The treasury has no cash to invest right now."
            : "No personal capital to invest yet — exits and cash-outs build it."}
        </p>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="market-detail__section">
      <div className="section-label">{label}</div>
      {children}
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="qbar">
      <span className="qbar__label">{label}</span>
      <span className="qbar__track">
        <span className="qbar__fill" style={{ width: `${value}%` }} />
      </span>
      <span className="qbar__val num">{value}</span>
    </div>
  );
}

function RelRow({ label, names, highlight = [] }: { label: string; names: string[]; highlight?: string[] }) {
  return (
    <div className="market-detail__rel">
      <span className="market-detail__rel-label">{label}</span>
      <span className="market-detail__rel-names">
        {names.length === 0 ? (
          <span className="dim">—</span>
        ) : (
          names.map((n, i) => (
            <span key={n}>
              {i > 0 && ", "}
              <span className={highlight.includes(n) ? "market-detail__rel-hot" : undefined}>{n}</span>
            </span>
          ))
        )}
      </span>
    </div>
  );
}
