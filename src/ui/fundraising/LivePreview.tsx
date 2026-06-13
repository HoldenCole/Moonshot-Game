import type { CapTable, RoundTerms } from "@/domain/captable";
import { computeRound, founderOwnership, totalShares } from "@/engine/captable";
import { formatMoney, formatPct, formatPricePerShare } from "@/engine/format";
import { Stat } from "@/ui/components/controls";

/** The live cap-table preview — one of the three eval-help layers. Shows what a
 *  set of terms would do to ownership and value before you commit. */
export function LivePreview({ capTable, terms }: { capTable: CapTable; terms: RoundTerms }) {
  const preview = computeRound(capTable, terms);
  const founderBefore = founderOwnership(capTable);
  const founderSharesBefore = founderBefore * totalShares(capTable);
  const founderAfter = preview.postShares > 0 ? founderSharesBefore / preview.postShares : founderBefore;

  return (
    <div className="live-preview">
      <div className="live-preview__head">If you sign this</div>
      <div className="live-preview__stats">
        <Stat label="Post-money" value={formatMoney(preview.postMoney)} />
        <Stat label="Investor takes" value={formatPct(preview.investorOwnership)} />
        <Stat
          label="You'd hold"
          value={formatPct(Math.max(0, founderAfter))}
          sub={`from ${formatPct(founderBefore)}`}
          tone={founderAfter >= 0.5 ? "up" : "warn"}
        />
        <Stat label="Price / share" value={formatPricePerShare(preview.pricePerShare)} />
        <Stat label="New pool" value={formatPct(preview.optionPoolPctPost)} />
        <Stat label="Your stake value" value={formatMoney(Math.max(0, founderAfter) * preview.postMoney)} tone="up" />
      </div>
    </div>
  );
}
