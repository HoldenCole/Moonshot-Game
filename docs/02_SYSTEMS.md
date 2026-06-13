# Moonshot Inc — Systems Reference

*The "how it works." A tour of every system and — more importantly — how they interconnect. This is the integration map, not the full spec. For depth, follow the pointers to `game_design_plan.md` and the entity docs.*

---

## The Integration Map (read this first)

The systems are not independent. The thing that makes Moonshot feel like a world rather than a pile of features is how they feed each other:

```
        MASTER VARIABLES (macro, rates, VC climate, IPO window, hype)
                 │  set the "weather" everything operates in
                 ▼
   ┌─────────────────────────────────────────────────────────┐
   │  YOUR COMPANY                                            │
   │   financials ◄── signature mechanic ◄── operating choices│
   │       │                                      ▲           │
   │       ▼                                      │           │
   │   fundraising ──► cap table ──► your net worth           │
   │       ▲                                      │           │
   │       │            delegation ──────────────►│ (cadence) │
   └───────┼──────────────────────────────────────┼──────────┘
           │                                      │
   INVESTORS (VC firms)                    EVENTS (the connective tissue)
   personality axes,                        reference rivals/suppliers,
   portfolios, memory                       touch ethics/delegation/macro
           │                                      │
           ▼                                      ▼
   COMPANY RELATIONSHIP GRAPH ◄──────────────────┘
   competitors, suppliers, customers, investor-overlap
           │
           ▼
   PROCEDURAL WORLD (companies, banks) — investment targets + texture
           │
           ▼
   EXITS (IPO / acquisition) ──► net worth ──► found again / invest (the arc)
```

Events are deliberately the layer that crosses everything — that's their job.

---

## 1. Master Variables — the weather

Six engines drive the world's state. All formulas live in `game_design_plan.md §"Master Variables: Full Formulas"`; all constants in TOML under `content/world/`; all pure functions for save determinism.

- **Macro Cycle Phase** — 5 states (expansion → peak → contraction → trough → recovery), monthly tick / quarterly settle.
- **Interest Rate** — Taylor-rule driven, quarterly, capped movement per quarter.
- **VC Climate** (0–100) — Frozen / Cool / Normal / Hot / Frothy; gates how easy fundraising is.
- **IPO Window** — Open / Cracking / Closed, with an 8-week minimum persistence; gates exit timing.
- **Industry Hype** (0–100 per industry) — mean-reverting at industry-specific rates (AI fastest, Quantum slowest); drives valuations and talent costs.

**Feeds:** fundraising (climate + rates), stock pricing (hype + macro), exits (IPO window), events (scheduled triggers), and the difficulty system (which modulates all of their volatility).

**Three-layer model:** universal macro → industry-level → sub-industry/company, so effects cascade top-down legibly.

## 2. Your Company — financials, operating, signature mechanic

- **Financials:** revenue, burn, runway, headcount, valuation, your stake — the always-visible financial band.
- **Operating choices:** hiring, budget, pricing, offices — the routine levers (delegatable).
- **Signature mechanic:** the one deep per-sub-industry process, a commit→anticipate→resolve loop:
  - Frontier Lab: compute + talent twin constraints; commit big training runs
  - Vertical SaaS: vertical-moat race before foundation models commoditize you
  - AI Chips: multi-year fab cycles (bet-the-company tape-outs)
  - Launch Services: launch cadence (binary success/failure moments)
  - Constellations: buildout curve (deploy batches, ramp revenue)
  - Space Stations: tenant mix
- *Full sub-industry specs: `game_design_plan.md §5` and the signature-mechanic sections.*

## 3. Fundraising & Investors — the second hero feature

- **5 negotiable terms** (valuation, round size, liq pref, board seats, option pool) over a 3-round flow.
- **Soft reaction signals**, never probabilities. Three eval-help layers: color-coded terms, Comparable Rounds widget, live cap-table preview.
- **Investors = VC firms** with 5 hidden personality axes + visible trait tags + two-tier memory. *Full system: `game_design_plan.md §"Investor Archetypes"`; authoring + generation: `entity_vcs.md`.*
- **Connects to:** master variables (climate/rates set the baseline), cap table (every round dilutes), the company graph (the same firms appear on NPC cap tables), and your relationship history (burning a firm colors future interactions).

## 4. Cap Table — the hero feature

5 tabs (Dashboard glance / Overview / Full Table / Round History / Vesting / Exit Scenarios), all A/B-tested. Stacked bars only. Founder holds 51%+ at founding. *This is the most-polished surface in the game.* It's downstream of fundraising and upstream of net worth and exit math.

## 5. Operating Loop — the week-to-week

- **Heartbeat:** Advance Week / Month / Next Decision.
- **Each tick resolves in order:** world advances → company advances → events evaluate → decisions surface → "This week" recap generates.
- **Cadence is player-defined**, made viable by delegation (below).
- **Main screen** = four persistent zones (top bar, nav rail, customizable center workspace, narrative right rail). Stage-adaptive. *Full UI: `game_design_plan.md §14` + this session's mockups.*

