# Moonshot Inc — Content Authoring Guide

*The practical reference for hand-authoring game content: what lives in `content/`, the exact schema for each type, the two little DSLs you'll write inside events, and the gotchas that have actually bitten us. Doubles as a "where we are" snapshot.*

> Companion docs: `00_VISION.md`, `01_DECISIONS.md`, `02_SYSTEMS.md` (how systems interconnect), `03_ROADMAP.md`, `04_BACKLOG.md`.

---

## Part 0 — Where we are (snapshot)

**Stack:** Tauri v2 shell + React 18 + TypeScript + Zustand v5. Content is hand-authored TOML under `content/`, parsed with `smol-toml`, bundled eagerly at build time via Vite's glob import (deterministic + offline). The engine is pure and deterministic (seeded RNG, no `Math.random`).

**Playable today:** Two industries — **AI** and **Space** — across six sub-industries, each with its own signature mechanic. A full run loop: found → operate (signature bets + right-sizing) → fundraise (negotiate term sheets) → react to events → exit (IPO / acquisition / step-back) → reinvest. Plus debt financing, a customizable dashboard, earnings reports once public, and **investing in other companies from two pockets (personal + company treasury)**.

**Recently shipped (most recent first):**
- **Company-treasury investing** — the operating company can take strategic stakes in other public companies, alongside the founder's personal portfolio. A *Personal / Company* toggle in the market drawer and the Portfolio panel. Company holdings sit on the balance sheet (out of net worth, like company cash); selling realizes gains back to company cash.
- **Operations reworked from a clicker into right-sizing** — headcount has a target driven by stage + revenue (Understaffed / Right-sized / Overstaffed gauge); compute is a finite build-out ladder (pod → cluster → data center). *(Code, not content.)*
- **Guided-tour fundraising beats fixed** — they now match the real founder-initiated flow (you compose & send a term sheet, then accept their counter).
- **Financials panel + earnings** — stock price, revenue growth, EPS, P/E, quarterly earnings reports + market reactions; an "Investments" balance-sheet line once the treasury holds stock.
- Earlier: debt financing, customizable dashboard, procedural investor generation (7 anchors → 18), per-sub-industry signature mechanics, stock-swap "step back" exit, 15 cross-cutting events, animated new-game wizard, GitHub Pages deploy.

**Health gate (run before every commit):** `npm run typecheck` · `npm run test` (**188 passing**) · `npm run build`. Dev server on port 1420.

---

## Part 1 — How the content pipeline works

```
content/**/*.toml  ──glob+smol-toml──►  src/content/load.ts  ──►  ContentDB (typed, id-indexed, memoized)
```

- **Drop-in.** To add content you just create a `.toml` file in the right folder. The glob (`import.meta.glob("/content/<dir>/*.toml")`) picks it up — **no registration anywhere**. (A dev-server restart is needed because the glob is resolved at build time.)
- **Typed views.** Schemas live in `src/domain/content.ts` and mirror the TOML 1:1. The loader exposes `Company`, `Investor`, `Bank`, `GameEvent`, `Founder`, plus `…ById` maps and a `tuning` object.
- **Money is in $millions** everywhere unless a field says otherwise. `shares_out` for market companies is in **millions of shares**.
- **IDs are global and snake_case.** A file's `id` is how everything else references it (relationships, event slots). Keep them stable — renaming an id orphans every reference to it.
- **Cross-reference validation.** At load, `validate()` walks every relationship/portfolio/rival id and pushes a line into `ContentDB.warnings` for anything unresolved. Warnings don't crash the game — **check them** (they surface a typo'd id immediately).
- **A parse error throws** with the offending file path. Malformed TOML fails the build, not silently.

### Folders at a glance

| Folder | Type | Count today | Consumed by |
|---|---|---|---|
| `content/companies/` | Market companies | ~19 | worldgen, market, relationship graph, event slots |
| `content/investors/` | VC firms (anchors) | 7 → 18 procedural | fundraising / negotiation |
| `content/banks/` | Banks (IPO underwriting + debt) | 4 | IPO pricing, debt offers |
| `content/events/` | Event tables | 6 files | the event engine |
| `content/founders/` | Founder archetypes | 1 file, N tables | new-game `createNewGame` |
| `content/tutorial/` | Guided first-run script | 1 file | `GuidedTutorial` driver |
| `content/world/` | `tuning.toml` | 1 | world model, runway, milestones |

