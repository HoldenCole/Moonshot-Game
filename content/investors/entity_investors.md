# Entity Reference: Investor Firms

**Purpose:** how to author the hand-crafted anchor VC firms and how the procedural generator derives the rest. Parallels `entity_companies.md`. Numbers are starting points for playtest tuning.

Firms live in `content/investors/` as TOML. Anchors are authored by hand; the generator reads anchors as archetype templates and emits the procedural long tail at world-gen, seeded by the save's PRNG.

See `game_design_plan.md` §"Investor Archetypes — Who Funds You" for the design rationale. This doc is the build-reference companion.

---

## 1. What Firms Are For

A firm entity serves these roles, and the schema supports all of them:

1. **Fundraising counterparty** — the player negotiates rounds against the firm's named partner
2. **Cap-table presence** — appears on company `investors` edges (player's and NPCs'); shared backers create the "my investor also backs my competitor" tension
3. **World texture** — fund closes, portfolio wins, and partner moves populate the news feed
4. **Recurring character** — hand-crafted firms accumulate relationship history across companies and decades

Hand-crafted firms serve all four. Procedural firms serve 1–3 with a lighter attribute set and numeric-only memory (no event log).

---

## 2. Roster Targets (V1)

| Tier | Count | Grade | Notes |
|---|---|---|---|
| Hand-crafted | ~30 | Full attributes, hand-tuned axes | Recurring characters, stable across saves |
| Procedural | ~150–250 | Light, rolled from distributions | Ambient ecosystem, varies each save |

