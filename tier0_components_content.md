# Tier-0 Components — Authored Content

Five smaller, cheaper, faster products for each of the 6 playable sub-industries — a tier-0 layer beneath the existing tier-1+ archetypes. These give early revenue, fill the weeks between big signature bets, and model the parts/supplier economy (memory, boosters, rovers, ground hardware, add-ons).

**These are appended to the existing `content/products/<sub_industry>.toml` files** — same schema as all other products, just `tier = 0`.

---

## Design properties (validated)

- **Exactly 5 components per sub-industry** (30 total).
- **Every tier-0 product is cheaper AND faster** than its sub-industry's tier-1 floor.
- Low `gates` (available early), small `capacity_to_build`/`capacity_to_run` (1 each).
- Smaller `addressable_market` than the flagships — early/supplementary revenue, not empire-builders.
- All cross-refs valid: `gates` -> real R&D lines, `capacity_type` -> real capacity ids, `specs` sum to 1.0, spec tags trace to each line's `drives_specs`.
- Each carries a characterful description tying it to the sub-industry's fiction and strategy.

**Cost/speed vs. each tier-1 floor:**

| sub_industry | tier-0 range | tier-1 floor |
|---|---|---|
| ai_chips | $8–16M / 14–24w | $40M / 60w |
| frontier_model_lab | $4–12M / 10–18w | $18M / 26w |
| vertical_ai_saas | $2–6M / 8–14w | $8M / 18w |
| launch_services | $7–20M / 14–28w | $35M / 44w |
| satellite_constellations | $10–24M / 18–32w | $90M / 60w |
| space_stations | $14–26M / 26–38w | $110M / 78w |

---

## AI Chips — memory, I/O, embedded SoC, power, packaging

Append to `content/products/ai_chips.toml`:

```toml
# ---------------------------------------------------------------------------
# TIER 0 — Components. Cheaper, faster, low-gate parts that generate early
# revenue and fill the weeks between tape-out bets. Each is well below the
# Consumer GPU floor ($40M/60w) in cost and time.
# ---------------------------------------------------------------------------

[memory_module]
id = "memory_module"
sub_industry = "ai_chips"
name = "Memory module"
tier = 0
description = """DRAM and high-bandwidth memory stacks — the commodity workhorse \
of the fab. Thin margins, steady demand, and a forgiving process. The first thing \
a young fab makes to keep the lines warm and the cash trickling in while you chase \
bigger silicon."""
flavor_naming_hint = "e.g. 'M-series', a memory part number"

[memory_module.gates]
yield_line = 15

[memory_module.economics]
build_cost = 9
build_weeks = 16
unit_margin = 0.22
capacity_type = "fab_line"
capacity_to_build = 1
capacity_to_run = 1
addressable_market = 500
ramp_weeks = 10
decay_per_quarter = 0.05

[memory_module.specs]
margin = 0.5
cost = 0.3
efficiency = 0.2

[io_controller]
id = "io_controller"
sub_industry = "ai_chips"
name = "I/O controller"
tier = 0
description = """The unglamorous interconnect and I/O dies that move data around a \
board — USB, PCIe, networking controllers. Low-margin, high-volume glue chips \
that every system needs. Reliable revenue that asks little of your process node."""
flavor_naming_hint = "e.g. 'IOC-100', a controller part number"

[io_controller.gates]
architecture = 15

[io_controller.economics]
build_cost = 11
build_weeks = 18
unit_margin = 0.28
capacity_type = "fab_line"
capacity_to_build = 1
capacity_to_run = 1
addressable_market = 600
ramp_weeks = 12
decay_per_quarter = 0.05

[io_controller.specs]
performance = 0.4
cost = 0.35
margin = 0.25

[embedded_soc]
id = "embedded_soc"
sub_industry = "ai_chips"
name = "Embedded SoC"
tier = 0
description = """A small system-on-chip for phones, appliances, and edge devices — \
modest compute, tight power budget, sold by the million. Lower stakes than a \
datacenter part, and a great way to bank architecture experience on someone \
else's volume."""
flavor_naming_hint = "e.g. 'Atom-S', an embedded line name"

[embedded_soc.gates]
architecture = 20
process_node = 18

[embedded_soc.economics]
build_cost = 16
build_weeks = 24
unit_margin = 0.33
capacity_type = "fab_line"
capacity_to_build = 1
capacity_to_run = 1
addressable_market = 750
ramp_weeks = 14
decay_per_quarter = 0.06

[embedded_soc.specs]
efficiency = 0.4
performance = 0.35
margin = 0.25

[power_chip]
id = "power_chip"
sub_industry = "ai_chips"
name = "Power management chip"
tier = 0
description = """The voltage regulators and power-delivery silicon that feed every \
other chip. Boring, essential, and almost recession-proof — demand never really \
goes away. A defensive product line that keeps earning when the frontier cools."""
flavor_naming_hint = "e.g. 'PMU-7', a power part number"

[power_chip.gates]
yield_line = 20

[power_chip.economics]
build_cost = 8
build_weeks = 14
unit_margin = 0.30
capacity_type = "fab_line"
capacity_to_build = 1
capacity_to_run = 1
addressable_market = 450
ramp_weeks = 10
decay_per_quarter = 0.03

[power_chip.specs]
margin = 0.45
cost = 0.35
efficiency = 0.2

[packaging_substrate]
id = "packaging_substrate"
sub_industry = "ai_chips"
name = "Advanced packaging substrate"
tier = 0
description = """The interposers and substrates that bind chiplets into a finished \
package — increasingly where performance is won or lost. A components business \
that rides the same yield expertise as your big parts and sells into the whole \
industry, rivals included."""
flavor_naming_hint = "e.g. 'Weave-1', a packaging brand"

[packaging_substrate.gates]
yield_line = 25

[packaging_substrate.economics]
build_cost = 14
build_weeks = 20
unit_margin = 0.36
capacity_type = "fab_line"
capacity_to_build = 1
capacity_to_run = 1
addressable_market = 680
ramp_weeks = 12
decay_per_quarter = 0.04

[packaging_substrate.specs]
margin = 0.4
cost = 0.35
efficiency = 0.25
```

