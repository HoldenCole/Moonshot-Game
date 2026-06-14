# Moonshot Inc — UI Language

*The locked visual + motion standard for every screen. Borderless, flat, alive. This is what Claude Code builds to, everywhere.*

---

## 1. Visual Language — Borderless & Flat

**No enclosing boxes.** No panel gets a full border + background-fill "card" treatment. The screen is one continuous surface; structure comes from hairlines, whitespace, and alignment — the Bloomberg/FT instrument look, not the Bento-box web-dashboard look.

**Structure tools (in priority order):**
1. **Hairline dividers** — `0.5px solid var(--color-border-tertiary)`. Horizontal between stacked sections; vertical between columns (financial stats, split panes). Used to *separate*, never to *enclose*.
2. **Whitespace + alignment** — consistent padding and a shared spacing scale do most of the grouping. This is load-bearing: borderless only reads as premium if spacing is disciplined. Sloppy spacing reads as "unstyled."
3. **Subtle tint zones** — only where grouping genuinely needs more than a divider (e.g. an advance bar). Very light, never a bordered card.

**Accents are single-sided or text-only, never filled boxes:**
- Emphasis on a row → inset left edge bar: `box-shadow: inset 3px 0 0 var(--color-text-info)` (note: single-sided, so no border-radius on that element).
- "Hot"/selected/fresh state → a small colored marker, a text-color shift, or an inset edge — not a filled rounded rectangle.
- Featured/recommended item (e.g. a difficulty preset) → `2px solid var(--color-border-info)` is the *one* allowed exception to "no borders," same bg as siblings.

**Section headers** are small uppercase labels sitting directly on the surface (`10px, weight 500, letter-spacing 0.05em, --color-text-secondary`), not titles inside a card.

**Flat always:** no gradients, drop shadows, blur, or glow. Solid fills only. (Streaming-safe and on-brand.)

**Numbers:** tabular-nums everywhere they appear; always rounded for display.

---

## 2. Motion Language — Two Kinds, Used Deliberately

The aliveness comes from *selective* motion. If everything moves it reads as busy/cheap; motion reads as "alive" precisely because most things are still. Two distinct kinds:

### Continuous motion — only on surfaces that are conceptually "always running"
- **The news ticker** — scrolls continuously.
- **The market** — prices micro-tick every ~650–700ms (a random subset updates), flashing green/red for ~260ms on change. *These micro-ticks are cosmetic noise around the real fundamentals+hype+macro price — they convey life, they do NOT change outcomes. Be explicit in the build so nobody mistakes the cosmetic noise for real P&L.*
- **In-progress signature processes** — a training run / launch countdown / fab cycle creeps forward; its metric ticks; its curve draws live. A breathing "live" dot (`opacity 0.35↔1, 2s`) marks anything actively running.

Nothing else gets continuous motion. Narrative text, decisions, labels, benchmarks, static charts — still.

### On-change motion — only when something actually happens
- **Value transitions** — when a tracked number changes on advance, it counts up/down over ~450ms and briefly flashes its change-color (green up / red down), fading after ~250ms. This is what makes advancing time *feel* like consequences rippling out.
- **Fresh items** — a new feed/news item arrives with a subtle entrance + a "· new" marker (or brief tint), which decays after it's been seen so not everything is permanently "new."

### Performance + accessibility
- The market view with ~70 companies updates a *visible subset* on a timer, not all rows every frame.
- A **"reduce motion" toggle** freezes all continuous motion (ticks, creep, scroll, breathing dots) while keeping on-change flashes (which are informative). Respect the OS reduced-motion preference by default.

---

## 3. Narrative is Load-Bearing (not decoration)

Without a heavy visual-world layer, the **writing carries the "this is a world" feeling.** The aliveness of the narrative comes from two things, neither of which is motion:

- **Voice** — the CEO log is written second-person and situationally aware ("The thing on your mind: Dr. Okafor came back still undecided…"), not a flat event list. Character lines are short attributed quotes ("I'm not unhappy. I just want to know where this is going.").
- **Continuity** — one thread appears across multiple surfaces at once (a wavering researcher shows up in the CEO log, the team feed *with her quote*, the sector news, AND the decisions strip). Same story, many lenses. This cross-surface echo is the single biggest "world, not spreadsheet" technique.

This makes narrative content quality a real authoring dependency (Path B: systems + a starter library at V1, grown via updates). The CEO-log generator and character-quote pools must be written this well or the world falls flat.

---

## 3b. Desktop Sizing & Responsive Behavior (build to real screens)

This is a Steam desktop game. Build and judge every screen at real monitor sizes, NOT at a narrow preview width. Mockups rendered in a chat preview pane look small/compressed — that is a preview artifact, not the spec. The real target is the full window on a real monitor.

**Target resolutions:**
- **Baseline design target: 1920×1080** — design and tune here first.
- **Must work down to ~1366×768** (still-common laptops) — nothing critical clipped; denser, may collapse the narrative rail to a toggle.
- **Scales up gracefully to 2560×1440 and ultrawide** — no stranded content, no oceans of empty margin.

