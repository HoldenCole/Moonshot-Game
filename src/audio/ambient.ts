// Generative ambient music — no audio files, just a slow pad the WebAudio graph
// synthesizes forever: four detuned oscillators walking a chord cycle through a
// gently-breathing lowpass. Two moods, keyed to the macro cycle: "bright"
// (expansion — open, major-leaning voicings) and "dark" (contraction — minor,
// lower, more closed). Volume + mute live in prefs; the whole thing idles at a
// whisper so it colors the room without asking for attention.

import { usePrefs } from "@/state/prefs";

export type Mood = "bright" | "dark";

const st = (base: number, semis: number) => base * Math.pow(2, semis / 12);

// Chord tables as semitone offsets from a root Hz: [root, voice2, voice3, air].
const CHORDS: Record<Mood, { root: number; voices: number[] }[]> = {
  bright: [
    { root: 110.0, voices: [0, 7, 14, 24] }, // A add9
    { root: 87.31, voices: [0, 7, 16, 26] }, // F maj7-ish
    { root: 98.0, voices: [0, 7, 14, 23] }, // G add9
    { root: 130.81, voices: [0, 4, 14, 21] }, // C maj9
  ],
  dark: [
    { root: 110.0, voices: [0, 3, 10, 15] }, // A min7
    { root: 87.31, voices: [0, 3, 12, 19] }, // F min
    { root: 73.42, voices: [0, 7, 10, 15] }, // D min7 low
    { root: 98.0, voices: [0, 3, 10, 17] }, // G min
  ],
};

const STEP_SECONDS = 11;
const GLIDE_SECONDS = 4.5;

interface Engine {
  ctx: AudioContext;
  master: GainNode;
  filter: BiquadFilterNode;
  oscs: OscillatorNode[];
  lfo: OscillatorNode;
  timer: number;
  chord: number;
}

let engine: Engine | null = null;
let mood: Mood = "bright";
let started = false;

function targetGain(): number {
  const p = usePrefs.getState();
  const base = p.musicOn ? p.musicVolume * 0.09 : 0;
  return typeof document !== "undefined" && document.hidden ? 0 : base;
}

function applyGain(): void {
  if (!engine) return;
  const t = engine.ctx.currentTime;
  engine.master.gain.cancelScheduledValues(t);
  engine.master.gain.setTargetAtTime(targetGain(), t, 0.6);
}

function stepChord(): void {
  if (!engine) return;
  const table = CHORDS[mood];
  engine.chord = (engine.chord + 1) % table.length;
  const c = table[engine.chord]!;
  const t = engine.ctx.currentTime;
  engine.oscs.forEach((o, i) => {
    // Voice 0 and its detuned twin share the root; the rest take the voicing.
    const semis = i <= 1 ? c.voices[0]! : c.voices[Math.min(i - 1, c.voices.length - 1)]!;
    const freq = st(c.root, semis) * (i === 1 ? 1.004 : 1); // twin drifts 4 cents
    o.frequency.cancelScheduledValues(t);
    o.frequency.setTargetAtTime(freq, t, GLIDE_SECONDS / 3);
  });
  // The dark mood closes the filter down; bright opens it.
  engine.filter.frequency.setTargetAtTime(mood === "bright" ? 640 : 380, t, 2.5);
}

function build(): Engine | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  const ctx = new AC();
  const master = ctx.createGain();
  master.gain.value = 0;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 640;
  filter.Q.value = 0.4;
  // A slow LFO breathes ±90 Hz through the cutoff.
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.05;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 90;
  lfo.connect(lfoGain).connect(filter.frequency);
  lfo.start();

  const oscs: OscillatorNode[] = [];
  for (let i = 0; i < 5; i++) {
    const o = ctx.createOscillator();
    o.type = i <= 1 ? "sawtooth" : "triangle";
    const g = ctx.createGain();
    g.gain.value = i <= 1 ? 0.05 : i === 4 ? 0.02 : 0.045; // the "air" voice sits far back
    o.connect(g).connect(filter);
    o.start();
    oscs.push(o);
  }
  filter.connect(master).connect(ctx.destination);
  return { ctx, master, filter, oscs, lfo, timer: 0, chord: -1 };
}

/** Start (or keep) the pad running. Safe to call repeatedly; resumes on the
 *  next user gesture if the autoplay policy has the context suspended. */
export function startAmbient(initial?: Mood): void {
  if (initial) mood = initial;
  if (!engine) {
    engine = build();
    if (!engine) return;
    stepChord();
    engine.timer = window.setInterval(stepChord, STEP_SECONDS * 1000);
    // Fade with tab visibility so an alt-tabbed game goes quiet.
    document.addEventListener("visibilitychange", applyGain);
    // Track pref changes live.
    usePrefs.subscribe(applyGain);
  }
  if (engine.ctx.state === "suspended") {
    const resume = () => {
      void engine?.ctx.resume().then(applyGain);
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
    window.addEventListener("pointerdown", resume);
    window.addEventListener("keydown", resume);
  }
  started = true;
  applyGain();
}

/** Shift the pad's mood (bright ↔ dark). Applies from the next chord step. */
export function setAmbientMood(next: Mood): void {
  if (mood === next) return;
  mood = next;
  if (started && engine) stepChord();
}