## Frontier Model Lab — embeddings, moderation, fine-tune, distilled, eval

Append to `content/products/frontier_model_lab.toml`:

```toml
# ---------------------------------------------------------------------------
# TIER 0 — Components. Small, fast model-layer products that earn between the
# big training runs. All well below the API model floor ($18M/26w).
# ---------------------------------------------------------------------------

[embeddings_api]
id = "embeddings_api"
sub_industry = "frontier_model_lab"
name = "Embeddings API"
tier = 0
description = """A cheap, fast vector-embeddings endpoint — the quiet workhorse \
behind every search and retrieval system. Trivial to serve once you have a model, \
sticky once developers build on it, and a steady token-metered trickle while your \
flagship trains."""
flavor_naming_hint = "e.g. 'Helio-Embed', an embeddings name"

[embeddings_api.gates]
data_quality = 15

[embeddings_api.economics]
build_cost = 5
build_weeks = 10
unit_margin = 0.55
capacity_type = "compute"
capacity_to_build = 1
capacity_to_run = 1
addressable_market = 350
ramp_weeks = 8
decay_per_quarter = 0.08

[embeddings_api.specs]
capability = 0.4
reliability = 0.4
benchmark = 0.2

[moderation_api]
id = "moderation_api"
sub_industry = "frontier_model_lab"
name = "Content moderation API"
tier = 0
description = """A safety-classifier endpoint that flags harmful content for \
everyone else's apps. Low compute, high trust, and it doubles as a showcase for \
your alignment work — proof to enterprise buyers that you take safety seriously."""
flavor_naming_hint = "e.g. 'Helio-Guard', a safety-tool name"

[moderation_api.gates]
alignment = 20

[moderation_api.economics]
build_cost = 6
build_weeks = 12
unit_margin = 0.50
capacity_type = "compute"
capacity_to_build = 1
capacity_to_run = 1
addressable_market = 300
ramp_weeks = 8
decay_per_quarter = 0.06

[moderation_api.specs]
safety = 0.45
reliability = 0.35
capability = 0.2

[finetune_service]
id = "finetune_service"
sub_industry = "frontier_model_lab"
name = "Fine-tuning service"
tier = 0
description = """Let customers adapt your base model on their own data, for a fee. \
Cheap to stand up on top of what you already have, and deeply sticky — once a \
customer has tuned a model on your platform, they don't want to redo it elsewhere."""
flavor_naming_hint = "e.g. 'Helio Tune', a customization brand"

[finetune_service.gates]
data_quality = 25
scaling = 20

[finetune_service.economics]
build_cost = 10
build_weeks = 16
unit_margin = 0.52
capacity_type = "compute"
capacity_to_build = 1
capacity_to_run = 1
addressable_market = 500
ramp_weeks = 12
decay_per_quarter = 0.07

[finetune_service.specs]
capability = 0.45
reliability = 0.35
benchmark = 0.2

[distilled_model]
id = "distilled_model"
sub_industry = "frontier_model_lab"
name = "Distilled small model"
tier = 0
description = """A compact, cheap-to-run model distilled from your bigger ones — \
fast, on-device-friendly, and priced for volume. Captures the cost-sensitive end \
of the market the flagship is too expensive to serve, on a fraction of the \
compute."""
flavor_naming_hint = "e.g. 'Helio-nano', a small-model name"

[distilled_model.gates]
scaling = 25
data_quality = 20

[distilled_model.economics]
build_cost = 12
build_weeks = 18
unit_margin = 0.48
capacity_type = "compute"
capacity_to_build = 1
capacity_to_run = 1
addressable_market = 650
ramp_weeks = 12
decay_per_quarter = 0.13

[distilled_model.specs]
capability = 0.4
benchmark = 0.35
reliability = 0.25

[eval_suite]
id = "eval_suite"
sub_industry = "frontier_model_lab"
name = "Evaluation suite"
tier = 0
description = """A benchmarking and eval toolkit you sell or open to the developer \
ecosystem — measuring model quality, safety, and regression. Light to build, and \
it quietly makes your own benchmarks the ones the market measures against."""
flavor_naming_hint = "e.g. 'HelioBench', an eval-tool name"

[eval_suite.gates]
data_quality = 20
alignment = 15

[eval_suite.economics]
build_cost = 4
build_weeks = 10
unit_margin = 0.58
capacity_type = "compute"
capacity_to_build = 1
capacity_to_run = 1
addressable_market = 250
ramp_weeks = 8
decay_per_quarter = 0.09

[eval_suite.specs]
reliability = 0.45
benchmark = 0.35
safety = 0.2
```

