# Moonshot Inc

A Steam-first business simulation game where you start a tech company in a future-forward industry, raise venture capital, grow to IPO, and eventually become a magnate running a holding company empire across multiple businesses.

**Core fantasy:** Founder → Executive → Owner → Capital Allocator. Bloomberg-grade financial depth, turn-based pacing, every save dynamic.

**Reference titles:** Coffee Inc 2, Plutocracy, Wall Street Raider, Capitalism Lab, Game Dev Tycoon.

**Full design vision:** see [`docs/game_design_plan.md`](./docs/game_design_plan.md). This document is the tactical implementation guide; the design plan is the long-term bible.

---

## Project Status

- **Current phase:** Pre-production / vertical slice
- **V1 scope:** Single industry (AI), founder mode, founding → seed → Series A → B → IPO arc
- **Target platform:** Steam (Windows / Mac / Linux) via Tauri
- **Target launch:** ~12–18 months from project start
- **Mobile port:** Follows Steam launch as V2.0+, focused subset using shared TypeScript core

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Desktop shell | **Tauri 2.x** | Rust-based, ~10 MB binaries, Steam-friendly |
| UI framework | **React 18+** | |
| Language | **TypeScript 5+ strict mode** | All financial logic must be typed |
| Build tool | **Vite** | |
| Styling | **Tailwind CSS** | + `shadcn/ui` components |
| Charts | **Recharts** | Use `visx` only if Recharts hits a wall |
| Tables | **TanStack Table** | Sortable, filterable, virtualized |
| State | **Zustand** | Sliced stores, not one monolith |
| Persistence | **SQLite** | Via `@tauri-apps/plugin-sql` |
| Content | **TOML** | Via `@iarna/toml` |
| Testing | **Vitest** | Sim engine has unit tests; UI has component tests |
| Steam | **Steamworks SDK** via Tauri plugin | Achievements, leaderboards, cloud saves |

**Why this stack:** Claude Code is meaningfully more productive in TypeScript/React than in any game engine language. The game is UI/data heavy, not graphics heavy — React + Tailwind + shadcn is exactly the right toolset. Tauri ships small, fast native binaries that Steam users won't sneer at the way they do at Electron.

---

## Quick Start

```bash
# First-time setup
npm create tauri-app@latest moonshot-inc -- --template react-ts
cd moonshot-inc
npm install
npm install zustand @tanstack/react-table recharts tailwindcss postcss autoprefixer
npm install @tauri-apps/plugin-sql @iarna/toml
npm install -D vitest @testing-library/react

# Initialize Tailwind
npx tailwindcss init -p

# Add shadcn/ui
npx shadcn@latest init

# Run dev
npm run tauri dev

# Build for distribution
npm run tauri build

# Run tests
npm test
```

---

## V1 Scope — What Ships First

### IN V1

- **AI industry only** as the playable founding industry (all 7 sub-industries: frontier model labs, vertical SaaS, AI chips, infrastructure, robotics, autonomy, creative tools)
- **Founder mode** — one company at a time
- **Full company lifecycle:** founding → pre-seed → seed → Series A → Series B → IPO
- **Cap table** as a hero feature — beautifully rendered, live-updating, central to the experience
- **Fundraising negotiation** as the second hero feature — varies based on dynamic world state
- **Public market** with ~150 procedural public companies across all 8 industries (so the world feels alive even though you can only operate in AI)
- **Personal wealth basics:** 10 properties, 20 vehicles, simple philanthropy with 5 cause categories
- **Procedural events engine:** 50–80 event templates (macro, industry, company, personal)
- **Dynamic world simulation:** all 8 industry hype scores tracked, macro cycle, VC climate, IPO window — these affect the AI industry even though only AI is playable
- **Core UI:** Dashboard, Companies, Investments, Life, World — all five sidebar sections
- **Steam achievements:** ~30 covering progression, signature plays, and easter eggs
- **Difficulty system:** 8 world variance sliders + news cycle mode (Easy/Medium/Hard)

### NOT IN V1 (defer to V1.5+)

- Other industries as **playable** (they exist as backdrop only)
- Multi-company simultaneous play
- Delegation / executive layer
- Holding companies
- Player's own VC fund
- Named AI rivals (procedural companies only for now)
- Options, futures, bonds (stocks + ETFs only)
- Antitrust mechanics
- Player ethics / karma system (defer to V1.5)
- Mobile port

