import type { ReactNode } from "react";

interface PanelProps {
  children: ReactNode;
  className?: string;
  /** Removes inner padding (for tables / charts that manage their own). */
  flush?: boolean;
  /** Optional ambient-hint anchor id (rendered as data-coach). */
  coach?: string;
  /** Optional guided-tour anchor id (rendered as data-guide). */
  guide?: string;
}

/** A workspace card — the unit the dashboard is composed of. */
export function Panel({ children, className, flush, coach, guide }: PanelProps) {
  return (
    <section
      className={`panel${flush ? " panel--flush" : ""}${className ? " " + className : ""}`}
      data-coach={coach}
      data-guide={guide}
    >
      {children}
    </section>
  );
}

interface PanelHeaderProps {
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
}

export function PanelHeader({ title, sub, right }: PanelHeaderProps) {
  return (
    <header className="panel__head">
      <div className="panel__titles">
        <h3 className="panel__title">{title}</h3>
        {sub != null && <div className="panel__sub">{sub}</div>}
      </div>
      {right != null && <div className="panel__head-right">{right}</div>}
    </header>
  );
}
