# Expansion Infrastructure — Authored Content (Foundations)

The late-game capital-deployment catalog — the permanent buildouts that make the whole empire stronger and, critically, supply the **slots** the concurrency-gated systems need. Authored against the *Expansion Infrastructure* spec (foundations only; UI deferred to the UI pass).

**Drop-in path:** `content/infrastructure/`

---

## Validation summary

All content passes the spec's Part 6 checklist:

- **7 types authored** across all 6 categories: headquarters (prestige), rd_campus (research), production_complex (production), talent_institution (talent), brand_machine (brand), lobbying_arm + think_tank (influence).
- Every type's tiers are **ordered with ascending stature_min, cost, and weeks**; tier numbers sequential from 1.
- `singular` types (HQ, talent, brand, lobbying, think_tank) upgrade in place; multiple-of types (rd_campus, production_complex) repeat.
- All effect keys are engine-known (slots, buffs, prestige, power-axis hooks).
- **Slot accounting reconciles with downstream caps**: research grants (rd_campus, multiple-of) clamp to research max 5 (4 headroom over the starting 1); megaproject grant (production_complex t3) sits within megaproject max 3; infra_slots (HQ t3/t4) feed the infra pool capped at 3.
- **Power-axis hooks wired**: `regulation_relief` and `influence_bonus` (lobbying_arm, think_tank) feed the scrutiny and lobbying events authored in the power-events layer.
- `_tuning.toml` has the infra-slot pool and the anti-spiral caps (rd_speed ≤1.5, opex ≥0.7, talent_quality ≤0.4).

**The 7 types and what they supply:**

| type | category | singular? | headline grant |
|---|---|---|---|
| headquarters | prestige | yes (4 tiers) | exec/retention buffs, stature, **infra_slots** |
| rd_campus | research | no (build several) | **research_slots** + rd_speed |
| production_complex | production | no | capacity + opex, **bet_slots**, **megaproject_slots** |
| talent_institution | talent | yes | talent/exec quality (feeds the exec market) |
| brand_machine | brand | yes | market share + reputation floor |
| lobbying_arm | influence | yes | **regulation_relief + influence_bonus + power** |
| think_tank | influence | yes | rd_speed + influence + reputation |

**Why this matters:** infrastructure is the supply side of the slot economy. The research tree and megaprojects are slot-limited on purpose, so even infinite late-game money can't run everything at once — you buy concurrency by building cathedrals. The constraint shifts from money to slots, and these buildouts are the lever. Costs scale steeply by tier (a landmark arcology is $2B, megaproject-scale) so the spend stays meaningful as the treasury balloons, while stature gates + the small infra build-slot pace it into a deliberate choice rather than a shopping spree.

---

## `content/infrastructure/headquarters.toml`

```toml
# Expansion infrastructure: HEADQUARTERS (singular, prestige). The monument layer
# — exec/retention buffs, stature, and at the top an infra slot. Upgraded in place.
[headquarters]
id = "headquarters"
name = "Corporate Headquarters"
singular = true
category = "prestige"
description = """The seat of the empire. More than offices — a statement of scale, \
a magnet for talent, and the nerve center everything is run from. Each expansion \
says, to the world and to your own people, how far you've come."""

[[headquarters.tiers]]
tier = 1
name = "Headquarters"
stature_min = 0
cost = 30
weeks = 26
effects = { exec_quality = 0.05, retention_bonus = 0.05 }

[[headquarters.tiers]]
tier = 2
name = "Corporate Campus"
stature_min = 8000
cost = 150
weeks = 52
effects = { exec_quality = 0.1, retention_bonus = 0.1, stature_bonus = 1000 }

[[headquarters.tiers]]
tier = 3
name = "Global Headquarters Tower"
stature_min = 25000
cost = 600
weeks = 90
effects = { exec_quality = 0.15, retention_bonus = 0.15, stature_bonus = 4000, infra_slots = 1 }

[[headquarters.tiers]]
tier = 4
name = "Landmark Arcology"
stature_min = 60000
cost = 2000
weeks = 130
effects = { exec_quality = 0.2, retention_bonus = 0.2, stature_bonus = 12000, power_bonus = 1, infra_slots = 1 }
```