When in doubt about scope, **err on the side of cutting**. The fundraising negotiation and cap table need to be excellent. Everything else supports those.

---

## Architecture — The Load-Bearing Decisions

These decisions are committed and shape everything else. Don't relitigate them in code without explicit discussion.

### 1. Turn-Based, Click-to-Advance

The game advances **only when the player clicks**. No real-time ticking, ever. Three advance buttons:

- **Advance Week** (default, 1 week): primary button + Spacebar
- **Advance Month** (4 weeks): Shift+Space
- **Advance to Next Event** (until something requires attention): Ctrl+Space

The simulation's tick unit is **1 game-week**. All durations and rates use weeks as the base.

Auto-pause triggers on any decision-required event regardless of speed: term sheets, board votes, FDA decisions, market shocks, employee crises, news that requires reaction.

### 2. Deterministic Simulation

Given a seed, the simulation produces **identical results**. This is critical for save/reload integrity, debugging, and testing.

- All randomness flows through a single seeded PRNG (use `seedrandom` or implement Mulberry32)
- The PRNG state is part of the save file
- No `Math.random()` anywhere in simulation code — that's a build-failing lint rule

### 3. Pure Simulation Engine, Reactive UI

The simulation engine (in `src/engine/`) is a **pure function**: `(WorldState, PlayerAction) => WorldState`. It has no UI dependencies, no React imports, no DOM access.

The UI subscribes to state via Zustand and dispatches actions. This separation is non-negotiable — it lets us:

- Unit test the simulation without rendering
- Run headless simulations for balance testing
- Port to mobile by swapping the UI layer
- Run rapid playtests via scripts

**Rule:** if you find yourself importing React in a file under `src/engine/`, stop. The logic belongs elsewhere.

### 4. Data-Driven Content

Industries, sub-industries, events, archetypes, properties, comparable rounds, exec roles — all defined in **TOML config files** under `content/`, not hardcoded.

Why this matters:

- Tuning iteration is 10x faster (edit TOML, reload — no recompile)
- Content DLC ships trivially
- Steam Workshop modding becomes possible
- A content designer can contribute without touching code

**Rule:** if a number or string represents game content, it lives in TOML. The TypeScript code reads and applies it.

### 5. Save Format Versioning

Every save file has a schema version. The save loader has migration functions for every version transition. Players whose 30-game-year empires become unloadable will leave Steam reviews; we will not let this happen.

### 6. Hidden vs. Visible State

Some state is shown to the player; some is intentionally hidden. The architecture should make this distinction explicit via the `WorldState` shape.

**Hidden:** industry hype scores (raw numbers), event schedules, exec integrity scores, ethics tracking, exact PRNG state.

**Visible:** macro cycle phase, VC climate gauge (0–100 categorical), IPO window state (Open/Cracking/Closed), industry hype gauges (categorical: Cold/Cool/Warm/Hot/Peak), interest rate.

The visible representations are **derived from hidden state at render time**, not stored separately.

---

## Project Structure

