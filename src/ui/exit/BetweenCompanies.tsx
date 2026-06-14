import { useGame } from "@/state/store";
import { formatMoney } from "@/engine/format";
import { Icon } from "@/ui/components/Icon";
import { Button } from "@/ui/components/controls";

/** The reflection state between companies (the founder→magnate arc's hinge).
 *  Shows the run's outcome, then lets you found again — reputation and exit
 *  wealth carried forward (New Game Plus). */
export function BetweenCompanies() {
  const game = useGame((s) => s.game)!;
  const foundAgain = useGame((s) => s.foundAgain);
  const o = game.runOutcome!;
  const years = (o.week / 52).toFixed(1);

  return (
    <div className="between">
      <div className="between__inner rise">
        <div className="between__brand">
          <Icon name="rocket" size={26} /> <span>Moonshot Inc</span>
        </div>
        <div className="between__kicker">{o.kind === "acquisition" ? "Acquired" : "Public"}</div>
        <h1 className="between__title">{o.headline.replace(/\d+$/, formatMoney(o.exitValue))}</h1>
        <p className="between__lede">
          Over {years} years you took {o.company} from an idea to a {formatMoney(o.exitValue)} exit. You
          walk away with <strong>{formatMoney(o.founderProceeds)}</strong> and a reputation that opens
          doors the next time.
        </p>

        <div className="between__stats">
          <Stat k="Exit value" v={formatMoney(o.exitValue)} />
          <Stat k="Your proceeds" v={formatMoney(o.founderProceeds)} tone="up" />
          <Stat k="Founder reputation" v={String(Math.round(game.founder.reputation))} />
        </div>

        <p className="between__prompt">
          A proven founder starts the next one from a different place — wealthier, better-known, harder
          to bet against.
        </p>
        <Button variant="primary" size="md" onClick={foundAgain}>
          Found your next company <Icon name="chevron-right" size={16} />
        </Button>
      </div>
    </div>
  );
}

function Stat({ k, v, tone }: { k: string; v: string; tone?: "up" }) {
  return (
    <div className="between__stat">
      <div className="kv__label">{k}</div>
      <div className={`between__stat-v num${tone === "up" ? " up" : ""}`}>{v}</div>
    </div>
  );
}