## Vertical AI SaaS — extension, connector, dashboard, mobile, templates

Append to `content/products/vertical_ai_saas.toml`:

```toml
# ---------------------------------------------------------------------------
# TIER 0 — Components. Tiny, fast add-ons and features that earn early and feed
# the land-and-expand motion. All below the Point solution floor ($8M/18w).
# ---------------------------------------------------------------------------

[browser_extension]
id = "browser_extension"
sub_industry = "vertical_ai_saas"
name = "Browser extension"
tier = 0
description = """A lightweight in-browser assistant for your vertical — surfacing \
your tool where the work already happens. Cheap to build, frictionless to adopt, \
and the perfect top-of-funnel wedge that pulls users toward the paid product."""
flavor_naming_hint = "e.g. 'ClauseCheck for Chrome', an extension name"

[browser_extension.gates]
model_leverage = 10

[browser_extension.economics]
build_cost = 2
build_weeks = 8
unit_margin = 0.70
capacity_type = "deployment"
capacity_to_build = 1
capacity_to_run = 1
addressable_market = 200
ramp_weeks = 10
decay_per_quarter = 0.06

[browser_extension.specs]
fit = 0.5
reliability = 0.3
stickiness = 0.2

[api_connector]
id = "api_connector"
sub_industry = "vertical_ai_saas"
name = "API & webhook connector"
tier = 0
description = """Prebuilt integrations into the tools your customers already run — \
the connectors that make you part of their stack. Unglamorous plumbing, but every \
integration deepens stickiness and raises the cost of ever leaving you."""
flavor_naming_hint = "e.g. 'Connect', an integrations brand"

[api_connector.gates]
platform = 20

[api_connector.economics]
build_cost = 4
build_weeks = 12
unit_margin = 0.74
capacity_type = "deployment"
capacity_to_build = 1
capacity_to_run = 1
addressable_market = 280
ramp_weeks = 12
decay_per_quarter = 0.04

[api_connector.specs]
stickiness = 0.5
reliability = 0.3
fit = 0.2

[reporting_dashboard]
id = "reporting_dashboard"
sub_industry = "vertical_ai_saas"
name = "Analytics dashboard"
tier = 0
description = """A reporting and insights layer that turns the data your product \
already touches into something an executive will pay for. Low effort on top of \
existing data, and it sells upward — the feature that gets you into the budget \
conversation."""
flavor_naming_hint = "e.g. 'Insights', a reporting add-on name"

[reporting_dashboard.gates]
domain_depth = 20
platform = 15

[reporting_dashboard.economics]
build_cost = 5
build_weeks = 12
unit_margin = 0.75
capacity_type = "deployment"
capacity_to_build = 1
capacity_to_run = 1
addressable_market = 320
ramp_weeks = 14
decay_per_quarter = 0.04

[reporting_dashboard.specs]
fit = 0.45
stickiness = 0.35
reliability = 0.2

[mobile_companion]
id = "mobile_companion"
sub_industry = "vertical_ai_saas"
name = "Mobile companion app"
tier = 0
description = """A phone app that extends your product to the field — approvals, \
quick lookups, notifications. Modest on its own, but it keeps users engaged \
between desk sessions and makes the whole subscription harder to give up."""
flavor_naming_hint = "e.g. 'ClauseCheck Mobile', a companion-app name"

[mobile_companion.gates]
domain_depth = 18
model_leverage = 15

[mobile_companion.economics]
build_cost = 6
build_weeks = 14
unit_margin = 0.70
capacity_type = "deployment"
capacity_to_build = 1
capacity_to_run = 1
addressable_market = 300
ramp_weeks = 14
decay_per_quarter = 0.05

[mobile_companion.specs]
fit = 0.45
stickiness = 0.35
reliability = 0.2

[template_library]
id = "template_library"
sub_industry = "vertical_ai_saas"
name = "Template & content library"
tier = 0
description = """A curated library of templates, prompts, and workflows for your \
vertical, sold as an add-on or used to drive adoption. Almost pure content — \
cheapest thing you can ship — and it showcases the domain depth that sets you \
apart from a generic model."""
flavor_naming_hint = "e.g. 'Playbook Library', a content-pack name"

[template_library.gates]
domain_depth = 22

[template_library.economics]
build_cost = 2
build_weeks = 8
unit_margin = 0.82
capacity_type = "deployment"
capacity_to_build = 1
capacity_to_run = 1
addressable_market = 180
ramp_weeks = 10
decay_per_quarter = 0.05

[template_library.specs]
fit = 0.4
moat = 0.35
stickiness = 0.25
```

