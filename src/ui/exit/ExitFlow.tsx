import { useMemo, useRef, useState } from "react";
import { useGame } from "@/state/store";
import { eligibleBanks, ipoPricing, ipoTargetRaise, firstDayWord } from "@/engine/exit";
import { formatMoney, formatPct } from "@/engine/format";
import { Button, Slider, Tag } from "@/ui/components/controls";
import { useModalA11y } from "@/ui/components/useModalA11y";

/** The exit flow — a 3-act IPO or an acquisition offer — over the modal scrim. */
export function ExitFlow() {
  const flow = useGame((s) => s.exitFlow);
  return flow ? <ExitModal kind={flow.kind} /> : null;
}

function ExitModal({ kind }: { kind: "ipo" | "acquisition" }) {
  const cancel = useGame((s) => s.cancelExit);
  const ref = useRef<HTMLDivElement>(null);
  useModalA11y(ref, { onClose: cancel });
  return (
    <div className="event-overlay">
      <div
        ref={ref}
        className="exit-modal rise"
        role="dialog"
        aria-modal="true"
        aria-label={kind === "ipo" ? "Initial public offering" : "Acquisition offer"}
        tabIndex={-1}
      >
        {kind === "ipo" ? <Ipo /> : <Acquisition />}
      </div>
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
  const stepBack = useGame((s) => s.acceptStepBack);
  const cancel = useGame((s) => s.cancelExit);
  if (flow.kind !== "acquisition") return null;
  const o = flow.offer;

  return (
    <>
      <div className="exit-modal__cat">Acquisition offer · {game.company.name}</div>
      <h2 className="exit-modal__headline">{o.buyerName} wants to buy {game.company.name}</h2>
      <p className="exit-modal__body">
        A <strong>{formatPct(o.premiumPct, 0)}</strong> premium to your last mark. Take it in cash and
        walk — or take stock in {o.buyerName} and step back, holding a piece of the bigger company.
      </p>
      <div className="deal-choice">
        <div className="deal-choice__opt">
          <div className="deal-choice__head">Cash</div>
          <div className="deal-choice__big num">{formatMoney(o.founderTake)}</div>
          <div className="deal-choice__sub">{formatMoney(o.exitValue)} all-cash · a clean break</div>
          <Button variant="primary" size="md" className="deal-choice__cta" onClick={accept}>
            Take the cash
          </Button>
        </div>
        <div className="deal-choice__opt deal-choice__opt--stock">
          <div className="deal-choice__head">Stock — step back</div>
          <div className="deal-choice__big num">{formatMoney(o.founderStockValue)}</div>
          <div className="deal-choice__sub">
            {formatPct(o.founderStakePct)} of {o.buyerName} · {formatMoney(o.stockExitValue)} merger
          </div>
          <Button variant="primary" size="md" className="deal-choice__cta" onClick={stepBack}>
            Merge &amp; step back
          </Button>
        </div>
      </div>
      <div className="exit-modal__actions">
        <Button variant="ghost" size="md" onClick={cancel}>
          Keep building <Tag>independent</Tag>
        </Button>
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
