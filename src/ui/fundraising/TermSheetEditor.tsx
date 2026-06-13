import type { RoundTerms } from "@/domain/captable";
import { formatMoney, formatPct } from "@/engine/format";
import { Slider } from "@/ui/components/controls";

/** The five negotiable terms as sliders, with optional soft per-term hints
 *  (the "color-coded terms" eval-help layer). Reused in setup and revision. */
export function TermSheetEditor({
  terms,
  market,
  onChange,
}: {
  terms: RoundTerms;
  market: RoundTerms;
  onChange: (t: RoundTerms) => void;
}) {
  const set = (patch: Partial<RoundTerms>) => onChange({ ...terms, ...patch });

  return (
    <div className="term-editor">
      <SliderRow hint={valuationHint(terms.valuation, market.valuation)}>
        <Slider
          label="Pre-money valuation"
          value={terms.valuation}
          min={Math.max(1, Math.round(market.valuation * 0.4))}
          max={Math.round(market.valuation * 2.2)}
          step={Math.max(0.5, Math.round(market.valuation / 40))}
          onChange={(v) => set({ valuation: v })}
          format={(v) => formatMoney(v)}
        />
      </SliderRow>

      <SliderRow>
        <Slider
          label="Round size"
          value={terms.roundSize}
          min={Math.max(0.5, Math.round(market.roundSize * 0.4))}
          max={Math.round(market.roundSize * 2.2)}
          step={Math.max(0.25, Math.round(market.roundSize / 40))}
          onChange={(v) => set({ roundSize: v })}
          format={(v) => formatMoney(v)}
        />
      </SliderRow>

      <SliderRow hint={poolHint(terms.optionPoolPct, market.optionPoolPct)}>
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
      </SliderRow>

      <SliderRow hint={prefHint(terms.liquidationPref)}>
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
      </SliderRow>

      <SliderRow hint={boardHint(terms.boardSeats)}>
        <Slider
          label="Investor board seats"
          value={terms.boardSeats}
          min={0}
          max={3}
          step={1}
          onChange={(v) => set({ boardSeats: v })}
          format={(v) => String(v)}
        />
      </SliderRow>
    </div>
  );
}

interface Hint {
  tone: "up" | "warn" | "down" | "neutral";
  label: string;
}

function SliderRow({ children, hint }: { children: React.ReactNode; hint?: Hint }) {
  return (
    <div className="term-row">
      {children}
      {hint && <span className={`term-chip term-chip--${hint.tone}`}>{hint.label}</span>}
    </div>
  );
}

function valuationHint(v: number, market: number): Hint {
  const r = v / market;
  if (r >= 1.35) return { tone: "warn", label: "rich — they'll resist" };
  if (r <= 0.85) return { tone: "up", label: "conservative" };
  return { tone: "neutral", label: "near market" };
}
function prefHint(x: number): Hint {
  if (x > 1) return { tone: "down", label: `${x.toFixed(2)}× — costs you` };
  return { tone: "up", label: "1× — clean" };
}
function boardHint(n: number): Hint {
  if (n === 0) return { tone: "up", label: "no seat" };
  if (n === 1) return { tone: "neutral", label: "1 seat" };
  return { tone: "warn", label: `${n} seats — control` };
}
function poolHint(v: number, market: number): Hint {
  if (v >= market + 0.03) return { tone: "warn", label: "large — dilutes you" };
  if (v <= market - 0.02) return { tone: "up", label: "lean" };
  return { tone: "neutral", label: "near market" };
}