---

## Part 2 — Content types

### 2.1 Companies — `content/companies/<id>.toml`

The market roster: investment targets, competitors, suppliers, customers — and the bar your own company is measured against. Each file is a single `[company]` table.

```toml
[company]
id = "openmind"
name = "OpenMind"
tier = "anchor"                # "anchor" (hand-authored) | "procedural" (generated)
industry = "ai"                # see enums (Part 4)
sub_industry = "frontier_model_lab"
founded_year = -7              # years relative to game start; negative = in the past
hq = "San Francisco, CA"
color = "#5B6CFF"
logo_glyph = "brain"

[company.identity]
tagline = "The lab that productized reasoning."
reputation = 88                # 0–100
narrative_hooks = ["frontier safety leader", "aggressive on compute"]

[company.stage]
status = "public"              # "private" | "public"
private_round = ""             # e.g. "series_c" when private; "" when public
ipo_year = -1                  # year relative to start; -1 if N/A

[company.financials]           # all $M
revenue = 1800
revenue_growth = 0.55          # fraction/yr
gross_margin = 0.62            # fraction
profitable = false
burn_monthly = 90              # OPTIONAL — omit for light/investment-grade names (derived in worldgen)
valuation = 42000
shares_out = 240               # MILLIONS of shares

[company.quality]              # all 0–100 (hype_exposure is 0–1)
fundamentals = 82
hype_exposure = 0.7            # 0–1; how much sector hype moves the price
moat = 75
execution = 80

[company.signature]            # OPTIONAL — omit for "light" investment-only names
benchmark_score = 80
signature_notes = "Helio-class models, 2 gens ahead"

[company.relationships]
competitors = ["cerebra", "novamind"]   # optional for light names
suppliers   = ["nova_silicon"]          # optional
customers   = ["lexiq", "synthseq"]     # optional
investors   = ["frontier_partners", "helio_capital"]   # required (can be [])
```

**Two grades:**
- **Full / competitor-grade** — carries `signature` + all four relationship edge lists. Use for names that should show up in the graph and in event slots ({rival}, {supplier}, {customer}).
- **Light / investment-only** — omit `burn_monthly`, `signature`, and the competitor/supplier/customer lists; carry only `investors`. Cheaper to author; still a valid investment target.

**Gotchas:**
- Relationship ids must resolve to other companies (or, for `investors`, to investor ids) — unresolved ids appear in `warnings`.
- `sub_industry` may be a **playable** id (gets a signature mechanic if the *player* picks it) or a **free-form** tag for light industries (biotech, energy, …).
- Prices are computed live (`marketPrice = valuation × hype × macro × noise`); `valuation` is the fundamental anchor, not the displayed price.

### 2.2 Investors — `content/investors/<id>.toml`

VC firms you negotiate with. **7 hand-authored anchors** seed a **procedural roster of 18** (generated deterministically from the anchors as archetypes, so every stage has eligible leads). Single `[firm]` table.

```toml
[firm]
id = "frontier_partners"
name = "Frontier Partners"
tier = "anchor"
partner_name = "Dana Wexler"
partner_title = "General Partner"   # optional
hq = "Menlo Park, CA"
color = "#3AA0FF"                   # optional
logo_glyph = "compass"              # optional

[firm.identity]
thesis = "Back the team chasing the hardest technical problem in the room."
reputation = 90                     # 0–100
trait_tags = ["technical", "high-conviction"]
narrative_hooks = ["led three frontier rounds"]   # optional

[firm.personality]                  # five hidden axes 1–100; drive negotiation counter-logic
aggression = 60
patience = 45
conviction = 85
founder_friendliness = 70
network_strength = 88

[firm.focus]
primary_sector = "ai"               # Industry
secondary_sector = "space"          # optional Industry
primary_stage = "series_a"          # Stage
stage_range = ["seed", "series_c"]  # [min, max] Stage
stretch_tolerance = 0.3             # 0–1; willingness to go outside focus

[firm.fund]                         # $M
fund_name = "Frontier IV"
fund_size = 1200
vintage_year = -2
deployment_years = 4
check_min = 2
check_max = 60

[firm.relationships]                # optional
signature_portfolio = ["openmind"] # company ids they're known for
rival_firms = ["helio_capital"]    # investor ids
```

