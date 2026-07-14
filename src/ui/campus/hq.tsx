// The headquarters GROWS with the run — the visible arc of the game:
//   garage (idea/pre-seed) → brick lowrise (seed) → glass tower (series A+)
//   → twin-tower complex (Scale-Up) → the Spire (Titan age and beyond).
import type { Stage } from "@/domain/ids";
import { GROUND, Chip, Hot, Windows } from "./shared";

export type HqForm = "garage" | "lowrise" | "tower" | "complex" | "spire";

export function hqForm(stage: Stage, late: boolean, era?: string): HqForm {
  if (late && (era === "titan" || era === "sovereign")) return "spire";
  if (late) return "complex";
  if (stage === "idea" || stage === "pre_seed") return "garage";
  if (stage === "seed") return "lowrise";
  return "tower";
}

interface HqProps {
  name: string;
  color: string;
  headcount: number;
  form: HqForm;
  onGo: () => void;
}

const X = 170; // the HQ block's left edge — every form roots here

/** The company sign: the name in your brand color, glowing over the roof. */
function Sign({ cx, y, name, color, size = 13 }: { cx: number; y: number; name: string; color: string; size?: number }) {
  return (
    <text
      x={cx}
      y={y}
      textAnchor="middle"
      className="cmp-sign cmp-sign--company"
      fill={color}
      style={{ filter: `drop-shadow(0 0 8px ${color})`, fontSize: size }}
    >
      {name.toUpperCase()}
    </text>
  );
}

export function Headquarters({ name, color, headcount, form, onGo }: HqProps) {
  return (
    <Hot label="Headquarters — your team" onGo={onGo}>
      <g>
        <ellipse cx={X + 95} cy={GROUND} rx={160} ry={16} fill={color} opacity={0.07} />
        {form === "garage" && <Garage name={name} color={color} headcount={headcount} />}
        {form === "lowrise" && <Lowrise name={name} color={color} headcount={headcount} />}
        {form === "tower" && <Tower name={name} color={color} headcount={headcount} />}
        {form === "complex" && <Complex name={name} color={color} headcount={headcount} />}
        {form === "spire" && <Spire name={name} color={color} headcount={headcount} />}
      </g>
    </Hot>
  );
}

/** Where it starts: a garage, a roller door, a hoop over the driveway. */
function Garage({ name, color, headcount }: { name: string; color: string; headcount: number }) {
  const x = X + 30;
  return (
    <g>
      <rect x={x} y={GROUND - 62} width={124} height={62} fill="#181f30" />
      <path d={`M ${x - 6} ${GROUND - 62} L ${x + 62} ${GROUND - 84} L ${x + 130} ${GROUND - 62} Z`} fill="#202942" />
      {/* roller door, slats lit from inside — somebody's always working */}
      <rect x={x + 14} y={GROUND - 44} width={56} height={44} fill="#0e1420" />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={x + 16} y={GROUND - 41 + i * 8.4} width={52} height={5.4} rx={1.5} fill="#1c2740" />
      ))}
      <rect x={x + 16} y={GROUND - 8} width={52} height={4} fill="#ffd98a" opacity={0.35} />
      {/* side door + window */}
      <rect x={x + 84} y={GROUND - 34} width={18} height={34} fill="#0e1420" />
      <rect x={x + 86} y={GROUND - 32} width={14} height={30} fill="#ffd98a" opacity={0.2} />
      <rect x={x + 106} y={GROUND - 40} width={14} height={12} rx={1.5} className="cmp-win cmp-win--lit" />
      {/* the hoop — every garage-founded giant had one */}
      <line x1={x + 4} y1={GROUND - 56} x2={x + 4} y2={GROUND} stroke="#2a3550" strokeWidth={3} />
      <rect x={x - 4} y={GROUND - 58} width={16} height={11} rx={1} fill="none" stroke="#3a4a6e" strokeWidth={1.6} />
      <circle cx={x + 4} cy={GROUND - 46} r={4} fill="none" stroke="#b06a35" strokeWidth={1.6} />
      <Sign cx={x + 62} y={GROUND - 94} name={name} color={color} size={10.5} />
      <Chip x={x + 62} y={GROUND - 128} label="THE GARAGE" value={`${headcount} aboard`} accent={color} />
    </g>
  );
}

