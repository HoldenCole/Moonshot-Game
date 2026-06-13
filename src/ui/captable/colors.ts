import type { OwnershipRow, ShareLot } from "@/domain/captable";
import { OPTION_POOL_HOLDER_ID } from "@/engine/captable";

const INVESTOR_SERIES = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
  "var(--series-6)",
];

/** Stable holder → color map so the same holder reads the same across every
 *  cap-table tab. Founder/co-founder/pool are fixed; investors cycle the
 *  series palette in first-appearance order. */
export function holderColors(rows: Pick<OwnershipRow, "holderId" | "holderType">[]): Map<string, string> {
  const map = new Map<string, string>();
  let investorIdx = 0;
  for (const r of rows) {
    if (map.has(r.holderId)) continue;
    if (r.holderType === "founder") map.set(r.holderId, "var(--series-founder)");
    else if (r.holderType === "cofounder") map.set(r.holderId, "var(--series-cofounder)");
    else if (r.holderId === OPTION_POOL_HOLDER_ID || r.holderType === "pool")
      map.set(r.holderId, "var(--series-pool)");
    else map.set(r.holderId, INVESTOR_SERIES[investorIdx++ % INVESTOR_SERIES.length]!);
  }
  return map;
}

export function lotColors(lots: ShareLot[]): Map<string, string> {
  return holderColors(lots.map((l) => ({ holderId: l.holderId, holderType: l.holderType })));
}
