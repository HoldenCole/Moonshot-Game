// ============================================================================
// ContractsTab.tsx — The first assembled tab: Capital > Contracts, composed
// from the UI kit (components.tsx) + engine (contracts.ts, advisory.ts) +
// content (content_loader.ts). Proves the stack composes end to end.
// Mirrors capital_contracts.html v2 (the locked calibration).
// ============================================================================
import { useMemo, useState } from "react";
import { T } from "./tokens";
import { BoldTable, FilterPills, ViewToggle, BigValue, SpecGrid, ExecAdviceStrip,
         OutcomeButton, useDrillIn, Column } from "./components";
import { ContractsState, ContractTemplate, CustomerDef } from "@/engine/late/contracts";
import { ExecProfile, recommend, scoreContract, Option } from "@/engine/late/advisory";

interface Row { id: string; t: ContractTemplate; gov: boolean; locked: boolean }

export function ContractsTab({ state, templates, customers, cfo, rng, onTake }: {
  state: ContractsState;
  templates: Record<string, ContractTemplate>;
  customers: Record<string, CustomerDef>;
  cfo: ExecProfile;
  rng: () => number;
  onTake: (t: ContractTemplate) => void;
}) {
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("value");
  const [openId, toggle] = useDrillIn();

  const rows: Row[] = useMemo(() => {
    let r = state.market.map(id => {
      const t = templates[id]!;
      const gov = customers[t.customer]!.channel === "government";
      const locked = !!t.requires.clearance && !state.clearances.includes(t.requires.clearance);
      return { id, t, gov, locked };
    });
    if (filter === "commercial") r = r.filter(x => !x.gov);
    if (filter === "government") r = r.filter(x => x.gov);
    const key = (x: Row) => view === "value" ? x.t.payment.recurring_per_year
      : view === "entanglement" ? -x.t.effects.entanglement : -x.t.payment.term_weeks;
    return [...r].sort((a, b) => key(b) - key(a));
  }, [state.market, filter, view, templates, customers, state.clearances]);

  const columns: Column<Row>[] = [
    { key: "name", header: "Contract", render: r => (
      <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
        <span style={{ width: 9, height: 9, borderRadius: "50%", flex: "none",
          background: r.gov ? T.purple : T.blue }} />
        <div>
          <div style={{ fontWeight: 600, color: T.white, fontSize: 15 }}>{r.t.name}</div>
          <div style={{ fontSize: 11.5, color: T.dim, marginTop: 2 }}>
            {r.t.customer.replace(/_/g, " ")} · {r.t.sub_industry.replace(/_/g, " ")}</div>
        </div>
      </div>) },
    { key: "rev", header: "Revenue", numeric: true, sorted: view === "value", render: r =>
      r.locked ? <span style={{ fontSize: 12, color: T.amber }}>🔒 needs {r.t.requires.clearance}</span>
        : <BigValue color="money" suffix="/yr">${r.t.payment.recurring_per_year}M</BigValue> },
    { key: "pow", header: "Power", numeric: true, render: r =>
      r.locked ? null : r.gov ? <BigValue color="power">+{r.t.effects.power}</BigValue>
        : <span style={{ color: T.label, fontSize: 15 }}>—</span> },
    { key: "ent", header: "Entangle", numeric: true, sorted: view === "entanglement", render: r =>
      r.locked ? null : r.gov ? <BigValue color="entanglement">+{r.t.effects.entanglement}</BigValue>
        : <span style={{ fontSize: 12, color: "#6f9bff" }}>no strings</span> },
    { key: "term", header: "Term", numeric: true, sorted: view === "term", render: r =>
      r.locked ? null : <span style={{ fontSize: 13, color: T.dim }}>{r.t.payment.term_weeks} wk</span> },
  ];

  const detail = (r: Row) => {
    if (r.locked) return <div style={{ color: T.dim }}>Obtain {r.t.requires.clearance} to unlock this tier.</div>;
    // The exec read: score take-vs-pass through the CFO's noisy lens.
    const options: Option[] = [
      { id: "take", label: "Take it",
        score: scoreContract(r.t.payment.upfront, r.t.payment.recurring_per_year,
          r.t.payment.term_weeks, r.t.effects.entanglement, 30, r.t.effects.power),
        outcome_line: `$${r.t.payment.recurring_per_year}M/yr for ${Math.round(r.t.payment.term_weeks / 52)} years`,
        risk_note: r.gov ? "we can't quietly exit government work" : undefined },
      { id: "pass", label: "Pass", score: 0, outcome_line: "stay free, keep the slot open" },
    ];
    const rec = recommend(cfo, options, { kind: "contract",
      facts: { mix: r.gov ? "this deepens our government identity" : "clean commercial money" } }, rng);
    return (
      <div>
        <SpecGrid cells={[
          { label: "Upfront", value: `$${r.t.payment.upfront}M` },
          { label: "Recurring", value: `$${r.t.payment.recurring_per_year}M/yr`, color: "money" },
          { label: "Term", value: `${r.t.payment.term_weeks} wk` },
          { label: "Power", value: r.gov ? `+${r.t.effects.power}` : "—", color: "power" },
          { label: "Entanglement", value: r.gov ? `+${r.t.effects.entanglement}` : "0", color: "entanglement" },
        ]} />
        <div style={{ marginBottom: 18 }}>
          <ExecAdviceStrip execName={`${cfo.name} (CFO)`} initials={cfo.name.split(" ").map(x => x[0]).join("")}
            reasoning={rec.reasoning} />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <OutcomeButton verb="Take contract" variant={r.gov ? "government" : "action"}
            breakdown={r.gov ? [`+${r.t.effects.power} power`, `+${r.t.effects.entanglement} entangle`] : ["no strings"]}
            onClick={() => onTake(r.t)} />
          <OutcomeButton verb={r.gov ? "Pass — stay independent" : "Pass"} variant="pass" breakdown={[]} />
        </div>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: T.sans, color: T.txt, background: T.bg }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 24px", flexWrap: "wrap" }}>
        <FilterPills active={filter} onChange={setFilter} pills={[
          { id: "all", label: "All" },
          { id: "commercial", label: "Commercial", dotColor: T.blue },
          { id: "government", label: "Government", dotColor: T.purple },
        ]} />
        <div style={{ marginLeft: "auto" }}>
          <ViewToggle active={view} onChange={setView} views={[
            { id: "value", label: "By value" },
            { id: "entanglement", label: "By entanglement" },
            { id: "term", label: "By term" },
          ]} />
        </div>
      </div>
      <BoldTable columns={columns} rows={rows} openId={openId}
        onRowClick={r => !r.locked && toggle(r.id)} renderDetail={detail} />
    </div>
  );
}