```
moonshot-inc/
├── src/                      # React frontend + game logic
│   ├── components/           # Reusable UI components
│   │   ├── ui/               # shadcn/ui primitives
│   │   ├── charts/           # Chart wrappers
│   │   ├── tables/           # Data table components
│   │   └── layout/           # Sidebar, top bar, panels
│   ├── routes/               # Top-level views (one per sidebar tab)
│   │   ├── Dashboard/
│   │   ├── Companies/
│   │   ├── Investments/
│   │   ├── Life/
│   │   └── World/
│   ├── stores/               # Zustand stores (sliced)
│   │   ├── worldStore.ts
│   │   ├── playerStore.ts
│   │   ├── uiStore.ts
│   │   └── settingsStore.ts
│   ├── engine/               # Pure simulation logic — NO React, NO DOM
│   │   ├── tick.ts           # Master tick function
│   │   ├── macro.ts          # Macro cycle simulation
│   │   ├── industries.ts     # Industry hype dynamics
│   │   ├── company.ts        # Company state evolution
│   │   ├── capTable.ts       # Cap table math, dilution, vesting
│   │   ├── fundraising.ts    # Round mechanics, negotiation outcomes
│   │   ├── events.ts         # Event scheduling and firing
│   │   ├── publicMarket.ts   # Stock price evolution
│   │   ├── prng.ts           # Seeded random
│   │   └── index.ts          # Public engine API
│   ├── types/                # Shared TypeScript types
│   │   ├── world.ts
│   │   ├── company.ts
│   │   ├── player.ts
│   │   ├── events.ts
│   │   └── index.ts
│   ├── lib/                  # Utilities
│   │   ├── format.ts         # Number/currency formatting
│   │   ├── content.ts        # TOML content loader
│   │   └── save.ts           # Save/load logic
│   ├── content/              # Loaded TOML content (TS-importable)
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/                # Tauri/Rust shell — minimal custom code
│   ├── src/
│   │   ├── main.rs
│   │   └── steam.rs          # Steamworks integration
│   ├── tauri.conf.json
│   └── Cargo.toml
├── content/                  # Source-of-truth TOML files
│   ├── industries/
│   │   └── ai.toml
│   ├── sub_industries/
│   │   └── ai_*.toml
│   ├── events/
│   │   ├── macro.toml
│   │   ├── ai.toml
│   │   ├── company.toml
│   │   └── personal.toml
│   ├── archetypes/
│   │   ├── investors.toml
│   │   ├── executives.toml
│   │   └── public_companies.toml
│   ├── properties.toml
│   ├── vehicles.toml
│   └── strings/              # User-facing strings (i18n later)
│       └── en.toml
├── tests/
│   ├── engine/               # Sim engine unit tests
│   └── integration/          # End-to-end scenarios
├── docs/
│   ├── game_design_plan.md   # The full design vision
│   ├── architecture.md       # Deeper architecture notes
│   └── content_authoring.md  # How to write events, archetypes, etc.
├── CLAUDE.md                 # This file
├── README.md
└── package.json
```

---

## Core Data Models

These are the key TypeScript types. Define them in `src/types/` early — they shape everything.

```typescript
// types/world.ts

export type IndustryId =
  | 'space' | 'ai' | 'biotech' | 'energy'
  | 'defense' | 'manufacturing' | 'mobility' | 'quantum';

export interface GameDate {
  year: number;       // game year, 1-indexed
  week: number;       // 1–52
}

export type CyclePhase = 'boom' | 'mid' | 'late' | 'recession' | 'recovery';
export type IPOWindow = 'open' | 'cracking' | 'closed';

export interface MacroState {
  phase: CyclePhase;
  gdpGrowth: number;        // -0.05 to 0.06 typical
  inflation: number;        // 0.00 to 0.10 typical
  fedFundsRate: number;     // 0.00 to 0.08 typical
  unemployment: number;     // 0.03 to 0.12 typical
  consumerConfidence: number; // 30 to 130
}

export interface IndustryState {
  id: IndustryId;
  hype: number;             // 0–100, hidden from player
  cyclePhase: 'cold' | 'heating' | 'peak' | 'cooling';
  capitalAvailable: number; // multiplier vs baseline
  talentCostMultiplier: number;
}

export interface WorldState {
  date: GameDate;
  prngState: number;        // serializable PRNG state
  saveSchemaVersion: number;
  macro: MacroState;
  industries: Record<IndustryId, IndustryState>;
  vcClimate: number;        // 0–100
  ipoWindow: IPOWindow;
  publicMarket: PublicMarketState;
  scheduledEvents: ScheduledEvent[];
  newsLog: NewsItem[];      // scrolling ticker, last 200 items
}
```

