import { useMemo, useState } from "react";
import { useGame } from "@/state/store";
import type { Company } from "@/content/load";
import { industryLabel, subIndustryLabel, type Industry } from "@/domain/ids";
import { formatMoney, formatPct } from "@/engine/format";
import { Segmented, Tag } from "@/ui/components/controls";

type Sort = "valuation" | "revenue" | "fundamentals" | "growth";

export function MarketView() {
  const content = useGame((s) => s.content);
  const [industry, setIndustry] = useState<Industry | "all">("all");
  const [sort, setSort] = useState<Sort>("valuation");

  const industries = useMemo(() => {
    const set = new Set<Industry>(content.companies.map((c) => c.industry));
    return ["all", ...[...set].sort()] as (Industry | "all")[];
  }, [content.companies]);

  const rows = useMemo(() => {
    const filtered = content.companies.filter((c) => industry === "all" || c.industry === industry);
    const key = (c: Company) =>
      sort === "valuation"
        ? c.financials.valuation
        : sort === "revenue"
          ? c.financials.revenue
          : sort === "growth"
            ? c.financials.revenue_growth
            : c.quality.fundamentals;
    return [...filtered].sort((a, b) => key(b) - key(a));
  }, [content.companies, industry, sort]);

  return (
    <div className="workspace-scroll market-view">
      <div className="market-head">
        <div>
          <h3 className="panel__title">The Market</h3>
          <div className="panel__sub">
            {content.companies.length} companies across the frontier — your investment universe and
            competitive web
          </div>
        </div>
        <Segmented
          size="sm"
          value={sort}
          onChange={(v) => setSort(v as Sort)}
          options={[
            { value: "valuation", label: "Valuation" },
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

      <div className="market-grid">
        <div className="market-grid__head market-grid__row">
          <span>Company</span>
          <span>Known for</span>
          <span>Sub-industry</span>
          <span>Stage</span>
          <span className="ar">Valuation</span>
          <span className="ar">Revenue</span>
          <span className="ar">Growth</span>
          <span className="ar">Fund.</span>
          <span className="ar">Hype</span>
        </div>
        <div className="market-grid__rows">
          {rows.map((c) => (
            <div key={c.id} className="market-grid__row market-grid__data">
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
              <span className="ar num strong">{formatMoney(c.financials.valuation)}</span>
              <span className="ar num">{c.financials.revenue > 0 ? formatMoney(c.financials.revenue) : "—"}</span>
              <span className="ar num">{formatPct(c.financials.revenue_growth, 0)}</span>
              <span className="ar num dim">{c.quality.fundamentals}</span>
              <span className="ar">
                <HypeBar value={c.quality.hype_exposure} />
              </span>
            </div>
          ))}
        </div>
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
