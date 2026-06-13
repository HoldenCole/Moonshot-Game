import { useMemo, useState } from "react";
import { useGame, upcomingStage } from "@/state/store";
import { suggestedTerms } from "@/state/newgame";
import { MAX_ROUNDS } from "@/engine/negotiation";
import { formatMoney } from "@/engine/format";
import { NEUTRAL_RELATIONSHIP } from "@/domain/state";
import { STAGE_LABELS, type Stage } from "@/domain/ids";
import type { RoundTerms } from "@/domain/captable";
import type { Investor } from "@/content/load";
import { Panel, PanelHeader } from "@/ui/components/Panel";
import { Button, Tag } from "@/ui/components/controls";
import { TermSheetEditor } from "./TermSheetEditor";
import { LivePreview } from "./LivePreview";
import { ComparableRounds } from "./ComparableRounds";
import { ReactionBanner } from "./ReactionBanner";
import { CounterCard } from "./CounterCard";

export function NegotiationPanel() {
  const game = useGame((s) => s.game);
  const content = useGame((s) => s.content);
  const negotiation = useGame((s) => s.negotiation);
  const startNegotiation = useGame((s) => s.startNegotiation);
  const counterOffer = useGame((s) => s.counterOffer);
  const acceptDeal = useGame((s) => s.acceptDeal);
  const walkAway = useGame((s) => s.walkAway);
  const dismissNegotiation = useGame((s) => s.dismissNegotiation);

  const stage: Stage = game ? upcomingStage(game.company.stage) : "seed";
  const market = useMemo(() => suggestedTerms(stage), [stage]);

  const eligible = useMemo(
    () => rankInvestors(content.investors, game?.company.industry, stage),
    [content.investors, game?.company.industry, stage],
  );
  const [leadId, setLeadId] = useState<string>(eligible[0]?.id ?? "");
  const [terms, setTerms] = useState<RoundTerms>(market);

  // Re-seed the editor: to market in setup; to the investor's counter each new round.
  const desiredKey = negotiation ? `neg:${negotiation.agentId}:${negotiation.round}` : `setup:${stage}`;
  const [syncKey, setSyncKey] = useState(desiredKey);
  if (syncKey !== desiredKey) {
    setSyncKey(desiredKey);
    if (negotiation?.currentCounter) setTerms(negotiation.currentCounter);
    else if (!negotiation) setTerms(suggestedTerms(stage));
  }

  if (!game) return null;

  const activeFirmId = negotiation?.agentId ?? leadId;
  const firm = content.investorById.get(activeFirmId) ?? eligible[0];
  if (!firm) return null;

  const relScore = game.relationships[firm.id]?.score ?? NEUTRAL_RELATIONSHIP;
  const lastRecord = negotiation?.history[negotiation.history.length - 1];

  return (
    <Panel className="negotiation">
      <PanelHeader
        title={negotiation ? `Negotiating your ${STAGE_LABELS[stage]}` : `Raise your ${STAGE_LABELS[stage]}`}
        sub={
          negotiation
            ? `Round ${Math.min(negotiation.round, MAX_ROUNDS)} of ${MAX_ROUNDS} · ${negotiation.partnerName}, ${firm.name}`
            : "Compose a term sheet and send it to a lead. They'll counter."
        }
        right={
          <div className="negotiation__head-right">
            <Tag tone={relTone(relScore)}>{relLabel(relScore)}</Tag>
            <Tag tone="accent">{STAGE_LABELS[stage]}</Tag>
          </div>
        }
      />

      {/* SETUP */}
      {!negotiation && (
        <div className="negotiation__grid">
          <div className="negotiation__left">
            <label className="field">
              <span className="field__label">Lead investor</span>
              <select className="select" value={leadId} onChange={(e) => setLeadId(e.target.value)}>
                {eligible.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} — {f.partner_name}
                  </option>
                ))}
              </select>
            </label>
            <FirmReadout firm={firm} />
            <TermSheetEditor terms={terms} market={market} onChange={setTerms} />
          </div>
          <aside className="negotiation__right">
            <ComparableRounds />
            <LivePreview capTable={game.company.capTable} terms={terms} />
            <Button
              variant="primary"
              size="md"
              className="negotiation__cta"
              onClick={() => startNegotiation(leadId, terms)}
            >
              Send term sheet to {firm.partner_name}
            </Button>
          </aside>
        </div>
      )}

      {/* NEGOTIATING */}
      {negotiation && negotiation.status === "active" && lastRecord && (
        <div className="negotiation__grid">
          <div className="negotiation__left">
            <ReactionBanner evaluation={lastRecord.evaluation} competingInterest={negotiation.competingInterest} />
            {negotiation.currentCounter && (
              <CounterCard yours={lastRecord.playerTerms} theirs={negotiation.currentCounter} />
            )}
            {negotiation.round < MAX_ROUNDS && (
              <div className="revise">
                <div className="revise__head">Revise &amp; counter</div>
                <TermSheetEditor terms={terms} market={market} onChange={setTerms} />
              </div>
            )}
          </div>
          <aside className="negotiation__right">
            {negotiation.currentCounter && (
              <LivePreview capTable={game.company.capTable} terms={negotiation.currentCounter} />
            )}
            <div className="negotiation__actions">
              {negotiation.currentCounter && (
                <Button variant="primary" size="md" className="negotiation__cta" onClick={acceptDeal}>
                  Accept their terms — {formatMoney(negotiation.currentCounter.roundSize)}
                </Button>
              )}
              {negotiation.round < MAX_ROUNDS && (
                <Button variant="subtle" size="md" className="negotiation__cta" onClick={() => counterOffer(terms)}>
                  Send revised terms
                </Button>
              )}
              <Button variant="ghost" size="md" className="negotiation__cta" onClick={walkAway}>
                Walk away
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* AGREED */}
      {negotiation && negotiation.status === "agreed" && negotiation.agreedTerms && (
        <div className="negotiation__grid">
          <div className="negotiation__left">
            <div className="deal-banner deal-banner--win">
              <div className="deal-banner__title">{negotiation.partnerName} is in.</div>
              <div className="deal-banner__sub">
                They accepted your terms. Sign to close the {STAGE_LABELS[stage]}.
              </div>
            </div>
            {lastRecord && <ReactionBanner evaluation={lastRecord.evaluation} />}
          </div>
          <aside className="negotiation__right">
            <LivePreview capTable={game.company.capTable} terms={negotiation.agreedTerms} />
            <Button variant="primary" size="md" className="negotiation__cta" onClick={acceptDeal}>
              Sign &amp; close — {formatMoney(negotiation.agreedTerms.roundSize)}
            </Button>
          </aside>
        </div>
      )}

      {/* ENDED */}
      {negotiation && (negotiation.status === "walked" || negotiation.status === "exhausted") && (
        <div className="negotiation__ended">
          <div className="deal-banner deal-banner--lose">
            <div className="deal-banner__title">
              {negotiation.status === "walked" ? "You walked away." : `No deal with ${negotiation.partnerName}.`}
            </div>
            <div className="deal-banner__sub">
              The relationship cools a little, but there are other firms — and you can always come back.
            </div>
          </div>
          <Button variant="primary" size="md" onClick={dismissNegotiation}>
            Back to the table
          </Button>
        </div>
      )}
    </Panel>
  );
}

function FirmReadout({ firm }: { firm: Investor }) {
  return (
    <div className="firm-readout">
      <div className="firm-readout__thesis">“{firm.identity.thesis}”</div>
      <div className="firm-tags">
        {firm.identity.trait_tags.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </div>
    </div>
  );
}

function relLabel(score: number): string {
  if (score >= 66) return "Strong relationship";
  if (score >= 56) return "Warm";
  if (score >= 45) return "Neutral";
  if (score >= 35) return "Cool";
  return "Strained";
}
function relTone(score: number): "up" | "warn" | "down" | "neutral" {
  if (score >= 56) return "up";
  if (score >= 45) return "neutral";
  if (score >= 35) return "warn";
  return "down";
}

function rankInvestors(investors: Investor[], industry: string | undefined, stage: Stage): Investor[] {
  const score = (f: Investor) => {
    let s = 0;
    if (industry && f.focus.primary_sector === industry) s += 3;
    if (industry && f.focus.secondary_sector === industry) s += 1;
    if (f.focus.primary_stage === stage) s += 2;
    return s;
  };
  return [...investors].sort((a, b) => score(b) - score(a));
}
