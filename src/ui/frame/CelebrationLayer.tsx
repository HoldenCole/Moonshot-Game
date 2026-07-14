// Big moments get a MOMENT: when a milestone log entry lands (net worth
// crossings, era beats), a starburst + banner takes the screen for a breath.
// Watches the log, fires once per entry, never replays on load.
import { useEffect, useRef, useState } from "react";
import { useGame } from "@/state/store";
import { usePrefs } from "@/state/prefs";
import type { LogEntry } from "@/domain/log";
import { play } from "@/audio/sfx";

const SHOW_MS = 3400;
const PARTICLES = 26;

export function CelebrationLayer() {
  const log = useGame((s) => s.game?.log);
  const seed = useGame((s) => s.game?.meta.seed);
  const reduceMotion = usePrefs((s) => s.reduceMotion);
  const seen = useRef<Set<string> | null>(null);
  const seedRef = useRef<number | undefined>(undefined);
  const [beat, setBeat] = useState<LogEntry | null>(null);

  useEffect(() => {
    if (!log) return;
    // A new run resets the ledger; the first pass only records what's already
    // there so loading a save never replays old fireworks.
    if (seen.current === null || seedRef.current !== seed) {
      seen.current = new Set(log.map((e) => e.id));
      seedRef.current = seed;
      return;
    }
    for (const e of log) {
      if (seen.current.has(e.id)) continue;
      seen.current.add(e.id);
      if (e.kind === "milestone") {
        setBeat(e);
        play("milestone");
      }
    }
  }, [log, seed]);

  useEffect(() => {
    if (!beat) return;
    const t = setTimeout(() => setBeat(null), SHOW_MS);
    return () => clearTimeout(t);
  }, [beat]);

  if (!beat) return null;

  return (
    <div className="celebrate" aria-live="polite">
      {!reduceMotion && (
        <div className="celebrate__burst">
          {Array.from({ length: PARTICLES }, (_, i) => (
            <span
              key={i}
              className="celebrate__p"
              style={{
                ["--a" as string]: `${(360 / PARTICLES) * i + (i % 3) * 4}deg`,
                ["--d" as string]: `${130 + (i % 5) * 34}px`,
                ["--t" as string]: `${1.1 + (i % 4) * 0.18}s`,
                background: ["#e8c76a", "#6f9cff", "#3ad29a", "#bd9dff"][i % 4],
              }}
            />
          ))}
        </div>
      )}
      <div className="celebrate__card">
        <div className="celebrate__kicker">Milestone</div>
        <div className="celebrate__headline">{beat.headline}</div>
        {beat.detail && <div className="celebrate__detail">{beat.detail}</div>}
      </div>
    </div>
  );
}
