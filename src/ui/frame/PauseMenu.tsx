// The Esc menu — the game pause every Steam player reaches for. Resume,
// Settings, and Quit to Title (the run is autosaved; quitting just closes the
// table and returns to the front door).
import { useGame } from "@/state/store";
import { useUi } from "@/state/ui";
import { saveGame } from "@/state/persist";
import { play } from "@/audio/sfx";

export function PauseMenu() {
  const open = useUi((s) => s.pauseOpen);
  const setOpen = useUi((s) => s.setPauseOpen);
  const setScreen = useUi((s) => s.setScreen);
  const setSettingsOpen = useUi((s) => s.setSettingsOpen);
  const game = useGame((s) => s.game);

  if (!open || !game) return null;

  const quitToTitle = () => {
    saveGame(game); // flush past the autosave debounce — never lose the last move
    play("close");
    setOpen(false);
    setScreen("title");
  };

  return (
    <div className="overlay-backdrop pause" onClick={() => { play("close"); setOpen(false); }}>
      <div className="pause__menu" role="dialog" aria-label="Pause menu" onClick={(e) => e.stopPropagation()}>
        <div className="pause__kicker">Paused</div>
        <div className="pause__title">{game.company.name}</div>
        <div className="pause__meta num">Week {game.clock.week} · autosaved</div>
        <div className="pause__rows">
          <button className="ts-row ts-row--primary" onClick={() => { play("click"); setOpen(false); }}>
            <span className="ts-row__tick" />Resume<span className="ts-row__hint">esc</span>
          </button>
          <button className="ts-row" onClick={() => { play("open"); setSettingsOpen(true); }}>
            <span className="ts-row__tick" />Settings
          </button>
          <button className="ts-row ts-row--quiet" onClick={quitToTitle}>
            <span className="ts-row__tick" />Quit to title
          </button>
        </div>
      </div>
    </div>
  );
}