## Launch Services — booster, upper stage, fairing, ground support, tug

Append to `content/products/launch_services.toml`:

```toml
# ---------------------------------------------------------------------------
# TIER 0 — Components. Hardware subsystems you can build and sell (to yourself
# or to rivals) before and between full vehicle programs. All below the
# Small-lift floor ($35M/44w).
# ---------------------------------------------------------------------------

[solid_booster]
id = "solid_booster"
sub_industry = "launch_services"
name = "Solid rocket booster"
tier = 0
description = """A strap-on solid booster — simpler than a full vehicle, sold to \
add thrust to your rockets or someone else's. Proven, forgiving tech that banks \
propulsion experience and early revenue without betting a whole launch program."""
flavor_naming_hint = "e.g. 'Kick-1', a booster part name"

[solid_booster.gates]
propulsion = 18

[solid_booster.economics]
build_cost = 12
build_weeks = 20
unit_margin = 0.34
capacity_type = "launch_capacity"
capacity_to_build = 1
capacity_to_run = 1
addressable_market = 380
ramp_weeks = 14
decay_per_quarter = 0.03

[solid_booster.specs]
payload = 0.45
performance = 0.35
cost = 0.2

[upper_stage]
id = "upper_stage"
sub_industry = "launch_services"
name = "Upper stage"
tier = 0
description = """The restartable upper stage that places payloads in their final \
orbit — a self-contained subsystem you can sell as a kick stage or fly atop your \
own rockets. Real propulsion craft at a fraction of a full vehicle's cost."""
flavor_naming_hint = "e.g. 'Apex Stage', an upper-stage name"

[upper_stage.gates]
propulsion = 22
reliability = 20

[upper_stage.economics]
build_cost = 18
build_weeks = 26
unit_margin = 0.38
capacity_type = "launch_capacity"
capacity_to_build = 1
capacity_to_run = 1
addressable_market = 480
ramp_weeks = 16
decay_per_quarter = 0.03

[upper_stage.specs]
performance = 0.4
reliability = 0.35
payload = 0.25

[payload_fairing]
id = "payload_fairing"
sub_industry = "launch_services"
name = "Payload fairing & dispenser"
tier = 0
description = """The nose cone and dispenser that protect and deploy payloads — and \
increasingly, recoverable so you can reuse them. Unsexy structural hardware, but \
it's where reusability savings quietly start and a steady B2B sale to other \
launchers."""
flavor_naming_hint = "e.g. 'Shell-2', a fairing part name"

[payload_fairing.gates]
reusability = 20

[payload_fairing.economics]
build_cost = 9
build_weeks = 16
unit_margin = 0.36
capacity_type = "launch_capacity"
capacity_to_build = 1
capacity_to_run = 1
addressable_market = 300
ramp_weeks = 12
decay_per_quarter = 0.03

[payload_fairing.specs]
cost = 0.45
reliability = 0.35
margin = 0.2

[ground_support]
id = "ground_support"
sub_industry = "launch_services"
name = "Ground support equipment"
tier = 0
description = """Launch-pad systems, transporters, and fueling rigs — the ground \
hardware every operator needs and few want to build. A defensive, low-drama \
revenue line that leans on your operational know-how rather than bleeding-edge \
propulsion."""
flavor_naming_hint = "e.g. 'PadWorks', a GSE brand"

[ground_support.gates]
reliability = 18

[ground_support.economics]
build_cost = 7
build_weeks = 14
unit_margin = 0.40
capacity_type = "launch_capacity"
capacity_to_build = 1
capacity_to_run = 1
addressable_market = 260
ramp_weeks = 12
decay_per_quarter = 0.02

[ground_support.specs]
reliability = 0.45
cost = 0.35
margin = 0.2

[orbital_tug]
id = "orbital_tug"
sub_industry = "launch_services"
name = "Orbital transfer tug"
tier = 0
description = """A small space tug that ferries payloads between orbits after \
separation — last-mile delivery for satellites. A fast-growing niche that rides \
your propulsion and reliability work, and opens a service the big vehicles don't \
provide."""
flavor_naming_hint = "e.g. 'Ferry-1', a tug name"

[orbital_tug.gates]
propulsion = 25
reliability = 22

[orbital_tug.economics]
build_cost = 20
build_weeks = 28
unit_margin = 0.42
capacity_type = "launch_capacity"
capacity_to_build = 1
capacity_to_run = 1
addressable_market = 520
ramp_weeks = 18
decay_per_quarter = 0.04

[orbital_tug.specs]
performance = 0.4
reliability = 0.35
payload = 0.25
```

