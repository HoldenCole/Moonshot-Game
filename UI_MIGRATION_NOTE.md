# UI Migration Note — Old Build → New Visual Language

*For the dev who has been building against the earlier UI mockups. The visual direction changed. This is the bridge: what changed, what to stop, what to do instead, and what to redo. The full spec is `UI_LANGUAGE.md` — this note is the diff and the action list.*

---

## TL;DR

The earlier screens used **bordered cards** (rounded boxes with fills, floating on a background). We've moved to a **borderless, flat, "instrument" look** — structure from hairline dividers + whitespace + alignment, not enclosing boxes. We also added **selective motion** (live ticker/market/processes + on-change value flashes), made the **narrative layer load-bearing**, and locked **desktop sizing with a hard no-dead-space rule**.

Nothing about the *information architecture* changed — same screens, same data, same flows, same four-zone frame. What changed is the **visual treatment, motion, and responsive sizing**. So this is a re-skin + add-motion + fix-sizing pass, not a rebuild.

---

## What Changed, Concretely

### 1. Boxes → borderless (the big one)
- **STOP:** wrapping panels/widgets in cards — rounded rectangles with their own `background` fill + full `border`, floating on a page background.
- **DO INSTEAD:** one continuous surface. Separate sections with `0.5px solid var(--color-border-tertiary)` hairline dividers (horizontal between stacked sections, vertical between columns). Group with whitespace + alignment. No enclosing borders, no per-card fills.
- **Accents:** emphasis is single-sided or text-only — an inset left edge bar (`box-shadow: inset 3px 0 0 var(--color-text-info)`, `border-radius: 0`), a colored marker, or a text-color shift. NOT a filled highlight box.
- **One allowed exception:** a featured/recommended item (e.g. a difficulty preset) may use `2px solid var(--color-border-info)` with the same background as siblings.
- **Section headers:** small uppercase labels sitting directly on the surface (`10px, weight 500, letter-spacing 0.05em, --color-text-secondary`), not titles inside a card.
- **Flat:** no gradients, shadows, blur, glow anywhere.

### 2. Static → selectively alive (new)
Two kinds of motion, used deliberately — see `UI_LANGUAGE.md §2`:
- **Continuous motion** ONLY on always-running surfaces: the news ticker (scrolls), the market (prices micro-tick ~650–700ms + flash on change — *cosmetic noise around the real price, does not change outcomes*), and in-progress signature processes (training run creeps, curve draws live, breathing "live" dot).
- **On-change motion** ONLY when something happens: tracked values count up/down ~450ms + flash their change-color on advance; new feed/news items enter with a subtle entrance + a decaying "· new" marker.
- **Everything else stays still** (narrative text, decisions, labels, static charts). Motion reads as alive *because* most things don't move.
- **reduce-motion:** add a toggle (and respect OS preference) that freezes continuous motion but keeps informative on-change flashes.

### 3. Narrative is now load-bearing (elevated)
- The right rail (CEO log / team activity / sector news) is not decoration — it carries the "this is a world" feeling now that there's no heavy visual-world layer.
- It must be **voiced** (second-person, situationally aware CEO log; short attributed character quotes) and **continuous** (one thread — e.g. a wavering researcher — echoes across CEO log + team feed + news + the decisions strip). The cross-surface echo is the point.
- This makes the CEO-log generator and character-quote pools real content dependencies (Path B: systems + starter library at V1, grown via updates).

### 4. Desktop sizing + no dead space (new, important)
- This is a Steam **desktop** game. Build and judge at **1920×1080 baseline**; works down to 1366×768, scales up to 2560 + ultrawide. Do NOT judge screens at a narrow width.
- **Full-width frame, content reflows to show MORE** (add columns, widen charts, more rows) as width grows — never stretch a fixed few elements.
- **HARD no-dead-space rule** (`UI_LANGUAGE.md §3b`): regions flex (workspace is `flex: 1`; only nav rail ~50px and narrative rail ~300–340px are fixed-width); grids use `fr` + `auto-fit`/`auto-fill`, never fixed px columns; content COUNT adapts to width via container-query breakpoints; vertical fill required (frame is full-height, lists grow to absorb slack, no screen ends in a void); prose capped at ~52–62ch even in wide columns. Rule of thumb: if a window resize can produce a blank rectangle that isn't doing layout work, the layout is wrong.

---

## What Did NOT Change (don't redo these)

- **Information architecture** — same five nav sections, same four-zone frame (top bar / nav rail / workspace / narrative rail), same screen inventory.
- **All data, formulas, flows, content** — cap-table math, fundraising terms, master variables, events, entity schemas, the TOML content. Untouched.
- **Component behavior** — what's clickable, what routes where, the stage-adaptive widget logic, customizable workspace. Same.
- **The color system & tokens** — same CSS variables, same palette.

So your engine/state/data work carries over fully. This is a presentation-layer migration.

---

## Redo List (priority order)

Re-skin to borderless + add motion + fix sizing. Hero features first (they set quality perception):

1. **Operating home** (the 90%-case screen) — borderless workspace, live ticker + market + training-run, voiced narrative rail, full-width reflow. *Reference mock exists.*
2. **Cap table** (hero) — all tabs borderless; Overview (stacked bar + hairline shareholder rows) and Full Table (hairline grid, no row boxes, inset edge on founder row) are the key ones. *Reference mocks exist.*
3. **Fundraising negotiation** (hero) — borderless; investor as a voiced character; soft-signal reaction dots + text (no probabilities); 3-layer eval help; live cap-table preview that flashes on slider change. *Reference mock exists.*
4. **New-game flow** (4 steps) — borderless; options as hairline-split columns with inset-top selection accent; keep functional form-control borders (inputs, segmented toggles). *Reference mocks exist.*
5. **IPO / earned-moment template** — the lived 6-beat sequence (pre-market → optional interviews w/ difficulty-scaled sway → ring the bell → live price discovery → wire reactions → settle on consequence). Reusable template for all earned moments (first unicorn, launch success, sale, milestones). *Reference mocks exist.*
6. **Action surfaces** (wealth popover, command palette, between-companies reflection) — borderless; NOT yet re-mocked, apply the same rules.

For each: run the `UI_LANGUAGE.md §5` checklist before calling it done, and verify at 1366 / 1920 / 2560 widths for no dead space.

---

## Where the References Live

- **`UI_LANGUAGE.md`** — the authoritative spec (visual rules, motion rules, narrative, desktop sizing, no-dead-space, the per-screen checklist). Read this first.
- **This note** — the diff from the old build + the redo list.
- **The reference mockups** were produced in the design session for: operating home (borderless + live + desktop-reflow), cap table (Overview + Full table), fundraising, all four new-game steps, and the full IPO sequence (reveal, interview, bell + open). Match those.

Net: same game, same data, same screens — restyled borderless, made selectively alive, narrative elevated, and sized for real desktop monitors with zero dead space.