**Strategy: full-width frame, content reflows to show MORE (not stretched).** The four-zone frame (top bar / nav rail / workspace / narrative rail) spans the whole window. As width grows, the workspace uses the extra room by **adding columns, widening charts, and showing more rows** — never by stretching the same content thin. More monitor = more information visible, the way Bloomberg / IDEs / Linear behave. Concretely:
- Financial band: more stat columns appear as width allows (4 → 6).
- Analysis row: 2-up at medium width → 3-up at full width (chart + benchmark + metrics).
- Market table: more columns appear when there's room (add market-cap, etc.); more rows visible vertically.
- Narrative rail: comfortable fixed-ish width (~300–340px); it does NOT stretch — the workspace absorbs extra width.

**Bounds & reflow rules:**
- Narrative rail: ~300–340px, fixed-ish. Below ~1366px it may collapse to an icon toggle to protect workspace width.
- Workspace: takes all remaining width; its widgets reflow (add/drop columns) at breakpoints rather than stretching.
- Below the min width, sections stack/collapse gracefully rather than clipping.
- **Cap text line-length even in wide columns.** Narrative prose and any running text use a `max-width` in `ch` units (~52–62ch) so lines never run 150+ characters across on a big monitor. Data/tables may use full column width; prose may not.
- Use container queries / breakpoints on the workspace, not just viewport media queries, so the reflow responds to the *workspace's* available width (which changes when the rail toggles).

**How "uses the whole screen" should feel:** denser and more informative, not bigger-and-emptier. A larger monitor reveals more widgets, more market rows, wider charts — the player sees more of their world at once. That is the payoff of desktop, and it's the antidote to "the screen looks small."

### No dead space — a hard rule, enforced by construction

Every screen must fill its width and height with content or intentional, even rhythm at EVERY supported resolution (1366 → 1920 → 2560 → ultrawide). Blank/awkward gaps are a bug, not a cosmetic issue. The way to guarantee this is to make dead space *impossible by construction*, not to patch gaps after they appear:

- **Regions flex; they are not fixed-width tiles that happen to sum to the window.** The workspace is `flex: 1` and always consumes all width the rail doesn't take. Fixed widths are allowed ONLY for the nav rail (~50px) and the narrative rail (~300–340px); everything else flexes.
- **Grids use `fr` units and `auto-fit`/`auto-fill`, never fixed pixel columns.** A row of stat cards is `repeat(auto-fit, minmax(min, 1fr))` so the columns grow to fill and the count adapts — there is never leftover track. Same for the analysis row, the market table columns, the decisions grid.
- **Content count adapts to width via breakpoints**, so a wider workspace is filled by *more* items, not by stretching a fixed few: financial band 4→5→6 stats, analysis 2-up→3-up, market table adds columns + shows more rows. Define these breakpoints on the workspace (container query), not the viewport.
- **Vertical fill too.** The frame is `height: 100vh`; the workspace and rail fill it. If real content doesn't reach the bottom at a given height, the layout absorbs the slack deliberately (e.g. the market/feed list grows to show more rows, or a section flexes) — never a raw empty band at the bottom. No screen ends in a void.
- **The one acceptable "space" is consistent internal padding and hairline rhythm** — even, intentional breathing room between sections. That is not dead space; ragged leftover gaps at the edges or bottom are.
- **Test at all four target widths before calling a screen done.** A screen that looks right at 1920 but leaves a gap at 2560 or clips at 1366 is not done. The reflow rules above exist precisely so the same screen is full at every width.

Rule of thumb for the build: if you can resize the window and produce a blank rectangle that isn't doing layout work, the layout is wrong — make a region flex or a count adapt until no resize can produce a void.

## 4. The Standard Layout (every in-company screen)

- **Top bar** (~46px): logo · time/advance controls · world gauges · net worth/news/market · ⌘K. One surface, hairline-divided.
- **Live ticker** (~28px): continuous scroll.
- **Left nav rail** (~50px): the 5 sections, icon-only, hairline-separated.
- **Center workspace**: financial band (hairline-divided columns) → signature process → charts/benchmark (split panes) → live market → decisions strip. Borderless throughout; customizable, stage-adaptive.
- **Right narrative rail** (~318px): CEO log → team activity → sector news. Voiced, continuous, skippable, toggleable off.

---

## 5. Checklist (apply to every screen during the redo)

- [ ] No enclosing card boxes — structure is hairlines + whitespace + alignment
- [ ] Accents are single-sided/text-only (inset edge bar, marker, color shift), not filled boxes
- [ ] Section headers are small uppercase labels on the surface
- [ ] Consistent padding/spacing scale (borderless lives or dies on this)
- [ ] Continuous motion ONLY on always-running surfaces (ticker, market, active process)
- [ ] On-change flash/count for values that change on advance
- [ ] Fresh-item entrance + decaying "new" marker
- [ ] Narrative voiced + continuous; key threads echo across surfaces
- [ ] tabular-nums + rounded for all displayed numbers
- [ ] reduce-motion path freezes continuous motion, keeps informative flashes
- [ ] flat — no gradient/shadow/blur/glow
