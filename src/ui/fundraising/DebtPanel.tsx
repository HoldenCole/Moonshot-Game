import { useState } from "react";
import { useGame } from "@/state/store";
import { formatMoney } from "@/engine/format";
import {
  DEFAULT_TERM_WEEKS,
  MAX_TERM_WEEKS,
  MIN_LOAN,
  MIN_TERM_WEEKS,
  availableLenders,
  weeklyInterest,
  weeksToMaturity,
} from "@/engine/debt";
import type { Loan } from "@/domain/state";
import { Panel, PanelHeader } from "@/ui/components/Panel";
import { Button, Slider, Tag } from "@/ui/components/controls";

const round1 = (x: number) => Math.round(x * 10) / 10;
const months = (weeks: number) => Math.round((weeks * 12) / 52);

/** Non-dilutive financing: draw a loan from a bank, adjust the amount and term,
 *  carry it, and repay. Rates are global and scale with the macro climate. */
export function DebtPanel() {
  const game = useGame((s) => s.game);
  const banks = useGame((s) => s.content.banks);
  const takeLoan = useGame((s) => s.takeLoan);
  const repayLoan = useGame((s) => s.repayLoan);

  const offers = game ? availableLenders(game.company, banks, game.world) : [];
  const [bankId, setBankId] = useState(offers[0]?.bankId ?? "");
  const [amount, setAmount] = useState(0);
  const [term, setTerm] = useState(DEFAULT_TERM_WEEKS);

  const offer = offers.find((o) => o.bankId === bankId) ?? offers[0];

  // Reseed the amount when the selected lender (and thus capacity) changes.
  const [syncKey, setSyncKey] = useState("");
  const key = offer?.bankId ?? "";
  if (key !== syncKey) {
    setSyncKey(key);
    setBankId(key);
    if (offer) setAmount(round1(Math.min(offer.capacity, Math.max(MIN_LOAN, offer.capacity * 0.5))));
  }

  if (!game) return null;
  const loans = game.company.loans ?? [];
  const cash = game.company.financials.cash;

  const weeklyInt = offer ? (amount * (offer.rateAnnual / 100)) / 52 : 0;

  return (
    <Panel className="debt" coach="debt">
      <PanelHeader
        title="Debt financing"
        sub="Borrow against revenue and enterprise value — non-dilutive, but the interest meter runs"
      />

      {offer ? (
        <div className="debt__new">
          <div className="debt__left">
            <label className="field">
              <span className="field__label">Lender</span>
              <select className="select" value={offer.bankId} onChange={(e) => setBankId(e.target.value)}>
                {offers.map((o) => (
                  <option key={o.bankId} value={o.bankId}>
                    {o.bankName} — {o.rateAnnual.toFixed(1)}% · up to {formatMoney(o.capacity)}
                  </option>
                ))}
              </select>
            </label>
            <Slider
              label="Amount"
              value={Math.min(amount, offer.capacity)}
              min={MIN_LOAN}
              max={offer.capacity}
              step={0.5}
              onChange={setAmount}
              format={(v) => formatMoney(v)}
              hint={`This lender will extend up to ${formatMoney(offer.capacity)}.`}
            />
            <Slider
              label="Term"
              value={term}
              min={MIN_TERM_WEEKS}
              max={MAX_TERM_WEEKS}
              step={2}
              onChange={setTerm}
              format={(v) => `${months(v)} mo`}
              hint="Interest-only; the principal is due as a lump at maturity."
            />
          </div>
          <aside className="debt__right">
            <div className="debt__terms">
              <div className="debt__rate-row">
                <span className="debt__rate num">{offer.rateAnnual.toFixed(1)}%</span>
                <span className="debt__rate-cap">APR · scales with the macro climate</span>
              </div>
              <Row k="Interest" v={`${formatMoney(weeklyInt)}/wk`} />
              <Row k={`Total over ${months(term)} mo`} v={formatMoney(weeklyInt * term)} />
              <Row k="Due at maturity" v={formatMoney(Math.min(amount, offer.capacity))} />
              {offer.covenantStrictness >= 60 && (
                <div className="debt__covenant">Strict covenants — this lender keeps you on a short leash.</div>
              )}
            </div>
            <Button
              variant="primary"
              size="md"
              className="debt__cta"
              disabled={amount < MIN_LOAN}
              onClick={() => takeLoan(offer.bankId, Math.min(amount, offer.capacity), term)}
            >
              Draw {formatMoney(Math.min(amount, offer.capacity))}
            </Button>
          </aside>
        </div>
      ) : (
        <p className="debt__none">
          No lender will extend debt yet. Capacity scales with revenue and enterprise value — grow into it,
          or post real revenue, and the credit lines open up.
        </p>
      )}

      {loans.length > 0 && (
        <div className="debt__book">
          <div className="debt__book-head">Outstanding</div>
          {loans.map((loan) => (
            <LoanRow key={loan.id} loan={loan} week={game.clock.week} cash={cash} onRepay={() => repayLoan(loan.id)} />
          ))}
        </div>
      )}
    </Panel>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="debt__row">
      <span className="debt__row-k">{k}</span>
      <span className="debt__row-v num">{v}</span>
    </div>
  );
}

function LoanRow({ loan, week, cash, onRepay }: { loan: Loan; week: number; cash: number; onRepay: () => void }) {
  const left = weeksToMaturity(loan, week);
  const matured = left <= 0;
  return (
    <div className={`loan${loan.overdue ? " loan--overdue" : ""}`}>
      <div className="loan__id">
        <span className="loan__lender">{loan.lenderName}</span>
        <span className="loan__meta num">
          {loan.rateAnnual.toFixed(1)}% · {formatMoney(weeklyInterest(loan))}/wk
        </span>
      </div>
      <div className="loan__status">
        {loan.overdue ? (
          <Tag tone="down">Past due</Tag>
        ) : matured ? (
          <Tag tone="warn">Due now</Tag>
        ) : (
          <span className="loan__maturity num">matures in {months(left)} mo</span>
        )}
      </div>
      <span className="loan__principal num">{formatMoney(loan.principal)}</span>
      <Button variant="subtle" size="sm" disabled={cash < loan.principal} onClick={onRepay} title={cash < loan.principal ? "Not enough cash to repay" : "Repay in full"}>
        Repay
      </Button>
    </div>
  );
}
