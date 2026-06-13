# Moonshot Inc — Design Decisions Log

*The "what we decided and why." The load-bearing decisions that shape the build, with reasoning, so settled questions don't get re-litigated. Organized by area.*

---

## A. Platform, Tech, Scope

- **Steam-first desktop.** The genre lives on desktop; mobile is a later companion product, not the launch target. *Why: the depth and screen real estate the game needs are desktop-native; WSR proves UI is the whole ballgame.*
- **Tech stack: Tauri + React + TypeScript.** *Why: chosen for Claude Code productivity — web UI skills, small binaries, native desktop wrapper.*
- **Turn-based pacing** (click to advance), not real-time. *Why: lets the player think; avoids the Game Dev Tycoon "time runs away from you" failure.*
- **Target: ~8–11 month solo build with Claude Code; ~9–12 months to Steam.**
- **All tunable constants in TOML config**, never hardcoded; engine functions are pure for save determinism. *Why: balance-tuning without recompiles; deterministic saves.*

## B. V1 Scope — What Ships

- **2 industries playable: AI and Space.** Biotech deferred to the Frontier DLC. The other 6 industries exist as investment targets only.
- **6 sub-industries (3 each):** AI = Frontier Model Lab, Vertical AI SaaS, AI Chips. Space = Launch Services, Satellite Constellations, Space Stations.
- **Each sub-industry has ONE signature mechanic** — a multi-phase commit→anticipate→resolve process. *Why: one deep distinct mechanic per sub-industry is more memorable and maintainable than many shallow ones; maximizes UI consistency while making each playthrough feel different.*
- **Single company at a time**, BUT V1 must support starting a new company after exiting (sequential play). The investor system must support a `'self'` type from day one even though self-investing isn't in V1. *Why: cheap to architect now, expensive to retrofit; the founder→magnate arc needs serial play.*
- **2 exit paths: IPO (3-act) + Acquisition.**
- **~70 procedural companies, ~18 VC firms (7 hand-authored + generated), 3–4 banks, ~50 events, ~30 achievements. English only.**

## C. V1 Scope — What's Deferred (and to where)

| Feature | Goes to |
|---|---|
| Multi-company simultaneous play | V1.5 |
| Deep executive layer (delegate whole companies, coups, succession) | Mogul DLC |
| Holding companies, player's own VC fund | Mogul DLC |
| Biotech + Energy playable | Frontier DLC |
| Stay-private endgame path | Dynasty DLC |
| Activists, hostile takeovers, antitrust | Power Plays DLC |
| NPC-to-NPC M&A, new NPC company foundings | AI Rivals free update |
| Angel investing, Direct Listing, full earnings calls | Free updates |
| Localizations (FR/DE/ES/RU) | Free updates |

**Key scope principle:** if the player can watch NPCs do something they can't do (e.g. buy companies), it reads as a missing feature, not a living world. So NPC-to-NPC M&A is cut from V1 — the player stays firmly in the found→raise→run→IPO loop, and dynamic M&A arrives only when the player can participate too.

## D. The Core Loop & Pacing

- **The heartbeat is "Advance"** — three flavors: Advance Week / Advance Month / Advance to Next Decision (the Crusader-Kings-style "continue" that skips empty weeks).
- **Cadence is player-defined, not stage-forced.** The player chooses how in-the-weeds to be. *Why: a player running one company may want to be hands-on OR hands-off; the game shouldn't force either.*
- **Delegation is the pressure valve that makes hands-off viable** — and is therefore V1-core, not DLC (see F).
- **Multi-phase signature processes** (commit→anticipate→resolve) give the player something to advance *toward*, so advancing time is anticipation, not waiting. *Why: solves the "is advancing time boring?" risk.*
- **Smart advance hints** — suggest "jump to next decision" on quiet stretches; warn before overshooting a pending resolution.

## E. Main Screen / Operating Home