```typescript
// types/company.ts

export type CompanyStage =
  | 'idea' | 'pre-seed' | 'seed'
  | 'series-a' | 'series-b' | 'series-c' | 'series-d'
  | 'pre-ipo' | 'public';

export interface Company {
  id: string;
  name: string;
  industry: IndustryId;
  subIndustry: string;      // e.g. 'ai-frontier-lab'
  stage: CompanyStage;
  founded: GameDate;
  capTable: CapTable;
  financials: Financials;
  team: TeamMember[];
  metrics: Metrics;
  customers: number;
  productMaturity: number;  // 0–100
  brand: number;            // 0–100
  isPublic: boolean;
  ticker?: string;          // if public
}

export interface CapTable {
  authorizedShares: number;
  shareholders: Shareholder[];
  optionPool: { authorized: number; granted: number; available: number };
  rounds: FundingRound[];
}

export interface Shareholder {
  id: string;
  name: string;
  type: 'founder' | 'employee' | 'investor' | 'esop' | 'public';
  shares: number;
  shareClass: ShareClass;
  vesting?: VestingSchedule;
}

export type ShareClass = 'common' | 'preferred-a' | 'preferred-b' | 'preferred-c' | string;

export interface VestingSchedule {
  startDate: GameDate;
  totalWeeks: number;       // typically 208 (4 years)
  cliffWeeks: number;       // typically 52 (1 year)
  vestedSoFar: number;      // cached for display
}

export interface FundingRound {
  series: 'pre-seed' | 'seed' | 'a' | 'b' | 'c' | 'd' | 'pre-ipo';
  date: GameDate;
  preMoney: number;
  raised: number;
  postMoney: number;
  pricePerShare: number;
  newSharesIssued: number;
  leadInvestorId: string;
  participants: { investorId: string; amount: number }[];
  terms: RoundTerms;
}

export interface RoundTerms {
  liquidationPref: number;  // 1.0 = 1x, 2.0 = 2x
  participating: boolean;
  antidilution: 'broad-based-weighted' | 'narrow-based-weighted' | 'full-ratchet';
  proRataRights: boolean;
  boardSeatsForLead: number;
  optionPoolTopUp: number;  // % of post-money
}

export interface Financials {
  cash: number;
  monthlyBurn: number;
  monthlyRevenue: number;
  runwayWeeks: number;       // derived: cash / weeklyBurn
  arr: number;               // annualized run rate
  // ... extend as needed
}
```

```typescript
// types/player.ts

export interface Player {
  name: string;
  cash: number;
  netWorth: number;
  reputation: number;        // 0–100, visible
  ethics: number;            // 0–100, hidden (V1.5+)
  ownedCompanyIds: string[];
  publicHoldings: PublicHolding[];
  privateHoldings: PrivateHolding[];
  properties: PropertyOwned[];
  vehicles: VehicleOwned[];
  donations: Donation[];
  achievements: string[];    // achievement IDs unlocked
}

export interface PublicHolding {
  ticker: string;
  shares: number;
  avgCost: number;
  currentValue: number;      // derived
}
```

---

## V1 Build Priorities (Ordered)

Build these in order. Each phase produces something runnable; later phases build on earlier ones.

### Phase 1 — Foundation (Week 1–2)
1. Project scaffolding (Tauri + React + TS + Tailwind + shadcn)
2. Core data types in `src/types/`
3. Seeded PRNG (`src/engine/prng.ts`) + tests
4. TOML content loader (`src/lib/content.ts`)
5. Initial layout shell (top bar, sidebar, center, right panel) with placeholder content
6. Routing between five main sections
7. Zustand stores skeleton

### Phase 2 — Cap Table Hero (Week 3–4)
1. `src/engine/capTable.ts` — share math, dilution calculations, vesting
2. Cap table view component (the hero screen) — beautifully formatted table showing founder %, investor stakes, ESOP, fully-diluted math
3. Visual polish — this is the screen that sells the game
4. Unit tests for cap table math

### Phase 3 — Time Advancement (Week 5)
1. `src/engine/tick.ts` — master tick function
2. Advance Week / Month / Event buttons functional
3. Date display, time controls in top bar
4. World state updates on tick (macro variables drift, news items append)

### Phase 4 — Fundraising Negotiation (Week 6–7)
The second hero feature, and the most replayable mini-game.

1. `src/engine/fundraising.ts` — round triggering, negotiation logic
2. Investor archetype generation (procedural, from TOML pool)
3. Term sheet UI — players see proposed terms, can push back, accept, walk
4. Outcome resolution affects cap table
5. Round difficulty modulated by VC climate × industry hype × company metrics

### Phase 5 — World Simulation (Week 8–9)
1. `src/engine/macro.ts` — macro cycle simulation
2. `src/engine/industries.ts` — hype dynamics, mean reversion
3. World tab: sector heat map, macro dashboard
4. Five master variables visible; underlying scores hidden
5. News feed (procedural generation from world state changes)

### Phase 6 — Public Market (Week 10–11)
1. ~150 procedural public companies across 8 industries
2. `src/engine/publicMarket.ts` — stock price evolution
3. Investments tab: stock list, individual stock view, charts
4. Buy/sell flow
5. Watchlist

### Phase 7 — Events Engine (Week 12)
1. `src/engine/events.ts` — scheduling and firing
2. 50–80 event templates in TOML
3. Auto-pause integration on critical events

