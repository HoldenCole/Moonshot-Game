// The world's running record: the timeline entries the narrative rail shows,
// and the active alerts that surface as in-context decisions and stop the
// "Advance to Next Decision" heartbeat.

export type LogTone =
  | "neutral"
  | "up"
  | "down"
  | "warn"
  | "crisis"
  | "opportunity";

export type LogKind = "world" | "alert" | "milestone" | "company";

export interface LogEntry {
  id: string;
  week: number;
  kind: LogKind;
  tone: LogTone;
  headline: string;
  detail?: string;
  /** Big beats (round closed, IPO) get the full-screen celebration. */
  celebrate?: boolean;
}

/** Runway pressure bands. Alerts fire when the band *worsens*, never every
 *  week, so the player isn't nagged. */
export type RunwayBand = "ok" | "low" | "critical" | "empty";

export type AlertKind = "raise_ready" | "runway_critical" | "out_of_cash";

export interface Alert {
  id: string;
  kind: AlertKind;
  week: number;
  tone: LogTone;
  headline: string;
  body: string;
  /** Optional in-context action; "fundraising" routes to the raise view. */
  action?: { label: string; target: "fundraising" };
}

/** Why an `advance` call stopped — drives the smart-advance messaging. */
export type StopReason =
  | "weeks_elapsed"
  | "decision"
  | "out_of_cash"
  | "cap_reached";