- **Four persistent zones:** top bar (logo, time controls, 5 world gauges, net worth/news/market, ⌘K) + left nav rail (5 sections) + center workspace (the "main screen") + right context rail (the narrative layer).
- **Dashboard-as-home; the visual office layer is an optional layer on top** (stretch goal). *Why: the dashboard is the actual game in V1; designing it as primary forces it to be excellent standalone; office view toggles on if/when it ships.*
- **Hero element = the sub-industry signature widget + a financial band.** *Why: sells the genre fantasy while keeping operating reality always-visible.*
- **Decisions surface in-context** inside the relevant widget, not in a separate queue.
- **Center workspace is customizable** (draggable/resizable widgets); stage-adaptive (same skeleton, widgets evolve — post-IPO adds stock chart, analyst coverage, etc.).
- **Right rail is the narrative layer** (CEO log "This week" + team activity + relational news), text-only, all skippable, toggleable off entirely for pure-data players.
- **Charts are real and detailed** (revenue-vs-burn dual line, benchmark bar chart) — the workspace is big on desktop and should earn the space.

## F. Delegation & Executives (V1-core, light)

- **Light delegation ships in V1** because player-defined cadence doesn't work without it. *Why: a single-company player who wants to go hands-off needs executives to delegate to.*
- **V1 includes:** hire a handful of key execs (CFO, COO, Head of Revenue, + one sub-industry leader); per-area autonomy (*Handle it / Recommend / I'll decide*); escalation thresholds; reports instead of decisions for delegated areas; exec quality affecting autonomy and decision quality.
- **"Delegation IS the auto-decisions system"** — whatever's delegated resolves automatically on time-advance; whatever isn't surfaces as a pause. This is the mechanism behind player-defined cadence.
- **Architecturally the same system the Mogul DLC extends** — do not build a throwaway version.

## G. Fundraising & Investors

- **5 V1 negotiable terms:** valuation, round size, liquidation preference, board seats, option pool. 3-round negotiation flow.
- **Soft reaction signals, NOT probabilities.** *Why: pattern recognition over optimization — the core design principle, applied everywhere.*
- **3-layer eval help:** color-coded terms + a "Comparable Rounds" widget + a live cap-table preview. *Why: two-tier accessibility — newcomers read colors, experts read the comps.*
- **Investors have 5 hidden personality axes** (Aggression, Patience, Conviction, Founder-Friendliness, Network Strength) + visible trait tags. Two-tier memory (hand-crafted firms get full event history; procedural firms get light numeric memory).
- **Hot Deal (competing term sheets) is a rare earned moment** (~3%), not a default. *Why: the Plutocracy lesson — don't overuse the most engaging mechanic until it's routine.*
- **Profitability is a real alternative to raising** — you don't have to take the money.

## H. Cap Table

- **The hero feature. Must be perfect.** 5 tabs, all A/B-tested as mockups: Dashboard glance, Overview (stacked bar + top shareholders), Full Table (enriched, 10 cols), Round History (dilution-down/value-up dual chart), Vesting (event feed with flight-risk actions), Exit Scenarios (payout curve + breakdown).
- **Stacked bars only, never donut charts.** *Why: Tufte-aligned; donuts are hard to read and compare.*
- **Founder keeps 51%+ at founding even in capital-intensive sub-industries** — achieved via harsher investor preferred terms, not by giving away control early. *Why: preserves the ownership fantasy; capital intensity shows up as worse terms, not lost control.*

## I. The World Model (Master Variables)

- **6 master-variable engines:** Macro Cycle Phase (5 states), Interest Rate (Taylor-rule), VC Climate (0–100), IPO Window (Open/Cracking/Closed), Industry Hype (0–100 per industry, mean-reverting at industry-specific rates). All formulas in the design plan; all constants in TOML; pure functions for determinism.
- **Three-layer model:** universal macro → industry-level → sub-industry/company. *Why: contagion and texture flow top-down legibly.*
- **Difficulty is hierarchical:** 8 top-level sliders, each expanding to 2–4 sub-sliders (~25 total) behind "Advanced," with 3 presets (Forgiving/Realistic/Brutal). A separate News Cycle selector (Easy/Medium/Hard) controls information transparency. All lock at game start. *Why: presets serve newcomers, deep sliders serve veterans, world-preview panel makes customization legible.*
- **Realistic but not punishing** — five specific rules in the design plan; black swans must always be reconstructable in hindsight.

## J. Company Relationships (light, V1)

- **Four edge types:** competitors (same sub-industry), customer↔supplier (cross-sub-industry), sector peers (shared industry hype), investor overlap (shared cap tables). *Why: the WSR interconnected-economy lesson — companies with relationships make the world feel alive; the player is one competitor inside the web, not above it.*
- **Static per playthrough in V1** — relationships influence events/news/hype/fundraising but the graph doesn't mutate (no NPC mergers, no new foundings). *Why: see the scope principle in C.*
- **Edges are one-directional-declarable; the graph builder unions them.** A light company needn't mirror every edge a full company points at it.

## K. Procedural Generation (anchors-as-templates)

- **Two-tier: hand-crafted anchors + procedural fill** — and crucially, **the anchors ARE the generation templates.** *Why: procedural fill inherits the believability of hand-authored archetypes instead of being a separate, blander system.*
- **Anchors recur across playthroughs; procedural fill varies.** *Why: continuity (you learn that OpenMind dominates) + replayability.*
- **Vary quality widely (fundamentals ±25) but bias procedural slightly below the anchor base** — so the market has genuinely good and bad companies, but the hand-authored category leaders stay special.
- **Stock pricing = fundamentals + hype + macro + noise**, not a random walk. *Why: a skilled player who reads fundamentals-vs-hype can find mispriced companies — real skill expression.*
- **Fundamentals visibility is tiered by News Cycle setting** — public financials always visible; deep quality requires inference. *Why: rewards attentive players.*
- **Light lifecycle:** grow/shrink/IPO/decline/die — no NPC M&A or new foundings.

## L. Exits

- **IPO is a 3-act designed moment:** underwriter selection → roadshow → pricing → first-day reveal. 180-day lockup with an expiration moment. *Why: going public should feel like a transformation, not a button.*
- **Post-IPO (V1) includes the earnings-management trade-off:** quarterly guidance + engineer-short-term (pull revenue forward, cut R&D, defer hiring) vs. invest-long-term (eat the miss, build real value). Sustained engineering builds a hidden gap that risks an eventual miss/restatement, tied to the ethics score. *Why: it's the single most distinctive feature of public-company life, high value per unit of work, and a genuine no-right-answer strategic/values choice.*
- **Acquisition is the alternative exit** — procedural buyers, payout, run ends or you start anew.

## M. Events

- **~50 starter events: 15 macro / 15 AI / 15 Space / 5 personal.** Authored and validated.
- **Events are templates with variable slots** that resolve from real entities (rival/supplier/researcher) at fire time. *Why: replayability + specificity — "Cerebra is poaching Dr. Okafor" lands where a generic version doesn't.*
- **Events are the connective tissue** that ties separate systems together (safety → ethics, burnout → delegation, windows → master variables).
- **Soft outcomes** (no shown probabilities); **earned moments gated by cooldowns**; **text-only**; **productive-losing check** (a loss must be reconstructable).

## N. New-Game Flow

- **4-step spine: Industry → Sub-industry → Founder → Difficulty → Found company.** Quick Start and Custom share the spine; Custom deepens steps 3–4 with pre-filled sensible defaults. *Why: nobody starts blind, nobody's forced through 10 minutes of sliders.*
- **Stepped flow with rich visible options + free click-through** (not hard Next-gates).
- **Setup explains why the choices matter** (cycle speed, capital intensity, difficulty) via visual profile bars + comparison tables + words.
- **CK3-style contextual hints + an optional guided tutorial** — build the hooks now, the content later.

## O. Narrative & Tone

- **No voice acting, ever.** Permanent constraint. *Why: locks content from patching, costs far more than text, creates localization/variety problems; genre convention is text.*
- **Maximum narrative depth, all text, all skippable.** CEO log, team activity, relational news, character message threads.
- **Path B authoring** — build the full narrative + events *systems* at V1 but ship a smaller content library (~10 named characters, ~50 events) and grow it via free updates. *Why: narrative content benefits hugely from playtest feedback; authoring blind risks tonally-off content; don't gate the ship on content milestones.*
- **Newsroom-meets-Bloomberg tone; players treated as adults.**

## P. Wellbeing (cross-cutting)

- The personal events (burnout, family/life milestones) are wellbeing-aware: **choosing life is never punished.** Delegation is offered as the healthy response to burnout. *Why: the game models ambition without glorifying self-destruction.*

---

*Decisions captured here are settled. If revisiting one, note the reason — these were made deliberately with tradeoffs weighed. For full specs see `game_design_plan.md`; for build sequencing see `CLAUDE.md` and `03_ROADMAP.md`.*