This doc ships **7 hand-crafted anchors** as the authored seed; author the remaining ~23 by varying stage/sector/personality coverage. Spread anchors so every stage (pre-seed → late-stage) and every playable sector has at least one specialist, and so the five personality axes are well-distributed (don't cluster all firms founder-friendly).

The 7 authored anchors and their roles:

| Firm | Partner | Role | Primary stage |
|---|---|---|---|
| Frontier Partners | Diane Okafor | Flagship conviction lead | Series A |
| Helio Capital | Marcus Vance | Boutique founder whisperer | Seed |
| Atlas Growth | Priya Sharma | Momentum / hype money | Growth |
| Evergreen Capital | Walter Renn | Patient compounder-backer | Series A |
| Redwood Ventures | Elena Cruz | Seed first-money | Seed |
| Ironclad Capital | Sam Boone | Defense / deep-tech specialist | Series A |
| Meridian Crossing | Catherine Vos | Activist crossover | Late-stage |

---

## 3. The Attribute Schema

### 3a. Full attribute set (hand-crafted anchor)

```toml
[firm]
id = "frontier_partners"        # stable unique key
name = "Frontier Partners"
tier = "anchor"                 # "anchor" | "procedural"
partner_name = "Diane Okafor"   # the firm's face
partner_title = "Managing Partner"
hq = "Menlo Park, CA"
color = "#2E5BFF"
logo_glyph = "compass"

[firm.identity]
thesis = "Lead the category-definer in every frontier industry."  # one-line known-for
reputation = 92                 # 0-100 — signaling power of the firm's term sheet
trait_tags = ["Conviction Lead", "Category Maker", "Tough but Fair"]  # 1-3 visible flavor labels
narrative_hooks = [             # phrases the news/event system pulls
  "a Frontier term sheet pulls in a syndicate",
]

[firm.personality]
# Five HIDDEN axes, 1-100 — drive negotiation counter-logic (game_design_plan.md §"What Drives Investor Counter-Logic")
aggression = 62                 # willingness to push hard on terms
patience = 70                   # tolerance for slow-burn investments
conviction = 95                 # willingness to lead vs. follow
founder_friendliness = 58       # bias toward founder-favorable terms
network_strength = 90           # quality of post-investment value-add

[firm.focus]
primary_sector = "ai"           # one of the 8 industries
secondary_sector = "space"      # optional
primary_stage = "series_a"      # pre_seed | seed | series_a | growth | late_stage
stage_range = ["seed", "late_stage"]   # full span the firm will participate in
stretch_tolerance = 0.7         # 0-1 — how far outside lane for an exceptional deal

[firm.fund]
fund_name = "Fund IV"
fund_size = 2400                # $M
vintage_year = -2               # relative to game start
deployment_years = 4            # deployment period before next fund
check_min = 8                   # $M
check_max = 300                 # $M — gates which rounds the firm can lead

[firm.relationships]
signature_portfolio = ["openmind", "vector_dynamics", "lexiq"]  # company ids — narrative continuity
rival_firms = ["atlas_growth"]  # firm ids the firm competes hardest with
```

### 3b. Light attribute set (procedural firm)

Drop `signature_portfolio`, `narrative_hooks`, and `partner_title`. Keep the five personality axes (rolled, not hand-tuned), focus, and fund. Procedural firms get **numeric relationship memory only** — no event log, no relationship badge.

```toml
[firm]
id = "quartz_ventures"
name = "Quartz Ventures"
tier = "procedural"
partner_name = "rolled from name bank"
hq = "rolled from city pool"

[firm.identity]
thesis = "template-filled from sector + stage"
reputation = 64                 # rolled
trait_tags = ["derived from axis profile"]  # see §5

[firm.personality]
aggression = 55                 # rolled from sector/stage distribution
patience = 60
conviction = 48
founder_friendliness = 52
network_strength = 50

[firm.focus]
primary_sector = "energy"
primary_stage = "seed"
stage_range = ["pre_seed", "series_a"]
stretch_tolerance = 0.3

[firm.fund]
fund_name = "Fund I"
fund_size = 120
vintage_year = -1
deployment_years = 3
check_min = 0.5
check_max = 8
```

---

## 4. Authoring the Hand-Crafted Anchors

Anchors are the recurring characters players build intuition about across saves. Author them so the player can learn "Atlas always pushes on structure, Helio always caves on price."

**Authoring guidance:**

1. **One firm = one clear negotiation feel.** The five axes should encode a posture the player can learn by pattern recognition, not memorization. Frontier pushes governance not price; Atlas pushes everything; Helio caves on price but maxes value-add. Make the axes *do work* in the negotiation.

2. **Span the founder-friendliness axis deliberately.** This is the soul of the negotiation game the way fundamentals×hype is the soul of investing. Author firms across the full range — from Helio (90) to Meridian Crossing (26) — so the player feels who they're dealing with. Don't let the roster cluster founder-friendly.

3. **Match personality to portfolio.** A firm's `signature_portfolio` should make sense given its axes: the hype-chaser (Atlas, low patience/high aggression) backs the high-hype_exposure companies; the patient steward (Evergreen) backs the compounders. This coherence is what makes shared cap tables feel real.

4. **Cover stages and sectors.** Across the 30, every stage needs specialists (so early and late rounds have appropriate counterparties) and every playable sector needs at least one focused firm. Generalists are fine, but the specialists create the strategic texture.

5. **Write trait_tags as player-facing vibe, axes as hidden mechanics.** Tags communicate; axes compute. "Tough Negotiator" tells the player what to expect; aggression=88 makes it true. Keep them aligned.

6. **Wire rivals intentionally.** `rival_firms` should be thematic opposites who plausibly compete for the same deals — the conviction lead vs. the momentum fund, the founder whisperer vs. the activist. Feeds competing-term-sheet and Hot Deal moments.

---

## 5. Procedural Generation Template

```
1. Pick target sector + stage (to hit ecosystem distribution).
2. Select a hand-crafted anchor in that sector/stage as BASE archetype.
3. Generate identity:
   - name: from VC name bank (see §6)
   - partner_name: from person-name bank
   - thesis: template-filled from sector + stage
4. Roll personality axes from sector/stage-appropriate distributions,
   centered near the base anchor's axes ± spread:
   - axis = clamp(base.axis + roll(-25, +25), 1, 100)
5. Derive trait_tags from the resulting axis profile (see mapping below).
6. Roll fund: size + check range from stage (seed funds small, growth large).
7. Assign reputation below the anchor base (anchors stay the iconic firms).
8. Light memory only — no event log, no signature_portfolio.
```

**Trait derivation from axes (examples):**
- aggression > 75 → "Tough Negotiator"
- founder_friendliness > 75 → "Founder Friendly"
- network_strength > 80 → "Hands-On Builder"
- patience > 80 → "Patient Capital"
- conviction > 80 → "Conviction Lead"
- aggression > 75 AND founder_friendliness < 35 → "Activist"

**Variation philosophy** — mirror the company generator: vary personality widely (the roster should contain genuinely founder-friendly and genuinely brutal firms), keep identity coherent (a seed firm reads as a seed firm), and bias procedural reputation slightly below the anchor base so the hand-crafted firms stay the recurring characters.

---

## 6. Name Generation

```toml
[names.vc_firm]
prefixes = ["Quartz", "Northwind", "Meridian", "Granite", "Cobalt", "Summit", "Cedar", "Harbor", "Lattice", "Vantage"]
suffixes = ["Ventures", "Capital", "Partners", "Growth", "Group"]
# → "Quartz Ventures", "Northwind Capital", "Cobalt Partners"

[names.vc_partner_first] = ["..."]   # person-name banks
[names.vc_partner_last]  = ["..."]
```

Dedupe firm names and partner names against existing entities (anchors + already-generated) within a save. Procedural names are bland by design — they're the long tail; the anchors carry the personality.

---

## 7. Authoring Checklist

For each hand-crafted anchor:
- [ ] One clear negotiation feel, encoded in the five axes (not just the tags)
- [ ] `founder_friendliness` deliberately placed — roster spans the full range
- [ ] trait_tags (1-3) aligned with the hidden axes
- [ ] `signature_portfolio` coherent with personality (hype-chaser backs hype; steward backs compounders)
- [ ] Each signature_portfolio company lists this firm back on its `investors` edge (reciprocal)
- [ ] `rival_firms` are thematic opposites that plausibly compete for deals
- [ ] Fund check_min/check_max gate the stages the firm can credibly lead
- [ ] Reads as an evocative fictional firm, not a trademark lift of a real VC

For the generator:
- [ ] Hits roster distribution across sectors and stages
- [ ] Centers rolled axes near a stage/sector-appropriate anchor, varied ±25
- [ ] Derives trait_tags from the axis profile
- [ ] Biases procedural reputation slightly below anchor base
- [ ] Light memory only (numeric score, no event log) for procedural firms
- [ ] Dedupes firm and partner names within a save
- [ ] Deterministic given the save seed
