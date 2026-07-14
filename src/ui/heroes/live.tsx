// Store-bound wrappers for the hero scenes (kept apart from the pure
// components so SSR tests never touch the Vite-glob content loader).
import { useGame } from "@/state/store";
import { suggestedTerms } from "@/state/newgame";
import { AREAS, AREA_LABEL } from "@/engine/delegation";
import { founderOwnership, ownership } from "@/engine/captable";
import { ExchangeHero, tickNoise, type ExchangePoint } from "./ExchangeHero";
import { BankHero } from "./BankHero";
import { ObservatoryHero } from "./ObservatoryHero";
import { OfficeFloorHero, type OfficeSeat } from "./OfficeFloorHero";
import { OrreryHero, type OrreryHolder } from "./OrreryHero";

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

export function ObservatoryHeroLive() {
  const game = useGame((s) => s.game);
  if (!game) return null;
  const w = game.world;
  const hype = Object.entries(w.hype)
    .map(([id, v]) => ({ label: id === "ai" ? "AI" : id.toUpperCase(), value: v ?? 50 }))
    .sort((a, b) => b.value - a.value);
  return (
    <ObservatoryHero
      phase={w.macroPhase}
      position={w.macroPosition}
      strength={w.macroStrength}
      rate={w.interestRate}
      rateTarget={w.rateTarget}
      sentiment={w.marketSentiment}
      climate={w.vcClimate}
      window={w.ipoWindow}
      hype={hype}
      economyScale={w.economyScale ?? 1}
    />
  );
}

export function OfficeFloorHeroLive() {
  const game = useGame((s) => s.game);
  if (!game) return null;
  const c = game.company;
  const seats: OfficeSeat[] = AREAS.map((a) => {
    const exec = c.executives[a];
    return { area: a, label: AREA_LABEL[a], name: exec?.name, quality: exec?.quality, autonomy: c.delegation[a] };
  });
  return <OfficeFloorHero founderName={game.founder.name} color={c.color} headcount={c.financials.headcount} seats={seats} />;
}

export function OrreryHeroLive() {
  const game = useGame((s) => s.game);
  if (!game) return null;
  const capTable = game.company.capTable;
  const ringIndex = new Map(capTable.rounds.map((r, i) => [r.id, i]));
  const firstRingOf = (holderId: string) => {
    let ring = capTable.rounds.length - 1;
    for (const lot of capTable.lots) {
      if (lot.holderId === holderId) {
        ring = Math.min(ring, ringIndex.get(lot.roundId) ?? capTable.rounds.length - 1);
      }
    }
    return ring;
  };
  const holders: OrreryHolder[] = ownership(capTable)
    .filter((r) => r.holderType !== "self")
    .map((r) => ({
      id: r.holderId,
      name: r.holderName,
      type: r.holderType as OrreryHolder["type"],
      ownership: r.ownership,
      ring: firstRingOf(r.holderId),
    }));
  return (
    <OrreryHero
      holders={holders}
      ringNames={capTable.rounds.map((r) => r.name)}
      founderPct={founderOwnership(capTable)}
      color={game.company.color}
    />
  );
}