**Gotchas:** the five `personality` axes are the whole point — they shape how the firm counters in negotiation. `signature_portfolio` / `rival_firms` ids are validated. To add an anchor that changes the procedural roster shape, remember the roster is regenerated from anchors with a fixed seed (`INVESTOR_SEED`), so adding/removing an anchor shifts the generated firms.

### 2.3 Banks — `content/banks/<id>.toml`

Underwrite IPOs and extend debt. Single `[bank]` table.

```toml
[bank]
id = "granite_stearns"
name = "Granite Stearns"
tier = "anchor"
founded_year = -60
hq = "New York, NY"
color = "#C8A45C"

[bank.identity]
tagline = "The bulge-bracket name on the biggest books."
trait_tags = ["prestige", "aggressive-pricing"]
narrative_hooks = ["took the last three megacap techs public"]

[bank.underwriting]
available = true
prestige = 95            # 0–100
pricing_quality = 80     # how well they price the book
fee_pct = 0.07           # underwriting fee (fraction of raise)
min_raise = 100          # $M floor they'll take public
selectivity = 85         # 0–100; how choosy
sectors = ["ai", "space", "biotech"]

[bank.debt]
offers_debt = true
max_loan_multiple = 1.5  # × of (revenue or cash basis)
base_rate_spread = 2.0   # points over the global base rate
covenant_strictness = 60 # 0–100
prefers_profitable = true

[bank.financials]
status = "public"        # "private" | "public"
revenue = 9000
valuation = 120000
fundamentals = 80
hype_exposure = 0.2
```

Debt rates scale with the **global** macro rate (`base_rate + base_rate_spread`); IPO pricing blends `prestige`/`pricing_quality` against the open IPO window.

### 2.4 Events — `content/events/<file>.toml`  ★ the big one

Events are the connective tissue. Each event file is a set of **keyed tables** (one table per event); the loader flattens them. Files group by theme: `ai.toml`, `space.toml`, `personal.toml`, `macro.toml`, `public.toml`, `general.toml`.

```toml
[a1_talent_poach]                 # table key (cosmetic; `id` is what matters)
id = "a1_talent_poach"
category = "ai"
weight = 10                       # base selection weight
cooldown_weeks = 26               # min weeks before it can recur
one_shot = false                  # true = fires at most once per run

[a1_talent_poach.trigger]
type = "random"                   # "random" | "threshold" | "scheduled"
conditions = [                    # ALL must pass (see Condition DSL, Part 3)
  "company.industry == ai",
  "company.stage >= series_a",
  "company.has_key_researcher == true",
  "company.has_competitor == true",
]
weight_mods = [                   # optional situational reweighting
  { when = "sector.hype > 70", factor = 1.5 },
]

[a1_talent_poach.framing]
headline = "{rival} is trying to poach {researcher}"     # {slots} resolve from the graph
body = """{rival} has made {researcher} an offer..."""
tone = "threat"                   # "opportunity" | "threat" | "crisis" | "neutral"

[[a1_talent_poach.choices]]       # array-of-tables; 2–4 choices is typical
label = "Counter aggressively"
detail = "Match the offer plus 20% and a retention grant"
effects = "Expensive. Likely keeps them. Sets a comp precedent."   # ← drives the outcome (Part 3)
outcome_ref = "poach_counter"     # stable key for logs/telemetry
# condition = "company.stage >= series_b"   # OPTIONAL — hides the choice when false

[[a1_talent_poach.choices]]
label = "Make a personal appeal"
detail = "No money — sell them on the mission"
effects = "Free. Works better if culture and your relationship are strong."
outcome_ref = "poach_appeal"
```

**Slots** (`{rival}`, `{researcher}`, `{customer}`, `{supplier}`, `{offer_amount}`, …) are filled from the company relationship graph by `src/engine/eventSlots.ts`. **An event is skipped entirely if a required slot can't resolve** — so a `{customer}` event won't fire for a company with no customer edges. Check `eventSlots.ts` for the authoritative slot list before inventing a new one.

