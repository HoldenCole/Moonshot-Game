import { useMemo, useState } from "react";
import { useGame } from "@/state/store";
import { usePrefs } from "@/state/prefs";
import type { Company } from "@/content/load";
import type { GameState } from "@/domain/state";
import { industryLabel, subIndustryLabel, type Industry } from "@/domain/ids";
import { formatMoney, formatPct } from "@/engine/format";
import { marketPrice } from "@/engine/pricing";
import { revenueGrowth, valuationMark } from "@/engine/finance";
import { totalShares } from "@/engine/captable";
import { buildGraph } from "@/engine/companyGraph";
import { Segmented, Tag } from "@/ui/components/controls";
import { useMarketTape } from "./useMarketTape";
import { CompanyDetail } from "./CompanyDetail";

type Sort = "valuation" | "revenue" | "fundamentals" | "growth";

const PLAYER_ID = "__you__";

/** The player's operating company, shaped as a market Company so it sits in the
 *  same table as its rivals — priced at its live valuation mark (not the rival
 *  hype/macro pricing). */
function playerCompany(game: GameState): Company {
  const c = game.company;
  return {
    id: PLAYER_ID,
    name: c.name,
    tier: "anchor",
    industry: c.industry,
    sub_industry: c.subIndustry,
    founded_year: 0,
    hq: "—",
    color: c.color,
    logo_glyph: "★",
    identity: { tagline: "Your company", reputation: game.founder.reputation, narrative_hooks: [] },
    stage: { status: c.stage === "public" ? "public" : "private", private_round: c.stage, ipo_year: 0 },
    financials: {
      revenue: c.financials.revenue,
      revenue_growth: revenueGrowth(c) ?? 0,
      gross_margin: 0.5,
      profitable: c.financials.revenue / 12 > c.financials.burnMonthly,
      burn_monthly: c.financials.burnMonthly,
      valuation: valuationMark(c),
      shares_out: Math.max(1, totalShares(c.capTable) / 1_000_000),
    },
    quality: { fundamentals: 60, hype_exposure: 0.5, moat: 50, execution: 60 },
    relationships: { investors: [] },
  };
}

