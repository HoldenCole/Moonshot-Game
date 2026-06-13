import { useMemo, useState } from "react";
import { useGame } from "@/state/store";
import type { Company } from "@/content/load";
import { industryLabel, subIndustryLabel, type Industry } from "@/domain/ids";
import { formatMoney, formatPct } from "@/engine/format";
import { Panel, PanelHeader } from "@/ui/components/Panel";
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
    <div className="workspace-scroll">
      <Panel className="market" flush>
        <PanelHeader
          title="The Market"
          sub={`${content.companies.length} companies across the frontier — your investment universe and competitive web`}
          right={
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
          }
        />
        <div className="market__filters">
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

        <table className="data-table market__table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Sub-industry</th>
              <th>Stage</th>
              <th className="ar">Valuation</th>
              <th className="ar">Revenue</th>
              <th className="ar">Growth</th>
              <th className="ar">Fund.</th>
              <th className="ar">Hype</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>
                  <span className="swatch swatch--sm" style={{ background: c.color }} />
                  <span className="strong">{c.name}</span>
                  {c.tier === "anchor" && <Tag>Anchor</Tag>}
                </td>
                <td className="dim">{subIndustryLabel(c.sub_industry)}</td>
                <td>
                  <span className={`status-dot status-dot--${c.stage.status}`} />
                  {cap(c.stage.status)}
                </td>
                <td className="ar num strong">{formatMoney(c.financials.valuation)}</td>
                <td className="ar num">{c.financials.revenue > 0 ? formatMoney(c.financials.revenue) : "—"}</td>
                <td className="ar num">{formatPct(c.financials.revenue_growth, 0)}</td>
                <td className="ar num dim">{c.quality.fundamentals}</td>
                <td className="ar">
                  <HypeBar value={c.quality.hype_exposure} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
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