## `content/infrastructure/rd_campus.toml`

```toml
# Expansion infrastructure: R&D CAMPUS (multiple-of, research). Research speed +
# research slots — the supply side of the 09 slot economy. Build several.
[rd_campus]
id = "rd_campus"
name = "R&D Campus"
singular = false
category = "research"
description = """A dedicated research campus — labs, talent, and the freedom to \
pursue the frontier. Each one speeds your research and widens how many programs you \
can run at once. The physical foundation of a technological lead."""

[[rd_campus.tiers]]
tier = 1
name = "Research Campus"
stature_min = 4000
cost = 80
weeks = 44
effects = { rd_speed_mult = 1.08, research_slots = 1 }

[[rd_campus.tiers]]
tier = 2
name = "Advanced Research Institute"
stature_min = 15000
cost = 280
weeks = 70
effects = { rd_speed_mult = 1.15, research_slots = 1, talent_quality = 0.1 }

[[rd_campus.tiers]]
tier = 3
name = "Frontier Research City"
stature_min = 35000
cost = 900
weeks = 100
effects = { rd_speed_mult = 1.25, research_slots = 1, talent_quality = 0.15, stature_bonus = 3000 }
```

## `content/infrastructure/production_complex.toml`

```toml
# Expansion infrastructure: PRODUCTION COMPLEX (multiple-of, production). Capacity
# + opex, and at higher tiers bet/megaproject slots. Build several.
[production_complex]
id = "production_complex"
name = "Production Complex"
singular = false
category = "production"
description = """An integrated manufacturing and operations complex — gigafabs, \
assembly lines, mission-control floors. It raises your capacity ceiling and drives \
the cost of running everything down through sheer scale and integration."""

[[production_complex.tiers]]
tier = 1
name = "Production Complex"
stature_min = 5000
cost = 100
weeks = 48
effects = { capacity_bonus = 0.1, opex_mult = 0.95 }

[[production_complex.tiers]]
tier = 2
name = "Megafactory"
stature_min = 16000
cost = 350
weeks = 72
effects = { capacity_bonus = 0.2, opex_mult = 0.9, bet_slots = 1 }

[[production_complex.tiers]]
tier = 3
name = "Industrial Megacomplex"
stature_min = 38000
cost = 1100
weeks = 105
effects = { capacity_bonus = 0.3, opex_mult = 0.85, bet_slots = 1, megaproject_slots = 1 }
```

## `content/infrastructure/talent_institution.toml`

```toml
# Expansion infrastructure: TALENT INSTITUTION (singular, talent). Raises the
# quality floor of the exec candidate market (feeds 12) and talent broadly.
[talent_institution]
id = "talent_institution"
name = "Corporate University"
singular = true
category = "talent"
description = """A university and leadership academy of your own — training your \
people, drawing the best in the world, and grooming the executives who will run the \
empire. The institution that turns a company into a dynasty of talent."""

[[talent_institution.tiers]]
tier = 1
name = "Training Academy"
stature_min = 6000
cost = 70
weeks = 44
effects = { talent_quality = 0.1, exec_quality = 0.05 }

[[talent_institution.tiers]]
tier = 2
name = "Corporate University"
stature_min = 18000
cost = 260
weeks = 66
effects = { talent_quality = 0.18, exec_quality = 0.12, retention_bonus = 0.1 }

[[talent_institution.tiers]]
tier = 3
name = "World-Renowned Institute"
stature_min = 40000
cost = 800
weeks = 95
effects = { talent_quality = 0.25, exec_quality = 0.2, retention_bonus = 0.15, stature_bonus = 2500 }
```

## `content/infrastructure/brand_machine.toml`

