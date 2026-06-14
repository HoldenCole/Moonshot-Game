// The light company relationship graph (decision J). A typed edge list built
// from the authored relationships — competitor/supplier/customer edges are
// materialized and unioned (one-directional declarations become reciprocal);
// investor-overlap and sector-peer relationships are derived on demand. Static
// per playthrough in V1, but the typed shape supports deeper edge types later.

import type { Company } from "@/content/load";

export type EdgeType = "competitor" | "supplier" | "customer";

export interface Edge {
  from: string;
  to: string;
  type: EdgeType;
  strength: number;
}

export interface CompanyGraph {
  edges: Edge[];
  competitorsOf(id: string): string[];
  suppliersOf(id: string): string[];
  customersOf(id: string): string[];
  investorsOf(id: string): string[];
  companiesBackedBy(firmId: string): string[];
  /** Companies that share at least one investor with `id`. */
  coInvested(id: string): string[];
  /** Same-industry companies (excluding self). */
  sectorPeers(id: string): string[];
}

export function buildGraph(companies: Company[]): CompanyGraph {
  const ids = new Set(companies.map((c) => c.id));
  const edgeKey = new Set<string>();
  const edges: Edge[] = [];

  const add = (from: string, to: string, type: EdgeType, strength = 1) => {
    if (from === to || !ids.has(from) || !ids.has(to)) return;
    const key = `${from}|${to}|${type}`;
    if (edgeKey.has(key)) return;
    edgeKey.add(key);
    edges.push({ from, to, type, strength });
  };

  for (const c of companies) {
    const r = c.relationships;
    // Competition is symmetric — union both directions.
    for (const rival of r.competitors ?? []) {
      add(c.id, rival, "competitor");
      add(rival, c.id, "competitor");
    }
    // "c's supplier is S" ⇒ reciprocally "S's customer is c".
    for (const s of r.suppliers ?? []) {
      add(c.id, s, "supplier");
      add(s, c.id, "customer");
    }
    for (const k of r.customers ?? []) {
      add(c.id, k, "customer");
      add(k, c.id, "supplier");
    }
  }

  // Indexes for fast selectors.
  const byIndustry = new Map<string, string[]>();
  const investorsByCompany = new Map<string, string[]>();
  const companiesByFirm = new Map<string, string[]>();
  for (const c of companies) {
    (byIndustry.get(c.industry) ?? byIndustry.set(c.industry, []).get(c.industry)!).push(c.id);
    const inv = c.relationships.investors ?? [];
    investorsByCompany.set(c.id, inv);
    for (const f of inv) {
      (companiesByFirm.get(f) ?? companiesByFirm.set(f, []).get(f)!).push(c.id);
    }
  }

  const industryOf = new Map(companies.map((c) => [c.id, c.industry]));
  const outOfType = (id: string, type: EdgeType) =>
    edges.filter((e) => e.from === id && e.type === type).map((e) => e.to);

  return {
    edges,
    competitorsOf: (id) => outOfType(id, "competitor"),
    suppliersOf: (id) => outOfType(id, "supplier"),
    customersOf: (id) => outOfType(id, "customer"),
    investorsOf: (id) => investorsByCompany.get(id) ?? [],
    companiesBackedBy: (firmId) => companiesByFirm.get(firmId) ?? [],
    coInvested: (id) => {
      const mine = new Set(investorsByCompany.get(id) ?? []);
      if (mine.size === 0) return [];
      const out = new Set<string>();
      for (const firm of mine) {
        for (const other of companiesByFirm.get(firm) ?? []) {
          if (other !== id) out.add(other);
        }
      }
      return [...out];
    },
    sectorPeers: (id) => {
      const ind = industryOf.get(id);
      return (byIndustry.get(ind ?? "") ?? []).filter((x) => x !== id);
    },
  };
}
