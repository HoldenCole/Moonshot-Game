import { useEffect, useState } from "react";

export interface Tick {
  pct: number;
  dir: "up" | "down";
  /** Increments each update — used as a React key to retrigger the flash. */
  n: number;
}

/**
 * Cosmetic market tape. Every ~680ms a random *subset* of rows nudges its
 * displayed daily move and flashes. This is decorative life around the real
 * fundamentals+hype+macro valuation — it does NOT change any outcome, so it
 * deliberately uses Math.random (not the deterministic sim RNG). Frozen when
 * reduced motion is on.
 */
export function useMarketTape(ids: string[], enabled: boolean): Record<string, Tick> {
  const [ticks, setTicks] = useState<Record<string, Tick>>({});
  const key = ids.join(",");

  useEffect(() => {
    if (!enabled || ids.length === 0) return;
    const interval = setInterval(() => {
      setTicks((prev) => {
        const next = { ...prev };
        const count = Math.max(1, Math.round(ids.length * 0.18));
        for (let i = 0; i < count; i++) {
          const id = ids[(Math.random() * ids.length) | 0]!;
          const cur = next[id]?.pct ?? 0;
          const delta = (Math.random() - 0.5) * 0.7;
          const pct = Math.max(-6, Math.min(6, cur + delta));
          next[id] = { pct, dir: delta >= 0 ? "up" : "down", n: (next[id]?.n ?? 0) + 1 };
        }
        return next;
      });
    }, 680);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key]);

  return ticks;
}
