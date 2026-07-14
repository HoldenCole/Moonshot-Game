import type { ButtonHTMLAttributes, ReactNode } from "react";

// ── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "subtle";
  size?: "sm" | "md";
  /** Pass-through for data-* anchors (e.g. data-guide for the guided tour). */
  [dataAttr: `data-${string}`]: string | undefined;
}

export function Button({ variant = "subtle", size = "md", className, ...rest }: ButtonProps) {
  return (
    <button
      className={`btn btn--${variant} btn--${size}${className ? " " + className : ""}`}
      {...rest}
    />
  );
}

// ── Segmented control (tabs / mode switch) ───────────────────────────────────

interface SegmentedProps<T extends string> {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
}

export function Segmented<T extends string>({ options, value, onChange, size = "md" }: SegmentedProps<T>) {
  return (
    <div className={`segmented segmented--${size}`} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          className={`segmented__opt${o.value === value ? " is-active" : ""}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Tag / pill ───────────────────────────────────────────────────────────────

export function Tag({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "up" | "down" | "warn";
}) {
  return <span className={`tag tag--${tone}`}>{children}</span>;
}

// ── Stat (label + value, optional delta) ─────────────────────────────────────

export function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "up" | "down" | "warn" | "neutral";
}) {
  return (
    <div className="stat">
      <div className="stat__label">{label}</div>
      <div className={`stat__value num${tone ? " stat__value--" + tone : ""}`}>{value}</div>
      {sub != null && <div className="stat__sub">{sub}</div>}
    </div>
  );
}

// ── Slider with a numeric readout ────────────────────────────────────────────

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
  hint,
}: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  hint?: ReactNode;
}) {
  return (
    <label className="slider">
      <div className="slider__top">
        <span className="slider__label">{label}</span>
        <span className="slider__value num">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ["--pct" as string]: `${max > min ? ((value - min) / (max - min)) * 100 : 0}%` }}
      />
      {hint != null && <div className="slider__hint">{hint}</div>}
    </label>
  );
}
