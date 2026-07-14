// The Architect panel — the player chooses what their company BUILDS: the
// architectural style (previewed live at skyscraper scale in their colors),
// what crowns the roof, and the trim light. Saved with the run.
import { useState } from "react";
import { useGame } from "@/state/store";
import type { CompanyArchitecture } from "@/domain/state";
import { GROUND } from "./shared";
import { CROWNS, STYLES, TRIMS, StyleBuilding, type CrownId, type StyleId } from "./architecture";
import { Button } from "@/ui/components/controls";
import { play } from "@/audio/sfx";

const DEFAULT: CompanyArchitecture = { style: "monolith", crown: "antenna" };

export function ArchitectModal({ onClose }: { onClose: () => void }) {
  const game = useGame((s) => s.game);
  const setArchitecture = useGame((s) => s.setArchitecture);
  const current = game?.company.architecture ?? DEFAULT;
  const [style, setStyle] = useState<StyleId>(current.style);
  const [crown, setCrown] = useState<CrownId>(current.crown);
  const [trim, setTrim] = useState<string | undefined>(current.trim);
  if (!game) return null;
  const color = game.company.color;

  const commit = () => {
    setArchitecture({ style, crown, ...(trim ? { trim } : {}) });
    play("milestone");
    onClose();
  };

  return (
    <div className="overlay-backdrop" onClick={() => { play("close"); onClose(); }}>
      <div className="architect" role="dialog" aria-label="The Architect" onClick={(e) => e.stopPropagation()}>
        <div className="settings-sheet__head">
          <div>
            <span className="section-label">The Architect</span>
            <div className="architect__sub">Choose what {game.company.name} builds. The design scales with every stage you reach.</div>
          </div>
          <button className="iconbtn" onClick={() => { play("close"); onClose(); }} aria-label="Close">✕</button>
        </div>

        <div className="architect__styles">
          {STYLES.map((s) => (
            <button
              key={s.id}
              className={`arch-card${s.id === style ? " is-active" : ""}`}
              onClick={() => { setStyle(s.id); play("click"); }}
              aria-pressed={s.id === style}
            >
              <svg viewBox={`96 ${GROUND - 495} 380 520`} className="arch-card__preview" aria-hidden>
                <rect x={96} y={GROUND - 495} width={380} height={520} fill="#0a0e18" />
                <StyleBuilding x={170} tier="skyscraper" style={s.id} crown={crown} trim={trim ?? color} litPct={62} canopy="#2f6b4f" />
                <rect x={96} y={GROUND} width={380} height={25} fill="#0c1018" />
              </svg>
              <div className="arch-card__name">{s.name}</div>
              <div className="arch-card__blurb">{s.blurb}</div>
            </button>
          ))}
        </div>

        <div className="architect__row">
          <span className="settings-row__label">Crown</span>
          <div className="architect__opts">
            {CROWNS.map((cr) => (
              <button key={cr.id} className={`arch-pill${cr.id === crown ? " is-active" : ""}`} onClick={() => { setCrown(cr.id); play("click"); }} aria-pressed={cr.id === crown}>
                {cr.name}
              </button>
            ))}
          </div>
        </div>

        <div className="architect__row">
          <span className="settings-row__label">Trim light</span>
          <div className="architect__opts">
            <button
              className={`arch-swatch${!trim ? " is-active" : ""}`}
              style={{ background: color }}
              title="Brand color"
              onClick={() => { setTrim(undefined); play("click"); }}
              aria-pressed={!trim}
            />
            {TRIMS.map((t) => (
              <button
                key={t}
                className={`arch-swatch${trim === t ? " is-active" : ""}`}
                style={{ background: t }}
                title={t}
                onClick={() => { setTrim(t); play("click"); }}
                aria-pressed={trim === t}
              />
            ))}
          </div>
        </div>

        <div className="architect__foot">
          <span className="architect__hint">Breaks ground instantly — no permits on the frontier.</span>
          <Button variant="primary" size="md" onClick={commit}>
            Commission it
          </Button>
        </div>
      </div>
    </div>
  );
}