### Phase 8 — Personal Wealth (Week 13)
1. Properties (purchase, value tracking)
2. Vehicles (collector value)
3. Philanthropy (donations, reputation effects)
4. Life tab UI

### Phase 9 — Operating Loop Polish (Week 14–15)
1. Hiring decisions (engineers, executives)
2. Strategic decisions surfaced periodically
3. Quarterly company review
4. Operating choices affecting metrics

### Phase 10 — IPO + Steam Achievements (Week 16)
1. IPO process flow (roadshow, pricing, lockup)
2. Post-IPO mechanics (quarterly earnings, public scrutiny)
3. ~30 achievements wired up
4. Cosmetic polish, sound design pass

### Phase 11 — Closed Steam Playtest Prep (Week 17–20)
1. Save/load with version migration
2. Steam Cloud integration
3. Performance optimization
4. Balance pass on numbers
5. Bug fixes, UX polish

This is roughly 5 months of focused work. Reality: budget 6–9 months for a solo dev with Claude Code. Steam page goes up around Week 8 (Phase 5 complete) so wishlist farming starts as soon as the game has presentable screenshots.

---

## Coding Conventions

### TypeScript

- **Strict mode always.** `tsconfig.json` has `"strict": true`. No `any` without an inline justification comment.
- **Numeric IDs are bad.** Use string IDs (`'company_001'`) not numbers — easier debugging, no collision risk.
- **Currency as cents.** Store all money as integer cents (`number`) to avoid float errors. Format for display only.
- **Dates as `GameDate` objects.** Never use `Date` objects for in-game time.
- **Discriminated unions for state.** When something has multiple shapes (e.g., `Company` while private vs public), use discriminated unions, not optional fields.

### React

- **Function components only.** No classes.
- **Hooks at the top.** Custom hooks in `src/hooks/`.
- **No game logic in components.** Components dispatch actions to Zustand stores; stores call into `src/engine/`.
- **Props are typed explicitly.** No prop spreading without type checks.
- **Avoid prop drilling** beyond two levels — use a store or context.

### Zustand Stores

- **Sliced.** Multiple small stores, not one giant store.
- **Selectors.** Components subscribe to slices via selectors to minimize re-renders.
- **Actions are explicit.** No mutating state outside the store's actions.

### Engine Code (`src/engine/`)

- **Pure functions only.** No side effects, no React, no DOM, no I/O.
- **Input → output.** Take state and inputs, return new state. Never mutate.
- **All randomness via PRNG.** Importing `Math.random` in this directory should fail the build.
- **Test everything.** Engine functions get unit tests in `tests/engine/`.

### File Naming

- Components: `PascalCase.tsx`
- Hooks: `useThing.ts`
- Utilities: `camelCase.ts`
- Engine modules: `camelCase.ts`
- Types: `camelCase.ts`
- TOML content: `snake_case.toml`

---

## Data-Driven Content

### Format

All content in TOML. Loaded at startup, validated against schemas, made available via typed accessors.

### Example: Industry Definition

```toml
# content/industries/ai.toml

id = "ai"
display_name = "Artificial Intelligence"
icon = "brain"
description = "..."

# Cycle parameters
[cycle]
phase_duration_weeks_min = 100
phase_duration_weeks_max = 150
hype_baseline = 55
hype_volatility = 1.2

# Sub-industries are in separate files under content/sub_industries/
sub_industries = [
  "ai_frontier_lab",
  "ai_vertical_saas",
  "ai_chips",
  "ai_infrastructure",
  "ai_robotics",
  "ai_autonomy",
  "ai_creative_tools",
]
```

### Example: Event Template

```toml
# content/events/ai.toml

[[event]]
id = "ai_breakthrough_scaling"
category = "industry"
industry = "ai"
weight = 5
cooldown_weeks = 200

# Conditions for firing
[event.conditions]
min_hype = 40
max_hype = 80
phase = ["heating", "peak"]

# Effects
[event.effects]
hype_delta = 12
news_template = "Breakthrough in [model_class] training shows [percent]% efficiency gains, sending [sector_name] valuations soaring."

[event.player_decision]
required = false
```

### Schema Validation

Use Zod or io-ts to validate TOML at load time. Bad content should fail loudly during development, not at runtime in front of a player.

---

## Save System

### Schema Version Migration

