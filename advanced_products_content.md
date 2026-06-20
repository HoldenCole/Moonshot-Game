# Advanced (Research-Gated) Products — Authored Content

The 13 top-of-tree product archetypes the R&D tree unlocks via `unlocks.products`. Authored against the *Advanced Products: Authoring Addendum* — ordinary `06`-schema products, gated by research completion (then respecting their tech-level `gates` as a floor). Authoring these closes the products↔research loop and clears the last of the `09` dangling-reference warnings.

**These append to the existing `content/products/<sub_industry>.toml` files.**

---

## Validation summary

- **All 13 authored**, one block per product, appended to its sub-industry's products file.
- **Zero remaining dangling `unlocks.products` references** from the R&D tree — the products↔research chain is fully closed.
- **Each product's `gates` ≤ its unlocking research node's `rd_levels`** (the addendum's new check) — so finishing the research guarantees the player can build the product; no unlockable-but-unbuildable archetypes.
- Standard `06` checks pass: `gates` → real lines, `capacity_type` → real capacity, `specs` sum to 1.0, spec tags trace to lines, `capacity_to_build` ≤ max capacity rung.

**Availability rule (engine):** these become buildable when the unlocking research project completes AND the tech-level gates are met. The research-gating is wired by the `09` node that names the product in its `unlocks.products` — no new field on the product itself.

**The 13 → unlocking node:**

| product | sub-industry | unlocked by (09 node) | tier |
|---|---|---|---|
| chiplet_accelerator | ai_chips | chiplet_packaging | 2 |
| edge_ai_chip | ai_chips | edge_inference_chip | 2 |
| frontier_node_part | ai_chips | node_leadership_program | 3 |
| wafer_scale_engine | ai_chips | wafer_scale_compute | 3 |
| autonomous_agent_platform | frontier_model_lab | autonomous_agents | 3 |
| multi_vertical_platform | vertical_ai_saas | multi_vertical_expansion | 2 |
| autonomous_operations_suite | vertical_ai_saas | autonomous_workflows | 3 |
| super_heavy_vehicle | launch_services | heavy_lift_program | 3 |
| global_broadband_network | satellite_constellations | global_broadband | 3 |
| direct_to_device_service | satellite_constellations | direct_to_device | 2 |
| servicing_vehicle | satellite_constellations | orbital_servicing | 2 |
| orbital_city | space_stations | large_scale_stations | 3 |
| microgravity_factory | space_stations | in_space_manufacturing_mod | 2 |

---

## AI Chips (4)

Append to `content/products/ai_chips.toml`:

```toml
# ---------------------------------------------------------------------------
# RESEARCH-GATED ADVANCED ARCHETYPES (unlocked by 09 research nodes).
# Available when the unlocking research project completes AND these gates are met.
# Gates are set <= the unlocking node's rd_levels so finishing the research
# guarantees buildability.
# ---------------------------------------------------------------------------

[chiplet_accelerator]
id = "chiplet_accelerator"
sub_industry = "ai_chips"
name = "Chiplet accelerator"
tier = 2
description = """A multi-die accelerator that stitches several smaller chips into \
one package — scaling past the yield wall that caps any single monolithic part. \
The design the whole industry converges on once the bleeding edge gets too \
expensive to etch in one piece. Unlocked by mastering chiplet packaging."""
flavor_naming_hint = "e.g. 'Mosaic-1', a multi-die brand"

[chiplet_accelerator.gates]
yield_line = 45
architecture = 40

[chiplet_accelerator.economics]
build_cost = 180
build_weeks = 110
unit_margin = 0.58
capacity_type = "fab_line"
capacity_to_build = 2
capacity_to_run = 2
addressable_market = 7000
ramp_weeks = 36
decay_per_quarter = 0.08

[chiplet_accelerator.specs]
performance = 0.5
efficiency = 0.3
margin = 0.2

[edge_ai_chip]
id = "edge_ai_chip"
sub_industry = "ai_chips"
name = "Edge AI chip"
tier = 2
description = """Tiny, power-sipping inference silicon for phones, cars, and \
devices — AI that runs locally with no datacenter round-trip. A vast, fast-growing \
volume market that rewards the efficiency work behind it. Unlocked by edge \
inference research."""
flavor_naming_hint = "e.g. 'Atom-E', an edge-silicon name"

[edge_ai_chip.gates]
architecture = 40
process_node = 38

[edge_ai_chip.economics]
build_cost = 70
build_weeks = 60
unit_margin = 0.40
capacity_type = "fab_line"
capacity_to_build = 1
capacity_to_run = 1
addressable_market = 2500
ramp_weeks = 26
decay_per_quarter = 0.07

[edge_ai_chip.specs]
efficiency = 0.5
performance = 0.3
margin = 0.2

[frontier_node_part]
id = "frontier_node_part"
sub_industry = "ai_chips"
name = "Frontier-node part"
tier = 3
description = """A bleeding-edge part a full process generation ahead of anything \
rivals can make — the product a standing node-leadership program exists to produce. \
Customers pay almost anything for the lead it gives them, and you set the pace the \
whole industry chases."""
flavor_naming_hint = "e.g. 'Apex-N', a leading-node codename"

[frontier_node_part.gates]
process_node = 75
yield_line = 60

[frontier_node_part.economics]
build_cost = 650
build_weeks = 175
unit_margin = 0.70
capacity_type = "fab_line"
capacity_to_build = 3
capacity_to_run = 2
addressable_market = 18000
ramp_weeks = 52
decay_per_quarter = 0.11

[frontier_node_part.specs]
performance = 0.6
efficiency = 0.25
margin = 0.15

[wafer_scale_engine]
id = "wafer_scale_engine"
sub_industry = "ai_chips"
name = "Wafer-scale engine"
tier = 3
description = """A single processor the size of a dinner plate — an entire wafer \
left uncut, hundreds of thousands of cores wired as one. It sidesteps the \
chip-to-chip bottleneck entirely and gives AI training a substrate nothing built \
from discrete parts can match. Only a fab that has mastered yield at the limit can \
make one without scrapping a fortune in silicon per attempt."""
flavor_naming_hint = "e.g. 'Monolith-1', a single-massive-part name"

[wafer_scale_engine.gates]
yield_line = 70
architecture = 65

[wafer_scale_engine.economics]
build_cost = 500
build_weeks = 150
unit_margin = 0.66
capacity_type = "fab_line"
capacity_to_build = 3
capacity_to_run = 3
addressable_market = 14000
ramp_weeks = 44
decay_per_quarter = 0.10

[wafer_scale_engine.specs]
performance = 0.55
efficiency = 0.30
margin = 0.15
```

## Frontier Model Lab (1)

Append to `content/products/frontier_model_lab.toml`:

```toml
# ---------------------------------------------------------------------------
# RESEARCH-GATED ADVANCED ARCHETYPE (unlocked by 09: autonomous_agents).
# ---------------------------------------------------------------------------

[autonomous_agent_platform]
id = "autonomous_agent_platform"
sub_industry = "frontier_model_lab"
name = "Autonomous agent platform"
tier = 3
description = """Models that don't just answer but act — planning and executing \
multi-step work on their own, sold as a platform others build their businesses on. \
The leap from tool to worker, productized. Once customers run their operations on \
your agents, you're not a model vendor; you're the workforce. Unlocked by \
autonomous-agent research."""
flavor_naming_hint = "e.g. 'Helio Agents', a platform brand"

[autonomous_agent_platform.gates]
scaling = 60
data_quality = 55
alignment = 45

[autonomous_agent_platform.economics]
build_cost = 200
build_weeks = 78
unit_margin = 0.64
capacity_type = "compute"
capacity_to_build = 4
capacity_to_run = 4
addressable_market = 18000
ramp_weeks = 30
decay_per_quarter = 0.14

[autonomous_agent_platform.specs]
capability = 0.45
reliability = 0.3
safety = 0.25
```

## Vertical AI SaaS (2)

Append to `content/products/vertical_ai_saas.toml`:

```toml
# ---------------------------------------------------------------------------
# RESEARCH-GATED ADVANCED ARCHETYPES (unlocked by 09 nodes).
# ---------------------------------------------------------------------------

[multi_vertical_platform]
id = "multi_vertical_platform"
sub_industry = "vertical_ai_saas"
name = "Multi-vertical platform"
tier = 2
description = """One platform adapted across several industries at once — the \
single-vertical winner turned into a portfolio without rebuilding the core. \
Multiplies your market without multiplying your engineering, and each new vertical \
makes the shared platform stronger. Unlocked by multi-vertical expansion research."""
flavor_naming_hint = "e.g. 'OmniOS', a cross-industry brand"

[multi_vertical_platform.gates]
platform = 45
domain_depth = 40

[multi_vertical_platform.economics]
build_cost = 45
build_weeks = 40
unit_margin = 0.78
capacity_type = "deployment"
capacity_to_build = 2
capacity_to_run = 2
addressable_market = 4500
ramp_weeks = 32
decay_per_quarter = 0.04

[multi_vertical_platform.specs]
fit = 0.4
stickiness = 0.35
reliability = 0.25

[autonomous_operations_suite]
id = "autonomous_operations_suite"
sub_industry = "vertical_ai_saas"
name = "Autonomous operations suite"
tier = 3
description = """Software that runs whole processes end to end — no human in the \
loop for the routine work. You stop selling seats and start selling outcomes, which \
is a far larger budget line and a far deeper lock-in. The product that turns a SaaS \
vendor into an operator. Unlocked by autonomous-workflow research."""
flavor_naming_hint = "e.g. 'AutoOps', an outcomes-as-a-service brand"

[autonomous_operations_suite.gates]
platform = 60
domain_depth = 60
model_leverage = 50

[autonomous_operations_suite.economics]
build_cost = 100
build_weeks = 60
unit_margin = 0.80
capacity_type = "deployment"
capacity_to_build = 2
capacity_to_run = 3
addressable_market = 11000
ramp_weeks = 44
decay_per_quarter = 0.03

[autonomous_operations_suite.specs]
stickiness = 0.4
fit = 0.35
reliability = 0.25
```

## Launch Services (1)

Append to `content/products/launch_services.toml`:

```toml
# ---------------------------------------------------------------------------
# RESEARCH-GATED ADVANCED ARCHETYPE (unlocked by 09: heavy_lift_program).
# ---------------------------------------------------------------------------

[super_heavy_vehicle]
id = "super_heavy_vehicle"
sub_industry = "launch_services"
name = "Super-heavy reusable vehicle"
tier = 3
description = """A fully reusable super-heavy lifter that throws hundreds of tons to \
orbit per flight — the backbone of everything off-world: stations, \
megaconstellations, missions beyond Earth. The truck that makes the space economy \
possible, and a long-lived workhorse once it's flying. Unlocked by the super-heavy \
lift program."""
flavor_naming_hint = "e.g. 'Colossus', a super-heavy vehicle name"

[super_heavy_vehicle.gates]
propulsion = 65
reusability = 60
reliability = 60

[super_heavy_vehicle.economics]
build_cost = 300
build_weeks = 130
unit_margin = 0.55
capacity_type = "launch_capacity"
capacity_to_build = 3
capacity_to_run = 2
addressable_market = 14000
ramp_weeks = 52
decay_per_quarter = 0.03

[super_heavy_vehicle.specs]
payload = 0.4
reliability = 0.35
cost = 0.25
```

## Satellite Constellations (3)

Append to `content/products/satellite_constellations.toml`:

```toml
# ---------------------------------------------------------------------------
# RESEARCH-GATED ADVANCED ARCHETYPES (unlocked by 09 nodes).
# ---------------------------------------------------------------------------

[global_broadband_network]
id = "global_broadband_network"
sub_industry = "satellite_constellations"
name = "Global broadband network"
tier = 3
description = """A constellation dense enough to deliver high-speed internet to \
every point on Earth — a recurring-revenue machine with planetary reach once the \
capex hump is behind you. The network that connects the unconnected and prints \
money doing it. Unlocked by global-broadband research."""
flavor_naming_hint = "e.g. 'Meridian Global', a planet-spanning brand"

[global_broadband_network.gates]
mass_production = 65
network = 60
satellite_tech = 55

[global_broadband_network.economics]
build_cost = 700
build_weeks = 150
unit_margin = 0.58
capacity_type = "sat_manufacturing"
capacity_to_build = 5
capacity_to_run = 3
addressable_market = 20000
ramp_weeks = 60
decay_per_quarter = 0.07

[global_broadband_network.specs]
coverage = 0.45
cost = 0.3
capability = 0.25

[direct_to_device_service]
id = "direct_to_device_service"
sub_industry = "satellite_constellations"
name = "Direct-to-device service"
tier = 2
description = """Signal beamed straight to ordinary phones with no special terminal \
— turning every smartphone on Earth into a potential customer. The breakthrough \
that explodes the market from enterprise to everyone. Unlocked by direct-to-device \
research."""
flavor_naming_hint = "e.g. 'SkyLink Direct', a consumer connectivity brand"

[direct_to_device_service.gates]
satellite_tech = 50
network = 45

[direct_to_device_service.economics]
build_cost = 220
build_weeks = 100
unit_margin = 0.50
capacity_type = "sat_manufacturing"
capacity_to_build = 3
capacity_to_run = 2
addressable_market = 8000
ramp_weeks = 44
decay_per_quarter = 0.06

[direct_to_device_service.specs]
coverage = 0.4
capability = 0.35
reliability = 0.25

[servicing_vehicle]
id = "servicing_vehicle"
sub_industry = "satellite_constellations"
name = "Orbital servicing vehicle"
tier = 2
description = """Robotic craft that refuel, repair, and upgrade satellites already \
in orbit — extending fleet life and opening a service business for everyone else's \
birds too. Turns satellites from disposable into maintainable. Unlocked by \
on-orbit servicing research."""
flavor_naming_hint = "e.g. 'Mechanic-1', a servicing-craft name"

[servicing_vehicle.gates]
satellite_tech = 60
mass_production = 55

[servicing_vehicle.economics]
build_cost = 120
build_weeks = 70
unit_margin = 0.48
capacity_type = "sat_manufacturing"
capacity_to_build = 2
capacity_to_run = 1
addressable_market = 3000
ramp_weeks = 39
decay_per_quarter = 0.05

[servicing_vehicle.specs]
capability = 0.45
reliability = 0.35
coverage = 0.2
```

## Space Stations (2)

Append to `content/products/space_stations.toml`:

```toml
# ---------------------------------------------------------------------------
# RESEARCH-GATED ADVANCED ARCHETYPES (unlocked by 09 nodes).
# ---------------------------------------------------------------------------

[orbital_city]
id = "orbital_city"
sub_industry = "space_stations"
name = "Orbital city"
tier = 3
description = """A multi-hundred-person orbital complex — research parks, factories, \
and habitation in one rotating structure with artificial gravity. The leap from \
outpost to destination, and the template for anywhere humans will live off Earth. \
Unlocked by large-scale station research."""
flavor_naming_hint = "e.g. 'Skyhold', a city-in-orbit name"

[orbital_city.gates]
module_tech = 65
assembly = 60
life_support = 55

[orbital_city.economics]
build_cost = 750
build_weeks = 170
unit_margin = 0.55
capacity_type = "module_construction"
capacity_to_build = 5
capacity_to_run = 3
addressable_market = 14000
ramp_weeks = 65
decay_per_quarter = 0.03

[orbital_city.specs]
capacity = 0.4
capability = 0.35
safety = 0.25

[microgravity_factory]
id = "microgravity_factory"
sub_industry = "space_stations"
name = "Microgravity factory"
tier = 2
description = """An orbital module built for production — fiber, pharmaceuticals, and \
alloys that can only be made in microgravity, manufactured in orbit and sold on \
Earth at a premium. Turns a station from a cost center into a factory with a \
high-value export. Unlocked by in-space manufacturing research."""
flavor_naming_hint = "e.g. 'Forge Orbital', a microgravity-production name"

[microgravity_factory.gates]
module_tech = 50
assembly = 45

[microgravity_factory.economics]
build_cost = 120
build_weeks = 80
unit_margin = 0.50
capacity_type = "module_construction"
capacity_to_build = 2
capacity_to_run = 2
addressable_market = 4000
ramp_weeks = 44
decay_per_quarter = 0.04

[microgravity_factory.specs]
capacity = 0.4
capability = 0.35
cost = 0.25
```
