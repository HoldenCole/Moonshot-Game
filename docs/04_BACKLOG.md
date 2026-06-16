# Moonshot Inc — V1 Gap Backlog

*Derived from the implementation audit (Jun 2026). Splits every "not fully built
out" finding into two categories: things fixable in code now (engine/UI/logic,
no new content), and things blocked on hand-authored TOML content. Items are
roughly ordered by leverage within each group.*

The pre-IPO loop (found → raise → run → acquire → found-again), the cap-table
math, the fundraising negotiation model, the six-variable world sim, and
save/migration are **solid and tested** — the gaps below cluster in the
public-company half of the arc, in mechanical depth behind finished UI shells,
and in forward-declared seams.

## Status (Bucket 1)

**Done** — IPO run-loop + living public company (mark-to-market, lockup,
cash-out); the 4 dead events revived; Hot-Deal rarity; networkStrength wired;
dead-code cleanup; event-effect layer (headcount/revenue + space/crisis
vocabulary); delegation depth (real Recommend, crisis escalation, quality
scaling); cap-table Vesting tab; News-Cycle gauge gating; new-game Quick Start;
investor relationship ledger.

**Customizable dashboard** — **Done.** The four standing dashboard panels
reorder via a drag handle (or arrow keys) and hide via a Customize menu; the
layout persists at the device level (`dashboardLayout.ts` + prefs).

**Remaining (the big ones)** — debt financing and distinct per-sub-industry
signature mechanics. (Stage-adaptive panels — e.g. a post-IPO stock chart — are
a smaller follow-on to the now-customizable dashboard.) Each is a substantial
standalone feature; best tackled as focused follow-ups.

---

## Category 1 — Fixable now (engine / UI, no new content)

### Quick wins (small, high-leverage)
- **IPO closes the run loop.** `ipoList` never sets `runOutcome`, so going public
  strands the player: no Between-Companies screen, no New Game+, and the
  "Exit"/"Magnate" achievements (gated on `runOutcome != null`) can't fire via
  IPO. Set the outcome → also un-deads the `"Public"` branch in
  `BetweenCompanies.tsx`.
- **Wire the 4 dead events.** `s1_launch_success` / `s2_launch_failure` /
  `s6_constellation_milestone` need `launch_committed` / `launch_outcome` /
  `deployment_batch_ready` surfaced into `buildEventContext` from signature
  state; `p1_burnout_risk` needs `sustained_intensity` computed instead of
  hard-coded `"low"`.
- **Hot Deal rarity** — drop from ~25%-when-ripe to the spec'd ~3–5%.
- **Wire the dead `networkStrength`** investor axis into negotiation appetite.
- **Dead-code cleanup** — `rollGen`, the `LogKind:"recap"` variant, two
  unreachable `.decision--*` CSS rules; tidy the unread bank/investor flavor
  fields.
- **Fix the false tutorial line** ("the market re-prices you every week") once
  post-IPO pricing is real.

### Medium (engine logic on existing data)
- **Event-effect layer.** The resolver scans authored text into 4 scalars with
  fixed magnitudes; ~35% of choices no-op, lopsided toward space/macro-crisis
  (`m5` is entirely inert). Extend the vocabulary for space/crisis idioms, model
  the missing dimensions (headcount, revenue), and scale magnitudes by stakes.
- **Minimal post-IPO loop.** Mark-to-market the player's valuation each week
  (reuse `pricing.ts` / `world.ts`), add a lockup timer and a secondary-sale /
  cash-out action. The *living public company*; earnings-management events are
  Category 2.
- **Delegation depth.** Make "Recommend" real (surface the exec's suggested
  choice in the modal), add escalation thresholds, and let exec quality scale
  outcome magnitude/odds — not just which choice is taken.
- **Difficulty.** Broaden the News Cycle's transparency effects and flesh the
  axes toward the designed 8→~25 hierarchy.
- **Relationship graph.** Store investor-overlap and sector-peer edges, feed
  them into hype/fundraising, and add a dedicated Relationships view.

### Larger (new systems, but data already exists / purely mechanical)
- **Distinct signature mechanics** per sub-industry (twin compute/talent
  constraint, batch accumulation, tenant-mix composition) — today it's one
  generic engine reskinned six times.
- **Debt financing.** The bank `debt` / covenant data is authored but unread;
  build the loan / interest / repayment mechanic + UI.
- **Customizable + stage-adaptive workspace.** **Done (reorder + hide + persist).**
  Drag-to-reorder, arrow-key reorder, and hide/show with device-level persistence
  shipped. Still open: per-widget resizing and stage-adaptive panels (post-IPO
  stock chart, etc.).
- **Cap-table Vesting tab** + a vesting model (the missing 5th hero tab).
- **New-game Quick Start vs. Custom split** (the UI; founder archetypes are
  Category 2).

---

## Category 2 — Blocked on authored content

- **Post-IPO events** — earnings calls, guidance beats, restatement,
  short-seller / activist, buyback / dividend (new event TOML gated on the public
  stage). Pairs with the minimal post-IPO engine above to make it feel alive.
- **Investor anchors: 7 → ~18** — author ~11 more firm TOMLs (the thinnest
  roster relative to its target).
- **Founder archetypes** — **Done.** Six archetypes + a custom-founder builder
  drive the new-game "Founder" step (`content/founders/founders.toml`).
- **Guided tutorial script** — **Done.** The authored 11-beat first-run tour
  (`content/tutorial/first_run.toml`) drives anchored coachmarks via
  `GuidedTutorial`, advancing on the player's real actions, then hands off to the
  ambient hint system.
- **Optional:** more company anchors / richer flavor; bespoke per-`outcome_ref`
  effect specs for true fidelity across all 117 outcomes; flavor copy to
  accompany the new signature mechanics.

---

## Notes
- **Post-IPO spans both categories:** the *living public company* (valuation
  re-rating, lockup, cash-out, run outcome) is Category 1; the
  earnings-management *drama* layers on once its events are authored.
- **Out of scope for V1 (deliberately deferred, per the in-app status board):**
  the visual "office" layer, `self`/`angel` investor *activation* + the
  `participating` term, the risk/scandal/activist meter, and the deeper
  Mogul-DLC delegation/graph systems.