```typescript
const CURRENT_SAVE_VERSION = 3;

const migrations: Record<number, (save: any) => any> = {
  1: (save) => ({ ...save, vcClimate: 50, schemaVersion: 2 }),
  2: (save) => ({ ...save, prngState: hashSeed(save.seed), schemaVersion: 3 }),
  // Add migration on every schema change
};

function loadSave(raw: any): WorldState {
  let save = raw;
  while (save.schemaVersion < CURRENT_SAVE_VERSION) {
    save = migrations[save.schemaVersion](save);
  }
  return save as WorldState;
}
```

**Rule:** every schema change ships with a migration. No exceptions.

### Save Storage

- SQLite database in user data directory (Tauri provides path)
- Multiple named saves
- Steam Cloud sync for cross-machine play
- Manual export/import to JSON for backup

---

## Working with Claude Code

Tips that make Claude Code dramatically more productive on this codebase:

### Reference the Right Doc

- For **what to build** → this file (`CLAUDE.md`) and `docs/game_design_plan.md`
- For **why we made a decision** → `docs/architecture.md` (write this as decisions accumulate)
- For **how a mechanic should work** → `docs/game_design_plan.md` sections by topic

### Constrain the Surface Area

When asking Claude Code to implement something, point it at:

- The relevant types in `src/types/`
- Any existing similar engine module
- The relevant content TOML schema

This dramatically improves output quality vs. a vague request.

### Engine vs. UI Work

Engine work is the higher-leverage place to use Claude Code — it's pure logic, easy to test, and a wrong implementation is caught fast by tests. UI work is also a good fit but iterate visually.

### Tests First for Financial Math

Cap table math, dilution calculations, fundraising outcomes — write the tests first. These are the places where bugs cause player-facing wrongness that destroys trust. Claude Code is good at writing both the test and the implementation; do the test first, validate the test logic, then have it generate the implementation.

### Don't Let It Skip Migrations

When changing a save-relevant type, Claude Code may or may not remember the migration rule. Check every schema change has a corresponding migration in `src/lib/save.ts`.

### Don't Let It Use `Math.random()`

There should be a lint rule banning `Math.random()` in `src/engine/`. If Claude Code reaches for it, redirect to the seeded PRNG.

---

## Steam Launch Context

### What Needs to Exist Before Launch

- Game itself (V1 scope above)
- Steamworks account ($100 fee, paid)
- Steam page live with screenshots, description, tags
- Trailer (60–90 seconds)
- Press kit (downloadable from store page)
- Achievements implemented
- Steam Cloud working
- At least one localization (English)
- Tested on Steam Deck (the audience overlaps heavily)
- Wishlists built up over months — aim for 20K+ before launch

### Pre-Launch Marketing (Build in Parallel with Game)

- Devlog (Twitter/X, Bluesky, or YouTube) — start early, post consistently
- Discord server — opens with the Steam page
- Reddit presence in r/incremental_games, r/gamedev, r/games, r/SimulationGames
- Submit to Steam Next Fest (a free festival, do at least one before launch)
- TikTok / YouTube Shorts of cap table dilution math (the audience exists)

### Launch Day Logistics

- Launch discount: 15% off launch week (Steam algorithm rewards this)
- Be available on Discord for first 48 hours — community management matters
- Respond to every review in the first week
- Day-one patch ready for any obvious issues

---

## Where to Find More

| Topic | Document |
|---|---|
| Full design vision | `docs/game_design_plan.md` |
| Industry mechanics in depth | `docs/game_design_plan.md` § 5 |
| Cap table and fundraising | `docs/game_design_plan.md` § 6 |
| Dynamic world simulation | `docs/game_design_plan.md` § 12 |
| Lessons from reference games | `docs/game_design_plan.md` § 20 |
| UI principles | `docs/game_design_plan.md` § 14 |

---

## Open TODOs (Living List)

- [ ] Decide final game name (current: Moonshot Inc — verify trademark)
- [ ] Reserve Steamworks app ID
- [ ] Buy domain
- [ ] Set up devlog (Twitter/X account, blog, or both)
- [ ] Decide art direction — commission illustrator for capsule art OR develop in-house
- [ ] Decide save file location and Steam Cloud paths
- [ ] Decide localization roadmap
- [ ] Set up CI (GitHub Actions for builds + tests)

---

## License

TBD — likely proprietary commercial. Decide before any code is public.
