// Store-bound wrappers for the hero scenes (kept apart from the pure
// components so SSR tests never touch the Vite-glob content loader).
import { useGame } from "@/state/store";
import { suggestedTerms } from "@/state/newgame";
import { ExchangeHero, tickNoise, type ExchangePoint } from "./ExchangeHero";
import { BankHero } from "./BankHero";

export function ExchangeHeroLive() {
  const game = useGame((s) => s.game);
  const content = useGame((s) => s.content);
  if (!game) return null;
  const points: ExchangePoint[] = game.worldHistory.map((w) => ({
    week: w.week,
    composite: w.marketSentiment * 0.5 + w.vcClimate * 0.3 + w.ipoOpenness * 0.2,
  }));
  const week = game.clock.week;
  const movers = [...content.companies, ...game.market.companies]
    .slice()
    .sort((a, b) => b.financials.valuation - a.financials.valuation)
    .slice(0, 12)
    .map((c) => ({ id: c.id, name: c.name, delta: tickNoise(c.id, week) }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 6);
  return <ExchangeHero points={points} window={game.world.ipoWindow} rate={game.world.interestRate} movers={movers} />;
}

export function BankHeroLive() {
  const game = useGame((s) => s.game);
  if (!game) return null;
  const base = suggestedTerms(game.company.stage);
  return (
    <BankHero
      climate={game.world.vcClimate}
      rate={game.world.interestRate}
      window={game.world.ipoWindow}
      stage={game.company.stage}
      valuation={Math.max(base.valuation, game.company.financials.valuation)}
      roundSize={base.roundSize}
    />
  );
}
