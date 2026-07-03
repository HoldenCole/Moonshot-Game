// ============================================================================
// tokens.ts — The calibration design tokens (19 Part 1, locked on Contracts v2)
// ============================================================================
export const T = {
  bg: "#0a0d12", line: "#1e2632", line2: "#161d27",
  label: "#66717f", dim: "#8b95a4", txt: "#d4dbe6", white: "#f2f5fa",
  blue: "#5288ff",    // commercial / action / your-company
  green: "#42d089",   // money / revenue
  amber: "#e6b34a",   // entanglement / warning / bottleneck
  red: "#e0584b",
  purple: "#a678ff",  // power / megaprojects / government
  exec: "#b3bce8",
  mono: "'SF Mono', ui-monospace, Menlo, monospace",
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  // The calibration: base 14, bold values 18-20, generous padding.
  fontBase: 14, fontValue: 18, fontValueLg: 20, rowPadY: 16, rowPadX: 24,
} as const;

export type ValueColor = "money" | "power" | "entanglement" | "action" | "neutral" | "warning";
export const valueColor = (c: ValueColor): string =>
  ({ money: T.green, power: "#bd9dff", entanglement: T.amber, action: T.blue, neutral: T.white, warning: T.amber }[c]);
