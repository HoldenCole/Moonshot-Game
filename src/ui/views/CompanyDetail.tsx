import { useGame } from "@/state/store";
import type { Company } from "@/content/load";
import type { CompanyGraph } from "@/engine/companyGraph";
import { fundamentalValue, marketPrice, mispricing } from "@/engine/pricing";
import { formatMoney, formatPct } from "@/engine/format";
import { industryLabel, subIndustryLabel } from "@/domain/ids";
import { Icon } from "@/ui/components/Icon";

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