export function MarketView() {
  const game = useGame((s) => s.game);
  const content = useGame((s) => s.content);
  const [industry, setIndustry] = useState<Industry | "all">("all");
  const [sort, setSort] = useState<Sort>("valuation");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const player = useMemo(() => (game ? playerCompany(game) : null), [game]);
  const companies = useMemo(
    () => [...(player ? [player] : []), ...content.companies, ...(game?.market.companies ?? [])],
    [player, content.companies, game?.market.companies],
  );
  const graph = useMemo(() => buildGraph(companies), [companies]);
  const byId = useMemo(() => new Map(companies.map((c) => [c.id, c])), [companies]);

  const world = game?.world;
  const week = game?.clock.week ?? 0;
  // Price every company once per render (sorting + each row cell read this),
  // instead of recomputing marketPrice on every comparison.
  const priceById = useMemo(() => {
    const m = new Map<string, number>();
    // The player's own mark is authoritative — don't run it through rival pricing.
    for (const c of companies) m.set(c.id, c.id === PLAYER_ID || !world ? c.financials.valuation : marketPrice(c, world, week));
    return m;
  }, [companies, world, week]);
  const priceOf = (c: Company) => priceById.get(c.id) ?? c.financials.valuation;

  const playerInvestorIds = useMemo(() => {
    const set = new Set<string>();
    for (const lot of game?.company.capTable.lots ?? []) {
      if (lot.holderType === "investor") set.add(lot.holderId);
    }
    return set;
  }, [game?.company.capTable.lots]);

  const industries = useMemo(() => {
    const set = new Set<Industry>(companies.map((c) => c.industry));
    return ["all", ...[...set].sort()] as (Industry | "all")[];
  }, [companies]);

  const rows = useMemo(() => {
    const filtered = companies.filter((c) => industry === "all" || c.industry === industry);
    const key = (c: Company) =>
      sort === "valuation"
        ? priceOf(c)
        : sort === "revenue"
          ? c.financials.revenue
          : sort === "growth"
            ? c.financials.revenue_growth
            : c.quality.fundamentals;
    return [...filtered].sort((a, b) => key(b) - key(a));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies, industry, sort, week]);

  const reduceMotion = usePrefs((s) => s.reduceMotion);
  const ids = useMemo(() => rows.map((r) => r.id), [rows]);
  const ticks = useMarketTape(ids, !reduceMotion);
  const selected = selectedId ? byId.get(selectedId) : undefined;

  return (
    <div className="workspace-scroll market-view">
      <div className="market-head" data-coach="market">
        <div>
          <h3 className="panel__title">
            The Market <span className="live-dot" />
          </h3>
          <div className="panel__sub">
            {companies.length} companies across the frontier — prices move with fundamentals, hype, and
            the macro cycle
          </div>
        </div>
        <Segmented
          size="sm"
          value={sort}
          onChange={(v) => setSort(v as Sort)}
          options={[
            { value: "valuation", label: "Market cap" },
            { value: "revenue", label: "Revenue" },
            { value: "growth", label: "Growth" },
            { value: "fundamentals", label: "Quality" },
          ]}
        />
      </div>

      <div className="market-filters">
        {industries.map((ind) => (
          <button
            key={ind}
            className={`chip${industry === ind ? " is-active" : ""}`}
            onClick={() => setIndustry(ind)}
          >
            {ind === "all" ? "All sectors" : industryLabel(ind)}
          </button>
        ))}
      </div>

      <div className="market-body">
        <div className="market-grid">
          <div className="market-grid__head market-grid__row">
            <span>Company</span>
            <span>Known for</span>
            <span>Sub-industry</span>
            <span>Stage</span>
            <span className="ar">Market cap</span>
            <span className="ar">Move</span>
            <span className="ar">Growth</span>
            <span className="ar">Hype</span>
          </div>
          <div className="market-grid__rows">
            {rows.map((c) => {
              const t = ticks[c.id];
              const pct = t?.pct ?? 0;
              const isYou = c.id === PLAYER_ID;
              return (
                <button
                  key={c.id}
                  className={`market-grid__row market-grid__data${selectedId === c.id ? " is-selected" : ""}${isYou ? " is-you" : ""}`}
                  onClick={() => { if (!isYou) setSelectedId(selectedId === c.id ? null : c.id); }}
                >
                  <span className="market-cell-name">
                    <span className="swatch swatch--sm" style={{ background: c.color }} />
                    <span className="strong">{c.name}</span>
                    {isYou ? <Tag>You</Tag> : c.tier === "anchor" && <Tag>Anchor</Tag>}
                  </span>
                  <span className="market-cell-tag dim">{c.identity.tagline}</span>
                  <span className="dim">{subIndustryLabel(c.sub_industry)}</span>
                  <span>
                    <span className={`status-dot status-dot--${c.stage.status}`} />
                    {cap(c.stage.status)}
                  </span>
                  <span className="ar num strong">{formatMoney(priceOf(c))}</span>
                  {isYou ? (
                    <span className="ar num dim">—</span>
                  ) : (
                    <span
                      key={t?.n ?? 0}
                      className={`ar num market-move ${pct >= 0 ? "up" : "down"} ${t ? (t.dir === "up" ? "tick-up" : "tick-down") : ""}`}
                    >
                      {pct >= 0 ? "+" : ""}
                      {pct.toFixed(1)}%
                    </span>
                  )}
                  <span className="ar num">{formatPct(c.financials.revenue_growth, 0)}</span>
                  <span className="ar">
                    <HypeBar value={c.quality.hype_exposure} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {selected && (
          <CompanyDetail
            company={selected}
            graph={graph}
            byId={byId}
            playerInvestorIds={playerInvestorIds}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  );
}

function HypeBar({ value }: { value: number }) {
  return (
    <span className="hypebar" title={`Hype exposure ${(value * 100).toFixed(0)}%`}>
      <span className="hypebar__fill" style={{ width: `${Math.min(100, value * 100)}%` }} />
    </span>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
