import { useMemo, useState } from "react";
import { useGame } from "@/state/store";
import { eligibleBanks, ipoPricing, ipoTargetRaise, firstDayWord } from "@/engine/exit";
import { founderOwnership, latestPostMoney } from "@/engine/captable";
import { formatMoney, formatPct } from "@/engine/format";
import { Button, Slider, Tag } from "@/ui/components/controls";

/** The exit flow — a 3-act IPO or an acquisition offer — over the modal scrim. */
export function ExitFlow() {
  const flow = useGame((s) => s.exitFlow);
  if (!flow) return null;
  return (
    <div className="event-overlay">
      <div className="exit-modal rise">{flow.kind === "ipo" ? <Ipo /> : <Acquisition />}</div>
    </div>
  );
}

function Ipo() {
  const game = useGame((s) => s.game)!;
  const flow = useGame((s) => s.exitFlow)!;
  const banks = useGame((s) => s.content.banks);
  const selectBank = useGame((s) => s.ipoSelectBank);
  const price = useGame((s) => s.ipoPrice);
  const list = useGame((s) => s.ipoList);
  const cancel = useGame((s) => s.cancelExit);
  if (flow.kind !== "ipo") return null;

  const eligible = useMemo(() => eligibleBanks(banks, game), [banks, game]);
  const bank = flow.bankId ? banks.find((b) => b.id === flow.bankId) : undefined;
  const pricing = useMemo(() => (bank ? ipoPricing(game, bank) : null), [bank, game]);
  const [priced, setPriced] = useState(0);

  return (
    <>
      <div className="exit-modal__cat">Initial Public Offering · {game.company.name}</div>

      {flow.act === "underwriter" && (
        <>
          <h2 className="exit-modal__headline">Choose your underwriter</h2>
          <p className="exit-modal__body">
            The bank on the cover sets the book and signals to the market. Prestige costs more but
            prices the deal better.
          </p>
          <div className="bank-list">
            {eligible.map((b) => (
              <button key={b.id} className="bank-card" onClick={() => selectBank(b.id)}>
                <div className="bank-card__name">{b.name}</div>
                <div className="bank-card__tag">{b.identity.tagline}</div>
                <div className="bank-card__meta num">
                  Prestige {b.underwriting.prestige} · fee {formatPct(b.underwriting.fee_pct, 1)} · min{" "}
                  {formatMoney(b.underwriting.min_raise)}
                </div>
              </button>
            ))}
            {eligible.length === 0 && <p className="exit-modal__body">No bank will take this deal yet — grow first.</p>}
          </div>
          <Button variant="ghost" size="md" onClick={cancel}>Not yet</Button>
        </>
      )}

      {flow.act === "pricing" && pricing && bank && (
        <>
          <h2 className="exit-modal__headline">Price the offering</h2>
          <p className="exit-modal__body">
            {bank.name} reads demand as <strong>{pricing.demand}</strong>. The book supports{" "}
            {formatMoney(pricing.low)}–{formatMoney(pricing.high)}. Price below fair and it'll pop;
            reach past it and the open could sag.
          </p>
          <Slider
            label="IPO valuation"
            value={priced || pricing.fair}
            min={pricing.low}
            max={pricing.high}
            step={Math.max(1, Math.round((pricing.high - pricing.low) / 60))}
            onChange={setPriced}
            format={(v) => formatMoney(v)}
            hint={`Raising ${formatMoney(ipoTargetRaise(game))} of primary capital.`}
          />
          <Button variant="primary" size="md" className="exit-modal__cta" onClick={() => price(priced || pricing.fair)}>
            Price at {formatMoney(priced || pricing.fair)}
          </Button>
        </>
      )}

      {flow.act === "reveal" && flow.result && (
        <>
          <h2 className="exit-modal__headline">{game.company.name} {firstDayWord(flow.result.firstDayPop)} on debut</h2>
          <p className="exit-modal__body">
            Priced at {formatMoney(flow.result.pricedValuation)}, the stock{" "}
            <strong className={flow.result.firstDayPop >= 0 ? "up" : "down"}>
              {flow.result.firstDayPop >= 0 ? "+" : ""}
              {Math.round(flow.result.firstDayPop * 100)}%
            </strong>{" "}
            on day one — a public-market cap of {formatMoney(flow.result.publicValuation)}.
          </p>
          <div className="exit-reveal">
            <Stat k="Public valuation" v={formatMoney(flow.result.publicValuation)} />
            <Stat k="Primary raised" v={formatMoney(flow.result.raise)} />
            <Stat k="Your stake" v={formatMoney(flow.result.founderStakeValue)} tone="up" />
          </div>
          <p className="exit-modal__note">Your shares are locked for 180 days. You're a public-company CEO now.</p>
          <Button variant="primary" size="md" className="exit-modal__cta" onClick={list}>
            Ring the bell
          </Button>
        </>
      )}
    </>
  );
}

function Acquisition() {
  const game = useGame((s) => s.game)!;
  const flow = useGame((s) => s.exitFlow)!;
  const accept = useGame((s) => s.acceptAcquisition);
  const cancel = useGame((s) => s.cancelExit);
  if (flow.kind !== "acquisition") return null;
  const o = flow.offer;
  const stake = founderOwnership(game.company.capTable) * latestPostMoney(game.company.capTable);

  return (
    <>
      <div className="exit-modal__cat">Acquisition offer · {game.company.name}</div>
      <h2 className="exit-modal__headline">{o.buyerName} wants to buy {game.company.name}</h2>
      <p className="exit-modal__body">
        They're offering <strong>{formatMoney(o.exitValue)}</strong> — a {formatPct(o.premiumPct, 0)} premium
        to your last mark. After the liquidation waterfall, you'd personally walk away with{" "}
        <strong>{formatMoney(o.founderTake)}</strong>. Accepting ends this chapter.
      </p>
      <div className="exit-reveal">
        <Stat k="Offer" v={formatMoney(o.exitValue)} />
        <Stat k="Your current stake" v={formatMoney(stake)} />
        <Stat k="You walk with" v={formatMoney(o.founderTake)} tone="up" />
      </div>
      <div className="exit-modal__actions">
        <Button variant="primary" size="md" onClick={accept}>Accept — walk with {formatMoney(o.founderTake)}</Button>
        <Button variant="ghost" size="md" onClick={cancel}>Keep building <Tag>independent</Tag></Button>
      </div>
    </>
  );
}

function Stat({ k, v, tone }: { k: string; v: string; tone?: "up" }) {
  return (
    <div className="exit-stat">
      <div className="kv__label">{k}</div>
      <div className={`exit-stat__v num${tone === "up" ? " up" : ""}`}>{v}</div>
    </div>
  );
}
