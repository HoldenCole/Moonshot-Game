// The settings sheet — one place for device preferences (display, motion,
// audio, tips), reachable from the title screen and the Esc pause menu.
import { useEffect } from "react";
import { usePrefs } from "@/state/prefs";
import { useUi } from "@/state/ui";
import { Segmented, Slider, Button } from "@/ui/components/controls";
import { play } from "@/audio/sfx";

export function SettingsModal() {
  const open = useUi((s) => s.settingsOpen);
  const setOpen = useUi((s) => s.setSettingsOpen);
  const theme = usePrefs((s) => s.theme);
  const toggleTheme = usePrefs((s) => s.toggleTheme);
  const reduceMotion = usePrefs((s) => s.reduceMotion);
  const setReduceMotion = usePrefs((s) => s.setReduceMotion);
  const soundOn = usePrefs((s) => s.soundOn);
  const setSoundOn = usePrefs((s) => s.setSoundOn);
  const volume = usePrefs((s) => s.volume);
  const setVolume = usePrefs((s) => s.setVolume);
  const musicOn = usePrefs((s) => s.musicOn);
  const setMusicOn = usePrefs((s) => s.setMusicOn);
  const musicVolume = usePrefs((s) => s.musicVolume);
  const setMusicVolume = usePrefs((s) => s.setMusicVolume);
  const resetHints = usePrefs((s) => s.resetHints);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        play("close");
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div className="overlay-backdrop" onClick={() => { play("close"); setOpen(false); }}>
      <div className="settings-sheet" role="dialog" aria-label="Settings" onClick={(e) => e.stopPropagation()}>
        <div className="settings-sheet__head">
          <span className="section-label">Settings</span>
          <button className="iconbtn" onClick={() => { play("close"); setOpen(false); }} aria-label="Close settings">✕</button>
        </div>

        <div className="settings-row">
          <div className="settings-row__label">Theme</div>
          <Segmented
            size="sm"
            value={theme}
            onChange={(v) => { if (v !== theme) toggleTheme(); play("click"); }}
            options={[
              { value: "dark", label: "Night" },
              { value: "light", label: "Day" },
            ]}
          />
        </div>

        <div className="settings-row">
          <div className="settings-row__label">Motion</div>
          <Segmented
            size="sm"
            value={reduceMotion ? "reduced" : "full"}
            onChange={(v) => { setReduceMotion(v === "reduced"); play("click"); }}
            options={[
              { value: "full", label: "Full" },
              { value: "reduced", label: "Reduced" },
            ]}
          />
        </div>

        <div className="settings-row">
          <div className="settings-row__label">Sound</div>
          <Segmented
            size="sm"
            value={soundOn ? "on" : "off"}
            onChange={(v) => { setSoundOn(v === "on"); if (v === "on") play("milestone"); }}
            options={[
              { value: "on", label: "On" },
              { value: "off", label: "Muted" },
            ]}
          />
        </div>

        {soundOn && (
          <div className="settings-row settings-row--wide">
            <Slider label="Volume" value={Math.round(volume * 100)} min={0} max={100} step={5} onChange={(v) => setVolume(v / 100)} format={(v) => `${v}%`} />
          </div>
        )}

        <div className="settings-row">
          <div className="settings-row__label">Music</div>
          <Segmented
            size="sm"
            value={musicOn ? "on" : "off"}
            onChange={(v) => { setMusicOn(v === "on"); play("click"); }}
            options={[
              { value: "on", label: "On" },
              { value: "off", label: "Muted" },
            ]}
          />
        </div>

        {musicOn && (
          <div className="settings-row settings-row--wide">
            <Slider label="Music volume" value={Math.round(musicVolume * 100)} min={0} max={100} step={5} onChange={(v) => setMusicVolume(v / 100)} format={(v) => `${v}%`} />
          </div>
        )}

        <div className="settings-row">
          <div className="settings-row__label">Tips & tutorial</div>
          <Button size="sm" variant="subtle" onClick={() => { resetHints(); play("click"); }}>
            Replay onboarding
          </Button>
        </div>
      </div>
    </div>
  );
}