## Satellite Constellations — bus, sensor, terminal, thruster, rover

Append to `content/products/satellite_constellations.toml`:

```toml
# ---------------------------------------------------------------------------
# TIER 0 — Components. Satellite subsystems and ground hardware that earn early
# and sell into the wider space economy. All below the Comms relay floor
# ($90M/60w). Most draw sat_manufacturing; ground terminals draw ground_network.
# ---------------------------------------------------------------------------

[satellite_bus]
id = "satellite_bus"
sub_industry = "satellite_constellations"
name = "Satellite bus"
tier = 0
description = """The standardized chassis — power, structure, avionics — that any \
payload bolts onto. Selling buses to other operators turns your mass-production \
muscle into a parts business and funds the constellation while it's still being \
built."""
flavor_naming_hint = "e.g. 'Bus-100', a platform name"

[satellite_bus.gates]
mass_production = 20

[satellite_bus.economics]
build_cost = 18
build_weeks = 26
unit_margin = 0.34
capacity_type = "sat_manufacturing"
capacity_to_build = 1
capacity_to_run = 1
addressable_market = 600
ramp_weeks = 18
decay_per_quarter = 0.04

[satellite_bus.specs]
cost = 0.45
capability = 0.35
margin = 0.2

[payload_sensor]
id = "payload_sensor"
sub_industry = "satellite_constellations"
name = "Payload sensor package"
tier = 0
description = """The cameras, antennas, and instruments that ride on a satellite — \
the part that actually does the job. Higher-value than the bus and a showcase for \
your satellite tech, sold to anyone who builds their own birds but not their own \
sensors."""
flavor_naming_hint = "e.g. 'Optix-1', a sensor name"

[payload_sensor.gates]
satellite_tech = 25

[payload_sensor.economics]
build_cost = 22
build_weeks = 28
unit_margin = 0.46
capacity_type = "sat_manufacturing"
capacity_to_build = 1
capacity_to_run = 1
addressable_market = 700
ramp_weeks = 18
decay_per_quarter = 0.06

[payload_sensor.specs]
capability = 0.5
coverage = 0.3
reliability = 0.2

[ground_terminal]
id = "ground_terminal"
sub_industry = "satellite_constellations"
name = "Ground terminal"
tier = 0
description = """The customer-side antennas and modems that connect to your fleet — \
the hardware that turns orbital coverage into a paying subscriber. Sells in volume \
alongside the service and leans on your ground-network expertise."""
flavor_naming_hint = "e.g. 'LinkDish', a terminal brand"

[ground_terminal.gates]
network = 20

[ground_terminal.economics]
build_cost = 10
build_weeks = 18
unit_margin = 0.38
capacity_type = "ground_network"
capacity_to_build = 1
capacity_to_run = 1
addressable_market = 520
ramp_weeks = 14
decay_per_quarter = 0.05

[ground_terminal.specs]
coverage = 0.4
reliability = 0.4
cost = 0.2

[ion_thruster]
id = "ion_thruster"
sub_industry = "satellite_constellations"
name = "Ion thruster module"
tier = 0
description = """A compact electric-propulsion module for station-keeping and orbit \
raising — the unglamorous part that keeps satellites where they belong for years. \
High-margin, long-lived, and in demand across the whole industry."""
flavor_naming_hint = "e.g. 'Drift-1', a thruster name"

[ion_thruster.gates]
satellite_tech = 22
mass_production = 18

[ion_thruster.economics]
build_cost = 14
build_weeks = 22
unit_margin = 0.44
capacity_type = "sat_manufacturing"
capacity_to_build = 1
capacity_to_run = 1
addressable_market = 460
ramp_weeks = 16
decay_per_quarter = 0.03

[ion_thruster.specs]
capability = 0.4
cost = 0.35
reliability = 0.25

[planetary_rover]
id = "planetary_rover"
sub_industry = "satellite_constellations"
name = "Planetary rover"
tier = 0
description = """A small robotic rover built for research agencies and lunar \
missions — a low-volume, high-prestige sideline that flexes your satellite tech in \
a new direction. The contract is lumpy, but landing one puts your name on a \
headline mission."""
flavor_naming_hint = "e.g. 'Pathfinder-S', a rover name"

[planetary_rover.gates]
satellite_tech = 28
mass_production = 20

[planetary_rover.economics]
build_cost = 24
build_weeks = 32
unit_margin = 0.40
capacity_type = "sat_manufacturing"
capacity_to_build = 1
capacity_to_run = 1
addressable_market = 420
ramp_weeks = 20
decay_per_quarter = 0.04

[planetary_rover.specs]
capability = 0.45
reliability = 0.35
coverage = 0.2
```

