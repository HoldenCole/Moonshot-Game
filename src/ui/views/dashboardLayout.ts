// Pure helpers for the customizable dashboard: the canonical panel set plus the
// reorder / reconcile math. DOM-free so the ordering logic is unit-testable.
// The contextual surfaces (pending decisions, exit CTA) stay pinned above this
// set, so only the four standing panels are reorderable / hideable.

export interface DashPanelMeta {
  id: string;
  label: string;
}

export const DASH_PANELS: DashPanelMeta[] = [
  { id: "financials", label: "Financials" },
  { id: "signature", label: "Signature" },
  { id: "operations", label: "Operations" },
  { id: "captable", label: "Cap Table" },
  { id: "fundraising", label: "Fundraising" },
];

export const DASH_PANEL_IDS: string[] = DASH_PANELS.map((p) => p.id);

export function panelLabel(id: string): string {
  return DASH_PANELS.find((p) => p.id === id)?.label ?? id;
}

/** Reconcile a saved order against the known panel set: drop ids that no longer
 *  exist and append any newly-added panels at the end (forward-compatible, so a
 *  later release can add a panel without stranding it). */
export function effectiveOrder(saved: readonly string[], known: readonly string[]): string[] {
  const knownSet = new Set(known);
  const kept = saved.filter((id) => knownSet.has(id));
  const missing = known.filter((id) => !kept.includes(id));
  return [...kept, ...missing];
}

/** Move `from` to just before `to` within a sequence. */
export function moveBefore(seq: readonly string[], from: string, to: string): string[] {
  if (from === to) return [...seq];
  const next = seq.filter((x) => x !== from);
  const idx = next.indexOf(to);
  if (idx < 0) return [...seq];
  next.splice(idx, 0, from);
  return next;
}

/** Swap an item with a neighbor (dir -1 up / +1 down); a no-op at the ends. */
export function swap(seq: readonly string[], id: string, dir: number): string[] {
  const i = seq.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= seq.length) return [...seq];
  const next = [...seq];
  [next[i], next[j]] = [next[j]!, next[i]!];
  return next;
}

/** Write a reordered visible sequence back onto the full order, leaving hidden
 *  panels pinned to their original slots (so hide/show preserves position). */
export function applyVisibleOrder(
  order: readonly string[],
  hidden: readonly string[],
  newVisible: readonly string[],
): string[] {
  const slots: number[] = [];
  order.forEach((id, i) => {
    if (!hidden.includes(id)) slots.push(i);
  });
  const next = [...order];
  newVisible.forEach((id, k) => {
    const slot = slots[k];
    if (slot != null) next[slot] = id;
  });
  return next;
}
