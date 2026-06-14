// On-change motion (UI_LANGUAGE §2): when a tracked number changes on Advance,
// it briefly flashes its change color (green up / red down) and — for headline
// figures — counts to the new value. Reduced-motion keeps the informative flash
// but drops the count tween.

import { useEffect, useRef, useState } from "react";
import { usePrefs } from "@/state/prefs";

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export function FlashNum({
  value,
  format,
  count = false,
  durationMs = 460,
}: {
  value: number;
  format: (n: number) => string;
  count?: boolean;
  durationMs?: number;
}) {
  const reduceMotion = usePrefs((s) => s.reduceMotion);
  const prev = useRef(value);
  const [shown, setShown] = useState(value);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const [flashKey, setFlashKey] = useState(0);

  useEffect(() => {
    const from = prev.current;
    if (from === value) return;

    setFlash(value > from ? "up" : "down");
    setFlashKey((k) => k + 1);
    const clear = setTimeout(() => setFlash(null), 600);

    if (count && !reduceMotion) {
      const start = performance.now();
      let raf = 0;
      const step = (t: number) => {
        const k = Math.min(1, (t - start) / durationMs);
        setShown(from + (value - from) * easeOut(k));
        if (k < 1) raf = requestAnimationFrame(step);
        else setShown(value);
      };
      raf = requestAnimationFrame(step);
      prev.current = value;
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(clear);
      };
    }

    setShown(value);
    prev.current = value;
    return () => clearTimeout(clear);
  }, [value, count, reduceMotion, durationMs]);

  return (
    <span key={flashKey} className={flash ? `flash-${flash}` : undefined}>
      {format(count && !reduceMotion ? shown : value)}
    </span>
  );
}
