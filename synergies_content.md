# Synergies — Authored Content (Terminal Content Doc)

The cross-front bonus web — the keystone that makes "a titan, not a conglomerate" real. Authored against the *Synergies: Design & Authoring Spec*. This consumes the synergy tags every other system emits (R&D `09`, megaprojects `10`, sub-economies `13`) and turns them into concrete empire-wide bonuses.

**This is the terminal content doc.** With it authored, every synergy tag emitted anywhere in the content set resolves to either an authored synergy or a documented local capability. No dangling references remain anywhere.

**Drop-in path:** `content/synergies/`

---

## Terminal validation summary — the whole reference graph is closed

The spec's Part 7 terminal check **passes clean**:

- **20 synergies authored**: 13 flow (scale with a sub-economy's output) + 7 presence (binary on owning ≥2 fronts + completing a cross-domain node).
- **69 total synergy tags** are emitted across `09`/`10`/`13`. Of these: **20 resolve to authored synergies**; the other **49 are single-front local capability tags** that resolve as plain capability modifiers in the product/R&D engine — *not synergies, by the spec's cross-front rule* (a synergy needs ≥2 fronts or a sub-economy feed).
- **0 dangling references.** Every flow synergy's `fed_by_resources` is produced by a real sub-economy; every presence synergy's `requires_research` is a real `09` node and `requires_fronts` are ≥2 real sub-industries; every effect modifier is engine-known and targets a real system; every synergy has a `cap`.

**With this, the entire content reference graph is closed in both directions:**

```
products → R&D lines → research projects → frontier programs → megaprojects → sub-economies → synergies
                                                    ↑                                            │
                                              executives gate                                    │
                                              megaprojects                                       │
                                                                                                 ▼
                              synergies modify ← products / R&D / finance / ops / megaprojects
```

Every cross-reference across all of it resolves. The content is complete.

---

## The synergies

**Flow synergies (13)** — scale with sub-economy output, diminishing returns toward a cap:

| synergy | branch | fed by | effect |
|---|---|---|---|
| cheap_raw_materials | space | raw_materials, quantum_advantage | ↓ chip/launch/station build cost |
| off_world_resources | space | off_world_materials, raw_materials | ↓ space build + megaproject cost |
| cislunar_logistics | space | cislunar_capacity | ↓ space opex, faster space megas |
| mars_manufacturing | space | off_world_materials, mars_research | ↓ build cost + ↑ space R&D |
| near_free_launch | space | launch_access | ↓↓ all launch/space cost (the big lever) |
| space_native_civilization | space | off_world_materials, orbital_research, launch_access | ↓ space cost + ↑ R&D + power |
| abundant_clean_energy | energy | clean_energy | ↓ opex empire-wide |
| agi_accelerates_all_rd | intelligence | research_speed | ↑ ALL R&D speed |
| all_rd_compounding | intelligence | research_speed | ↑ R&D speed (compounding) |
| quantum_advantage_all_rd | intelligence | quantum_advantage | ↑ materials/optimization R&D |
| agi_runs_divisions | intelligence | division_automation | ↓ ops cost + exec load relief |
| economic_gravity | economic | economic_substrate, market_lock_in | + power + share defense |
| industry_lock_in | economic | market_lock_in | + retention + share defense |

**Presence synergies (7)** — binary, from `09` cross-domain nodes (each requires ≥2 fronts):

| synergy | emitted by (09 cross-node) | fronts | effect |
|---|---|---|---|
| ai_chip_codesign | ai_designed_silicon | lab + chips | ↑ chip & AI R&D |
| full_ai_stack | vertically_integrated_ai | lab + chips + saas | ↑ AI-stack R&D + ↓ opex |
| integrated_space_logistics | reusable_satellite_launch | launch + satellites | ↓ sat cost + ↓ launch opex |
| orbital_construction | orbital_construction_logistics | launch + stations | ↓ station cost + faster space megas |
| orbital_compute | space_based_compute | chips + satellites | ↓ AI/chip opex + ↑ sat R&D |
| autonomous_space | autonomous_space_ops | lab + satellites + launch | ↓ space ops cost |
| ai_research_engine | ai_accelerated_research | lab + chips + launch + stations | ↑ all R&D (cross-front capstone) |

All bonuses stack multiplicatively with the global floors in `_tuning.toml` (build cost can't drop below 45%, R&D speed caps at 2.5×, synergies contribute at most +6 power) — integration compounds but never spirals.

---

## `content/synergies/_tuning.toml`

```toml
# content/synergies/_tuning.toml
# Global multiplicative floors/caps so stacked synergies compound but stay
# bounded. Integration is rewarded; it never trivializes the game or spirals.

[global]
min_build_cost_mult = 0.45       # combined synergies can't cut build cost below 45%
min_opex_mult = 0.5              # combined opex can't drop below 50%
max_rd_speed_mult = 2.5          # combined R&D speed bonus caps at 2.5x
max_power_from_synergies = 6     # synergies contribute at most +6 power total

[flow]
default_strength_curve = "diminishing"
# diminishing: strength = output / (output + full_strength_at), asymptotes toward 1.
# So full_strength_at is the sub-economy output level at which the bonus is ~50%
# of its cap; it keeps climbing toward the cap with diminishing returns past that.
```

## `content/synergies/space.toml`

```toml
# content/synergies/space.toml
# Space-branch flow synergies — fed by space sub-economy outputs. These are the
# dynamic ones: bigger sub-economy -> bigger bonus, with diminishing returns
# toward each synergy's cap. fed_by_resources matches the sub-economy produces.

[cheap_raw_materials]
id = "cheap_raw_materials"
name = "Off-world raw materials"
activation = "flow"
description = """The metals and volatiles your asteroid operation returns feed \
straight into your fabs and your rockets — at a cost no Earth-bound miner can \
touch. The more the belt produces, the cheaper everything you build becomes. \
Quantum-simulated materials science sharpens the edge further."""
icon = "gem"

[cheap_raw_materials.source]
fed_by_resources = ["raw_materials", "quantum_advantage"]

[cheap_raw_materials.effect]
build_cost_mult = { ai_chips = 0.85, launch_services = 0.9, space_stations = 0.9 }
cap = 0.7

[cheap_raw_materials.tuning]
strength_curve = "diminishing"
full_strength_at = 3000

[off_world_resources]
id = "off_world_resources"
name = "Off-world resource base"
activation = "flow"
description = """Materials sourced and worked beyond Earth — from Mars, the \
asteroids, and your orbital city — supply your space endeavors without ever \
climbing out of a gravity well. The off-world economy building the off-world \
economy. Space megaprojects and space products get dramatically cheaper."""
icon = "globe"

[off_world_resources.source]
fed_by_resources = ["off_world_materials", "raw_materials"]

[off_world_resources.effect]
build_cost_mult = { space_stations = 0.85, satellite_constellations = 0.9 }
megaproject_cost_mult = { space = 0.85 }
cap = 0.7

[off_world_resources.tuning]
strength_curve = "diminishing"
full_strength_at = 4000

[cislunar_logistics]
id = "cislunar_logistics"
name = "Cislunar logistics backbone"
activation = "flow"
description = """The Earth–Mars transit network doubles as the logistics spine for \
everything you do beyond Earth orbit — moving cargo and crew cheaply between \
worlds. It lowers the operating cost of every off-world endeavor and speeds the \
big space builds."""
icon = "route"

[cislunar_logistics.source]
fed_by_resources = ["cislunar_capacity"]

[cislunar_logistics.effect]
opex_mult = { space_stations = 0.9, satellite_constellations = 0.92 }
megaproject_time_mult = { space = 0.9 }
cap = 0.8

[cislunar_logistics.tuning]
strength_curve = "diminishing"
full_strength_at = 1500

[mars_manufacturing]
id = "mars_manufacturing"
name = "Martian manufacturing"
activation = "flow"
description = """The colony doesn't just survive — it builds. Martian industry \
produces components and runs research that no Earth-bound operation can replicate, \
feeding unique materials and discoveries back into your empire. A second \
industrial base, on a second world."""
icon = "factory"

[mars_manufacturing.source]
fed_by_resources = ["off_world_materials", "mars_research"]

[mars_manufacturing.effect]
build_cost_mult = { space_stations = 0.9 }
rd_speed_mult = { space_stations = 1.1, satellite_constellations = 1.1 }
cap = 0.85

[mars_manufacturing.tuning]
strength_curve = "diminishing"
full_strength_at = 30000

[near_free_launch]
id = "near_free_launch"
name = "Near-free launch"
activation = "flow"
description = """The orbital ring has turned reaching space into something close to \
an elevator ride. Every satellite you loft, every station module, every ton bound \
for Mars now costs a fraction of what it did. The single greatest cost lever in \
your entire space empire."""
icon = "circle-dashed"

[near_free_launch.source]
fed_by_resources = ["launch_access"]

[near_free_launch.effect]
build_cost_mult = { launch_services = 0.6, satellite_constellations = 0.7, space_stations = 0.7 }
megaproject_cost_mult = { space = 0.75 }
cap = 0.55

[near_free_launch.tuning]
strength_curve = "diminishing"
full_strength_at = 20000

[space_native_civilization]
id = "space_native_civilization"
name = "Space-native civilization"
activation = "flow"
description = """A population that lives, works, and builds in space — your orbital \
city and ring access compounding into a true off-world civilization. It throws off \
materials, research, and launch capacity at once, and its sheer existence makes \
you a power on a scale no Earth-bound institution can answer."""
icon = "cylinder"

[space_native_civilization.source]
fed_by_resources = ["off_world_materials", "orbital_research", "launch_access"]

[space_native_civilization.effect]
build_cost_mult = { space_stations = 0.85, satellite_constellations = 0.85, launch_services = 0.85 }
rd_speed_mult = { space_stations = 1.15 }
power_bonus = 2
cap = 0.7

[space_native_civilization.tuning]
strength_curve = "diminishing"
full_strength_at = 200000
```

## `content/synergies/energy.toml`

```toml
# content/synergies/energy.toml
# Energy-branch flow synergy — orbital solar's clean energy lowers operating
# costs across the entire empire.

[abundant_clean_energy]
id = "abundant_clean_energy"
name = "Abundant clean energy"
activation = "flow"
description = """Your orbital power grid feeds clean, constant energy to every \
operation you run — fabs, datacenters, factories, habitats. When power costs \
almost nothing and never fluctuates, the operating cost of the entire empire \
falls. The input under every other input, taken care of."""
icon = "sun"

[abundant_clean_energy.source]
fed_by_resources = ["clean_energy"]

[abundant_clean_energy.effect]
opex_mult = { all = 0.85 }
cap = 0.7

[abundant_clean_energy.tuning]
strength_curve = "diminishing"
full_strength_at = 8000
```

## `content/synergies/intelligence.toml`

```toml
# content/synergies/intelligence.toml
# Intelligence-branch flow synergies — the research-speed and automation feeders.
# These are the force multipliers: AGI and the discovery engine accelerate ALL
# your R&D, quantum sharpens materials/optimization work, and AGI/autonomous-
# economy automation relieves operating load empire-wide.

[agi_accelerates_all_rd]
id = "agi_accelerates_all_rd"
name = "AGI-accelerated R&D"
activation = "flow"
description = """Your general intelligence is pointed inward, working every \
research program you run at a pace no human team can match. Each front advances \
faster because the smartest thing in the building is helping. The compounding \
advantage that lets an integrated titan out-research the entire field at once."""
icon = "sparkles"

[agi_accelerates_all_rd.source]
fed_by_resources = ["research_speed"]

[agi_accelerates_all_rd.effect]
rd_speed_mult = { all = 1.4 }
cap = 1.6

[agi_accelerates_all_rd.tuning]
strength_curve = "diminishing"
full_strength_at = 20000

[all_rd_compounding]
id = "all_rd_compounding"
name = "Compounding discovery"
activation = "flow"
description = """The automated discovery engine doesn't just speed research — it \
speeds the rate at which research speeds up. Each breakthrough feeds the next, and \
the pace of progress itself climbs across every front you operate. The closest \
thing to a perpetual-motion machine your empire has."""
icon = "flask"

[all_rd_compounding.source]
fed_by_resources = ["research_speed"]

[all_rd_compounding.effect]
rd_speed_mult = { all = 1.3 }
cap = 1.5

[all_rd_compounding.tuning]
strength_curve = "diminishing"
full_strength_at = 12000

[quantum_advantage_all_rd]
id = "quantum_advantage_all_rd"
name = "Quantum research advantage"
activation = "flow"
description = """Your quantum platform cracks the simulation and optimization \
problems that gate progress in materials, chemistry, and chip design — giving your \
research a head start no classical rival can close. The hardest problems in your \
labs become tractable overnight."""
icon = "atom"

[quantum_advantage_all_rd.source]
fed_by_resources = ["quantum_advantage"]

[quantum_advantage_all_rd.effect]
rd_speed_mult = { ai_chips = 1.25, satellite_constellations = 1.15, space_stations = 1.15 }
cap = 1.4

[quantum_advantage_all_rd.tuning]
strength_curve = "diminishing"
full_strength_at = 5000

[agi_runs_divisions]
id = "agi_runs_divisions"
name = "AGI-run divisions"
activation = "flow"
description = """Your AGI and autonomous-economy platforms run whole divisions on \
their own — handling the operational load that used to need executives and staff. \
It relieves the management burden across the empire and drives operating costs \
down toward something close to zero marginal overhead."""
icon = "cpu"

[agi_runs_divisions.source]
fed_by_resources = ["division_automation"]

[agi_runs_divisions.effect]
ops_cost_mult = { all = 0.8 }
exec_load_relief = 0.3
cap = 0.65

[agi_runs_divisions.tuning]
strength_curve = "diminishing"
full_strength_at = 8000
```

## `content/synergies/economic.toml`

```toml
# content/synergies/economic.toml
# Economic-branch flow synergies — power and defensive moat from economic
# indispensability rather than physical infrastructure.

[economic_gravity]
id = "economic_gravity"
name = "Economic gravity"
activation = "flow"
description = """A growing share of the economy runs on your platforms — sector \
tolls and autonomous businesses compounding into sheer economic mass. The bigger \
it gets, the more the world's commerce bends around you, and the more power \
accrues from being the substrate everything else depends on."""
icon = "globe-lock"

[economic_gravity.source]
fed_by_resources = ["economic_substrate", "market_lock_in"]

[economic_gravity.effect]
power_bonus = 2
share_defense = 0.3
cap = 0.8

[economic_gravity.tuning]
strength_curve = "diminishing"
full_strength_at = 100000

[industry_lock_in]
id = "industry_lock_in"
name = "Industry lock-in"
activation = "flow"
description = """The deeper an industry embeds your platform, the more impossible \
you are to remove — switching costs become prohibitive and your share becomes \
nearly unassailable. A moat that widens itself: every customer who builds on you \
makes leaving harder for the next."""
icon = "lock"

[industry_lock_in.source]
fed_by_resources = ["market_lock_in"]

[industry_lock_in.effect]
retention_bonus = 0.25
share_defense = 0.25
cap = 0.6

[industry_lock_in.tuning]
strength_curve = "diminishing"
full_strength_at = 30000
```

## `content/synergies/cross_industry.toml`

```toml
# content/synergies/cross_industry.toml
# Presence synergies from the 09 cross-domain research nodes. Binary: active when
# the emitting node is complete (which itself required operating >=2 fronts). Flat
# bonuses, no strength curve. requires_research = the cross-domain node that emits
# the tag; requires_fronts mirrors that node's front requirements.

[ai_chip_codesign]
id = "ai_chip_codesign"
name = "AI–chip co-design"
activation = "presence"
description = """Your own models design your own silicon, and your silicon is built \
for your models — a feedback loop no company renting either half can run. Each \
generation of chips and models makes the next one better."""
icon = "circuit"

[ai_chip_codesign.source]
requires_fronts = ["frontier_model_lab", "ai_chips"]
requires_research = ["ai_designed_silicon"]
requires_megaprojects = []

[ai_chip_codesign.effect]
rd_speed_mult = { ai_chips = 1.25, frontier_model_lab = 1.1 }
cap = 1.4

[ai_chip_codesign.tuning]
# presence synergies are flat — no strength curve.

[full_ai_stack]
id = "full_ai_stack"
name = "Full AI stack"
activation = "presence"
description = """Chips, models, and applications all under one roof, each tuned to \
the others in ways no company renting a piece can match. Owning the whole stack \
turns three good businesses into one dominant, self-reinforcing machine."""
icon = "layers-3"

[full_ai_stack.source]
requires_fronts = ["frontier_model_lab", "ai_chips", "vertical_ai_saas"]
requires_research = ["vertically_integrated_ai"]
requires_megaprojects = []

[full_ai_stack.effect]
rd_speed_mult = { ai_chips = 1.15, frontier_model_lab = 1.15, vertical_ai_saas = 1.1 }
opex_mult = { frontier_model_lab = 0.9 }
cap = 1.5

[full_ai_stack.tuning]

[integrated_space_logistics]
id = "integrated_space_logistics"
name = "Integrated space logistics"
activation = "presence"
description = """You fly your own satellites on your own rockets, matching launch \
cadence to manufacturing output so neither waits on the other. The vertical \
integration that turns a megaconstellation from a slide in a deck into something \
you can actually deploy."""
icon = "rocket"

[integrated_space_logistics.source]
requires_fronts = ["launch_services", "satellite_constellations"]
requires_research = ["reusable_satellite_launch"]
requires_megaprojects = []

[integrated_space_logistics.effect]
build_cost_mult = { satellite_constellations = 0.85 }
opex_mult = { launch_services = 0.9 }
cap = 0.8

[integrated_space_logistics.tuning]

[orbital_construction]
id = "orbital_construction"
name = "Orbital construction"
activation = "presence"
description = """Heavy-lift launch paired with in-orbit assembly lets you build \
structures too large to ever launch whole — stations, arrays, megastructures \
assembled piece by piece on orbit. The capability that makes the truly big \
endeavors buildable at all."""
icon = "crane"

[orbital_construction.source]
requires_fronts = ["launch_services", "space_stations"]
requires_research = ["orbital_construction_logistics"]
requires_megaprojects = []

[orbital_construction.effect]
build_cost_mult = { space_stations = 0.85 }
megaproject_time_mult = { space = 0.9 }
cap = 0.8

[orbital_construction.tuning]

[orbital_compute]
id = "orbital_compute"
name = "Orbital compute"
activation = "presence"
description = """Datacenters in orbit — unlimited solar power, free cooling in the \
vacuum, and your satellites' onboard intelligence fed by datacenter-class \
hardware. Building both the silicon and the satellites turns orbit into the \
cheapest place in the system to run a model."""
icon = "server"

[orbital_compute.source]
requires_fronts = ["ai_chips", "satellite_constellations"]
requires_research = ["space_based_compute"]
requires_megaprojects = []

[orbital_compute.effect]
opex_mult = { frontier_model_lab = 0.88, ai_chips = 0.92 }
rd_speed_mult = { satellite_constellations = 1.1 }
cap = 0.8

[orbital_compute.tuning]

[autonomous_space]
id = "autonomous_space"
name = "Autonomous space operations"
activation = "presence"
description = """Your entire space enterprise — launches, constellations, stations \
— run by AI agents instead of armies of operators. A real lab combined with real \
space assets slashes the operating cost of everything you fly and frees capacity \
across the board."""
icon = "satellite-dish"

[autonomous_space.source]
requires_fronts = ["frontier_model_lab", "satellite_constellations", "launch_services"]
requires_research = ["autonomous_space_ops"]
requires_megaprojects = []

[autonomous_space.effect]
ops_cost_mult = { launch_services = 0.85, satellite_constellations = 0.85 }
cap = 0.75

[autonomous_space.tuning]

[ai_research_engine]
id = "ai_research_engine"
name = "AI research engine"
activation = "presence"
description = """Superhuman scientific AI pointed at every research program across a \
diversified empire — chips, launch, satellites, and stations advancing together, \
faster than any focused rival can follow. The cross-front capstone: integration \
turned into raw research velocity."""
icon = "flask"

[ai_research_engine.source]
requires_fronts = ["frontier_model_lab", "ai_chips", "launch_services", "space_stations"]
requires_research = ["ai_accelerated_research"]
requires_megaprojects = []

[ai_research_engine.effect]
rd_speed_mult = { all = 1.25 }
cap = 1.5

[ai_research_engine.tuning]
```
