import { useMemo, useState } from "react";
import { useGame } from "@/state/store";
import { usePrefs } from "@/state/prefs";
import type { Company } from "@/content/load";
import { industryLabel, subIndustryLabel, type Industry } from "@/domain/ids";
import { formatMoney, formatPct } from "@/engine/format";
import { marketPrice } from "@/engine/pricing";
import { buildGraph } from "@/engine/companyGraph";
import { Segmented, Tag } from "@/ui/components/controls";
import { useMarketTape } from "./useMarketTape";
import { CompanyDetail } from "./CompanyDetail";

type Sort = "valuation" | "revenue" | "fundamentals" | "growth";

export function MarketView() {
  const game = useGame((s) => s.game);
  const content = useGame((s) => s.content);
  const [industry, setIndustry] = useState<Industry | "all">("all");
  const [sort, setSort] = useState<Sort>("valuation");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const companies = useMemo(
    () => [...content.companies, ...(game?.market.companies ?? [])],
    [content.companies, game?.market.companies],
  );
  const graph = useMemo(() => buildGraph(companies), [companies]);
  const byId = useMemo(() => new Map(companies.map((c) => [c.id, c])), [companies]);

  const world = game?.world;
  const week = game?.clock.week ?? 0;
  // Price every company once per render (sorting + each row cell read this),
  // instead of recomputing marketPrice on every comparison.
  const priceById = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of companies) m.set(c.id, world ? marketPrice(c, world, week) : c.financials.valuation);
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
      <div className="market-head">
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
              return (
                <button
                  key={c.id}
                  className={`market-grid__row market-grid__data${selectedId === c.id ? " is-selected" : ""}`}
                  onClick={() => setSelectedId(selectedId === c.id ? null : c.id)}
                >
                  <span className="market-cell-name">
                    <span className="swatch swatch--sm" style={{ background: c.color }} />
                    <span className="strong">{c.name}</span>
                    {c.tier === "anchor" && <Tag>Anchor</Tag>}
                  </span>
                  <span className="market-cell-tag dim">{c.identity.tagline}</span>
                  <span className="dim">{subIndustryLabel(c.sub_industry)}</span>
                  <span>
                    <span className={`status-dot status-dot--${c.stage.status}`} />
                    {cap(c.stage.status)}
                  </span>
                  <span className="ar num strong">{formatMoney(priceOf(c))}</span>
                  <span
                    key={t?.n ?? 0}
                    className={`ar num market-move ${pct >= 0 ? "up" : "down"} ${t ? (t.dir === "up" ? "tick-up" : "tick-down") : ""}`}
                  >
                    {pct >= 0 ? "+" : ""}
                    {pct.toFixed(1)}%
                  </span>
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
