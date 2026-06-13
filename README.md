# Moonshot Inc

A Steam-first business simulation where you found a frontier-tech company, raise
venture capital, build it from a garage to an IPO, and grow into a magnate who
shapes whole industries. Coffee Inc 2's depth meets Crusader Kings' living world —
with a Bloomberg-terminal UI that's a pleasure to use.

> **Founder → Executive → Owner → Capital Allocator.** You start small; the
> *building* is the point.

This repository is the V1 build. See [`docs/`](docs/) for the full design:
[Vision](docs/00_VISION.md) · [Decisions](docs/01_DECISIONS.md) ·
[Systems](docs/02_SYSTEMS.md) · [Roadmap](docs/03_ROADMAP.md).

## Status

The **Foundation** and the **Cap Table** hero feature are in place (Roadmap
Phases 1–2), wired to the real authored content.

| Area | State |
|---|---|
| Four-zone operating frame (top bar · nav rail · workspace · narrative rail) | ✅ |
| New-game founding flow (Industry → Focus → Identity) | ✅ |
| Cap table: Overview · Holders · Round History · Exit Scenarios | ✅ |
| Priced-round engine — pre-money option pool, dilution, exit waterfall | ✅ (pure + unit-tested) |
| Live fundraising negotiation preview vs. real VC firms | ✅ |
| Content loader for all authored TOML, cross-references validated | ✅ |
| Time advancement & tick resolution | ▫ next (Phase 3) |
| Master variables · relationship graph · events · IPO | ▫ later phases |

## Running it

```bash
npm install
npm run dev        # Vite dev server (the Tauri frontend), open the printed URL
```

Other scripts:

```bash
npm run build      # typecheck + production build
npm run typecheck  # tsc --noEmit
npm test           # engine unit tests (node:test)
```

The frontend is plain Vite + React + TypeScript — i.e. the Tauri webview app.
The native desktop shell (`src-tauri/`) is wrapped at packaging time; nothing in
the UI assumes it, so everything runs in a browser during development.

## Architecture

All tunable values live in TOML under `content/`; the engine is pure functions
so saves are deterministic given a seed (per the design decisions).

```
content/            Authored game content (TOML)
  companies/        19 company anchors (AI, Space + investment-only sectors)
  investors/        7 VC firm anchors + the generation authoring doc
  banks/            4 underwriters
  events/           50 events (15 macro / 15 AI / 15 space / 5 personal)
docs/               The consolidated design (vision, decisions, systems, roadmap)
src/
  domain/           Types: ids, content schema, cap table, game state
  engine/           Pure functions — cap table math, formatting (unit-tested)
  content/          TOML loader + cross-reference validation
  state/            New-game construction + the Zustand store
  ui/
    frame/          The four persistent zones + view router
    captable/       The cap-table hero feature (tabs, fundraising panel)
    charts/         Hand-rolled SVG charts (stacked bar, dual line, payout curve)
    views/          Dashboard, Market, Fundraising, About
    newgame/        Founding flow
    components/     Shared primitives (Panel, controls, Icon)
  styles/           Design tokens + app styles (the newsroom/Bloomberg system)
```

### The cap-table engine

`src/engine/captable.ts` is the heart of the hero feature and is pure +
deterministic:

- **`foundCompany`** — genesis cap table (founder keeps 100%).
- **`computeRound` / `applyRound`** — a priced round with the standard
  *pre-money* option-pool top-up, so existing holders (not the new investor)
  absorb the pool dilution.
- **`exitWaterfall`** — non-participating preferred with a liquidation-preference
  multiple, resolved by best-response iteration (each holder takes the greater of
  its preference or its as-converted value), conserving total proceeds.

Covered by `src/engine/captable.test.ts`.