## 6. Delegation & Executives — the cadence valve (V1-core, light)

- Hire key execs; set per-area autonomy (*Handle it / Recommend / I'll decide*); escalation thresholds; receive reports.
- **"Delegation IS the auto-decisions system"** — delegated areas resolve automatically on advance; the rest pause for you. This is *how* the player sets their own cadence.
- Exec quality (a hiring/comp/retention concern) determines how much runs well without you.
- *Full spec: `game_design_plan.md §"Delegation & the Executive Layer"`. Mogul DLC extends this same system.*

## 7. Procedural World — companies, banks

- **~70 companies:** ~15 AI + ~15 Space (competitor-grade, full attributes) + ~40 across 6 other industries (investment-grade, light). Two-tier: hand-crafted anchors as templates → procedural fill.
- **Stock pricing** = fundamentals + hype + macro + noise (mispricings are the investment skill).
- **3–4 banks:** IPO underwriting + debt; also low-hype investment targets.
- *Authoring + generation: `entity_companies.md`, `entity_banks.md`. Content authored in `content/`.*

## 8. Company Relationship Graph — the living economy

- Four edge types (competitors / customer↔supplier / sector peers / investor overlap), static per playthrough in V1.
- **Feeds events** (a poach names a real rival; a supply disruption names a real supplier), **news** (relationally framed), **hype pressure** (a competitor's win pressures you), and **fundraising** (your investor also backs your competitor).
- Typed edge list `{from, to, type, strength}`, built to support deeper types later. *Full spec: `game_design_plan.md §"Light Company Relationship System"`.*

## 9. Events — the connective tissue

- ~50 templates (15 macro / 15 AI / 15 Space / 5 personal), slot-filled from real entities at fire time.
- Three trigger types (scheduled / threshold / random-weighted), cooldowns, events-per-tick cap.
- **Touches every system:** safety incidents → ethics score; burnout → delegation; capital window → master variables; poaching → relationship graph + signature talent mechanic.
- Soft outcomes, earned-moment gating, text-only. *Full spec + catalog: `entity_events.md`. Content in `content/events/`.*

## 10. Exits — closing the arc

- **IPO:** 3-act (underwriter → roadshow → pricing → first-day reveal), 180-day lockup, then the post-IPO earnings-management trade-off (engineer short-term vs. invest long-term; hidden gap → restatement risk; tied to ethics).
- **Acquisition:** procedural buyers, payout, run ends or you start again.
- **Feeds the arc:** exit → net worth → "between companies" reflection state → found again (with persistent founder reputation) or shift toward investing. *Full spec: `game_design_plan.md §"Exit Paths"`.*

## 11. Progression & Meta — the spine

- **Net-worth milestones** are the motivational spine (the "why" WSR lacked).
- **Founder reputation + investor network persist across companies** — a proven serial founder has structural advantages.
- **~30 Steam achievements; New Game Plus.** *Full: `game_design_plan.md §13`.*

## 12. Ethics / Integrity (cross-cutting, light in V1)

- A score nudged by choices: aggressive earnings management, safety incidents handled badly, data-licensing shortcuts.
- In V1 it's mostly a hidden gap + risk meter (e.g. engineered-vs-real earnings); DLCs deepen it (scandals, activist triggers). Events are its main surface.

## 13. The Visual World Layer (V1 stretch goal)

- 2D-isometric office/campus that grows with company stage; clickable spaces route to the existing dashboards (the dashboard is the substance, the office is the atmosphere).
- **If the asset pipeline doesn't reach the quality bar by ship, defer to V1.5** — but architect for it from day one (scene-render hooks, click→dashboard routing). *Decision rationale in `01_DECISIONS.md §E` and `00_VISION.md`.*

---

## How a Single Week Actually Flows (worked example)

1. Player clicks **Advance to Next Decision**.
2. Engine ticks the **master variables** (hype drifts up, VC climate warms).
3. **Company** accrues revenue, deducts burn; the **signature mechanic** advances (training run at week 8 of 11).
4. **Events** evaluate: a threshold trips (a rival just raised — from the **relationship graph**), firing a talent-poach event naming a real researcher.
5. The loop **stops** (it's a decision), surfacing the event in-context + the accumulated **"This week" recap** in the right rail.
6. Player chooses to counter the poach → **cash** drops, **retention** holds, a **comp precedent** is set (hidden), and it's logged to the **CEO log**.
7. Everything the player did is reflected across surfaces — the researcher's status dot, the team-activity feed, the relational news — *one story, many lenses.*

That loop, repeated, is the game.

---

*For full mechanical depth, `game_design_plan.md` is the bible. For build sequencing, `CLAUDE.md`. For content authoring, the four `entity_*.md` docs.*
