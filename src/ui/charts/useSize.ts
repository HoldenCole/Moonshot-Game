import { useLayoutEffect, useRef, useState } from "react";

/** Measure an element's content box so SVG charts can render at exact pixel
 *  dimensions (crisp axis text, no viewBox scaling distortion). */
export function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]!.contentRect;
      setSize({ width: cr.width, height: cr.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, size] as const;
}
