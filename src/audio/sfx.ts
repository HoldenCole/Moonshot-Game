// Synthesized UI sound — no audio assets, just WebAudio oscillators and shaped
// noise. Every cue is short, quiet, and pitched to the app's register: ticks
// for clicks, a filtered whoosh for time passing, small stingers for moments.
// Master volume + mute live in prefs; the context lazy-starts on first gesture
// (satisfying autoplay policy, since every cue is user-triggered).

import { usePrefs } from "@/state/prefs";

export type SfxName =
  | "click" // generic press
  | "nav" // switching views
  | "advance" // a week passing
  | "event" // a decision lands on your desk
  | "milestone" // achievement / era moment
  | "launch" // rocket off the pad
  | "found" // a company is born
  | "open" // modal / menu opens
  | "close"; // modal / menu closes

let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function master(): number {
  const p = usePrefs.getState();
  return p.soundOn ? p.volume : 0;
}

/** One enveloped oscillator note. */
function tone(ac: AudioContext, opts: { freq: number; to?: number; type?: OscillatorType; at?: number; dur?: number; gain?: number }): void {
  const t0 = ac.currentTime + (opts.at ?? 0);
  const dur = opts.dur ?? 0.08;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = opts.type ?? "sine";
  o.frequency.setValueAtTime(opts.freq, t0);
  if (opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, t0 + dur);
  const peak = (opts.gain ?? 0.12) * master();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0004, t0 + dur);
  o.connect(g).connect(ac.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

/** A burst of filtered noise (whoosh / rumble body). */
function noise(ac: AudioContext, opts: { dur: number; from: number; to: number; type?: BiquadFilterType; gain?: number; at?: number }): void {
  const t0 = ac.currentTime + (opts.at ?? 0);
  const len = Math.ceil(ac.sampleRate * opts.dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const f = ac.createBiquadFilter();
  f.type = opts.type ?? "bandpass";
  f.frequency.setValueAtTime(opts.from, t0);
  f.frequency.exponentialRampToValueAtTime(opts.to, t0 + opts.dur);
  f.Q.value = 1.1;
  const g = ac.createGain();
  const peak = (opts.gain ?? 0.1) * master();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + opts.dur * 0.2);
  g.gain.exponentialRampToValueAtTime(0.0004, t0 + opts.dur);
  src.connect(f).connect(g).connect(ac.destination);
  src.start(t0);
  src.stop(t0 + opts.dur + 0.02);
}

/** Fire a cue. Safe to call anywhere; silent when muted or unsupported. */
export function play(name: SfxName): void {
  if (master() <= 0) return;
  const ac = context();
  if (!ac) return;
  switch (name) {
    case "click":
      tone(ac, { freq: 1250, to: 900, dur: 0.05, gain: 0.07 });
      break;
    case "nav":
      tone(ac, { freq: 700, to: 980, dur: 0.06, gain: 0.05 });
      break;
    case "advance":
      noise(ac, { dur: 0.24, from: 420, to: 2400, gain: 0.06 });
      tone(ac, { freq: 520, to: 700, dur: 0.14, gain: 0.03, type: "triangle" });
      break;
    case "event":
      tone(ac, { freq: 440, dur: 0.12, gain: 0.08, type: "triangle" });
      tone(ac, { freq: 554, dur: 0.16, gain: 0.08, type: "triangle", at: 0.09 });
      break;
    case "milestone":
      tone(ac, { freq: 523, dur: 0.11, gain: 0.08, type: "triangle" });
      tone(ac, { freq: 659, dur: 0.11, gain: 0.08, type: "triangle", at: 0.09 });
      tone(ac, { freq: 784, dur: 0.22, gain: 0.09, type: "triangle", at: 0.18 });
      break;
    case "launch":
      noise(ac, { dur: 1.4, from: 60, to: 220, type: "lowpass", gain: 0.22 });
      noise(ac, { dur: 0.9, from: 900, to: 300, gain: 0.05, at: 0.05 });
      break;
    case "found":
      tone(ac, { freq: 196, dur: 0.5, gain: 0.07, type: "sine" });
      tone(ac, { freq: 294, dur: 0.5, gain: 0.06, type: "sine", at: 0.02 });
      tone(ac, { freq: 392, dur: 0.6, gain: 0.06, type: "sine", at: 0.05 });
      break;
    case "open":
      tone(ac, { freq: 620, to: 880, dur: 0.07, gain: 0.05 });
      break;
    case "close":
      tone(ac, { freq: 880, to: 560, dur: 0.07, gain: 0.045 });
      break;
  }
}
