// Display formatting. Money is stored in $M everywhere; these helpers render
// it the way a Bloomberg-style reader expects ($1.8B, $980M, $8.5M, $420K).
// Pure and locale-stable so snapshots/tests don't drift.

import type { Money } from "@/domain/captable";

/** Format a $M value into a compact currency string. */
export function formatMoney(millions: Money, opts: { sign?: boolean } = {}): string {
  const sign = opts.sign && millions > 0 ? "+" : "";
  if (millions < 0) return "-" + formatMoney(-millions);
  if (millions === 0) return "$0";

  const abs = millions;
  if (abs >= 1_000_000) return `${sign}$${trim(abs / 1_000_000)}T`;
  if (abs >= 1_000) return `${sign}$${trim(abs / 1_000)}B`;
  if (abs >= 1) return `${sign}$${trim(abs)}M`;
  // Below $1M, show thousands.
  return `${sign}$${Math.round(abs * 1000)}K`;
}

/** Format a per-share price (whole dollars in) with cents. */
export function formatPricePerShare(dollars: number): string {
  if (dollars >= 100) return `$${dollars.toFixed(2)}`;
  if (dollars >= 1) return `$${dollars.toFixed(2)}`;
  return `$${dollars.toFixed(4)}`;
}

/** Format a 0–1 fraction as a percentage. */
export function formatPct(fraction: number, decimals = 1): string {
  return `${(fraction * 100).toFixed(decimals)}%`;
}

/** Format a share count with thousands separators. */
export function formatShares(shares: number): string {
  return Math.round(shares).toLocaleString("en-US");
}

/** Format a multiple-on-invested, e.g. "3.2×". */
export function formatMultiple(x: number): string {
  return `${trim(x)}×`;
}

/** Trim a number to at most one decimal, dropping a trailing ".0". */
function trim(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