**How outcomes work — read this twice.** There is no per-choice outcome table. The engine reads the **authored prose** of the chosen option (`label` + `detail` + `effects`, lowercased and concatenated) and keyword-matches it to proportionate effects (cash/ethics/reputation/hype/headcount/revenue). This is the **Effects DSL** in Part 3. The single most common authoring bug is a choice whose text matches *no* keyword — it silently resolves to *"You held the line — no immediate cost."* If a choice is supposed to cost something or carry a consequence, **the prose must contain the trigger words.**

### 2.5 Founders — `content/founders/founders.toml`

Starting backgrounds for the new-game "Founder" step. One keyed table per archetype; deltas/multipliers applied in `createNewGame` over the difficulty baselines. Deliberately **modest** — flavor + a tilt, never a power pick.

```toml
[engineer]
id = "engineer"
name = "The Engineer"
blurb = """You built the thing before you built the company..."""
playstyle_hint = "Product-led. Strong on the signature mechanic, weaker on fundraising warmth."

[engineer.modifiers]
starting_reputation = 5      # delta on the ~50 baseline
starting_cash_mult = 1.0     # multiplies the Starting Capital slider (1.0 = exactly the slider)
investor_warmth = -8         # delta to investor rapport
integrity_baseline = 5       # delta on the ~50 baseline
signature_lean = 8           # tilt toward the technical/product signature
exec_quality_floor = 0       # raises the floor on rolled exec quality
sub_system_lean = "signature_mechanic"   # names the one system this founder is nudged toward
```

### 2.6 Guided tutorial — `content/tutorial/first_run.toml`

One `[tutorial]` table wrapping an ordered list of `[[tutorial.steps]]` beats, plus a `[tutorial.handoff]`. The driver (`src/ui/tutorial/GuidedTutorial.tsx`) shows the current beat anchored to a DOM element and advances on the player's real action.

```toml
[[tutorial.steps]]
id = "raise_send"
order = 8
anchor = "term-sheet-panel"     # must equal a data-guide="…" attribute in the UI
placement = "left"              # top | bottom | left | right | center
title = "Compose your offer"
body = """Pick a lead investor, set how much to raise..."""
advance_on = "action:term_sheet_sent"   # "ack" | "action:<evt>"
allow_skip = true
gate = "screen == fundraising"  # single condition vs. the guided context
hint_fallback = "Pick an investor, set terms, then send the term sheet."
```

**Authoring rules that actually matter (hard-won):**
- `anchor` must match a real, **visible** `data-guide` attribute. If it can't resolve, the coachmark renders nothing and the tour looks broken. Known anchors live in the components (`founder-step-archetype`, `new-game-confirm`, `center-workspace`, `top-bar-gauges`, `advance-week-button`, `advance-event-button`, `action-raise-round`, `term-sheet-panel`, `term-sheet-accept`, `signature-action-button`).
- `advance_on` is either `"ack"` (player taps *Got it*) or `"action:<evt>"`. The driver emits these actions: `founder_archetype_selected`, `advanced_week`, `round_closed`, `signature_committed`, `fundraise_opened`, `term_sheet_sent`. **Prefer action-advance** ("learn by doing").
- `gate` is a **single** condition against the guided context (`screen`, `company.can_raise`, `company.signature_available`) — no `&&`. Beats are sequential, so you rarely need more.
- `{signature_label}` in a beat's title/body is interpolated to the sub-industry's noun (e.g. "training run", "launch").
- The script-contract test (`guided.test.ts`) asserts 11 steps with valid fields — update it if you add/remove beats.

### 2.7 Tuning — `content/world/tuning.toml`

Global knobs for the world model, runway thresholds, the advance cap, and the net-worth milestone ladder. Authored in `snake_case`; `load.ts → loadTuning()` maps it to the camelCase `Tuning` shape (`src/domain/tuning.ts`). Sections: `runway`, `advance`, `milestones.net_worth`, and `world.{macro,rates,sentiment,climate,ipo,hype,difficulty}`. If you add a field here you must also add it to the `Tuning` type and the mapper.

---

## Part 3 — The two DSLs you write inside events

### 3.1 Condition DSL (triggers, `weight_mods.when`, choice `condition`)