/** Seed: the brick loft — two floors, tall windows, an AC box on the roof. */
function Lowrise({ name, color, headcount }: { name: string; color: string; headcount: number }) {
  const x = X + 10;
  return (
    <g>
      <rect x={x} y={GROUND - 96} width={166} height={96} fill="#1b1c2c" />
      <rect x={x} y={GROUND - 96} width={166} height={5} fill="#272b44" />
      <rect x={x + 122} y={GROUND - 108} width={26} height={12} fill="#232c44" />
      <Windows x={x + 12} y={GROUND - 84} cols={5} rows={2} cw={22} ch={26} gapX={8} gapY={12} litPct={Math.min(85, 35 + headcount * 4)} salt={31} />
      <rect x={x + 66} y={GROUND - 30} width={34} height={30} fill="#0e1420" />
      <rect x={x + 69} y={GROUND - 27} width={28} height={27} fill="#ffd98a" opacity={0.2} />
      <rect x={x + 60} y={GROUND - 34} width={46} height={5} rx={2} fill="#232c44" />
      <Sign cx={x + 83} y={GROUND - 118} name={name} color={color} size={11.5} />
      <Chip x={x + 83} y={GROUND - 152} label="THE LOFT" value={`${headcount} aboard`} accent={color} />
    </g>
  );
}

/** Series A onward: the glass tower — floors climb with headcount. */
function Tower({ name, color, headcount }: { name: string; color: string; headcount: number }) {
  const floors = Math.min(9, 3 + Math.ceil(headcount / 8));
  const w = 170;
  const h = floors * 34;
  const y = GROUND - h;
  const litPct = Math.min(85, 25 + headcount * 3);
  return (
    <g>
      <line x1={X + w / 2} y1={y - 26} x2={X + w / 2} y2={y} stroke="#2a3550" strokeWidth={3} />
      <circle cx={X + w / 2} cy={y - 28} r={3} className="cmp-beacon" />
      <Sign cx={X + w / 2} y={y - 40} name={name} color={color} />
      <rect x={X} y={y} width={w} height={h} fill="#1a2136" />
      <rect x={X} y={y} width={w} height={5} fill="#2a3552" />
      <rect x={X + 6} y={y + 5} width={w - 12} height={h - 5} fill="url(#cmp-glass)" opacity={0.4} />
      <Windows x={X + 14} y={y + 13} cols={5} rows={floors} cw={24} ch={14} gapX={4.5} gapY={20} litPct={litPct} salt={9} />
      <rect x={X + w / 2 - 20} y={GROUND - 26} width={40} height={26} fill="#0b0f18" />
      <rect x={X + w / 2 - 17} y={GROUND - 23} width={34} height={23} fill="#ffd98a" opacity={0.18} />
      <rect x={X + w / 2 - 26} y={GROUND - 30} width={52} height={5} rx={2} fill="#232c44" />
      <Chip x={X + w / 2} y={y - 76} label="HEADQUARTERS" value={`${headcount} aboard`} accent={color} />
    </g>
  );
}

