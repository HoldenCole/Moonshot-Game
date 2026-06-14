import { useMemo } from "react";
import { useGame } from "@/state/store";
import { formatMoney } from "@/engine/format";

interface TickerItem {
  key: string;
  text: string;
  value?: string;
  dir?: "up" | "down";
  color?: string;
}

/** The live ticker — an always-running surface (continuous scroll). It blends
 *  recent world/company news with a market tape of sector companies. The price
 *  ticks are cosmetic life around the real fundamentals+hype price, not P&L. */
export function Ticker() {
  const game = useGame((s) => s.game);
  const content = useGame((s) => s.content);

  const items = useMemo<TickerItem[]>(() => {
    if (!game) return [];
    const out: TickerItem[] = [];

    // A market tape: sector peers first, then a few others, with a cosmetic tick.
    const companies = [
      ...content.companies.filter((c) => c.industry === game.company.industry),
      ...content.companies.filter((c) => c.industry !== game.company.industry),
    ].slice(0, 14);
    for (const c of companies) {
      const tick = cosmeticTick(c.id, game.clock.week);
      out.push({
        key: `mkt-${c.id}`,
        text: c.name,
        value: `${formatMoney(c.financials.valuation)} ${tick >= 0 ? "+" : ""}${tick.toFixed(1)}%`,
        dir: tick >= 0 ? "up" : "down",
        color: c.color,
      });
    }

    // Recent world/company headlines woven in.
    const news = [...game.log]
      .filter((e) => e.kind === "world" || e.kind === "company" || e.kind === "milestone")
      .slice(-6)
      .reverse();
    news.forEach((n, i) => out.splice(i * 3 + 1, 0, { key: `news-${n.id}`, text: n.headline }));

    return out;
  }, [game, content]);

  if (!game || items.length === 0) return null;

  // Duplicate the stream so the CSS loop is seamless.
  const stream = [...items, ...items];

  return (
    <div className="ticker">
      <span className="ticker__label">
        <span className="live-dot" /> Live
      </span>
      <div className="ticker__viewport">
        <div className="ticker__stream">
          {stream.map((it, i) => (
            <span className="ticker__item" key={`${it.key}-${i}`}>
              {it.color && <span className="ticker__dot" style={{ background: it.color }} />}
              {it.text}
              {it.value && (
                <span className={`num ${it.dir === "down" ? "ticker__tick--down" : it.dir === "up" ? "ticker__tick--up" : ""}`}>
                  {it.value}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** A small, stable pseudo-change for the tape (deterministic per company+week). */
function cosmeticTick(id: string, week: number): number {
  let h = 2166136261;
  const s = `${id}:${Math.floor(week)}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (((h >>> 0) % 900) / 100 - 4.5) * 0.8; // ~ -3.6%..+3.6%
}
