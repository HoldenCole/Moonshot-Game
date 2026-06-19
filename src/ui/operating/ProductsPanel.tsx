import { useState } from "react";
import { useGame } from "@/state/store";
import { signatureConfig } from "@/engine/signature";
import { betBuildWeeks, betCost, productQuality, rushQuote } from "@/engine/products";
import { rivalProductQuality } from "@/engine/productMarket";
import { available, nextRung } from "@/engine/capacity";
import { formatMoney } from "@/engine/format";
import type { CapacityType, ProductArchetype, ProductTuning, RDLine } from "@/domain/content";
import type { ProductsRuntime } from "@/domain/products";
import { Panel, PanelHeader } from "@/ui/components/Panel";
import { Button, Slider } from "@/ui/components/controls";

/** The "what am I building" surface: R&D allocation, the capacity meter, and the
 *  product portfolio — including committing new bets (the signature move). */
export function ProductsPanel() {
  const game = useGame((s) => s.game);
  const content = useGame((s) => s.content);
  const setBudget = useGame((s) => s.setRdBudget);
  const setAlloc = useGame((s) => s.setRdAllocation);
  const buyRung = useGame((s) => s.buyCapacityRung);
  const commitBet = useGame((s) => s.commitBet);
  const accelerate = useGame((s) => s.accelerateBet);

  const rt = game?.company.products;
  const sub = game?.company.subIndustry ?? "";
  const lines = content.rdLinesBySub.get(sub) ?? [];
  const [weights, setWeights] = useState<Record<string, number>>(() =>
    Object.fromEntries(lines.map((l) => [l.id, Math.round((rt?.rd.allocation[l.id] ?? 0) * 100)])),
  );
  if (!game || !rt) return null;

  const c = game.company;
  const cash = c.financials.cash;
  const caps = content.capacityBySub.get(sub) ?? [];
  const archetypes = (content.productsBySub.get(sub) ?? []).slice().sort((a, b) => a.tier - b.tier);
  const tuning = content.productTuningBySub.get(sub)!;
  const productById = new Map(archetypes.map((a) => [a.id, a]));
  const cfg = signatureConfig(sub);
  const totalW = Object.values(weights).reduce((s, x) => s + x, 0) || 1;

  // The benchmark you push: your best model's quality (live, or what the headline
  // product would ship at today's R&D levels) against the rival field.
  const rivals = [...content.companies, ...game.market.companies].filter((co) => co.sub_industry === sub);
  const fieldBench = Math.round(rivalProductQuality(rivals));
  const headline = archetypes.find((a) => a.tier === 1) ?? archetypes[0];
  const bestLive = rt.products.reduce((m, p) => Math.max(m, p.quality), 0);
  const yourBench = Math.round(Math.max(bestLive, headline ? productQuality(headline, lines, rt.rd.levels) : 0));
  const benchGap = yourBench - fieldBench;

  const setLineWeight = (id: string, v: number) => {
    const w = { ...weights, [id]: v };
    setWeights(w);
    setAlloc(w);
  };

  return (
    <Panel className="prod-panel" coach="company">
      <PanelHeader title="Products & R&D" sub={`Build the ${cfg.noun} pipeline — fund research, grow capacity, ship products`} />

      {/* ── R&D allocation ── */}
      <div className="prod-section">
        <div className="prod-section__head">
          <span className="section-label">R&amp;D</span>
          <span className="prod-budget num">{formatMoney(rt.rd.rd_budget_per_week)}/wk</span>
        </div>
        <div className="prod-bench">
          <span className="prod-bench__label">Benchmark</span>
          <span className="prod-bench__val num">
            Q{yourBench} <span className="dim">vs field Q{fieldBench}</span>
            <span className={benchGap >= 0 ? "up" : "down"}> · {benchGap >= 0 ? "ahead" : `${-benchGap} behind`}</span>
          </span>
        </div>
        <Slider label="Weekly R&D budget" value={rt.rd.rd_budget_per_week} min={0} max={Math.max(5, Math.round(cash / 4))} step={0.5} onChange={setBudget} format={(n) => `${formatMoney(n)}/wk`} />
        <div className="prod-lines">
          {lines.map((l) => (
            <div key={l.id} className="prod-line">
              <div className="prod-line__top">
                <span className="prod-line__name">{l.name}</span>
                <span className="prod-line__lvl num">lvl {Math.round(rt.rd.levels[l.id] ?? l.starting_level)}</span>
              </div>
              <Slider label={`${Math.round(((weights[l.id] ?? 0) / totalW) * 100)}% · drives ${l.drives_specs.join(", ")}`} value={weights[l.id] ?? 0} min={0} max={100} step={5} onChange={(v) => setLineWeight(l.id, v)} format={(v) => `${v}`} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Capacity ── */}
      <div className="prod-section">
        <div className="section-label">Capacity</div>
        <div className="prod-caps">
          {caps.map((cap) => {
            const avail = available(rt.capacity, cap.id, rt.bets, rt.products, productById);
            const owned = rt.capacity.owned[cap.id] ?? 0;
            const next = nextRung(rt.capacity, cap);
            const building = rt.capacity.builds_in_progress.some((b) => b.cap_id === cap.id);
            return (
              <div key={cap.id} className="prod-cap">
                <div className="prod-cap__id">
                  <span className="prod-cap__name">{cap.name}</span>
                  <span className="prod-cap__avail num">{avail} / {owned} {cap.unit_label}s free</span>
                </div>
                {next ? (
                  <Button variant="subtle" size="sm" disabled={building || cash < next.rung.cost} onClick={() => buyRung(cap.id)}>
                    {building ? "Building…" : `+${next.rung.capacity} · ${formatMoney(next.rung.cost)}`}
                  </Button>
                ) : (
                  <span className="prod-cap__max dim">maxed</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Product portfolio + bets ── */}
      <div className="prod-section">
        <div className="section-label">Portfolio</div>
        {rt.bets.length === 0 && rt.products.length === 0 && (
          <p className="prod-empty dim">Nothing in flight yet. Fund R&amp;D to clear a product's gates, then commit a {cfg.noun} below.</p>
        )}
        {rt.bets.map((b) => {
          const a = productById.get(b.archetype_id);
          const quote = a ? rushQuote(b, a, tuning) : null;
          return (
            <div key={b.id} className="prod-row prod-row--bet">
              <span className="prod-row__name">{b.instance_name}</span>
              <span className="prod-row__tag">{cfg.noun} · ~{b.weeks_left}wk</span>
              {quote ? (
                <Button variant="subtle" size="sm" disabled={cash < quote.cost} onClick={() => accelerate(b.id)} title={`Invest ${formatMoney(quote.cost)} to ship ${quote.weeks} week${quote.weeks === 1 ? "" : "s"} sooner`}>
                  Rush −{quote.weeks}wk · {formatMoney(quote.cost)}
                </Button>
              ) : (
                <span className="prod-row__tag dim">shipping soon</span>
              )}
              <span className="prod-row__meta dim">building {a?.name}</span>
            </div>
          );
        })}
        {rt.products.map((p) => {
          return (
            <div key={p.id} className="prod-row">
              <span className="prod-row__name">{p.instance_name}</span>
              <span className={`prod-row__state prod-row__state--${p.state}`}>{p.state}</span>
              <span className="prod-row__meta num">{Math.round(p.share * 100)}% share · {formatMoney(p.revenue_run_rate)}/yr · Q{Math.round(p.quality)}</span>
            </div>
          );
        })}
      </div>

      {/* ── Commit a bet ── */}
      <div className="prod-section">
        <div className="section-label">Commit a {cfg.noun}</div>
        <div className="prod-builds">
          {archetypes.map((a) => (
            <BuildRow key={a.id} archetype={a} rt={rt} cash={cash} tuning={tuning} productById={productById} lines={lines} caps={caps} cfg={cfg.commitVerb} onCommit={(name) => commitBet(a.id, name)} />
          ))}
        </div>
      </div>
    </Panel>
  );
}

function BuildRow({
  archetype,
  rt,
  cash,
  tuning,
  productById,
  lines,
  caps,
  cfg,
  onCommit,
}: {
  archetype: ProductArchetype;
  rt: ProductsRuntime;
  cash: number;
  tuning: ProductTuning;
  productById: Map<string, ProductArchetype>;
  lines: RDLine[];
  caps: CapacityType[];
  cfg: string;
  onCommit: (name: string) => void;
}) {
  const cost = betCost(archetype, tuning);
  const unmet = Object.entries(archetype.gates).filter(([l, v]) => (rt.rd.levels[l] ?? 0) < v);
  const gated = unmet.length > 0;
  const avail = available(rt.capacity, archetype.economics.capacity_type, rt.bets, rt.products, productById);
  const capShort = avail < archetype.economics.capacity_to_build;
  const atCap = rt.bets.length >= tuning.max_concurrent_bets;
  const can = !gated && !capShort && !atCap && cash >= cost;
  const count = rt.products.filter((p) => p.archetype_id === archetype.id).length + rt.bets.filter((b) => b.archetype_id === archetype.id).length;

  // A specific, current-vs-required reason for *why* a build is blocked.
  const lineName = (id: string) => lines.find((l) => l.id === id)?.name ?? id;
  const cap = caps.find((cp) => cp.id === archetype.economics.capacity_type);
  const need = archetype.economics.capacity_to_build;
  const reason = gated
    ? `Locked — R&D: ${unmet.map(([l, v]) => `${lineName(l)} ${Math.round(rt.rd.levels[l] ?? 0)}/${v}`).join(", ")}`
    : capShort
      ? `Needs ${need} ${cap?.unit_label ?? "unit"}${need > 1 ? "s" : ""} of ${cap?.name ?? "capacity"} — only ${avail} free (build more capacity)`
      : atCap
        ? `${rt.bets.length}/${tuning.max_concurrent_bets} builds in progress — wait for one to ship`
        : cash < cost
          ? `Short on cash — ${formatMoney(cost)} to build, ${formatMoney(cash)} on hand`
          : "";

  return (
    <div className={`build-row${gated ? " is-locked" : ""}`}>
      <div className="build-row__id">
        <span className="build-row__name">T{archetype.tier} · {archetype.name}{count > 0 ? ` · #${count + 1}` : ""}</span>
        <span className={`build-row__sub ${can ? "dim" : "is-blocked"}`}>{reason || `${formatMoney(cost)} · ${betBuildWeeks(archetype, tuning, count)}wk build`}</span>
      </div>
      <Button variant="primary" size="sm" disabled={!can} title={can ? "" : reason} data-guide="signature-action-button" onClick={() => onCommit(`${archetype.name} ${count + 1}`)}>
        {cfg.split(" ")[0]}
      </Button>
    </div>
  );
}