## Space Stations — docking, life-support, cargo, robotic arm, airlock

Append to `content/products/space_stations.toml`:

```toml
# ---------------------------------------------------------------------------
# TIER 0 — Components. Station subsystems and orbital hardware that earn before
# you can afford a full module. All well below the Research module floor
# ($110M/78w) in cost and time.
# ---------------------------------------------------------------------------

[docking_adapter]
id = "docking_adapter"
sub_industry = "space_stations"
name = "Docking adapter"
tier = 0
description = """A standardized docking and berthing port — the handshake between \
spacecraft and station. Sells to anyone operating in orbit, leans on your assembly \
expertise, and gets your hardware flying long before a full module is affordable."""
flavor_naming_hint = "e.g. 'Port-1', a docking standard name"

[docking_adapter.gates]
assembly = 18

[docking_adapter.economics]
build_cost = 16
build_weeks = 30
unit_margin = 0.40
capacity_type = "module_construction"
capacity_to_build = 1
capacity_to_run = 1
addressable_market = 420
ramp_weeks = 20
decay_per_quarter = 0.03

[docking_adapter.specs]
reliability = 0.45
cost = 0.35
capability = 0.2

[life_support_unit]
id = "life_support_unit"
sub_industry = "space_stations"
name = "Life-support unit"
tier = 0
description = """A self-contained air, water, and CO2-scrubbing module sold to other \
station and spacecraft operators. Safety-critical and high-trust — it builds and \
showcases the life-support maturity you'll need before you can ever human-rate a \
habitat of your own."""
flavor_naming_hint = "e.g. 'BioLoop-1', a life-support brand"

[life_support_unit.gates]
life_support = 25

[life_support_unit.economics]
build_cost = 22
build_weeks = 34
unit_margin = 0.44
capacity_type = "module_construction"
capacity_to_build = 1
capacity_to_run = 1
addressable_market = 480
ramp_weeks = 22
decay_per_quarter = 0.03

[life_support_unit.specs]
safety = 0.5
reliability = 0.3
capability = 0.2

[cargo_pod]
id = "cargo_pod"
sub_industry = "space_stations"
name = "Cargo & logistics pod"
tier = 0
description = """An unpressurized cargo pod for resupplying stations — storage and \
logistics, no humans aboard. The simplest orbital structure you can build, and a \
steady contract business ferrying supplies to everyone else's stations while you \
plan your own."""
flavor_naming_hint = "e.g. 'Haul-1', a cargo-pod name"

[cargo_pod.gates]
module_tech = 20
assembly = 18

[cargo_pod.economics]
build_cost = 14
build_weeks = 26
unit_margin = 0.36
capacity_type = "module_construction"
capacity_to_build = 1
capacity_to_run = 1
addressable_market = 380
ramp_weeks = 18
decay_per_quarter = 0.03

[cargo_pod.specs]
capacity = 0.45
cost = 0.35
reliability = 0.2

[robotic_arm]
id = "robotic_arm"
sub_industry = "space_stations"
name = "Robotic manipulator arm"
tier = 0
description = """A dexterous robotic arm for on-orbit construction, capture, and \
repair — the tool that makes assembly possible. High-value, reusable across \
missions, and a direct expression of your assembly tech sold to the whole \
orbital-construction market."""
flavor_naming_hint = "e.g. 'Reach-7', a manipulator name"

[robotic_arm.gates]
assembly = 25

[robotic_arm.economics]
build_cost = 20
build_weeks = 30
unit_margin = 0.46
capacity_type = "module_construction"
capacity_to_build = 1
capacity_to_run = 1
addressable_market = 440
ramp_weeks = 20
decay_per_quarter = 0.03

[robotic_arm.specs]
capability = 0.45
reliability = 0.35
cost = 0.2

[airlock_module]
id = "airlock_module"
sub_industry = "space_stations"
name = "Airlock module"
tier = 0
description = """A compact airlock for crew and cargo transfer — a small pressurized \
structure that's a real step up from cargo hardware without being a full habitat. \
Builds module and life-support experience together, and every crewed station \
needs several."""
flavor_naming_hint = "e.g. 'Gate-1', an airlock name"

[airlock_module.gates]
module_tech = 25
life_support = 20

[airlock_module.economics]
build_cost = 26
build_weeks = 38
unit_margin = 0.42
capacity_type = "module_construction"
capacity_to_build = 1
capacity_to_run = 1
addressable_market = 500
ramp_weeks = 24
decay_per_quarter = 0.03

[airlock_module.specs]
safety = 0.4
capability = 0.35
capacity = 0.25
```
