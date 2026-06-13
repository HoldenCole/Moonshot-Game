import { useMemo, useState } from "react";
import { useGame, upcomingStage } from "@/state/store";
import { suggestedTerms } from "@/state/newgame";
import { computeRound, founderOwnership, totalShares } from "@/engine/captable";
import { formatMoney, formatPct, formatPricePerShare } from "@/engine/format";
import { STAGE_LABELS, type Stage } from "@/domain/ids";
import type { RoundTerms } from "@/domain/captable";
import type { Investor } from "@/content/load";
import { Button, Slider, Stat, Tag } from "@/ui/components/controls";
import { Panel, PanelHeader } from "@/ui/components/Panel";

/** Soft, qualitative read on how the lead would receive these terms — pattern,
 *  not probability (decision G). Derived from the firm's hidden axes vs. how
 *  founder-favorable the ask is. */
function investorReaction(firm: Investor, terms: RoundTerms): { tone: "up" | "warn" | "down"; text: string } {
  const ff = firm.personality.founder_friendliness;
  const aggression = firm.personality.aggression;
  // A founder-favorable ask: rich valuation, light pref, lean pool.
  const richValuation = terms.valuation; // higher = more founder-favorable
  const stretch = richValuation / (firm.fund.check_max * 3 + 1);
  const friction = stretch * 0.6 + (1 - terms.liquidationPref) * -0.2 + aggression / 200 - ff / 200;

  if (friction < 0.15) return { tone: "up", text: `${firm.partner_name} sounds genuinely warm on this.` };
  if (friction < 0.45) return { tone: "warn", text: `${firm.partner_name} is interested but will push on terms.` };
  return { tone: "down", text: `${firm.partner_name} thinks you're reaching on price.` };
}

export function RaiseRoundPanel() {
  const game = useGame((s) => s.game);
  const content = useGame((s) => s.content);
  const raiseRound = useGame((s) => s.raiseRound);

  const stage: Stage = game ? upcomingStage(game.company.stage) : "seed";
  const defaults = useMemo(() => suggestedTerms(stage), [stage]);
  const [terms, setTerms] = useState<RoundTerms>(defaults);
  const [stageKey, setStageKey] = useState<Stage>(stage);

  // Re-seed terms when the company advances to a new stage.
  if (stageKey !== stage) {
    setStageKey(stage);
    setTerms(defaults);
  }

  const eligible = useMemo(
    () => rankInvestors(content.investors, game?.company.industry, stage),
    [content.investors, game?.company.industry, stage],
  );
  const [leadId, setLeadId] = useState<string>(eligible[0]?.id ?? "");
  const lead = content.investorById.get(leadId) ?? eligible[0];

  if (!game || !lead) return null;

  const preview = computeRound(game.company.capTable, terms);
  const founderBefore = founderOwnership(game.company.capTable);
  // Founder shares don't change in a round; only the denominator grows.
  const founderSharesBefore = founderBefore * totalShares(game.company.capTable);
  const founderAfterFrac = preview.postShares > 0 ? founderSharesBefore / preview.postShares : founderBefore;
  const reaction = investorReaction(lead, terms);

  const set = (patch: Partial<RoundTerms>) => setTerms((t) => ({ ...t, ...patch }));

  return (
    <Panel className="raise-panel">
      <PanelHeader
        title={`Raise your ${STAGE_LABELS[stage]}`}
        sub="Negotiate the five terms. The preview updates live."
        right={<Tag tone="accent">{STAGE_LABELS[stage]}</Tag>}
      />

      <div className="raise-grid">
        <div className="raise-terms">
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

          <div className="firm-readout">
            <div className="firm-readout__thesis">“{lead.identity.thesis}”</div>
            <div className="firm-tags">
              {lead.identity.trait_tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
          </div>

          <Slider
            label="Pre-money valuation"
            value={terms.valuation}
            min={Math.max(1, Math.round(defaults.valuation * 0.4))}
            max={Math.round(defaults.valuation * 2.2)}
            step={Math.max(0.5, Math.round(defaults.valuation / 40))}
            onChange={(v) => set({ valuation: v })}
            format={(v) => formatMoney(v)}
          />
          <Slider
            label="Round size"
            value={terms.roundSize}
            min={Math.max(0.5, Math.round(defaults.roundSize * 0.4))}
            max={Math.round(defaults.roundSize * 2.2)}
            step={Math.max(0.25, Math.round(defaults.roundSize / 40))}
            onChange={(v) => set({ roundSize: v })}
            format={(v) => formatMoney(v)}
          />
          <Slider
            label="Option pool (post-money)"
            value={terms.optionPoolPct}
            min={0}
            max={0.2}
            step={0.005}
            onChange={(v) => set({ optionPoolPct: v })}
            format={(v) => formatPct(v, 1)}
            hint="Topped up pre-money — the dilution lands on you, not the new investor."
          />
          <Slider
            label="Liquidation preference"
            value={terms.liquidationPref}
            min={1}
            max={2}
            step={0.25}
            onChange={(v) => set({ liquidationPref: v })}
            format={(v) => `${v.toFixed(2)}×`}
            hint="Higher pref protects the investor's downside at your expense."
          />
          <Slider
            label="Investor board seats"
            value={terms.boardSeats}
            min={0}
            max={3}
            step={1}
            onChange={(v) => set({ boardSeats: v })}
            format={(v) => String(v)}
          />
        </div>

        <aside className="raise-preview">
          <div className="raise-preview__head">Live preview</div>
          <div className="raise-preview__stats">
            <Stat label="Post-money" value={formatMoney(preview.postMoney)} />
            <Stat label="Investor takes" value={formatPct(preview.investorOwnership)} />
            <Stat
              label="You'd hold"
              value={formatPct(Math.max(0, founderAfterFrac))}
              sub={`from ${formatPct(founderBefore)}`}
              tone={founderAfterFrac >= 0.5 ? "up" : "warn"}
            />
            <Stat label="Price / share" value={formatPricePerShare(preview.pricePerShare)} />
            <Stat label="New pool" value={formatPct(preview.optionPoolPctPost)} />
            <Stat
              label="Your stake value"
              value={formatMoney(Math.max(0, founderAfterFrac) * preview.postMoney)}
              tone="up"
            />
          </div>

          <div className={`reaction reaction--${reaction.tone}`}>
            <span className="reaction__dot" />
            {reaction.text}
          </div>

          <Button
            variant="primary"
            size="md"
            className="raise-close"
            onClick={() =>
              raiseRound({
                terms,
                stage,
                leadInvestorId: lead.id,
                leadInvestorName: lead.name,
              })
            }
          >
            Close {STAGE_LABELS[stage]} — {formatMoney(terms.roundSize)}
          </Button>
        </aside>
      </div>
    </Panel>
  );
}

/** Order firms by fit for the company's sector + the upcoming stage, so the
 *  most plausible leads surface first (still selectable across the board). */
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
