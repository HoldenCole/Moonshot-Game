# Moonshot Inc — Build Roadmap & Open Questions

*The "what's next." Build sequence, content status, known open questions and risks, and the post-V1 roadmap. The forward-looking doc.*

---

## Where We Are

**Design: complete for V1.** All 10 design items are spec'd (investor archetypes, fundraising, cap table, operating loop, master variables, sub-industry mechanics, procedural companies, events, IPO, new-game flow). UI mocked across the board.

**Content: foundation authored and validated.** Hand-authored TOML, all cross-references resolving:

| Entity | Authored | Target | Notes |
|---|---|---|---|
| Companies | 19 anchors | ~20–30 anchors + ~40-50 generated | Strong anchor set; generator fills rest |
| VC firms | 7 anchors | ~18 anchors + ~80-100 generated | Core 7 cover archetypes + resolve all company refs; generator fills rest |
| Banks | 4 | 3–4 | **Complete** |
| Events | 50 | ~50 | **Complete** (15 macro / 15 AI / 15 Space / 5 personal) |

**Next: the build.** Design and content are no longer the blockers — implementation is.

---

## The Build Sequence (11 Phases, ~17–20 weeks)

From `CLAUDE.md` — UI-first ordering, hero features early so they get the most polish time.

| Phase | Weeks | What |
|---|---|---|
| 1 — Foundation | 1–2 | Project skeleton, state, save system, the four-zone frame |
| 2 — Cap Table Hero | 3–4 | The hero feature — must be perfect before moving on |
| 3 — Time Advancement | 5 | The Advance heartbeat; tick resolution order |
| 4 — Fundraising Negotiation | 6–7 | Second hero feature; investor system w/ `'self'` type architected |
| 5 — World Simulation | 8–9 | The 6 master-variable engines, pure functions, TOML constants |
| 6 — Public Market | 10–11 | ~70 procedural companies + `companyGraph.ts` relationship edges + Relationships UI |
| 7 — Events Engine | 12 | Trigger system + the 50 templates + slot resolution |
| 8 — Personal Wealth | 13 | Net worth, assets, the wealth popover |
| 9 — Operating Loop + Light Delegation | 14–15 | Signature mechanics, multi-phase processes, the delegation/auto-decision system, recap generation |
| 10 — IPO + Exits + Achievements | 16 | 3-act IPO, earnings-management trade-off, acquisition, ~30 achievements |
| 11 — Steam Playtest Prep | 17–20 | Save/version migration, Steam Cloud, polish, closed playtest |

**Critical-path dependencies:** master variables (5) before public market (6) before events (7); cap table (2) and fundraising (4) are the hero features and gate quality perception; delegation (9) is load-bearing for the cadence philosophy.

---

## Things to Build On (the highest-leverage extension points)

These are designed-for-extension seams — building them right in V1 unlocks the roadmap cheaply:

1. **The investor `'self'` type** — architect it in Phase 4 even though self-investing isn't in V1. Unlocks angel investing (free update) and the player's VC fund (Mogul) without rework.
2. **The delegation/executive system** — V1's light version must be the same system Mogul extends, not a throwaway. The "delegation IS auto-decisions" framing is the seam.
3. **The company relationship graph** — typed edge list built to support deeper edge types (common ownership, supply tiers, contagion) later. Cheap now, expensive to retrofit.
4. **The anchors-as-templates generator** — the generation system reads hand-authored anchors as archetypes; adding new anchors automatically enriches procedural output. The same pattern serves companies and VCs.
5. **The events engine's slot resolver + trigger types** — built generic, the 50-event library can grow to hundreds via free updates with no engine changes.
6. **The visual-world render hooks** — even if the office layer ships in V1.5, Phase 1's frame should leave scene-render + click→dashboard routing seams so it layers in without a rewrite.
7. **The ethics/integrity score** — light in V1 (mostly the earnings gap), but wired as a real score so scandals/activists (DLC) plug into an existing value.

---

## Known Open Questions & Risks

**Open design questions (decide during build/playtest):**
- **Visual world layer go/no-go for V1** — depends on whether the AI-asset pipeline (Claude Code + external sprite services) hits the quality bar. Prototype early; defer to V1.5 if not. Realistic art budget $1,500–4,000.
- **Right-rail width and toggle behavior** — 240–300px; confirm in real use whether pure-data players want it off entirely by default.
- **Configurable 4th top-bar slot** — menu-of-options (simpler) vs. any-action (flexible). Leaning menu-of-options for V1.
- **Exact event weights/cooldowns** — authored as starting points; tune against playtest so earned moments stay rare and quiet weeks aren't *too* quiet.
- **Tutorial content** — hooks designed now (CK3-style hints + optional guided tutorial); the actual content is a later build, informed by where playtesters get stuck.
- **Remaining VC anchors** — generator fills toward ~18, but a few more hand-authored anchors (esp. more Space-primary, a pure pre-seed/angel firm) would enrich the named roster. Optional.

**Risks to watch:**
- **UI polish slipping under build pressure** — the single biggest risk (the WSR lesson). The hero features (cap table, fundraising) are sequenced early specifically to protect their polish.
- **Event spam** — the events-per-tick cap and cooldowns must be tuned so the world feels alive but not noisy.
- **Signature mechanics feeling samey** — each must have a genuinely different shape (twin-constraint vs. binary-launch vs. multi-year-fab); guard against them collapsing into "same loop, different art."
- **Difficulty legibility** — the hierarchical sliders + world preview must make customization understandable, or it becomes the WSR manual problem in miniature.
- **Scope creep from this very document** — the roadmap below is generous; V1 stays tight (found→raise→run→IPO, 2 industries). Resist pulling DLC features forward.

---

## Post-V1 Roadmap

**Free updates between paid DLCs** (retention + goodwill): angel investing, Direct Listing, full earnings calls (analyst Q&A), AI Rivals (NPC-to-NPC M&A + new foundings), deeper ethics/karma, more sub-industries/firms/events, localizations (FR/DE/ES/RU).

**Paid DLC sequence:**

| DLC | Theme | Headline additions |
|---|---|---|
| **Mogul** | Empire | Multi-company delegation, holding companies, player VC fund, Term Sheet expansion (3 advanced terms + Cap Table Pro) |
| **Frontier** | New industries | Biotech + Energy playable |
| **Dynasty** | Stay private | The stay-private endgame path |
| **Power Plays** | Conflict | Activists, hostile takeovers, antitrust |
| **Hard Tech** | — | (further industries / mechanics) |
| **Quantum Leap** | — | (late-game frontier) |

**Content-growth philosophy (Path B):** the V1 narrative + event + character *systems* are built to hold far more than V1 ships. Libraries grow via free updates, prioritized by playtest signal — what players engage with gets expanded, what falls flat gets cut. This avoids authoring hundreds of items blind.

**The mobile companion** — a separate post-launch product, not a port. Designed later against what the desktop game proves out.

---

## Document Map

**Consolidation docs (start here):**
- `00_VISION.md` — why we're building this
- `01_DECISIONS.md` — every load-bearing decision + reasoning
- `02_SYSTEMS.md` — how the systems interconnect
- `03_ROADMAP.md` — this doc

**Deep references:**
- `game_design_plan.md` — the full design bible (~2,600 lines)
- `CLAUDE.md` — the tactical build guide (11 phases, schemas, file structure)

**Content authoring references + the content itself:**
- `entity_companies.md`, `entity_vcs.md`, `entity_banks.md`, `entity_events.md`
- `content/companies/` (19), `content/vcs/` (7 + doc), `content/banks/` (4), `content/events/` (50 events in 4 files)
