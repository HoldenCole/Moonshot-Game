import { useGame } from "@/state/store";
import { comparableRounds } from "@/engine/negotiation";
import { suggestedTerms } from "@/state/newgame";
import { upcomingStage } from "@/state/store";
import { formatMoney } from "@/engine/format";
import { STAGE_LABELS } from "@/domain/ids";

/** Comparable Rounds widget — the eval-help layer that grounds the player's
 *  sense of price with a stage median, a band, and a few real sector peers. */
export function ComparableRounds() {
  const game = useGame((s) => s.game);
  const content = useGame((s) => s.content);
  if (!game) return null;

  const stage = upcomingStage(game.company.stage);
  const market = suggestedTerms(stage);
  const comps = comparableRounds(content.companies, game.company.industry, stage, market);

  return (
    <div className="comps">
      <div className="comps__head">Comparable {STAGE_LABELS[stage]} rounds</div>
      <div className="comps__band">
        <span className="comps__band-end num">{formatMoney(comps.low)}</span>
        <div className="comps__bar">
          <span className="comps__median" title={`Median pre-money ${formatMoney(comps.median)}`} />
        </div>
        <span className="comps__band-end num">{formatMoney(comps.high)}</span>
      </div>
      <div className="comps__median-label">
        median pre-money <strong className="num">{formatMoney(comps.median)}</strong>
      </div>
      <ul className="comps__list">
        {comps.comps.map((c) => (
          <li key={c.name}>
            <span className="comps__peer">{c.name}</span>
            <span className="comps__peer-val num">~{formatMoney(c.preMoney)} pre</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
