// The hotkey legend — "?" in game. One glance, every key.
import { play } from "@/audio/sfx";

const KEYS: { k: string; what: string }[] = [
  { k: "Space", what: "Advance one week" },
  { k: "Esc", what: "Pause menu" },
  { k: "⌘K", what: "Command palette" },
  { k: "1–8", what: "Switch views (Campus … About)" },
  { k: "?", what: "This legend" },
];

export function KeysOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="overlay-backdrop" onClick={() => { play("close"); onClose(); }}>
      <div className="keys-sheet" role="dialog" aria-label="Keyboard shortcuts" onClick={(e) => e.stopPropagation()}>
        <div className="settings-sheet__head">
          <span className="section-label">Keyboard</span>
          <button className="iconbtn" onClick={() => { play("close"); onClose(); }} aria-label="Close">✕</button>
        </div>
        {KEYS.map((r) => (
          <div key={r.k} className="keys-row">
            <kbd className="keys-kbd">{r.k}</kbd>
            <span className="keys-what">{r.what}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