```toml
# Expansion infrastructure: BRAND MACHINE (singular, brand). Market share +
# reputation floor — cushions the scrutiny/reputation hits, lifts share.
[brand_machine]
id = "brand_machine"
name = "Brand & Communications"
singular = true
category = "brand"
description = """A world-class brand, marketing, and communications operation — the \
machine that makes your name mean something. It lifts your market share, cushions \
your reputation when things go wrong, and turns the company into a cultural force."""

[[brand_machine.tiers]]
tier = 1
name = "Brand Studio"
stature_min = 3000
cost = 50
weeks = 36
effects = { share_bonus = 0.05, reputation_floor = 0.05 }

[[brand_machine.tiers]]
tier = 2
name = "Global Brand Operation"
stature_min = 14000
cost = 200
weeks = 58
effects = { share_bonus = 0.1, reputation_floor = 0.1 }

[[brand_machine.tiers]]
tier = 3
name = "Cultural Institution"
stature_min = 32000
cost = 650
weeks = 85
effects = { share_bonus = 0.15, reputation_floor = 0.15, stature_bonus = 2000 }
```

## `content/infrastructure/lobbying_arm.toml`

```toml
# Expansion infrastructure: LOBBYING ARM (singular, influence). Power-axis hooks —
# regulation_relief softens the scrutiny events (17); influence_bonus strengthens
# lobbying; power_bonus at higher tiers.
[lobbying_arm]
id = "lobbying_arm"
name = "Government Affairs Office"
singular = true
category = "influence"
description = """A standing government-affairs and lobbying operation — the \
permanent machinery of influence. It softens the regulation that comes for every \
giant, strengthens your hand when you choose to lobby, and quietly keeps the state \
on your side. The institutional form of power."""

[[lobbying_arm.tiers]]
tier = 1
name = "Government Affairs Office"
stature_min = 10000
cost = 90
weeks = 44
effects = { regulation_relief = 0.1, influence_bonus = 0.1 }

[[lobbying_arm.tiers]]
tier = 2
name = "Policy & Influence Division"
stature_min = 24000
cost = 320
weeks = 64
effects = { regulation_relief = 0.18, influence_bonus = 0.2, power_bonus = 1 }

[[lobbying_arm.tiers]]
tier = 3
name = "Statecraft Operation"
stature_min = 50000
cost = 950
weeks = 90
effects = { regulation_relief = 0.25, influence_bonus = 0.3, power_bonus = 2 }
```

## `content/infrastructure/think_tank.toml`

```toml
# Expansion infrastructure: THINK TANK (singular, influence). Research + influence
# blend — speeds your own work and bends the policy conversation your way.
[think_tank]
id = "think_tank"
name = "Institute for the Future"
singular = true
category = "influence"
description = """A prestigious research institute and think tank under your banner — \
shaping the intellectual climate, the policy debate, and the public's sense of \
what's possible. Soft power and hard research at once: it speeds your own work and \
bends the conversation your way."""

[[think_tank.tiers]]
tier = 1
name = "Research Foundation"
stature_min = 12000
cost = 110
weeks = 50
effects = { rd_speed_mult = 1.05, influence_bonus = 0.1, reputation_floor = 0.05 }

[[think_tank.tiers]]
tier = 2
name = "Institute for the Future"
stature_min = 30000
cost = 400
weeks = 75
effects = { rd_speed_mult = 1.1, influence_bonus = 0.2, reputation_floor = 0.1, stature_bonus = 2500 }
```

## `content/infrastructure/_tuning.toml`

```toml
# content/infrastructure/_tuning.toml
[global]
starting_infra_slots = 1         # infrastructure builds you can run at once
max_infra_slots = 3              # ceiling (raised by HQ tier 3+ infra_slots grants)
# Slot grants from buildouts (research_slots / megaproject_slots / bet_slots) feed
# the respective system slot pools (09 / 10 / bet scheduler). Engine sums and
# clamps to those systems' own max caps (research max 5 from 09; megaproject max 3
# from 10).

[caps]
# Global ceilings so infrastructure buffs stack but don't spiral (with synergies 14).
max_rd_speed_from_infra = 1.5
min_opex_from_infra = 0.7
max_talent_quality = 0.4
```