/** Scale-Up: the campus becomes a complex — podium, twin towers, a skybridge. */
function Complex({ name, color, headcount }: { name: string; color: string; headcount: number }) {
  const aH = 300;
  const aY = GROUND - aH;
  const bH = 190;
  const bY = GROUND - bH;
  const litPct = Math.min(88, 30 + headcount * 2);
  return (
    <g>
      {/* podium */}
      <rect x={X - 30} y={GROUND - 44} width={280} height={44} fill="#161c2e" />
      <rect x={X - 30} y={GROUND - 44} width={280} height={4} fill="#242e4c" />
      <Windows x={X - 18} y={GROUND - 34} cols={9} rows={1} cw={20} ch={16} gapX={8} gapY={0} litPct={70} salt={41} />
      {/* tower A */}
      <rect x={X} y={aY} width={140} height={aH - 44} fill="#1a2136" />
      <rect x={X} y={aY} width={140} height={5} fill="#2c3756" />
      <rect x={X + 5} y={aY + 5} width={130} height={aH - 54} fill="url(#cmp-glass)" opacity={0.42} />
      <Windows x={X + 12} y={aY + 12} cols={4} rows={8} cw={26} ch={14} gapX={4.5} gapY={17} litPct={litPct} salt={9} />
      {/* tower B */}
      <rect x={X + 168} y={bY} width={82} height={bH - 44} fill="#181f33" />
      <rect x={X + 168} y={bY} width={82} height={4} fill="#28324f" />
      <Windows x={X + 175} y={bY + 10} cols={3} rows={4} cw={20} ch={13} gapX={4} gapY={18} litPct={litPct - 8} salt={17} />
      {/* skybridge */}
      <rect x={X + 140} y={bY + 26} width={28} height={12} fill="#20294a" />
      <rect x={X + 141} y={bY + 28} width={26} height={4} fill="#ffd98a" opacity={0.25} />
      <line x1={X + 70} y1={aY - 26} x2={X + 70} y2={aY} stroke="#2a3550" strokeWidth={3} />
      <circle cx={X + 70} cy={aY - 28} r={3} className="cmp-beacon" />
      <Sign cx={X + 70} y={aY - 40} name={name} color={color} size={14} />
      <Chip x={X + 110} y={aY - 76} label="HQ CAMPUS" value={`${headcount} aboard`} accent={color} />
    </g>
  );
}

/** The Titan age: a spire that owns the skyline — light seams, a crown beacon. */
function Spire({ name, color, headcount }: { name: string; color: string; headcount: number }) {
  const h = 400;
  const y = GROUND - h;
  const cx = X + 95;
  return (
    <g>
      <polygon points={`${cx - 78},${GROUND} ${cx - 30},${y + 30} ${cx},${y} ${cx + 30},${y + 30} ${cx + 78},${GROUND}`} fill="#1a2138" />
      <polygon points={`${cx - 50},${GROUND} ${cx - 18},${y + 46} ${cx},${y + 22} ${cx + 18},${y + 46} ${cx + 50},${GROUND}`} fill="url(#cmp-glass)" opacity={0.5} />
      {/* light seams */}
      <line x1={cx - 26} y1={GROUND} x2={cx - 6} y2={y + 34} stroke={color} strokeWidth={1.4} opacity={0.5} className="cmp-lab-glow" />
      <line x1={cx + 26} y1={GROUND} x2={cx + 6} y2={y + 34} stroke={color} strokeWidth={1.4} opacity={0.5} className="cmp-lab-glow" />
      {/* window bands */}
      {Array.from({ length: 10 }, (_, i) => {
        const t = i / 10;
        const half = 70 - t * 48;
        const yy = GROUND - 24 - i * ((h - 70) / 10);
        return <rect key={i} x={cx - half} y={yy} width={half * 2} height={4} fill="#ffd98a" opacity={0.1 + rndBand(i)} />;
      })}
      <line x1={cx} y1={y - 34} x2={cx} y2={y} stroke="#2a3550" strokeWidth={3} />
      <circle cx={cx} cy={y - 36} r={3.6} className="cmp-beacon cmp-beacon--gold" />
      <Sign cx={cx} y={y - 50} name={name} color={color} size={15} />
      <Chip x={cx} y={y - 88} label="THE SPIRE" value={`${headcount} aboard`} accent={color} />
    </g>
  );
}

function rndBand(i: number): number {
  return ((i * 2654435761) >>> 24) / 255 / 6;
}