One comparison per string: `path op value`.

- **Operators:** `==`, `!=`, `>=`, `<=`, `>`, `<`. **No `&&` / `||`** — list multiple conditions as separate array entries; **all must pass** (logical AND).
- **Unknown path → the condition FAILS** (event won't fire). A typo'd path therefore silently disables an event — double-check spelling.
- **Unparseable string → passes** (treated as a no-op).
- **Enums compare by rank:** stages (`idea < pre_seed < … < public`), plus `small<medium<large`, `low<elevated<high`, `nascent<growing<mature`. The literal `milestone` maps to per-path thresholds.

**Available context paths** (from `src/engine/eventConditions.ts → buildEventContext`; this is the authority — peek there for the full current set):

| Group | Paths (selected) |
|---|---|
| Company | `company.industry`, `company.sub_industry`, `company.stage`, `company.status` (private/public), `company.has_competitor`, `company.has_supplier`, `company.has_customer`, `company.has_key_researcher`, `company.has_cofounder`, `company.compute_dependent`, `company.trains_models`, `company.has_public_model`, `company.deployment_scale`, `company.training_run_committed`, `company.profitable`, `company.cash_surplus`, `company.weeks_public`, `company.beat_guidance`, `company.guidance_window_open`, `company.quarter_close_tick`, `company.lockup_cleared` |
| Founder | `founder.reputation`, `founder.personal_wealth`, `founder.archetype`, `founder.voting_control`, `founder.sustained_intensity`, `founder.recent_crisis_density` |
| Sector | `sector.hype`, `sector.hype_moved_band`, `sector.maturity`, `sector.recent_failure_density` |
| Macro | `macro.cycle_phase`, `macro.entered_phase_this_tick`, `macro.prev_phase`, `macro.rate_move_qtr_abs`, `macro.ipo_window_changed`, `macro.correction_triggered`, `macro.tax_review_due` |
| World / game | `game.year`, `world.star_talent_available` |
| Space-specific | `company.has_anchor_customer`, `company.fleet_on_orbit`, `company.reusability_program`, `company.has_tenant`, `company.demand_exceeds_capacity`, `company.launch_committed`, `company.launch_outcome`, `company.deployment_batch_ready` |

> DLC gates (`company.analyst_coverage`, `company.activism_enabled`, `company.ma_market_enabled`, …) are present but hardwired off in V1, so events keyed to them stay dormant.

### 3.2 Effects DSL (choice outcomes, via `label` + `detail` + `effects`)

The engine lowercases and concatenates the chosen option's `label + detail + effects`, then applies effects per matched bucket (`src/engine/eventOutcomes.ts`). Magnitudes are proportional (cost ≈ 14% of cash, clamped; revenue swings ≈ ±8–12% of current revenue) and are then **amplified on the downside by difficulty** and **reshaped by exec quality** when the area is delegated.

| Bucket | Effect | Trigger phrases (write these into your prose) |
|---|---|---|
| **COST** | −cash (~14% of cash) | cash, spend, costs, expensive, premium, fee, dilute, buy out, fund it, foot the bill, pour in, license it, rebuild, discount, outspend, matching, war chest |
| **FREE** | suppresses COST | free, no money, no cost, costs nothing |
| **HEAVY** | ×1.6 cost | brutal, heavy, bet-the-company, doubles, burns cash fast, large cash |
| **ETHICS_UP** | +4 integrity | trust, integrity, transparent, responsible, cooperate, clean, honest, standards, own it, properly |
| **ETHICS_DOWN** | −5 integrity | erodes, cheapest now, liability, cover, stonewall, deflect, downplay, hope it fades, shortcut, skirt, risk it |
| **HYPE_UP** | +3 sector hype | maximizes hype, buzz, press, halo, spotlight, ship loud, visibility, announce, riding the hype, talent pull |
| **HYPE_DOWN** | −2 sector hype | less hype, quieter, low profile, niche, retreat, cedes the press/narrative, forgoes the visibility |
| **REP_UP** | +3 reputation | credibility, profile climbs, brand, standing rose, builds trust, halo of credibility |
| **REP_DOWN** | −3 reputation | scrutiny, backlash, reputation took/risk/hit, takes a knock, liability, stonewall |
| **HEADCOUNT_UP** | +1 headcount | grow your team, staff up, expand the team, hire a/more, talent influx |
| **HEADCOUNT_DOWN** | −1 headcount | X walks/leaves/departs, poached, attrition, let them go, loses a key/senior/star |
| **REVENUE_UP** | +max(0.2, rev×8%) | win the logo/account/deal, marquee account, recurring revenue, lock in a lease/tenant, raise prices, land the deal, occupancy up, anchor customer/tenant, fills the manifest |
| **REVENUE_DOWN** | −rev×12% | lose the customer/account/tenant, churn, cancels, pulls out, discount aggressively, bleeds margin, cedes share, occupancy slips |

**Two traps that have bitten us:**
1. **The no-op trap.** A choice whose prose matches nothing resolves to *"held the line — no immediate cost."* Crisis/consequence choices **must** include the relevant trigger words, or they're free.
2. **Keyword collisions.** Opposite buckets cancel: *"erodes trust"* hits ETHICS_DOWN (`erodes`) **and** ETHICS_UP (`trust`) → nets to zero. Write *"erodes goodwill"* instead. Watch incidental matches too: *clean*, *visibility*, *war chest*, *liability* all trigger buckets. After writing an event, sanity-check that each choice's net effect is what you intended (a 30-second mental pass, or throwaway script against `resolveOutcome`).

---

## Part 4 — Enums & vocabularies

- **Industry:** `ai`, `space`, `biotech`, `energy`, `defense`, `advanced_mfg`, `mobility`, `quantum`. *(Playable: `ai`, `space`. The rest are investment targets / texture.)*
- **Playable sub-industries** (each has a code-defined signature mechanic): `frontier_model_lab`, `vertical_ai_saas`, `ai_chips`, `launch_services`, `satellite_constellations`, `space_stations`. *(Light industries use free-form `sub_industry` tags.)*
- **Stage** (ordered): `idea`, `pre_seed`, `seed`, `series_a`, `series_b`, `series_c`, `growth`, `late_stage`, `public`.
- **Event tone:** `opportunity`, `threat`, `crisis`, `neutral`. **Trigger type:** `random`, `threshold`, `scheduled`. **Tier:** `anchor`, `procedural`.
- **Signature nouns** (fill `{signature_label}`, and what the player commits): frontier_model_lab → *training run*; vertical_ai_saas → *vertical-moat push*; ai_chips → *fab tape-out*; launch_services → *launch*; satellite_constellations → *deployment batch*; space_stations → *tenant build-out*.

---

## Part 5 — Workflow: author → verify

1. Add/edit the `.toml` (drop-in; no registration). Restart the dev server (glob resolves at build).
2. **`npm run typecheck`** — catches schema drift only if you also touched a type; TOML itself is validated at load.
3. **`npm run test`** — the suite includes content-contract tests (e.g. the tutorial script shape, investor generation, event-condition evaluation). Add a test when you add a new content *shape*.
4. **`npm run build`** — a parse error in any TOML fails here with the file path.
5. **Check `ContentDB.warnings`** for unresolved id references (logged at load).
6. For events specifically: do the Effects-DSL sanity pass (Part 3.2) so no choice is an accidental no-op.

---

## Part 6 — What is *code*, not content (the boundary)

So you don't go looking for a TOML that doesn't exist:

- **Signature mechanics** — per sub-industry definitions (noun, accumulators, approaches, odds) live in `src/engine/signature.ts`.
- **Pricing / valuation / net worth** — `src/engine/pricing.ts`, `finance.ts`. `valuation` in content is the fundamental anchor; the displayed price is derived.
- **Operations (headcount targets, compute ladder)** — `src/engine/operations.ts`.
- **Negotiation logic** — `src/engine/negotiation.ts` (reads the investor `personality` axes).
- **The tick / world model** — `src/engine/tick.ts`, `world.ts` (driven by `tuning.toml`).
- **Event slot resolution** — `src/engine/eventSlots.ts`. **Outcome keyword matching** — `src/engine/eventOutcomes.ts`. **Condition context** — `src/engine/eventConditions.ts`.

When in doubt: content is *what exists in the world and what the player is offered*; code is *how the world reacts*.
