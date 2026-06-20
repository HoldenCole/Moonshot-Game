# Sub-Economies — Authored Content

What each megaproject opens when it completes — the ongoing economic systems that make completion world-altering rather than a one-off. Authored against the *Sub-Economies: Design & Authoring Spec*. These are the `on_complete.sub_economy` ids the megaprojects reference.

**Drop-in path:** `content/sub_economies/`

---

## Validation summary

All content passes the spec's Part 7 checklist:

- **All 11 sub-economies authored** — one per megaproject `on_complete.sub_economy` id; clears those warnings.
- **Bidirectional megaproject↔sub-economy check passes**: every `opened_by` is a real megaproject whose `on_complete.sub_economy` names this exact id, and every megaproject sub-economy id has a sub-economy.
- Every `exec_domain` is a real exec domain (cto/cfo/.../space_program/chief_scientist/chief_executive).
- **No orphan inputs**: every consumed resource is produced by another sub-economy or is a real core capacity type (compute, launch_capacity).
- `scale_cap` > `starting_scale`; `growth_rate` in (0,1); power tiers ascending — all sub-economies.
- `_tuning.toml` present with global + branch_pacing.

**The resource-flow graph (the empire as an interlocking machine):**

- `mars_logistics` consumes core **launch_capacity** → produces **cislunar_capacity**
- `mars_colony` consumes **cislunar_capacity** (from mars_logistics) → produces off-world materials + research
- `orbital_city` consumes **clean_energy** (from space_power) → produces materials + research
- `asteroid_materials` → **raw_materials** (feeds chips + launch synergies — the key source)
- `space_power` → **clean_energy** (lowers opex empire-wide)
- `ring_access` → **launch_access** (near-free launch for all space fronts)
- intelligence trio (agi/quantum/discovery) consume core **compute** → produce **research_speed** / quantum advantage
- economic engines consume **compute** → produce recurring revenue + economic lock-in

**`sub_economy_preview` handling:** preview ids in the megaproject stages are NOT separate sub-economies. A preview means the named sub-economy begins at its `starting_scale` early, at reduced output (`_tuning.preview.output_mult = 0.4`). Only `mars_outpost` needs an alias mapping (→ mars_colony); all other preview ids match their sub-economy id directly. Documented in `_tuning.toml`.

---

## Forward hook: synergy tags (for `13`)

These 11 sub-economies feed **13 synergy tags** via `feeds_synergies` — every one matching a tag the megaprojects already declared in `on_complete.synergies`. The synergy spec (`13`) must author these:

`abundant_clean_energy`, `agi_accelerates_all_rd`, `agi_runs_divisions`, `all_rd_compounding`, `cheap_raw_materials`, `cislunar_logistics`, `economic_gravity`, `industry_lock_in`, `mars_manufacturing`, `near_free_launch`, `off_world_resources`, `quantum_advantage_all_rd`, `space_native_civilization`

The loader treats these as `ContentDB.warnings` until `13` is authored.

---

## `content/sub_economies/_tuning.toml`

```toml
# content/sub_economies/_tuning.toml
# Posture multipliers + branch pacing. A sub-economy is lightly steered: the
# player picks a posture (grow/harvest/balanced), the exec runs it, the rest is
# autonomous. Investing capital to raise scale_cap is the optional money sink.

[global]
default_posture = "balanced"     # grow | harvest | balanced
grow_growth_mult = 1.6           # posture multipliers on growth_rate
harvest_growth_mult = 0.5
harvest_revenue_mult = 1.4       # harvest trades growth for more current revenue
invest_to_raise_cap_cost = 50    # $M to raise a sub-economy's scale_cap a tier (money sink)

# Growth pace by branch (space slow and capital-heavy; services scale fast).
[branch_pacing]
space = 1.0
intelligence = 1.4
energy = 1.0
economic = 1.5

# sub_economy_preview handling: preview ids in the megaproject stages
# (mars_outpost, etc.) are NOT separate sub-economies. A preview means "this
# sub-economy begins at its starting_scale early, at reduced output." The
# engine instantiates the named sub-economy at preview time at a reduced
# output multiplier; full output begins on megaproject completion.
[preview]
output_mult = 0.4                # preview runs at 40% output until the mega completes
# Preview id -> sub-economy id it previews (only the non-self-named one needs mapping):
#   mars_outpost -> mars_colony
# All other preview ids match their sub-economy id directly (mars_logistics,
# asteroid_materials, space_power, discovery_engine, platform_tolls).
[preview.aliases]
mars_outpost = "mars_colony"
```

## `content/sub_economies/space.toml`

```toml
# content/sub_economies/space.toml
# The space-branch sub-economies. opened_by matches each megaproject's
# on_complete.sub_economy; feeds_synergies aligns with the synergy tags those
# megaprojects already declare. exec_domain = space_program throughout.

# ===========================================================================
# ASTEROID MATERIALS — the key synergy source (materials feed fabs + launch)
# ===========================================================================
[asteroid_materials]
id = "asteroid_materials"
name = "Asteroid Materials Operation"
opened_by = "asteroid_mining_operation"
branch = "space"
scale_label = "extraction throughput"
description = """A standing fleet working the belt, returning a steady stream of \
metals and volatiles. Its revenue is real, but its true value is the materials it \
sends home — feeding your fabs and your launch program with resources no \
Earth-bound rival can match the cost of. The supply line to the sky."""
icon = "gem"

[asteroid_materials.scale]
starting_scale = 50
scale_cap = 5000
growth_rate = 0.05
exec_domain = "space_program"

[asteroid_materials.produces]
revenue_per_scale = 0.012
[asteroid_materials.produces.resources]
raw_materials = 0.02             # the big one — feeds chips + launch + construction

[asteroid_materials.consumes]
upkeep_per_scale = 0.004

[asteroid_materials.power]
power_per_scale_tier = [ [1000, 1], [3000, 2], [5000, 3] ]

[asteroid_materials.events]
pool = "asteroid_events"
crisis_chance = 0.05

[asteroid_materials.feeds_synergies]
raw_materials = ["cheap_raw_materials", "off_world_resources"]

# ===========================================================================
# MARS LOGISTICS — opened by the transit line (precursor to the colony)
# ===========================================================================
[mars_logistics]
id = "mars_logistics"
name = "Mars Logistics Network"
opened_by = "mars_transit_line"
branch = "space"
scale_label = "transit throughput"
description = """The two-way freight and passenger artery between Earth and Mars — \
a scheduled service that earns on every crossing and builds the cislunar logistics \
backbone everything off-world depends on. Modest beside a colony, and the rails \
the colony will ride."""
icon = "route"

[mars_logistics.scale]
starting_scale = 30
scale_cap = 2000
growth_rate = 0.05
exec_domain = "space_program"

[mars_logistics.produces]
revenue_per_scale = 0.01
[mars_logistics.produces.resources]
cislunar_capacity = 0.008        # logistics throughput that eases colony/city upkeep

[mars_logistics.consumes]
upkeep_per_scale = 0.003
[mars_logistics.consumes.resources]
launch_capacity = 0.00004        # needs launch throughput from the core business

[mars_logistics.power]
power_per_scale_tier = [ [500, 1], [1500, 2] ]

[mars_logistics.events]
pool = "mars_logistics_events"
crisis_chance = 0.035

[mars_logistics.feeds_synergies]
cislunar_capacity = ["cislunar_logistics"]

# ===========================================================================
# MARS COLONY — residents, materials, research; previewed by mars_outpost
# ===========================================================================
[mars_colony]
id = "mars_colony"
name = "Mars Colony"
opened_by = "mars_colony"
branch = "space"
scale_label = "residents"
description = """A permanent, growing settlement — residents, industry, and an \
economy of its own. It produces rare off-world materials and a stream of revenue, \
consumes supplies shipped from Earth until it's self-sufficient, and its very \
existence makes you a power no government can ignore. It grows on its own; you \
decide how hard to push it."""
icon = "planet"

[mars_colony.scale]
starting_scale = 100
scale_cap = 100000
growth_rate = 0.04
exec_domain = "space_program"

[mars_colony.produces]
revenue_per_scale = 0.0008
[mars_colony.produces.resources]
off_world_materials = 0.0004
mars_research = 0.0002

[mars_colony.consumes]
upkeep_per_scale = 0.0003
[mars_colony.consumes.resources]
cislunar_capacity = 0.0001       # consumes Mars-logistics throughput (inter-sub dependency)

[mars_colony.power]
power_per_scale_tier = [ [1000, 1], [10000, 2], [50000, 3], [100000, 4] ]

[mars_colony.events]
pool = "mars_colony_events"
crisis_chance = 0.04

[mars_colony.feeds_synergies]
off_world_materials = ["off_world_resources", "mars_manufacturing"]
mars_research = ["mars_manufacturing"]

# ===========================================================================
# ORBITAL CITY — the biggest habitat (O'Neill cylinder)
# ===========================================================================
[orbital_city]
id = "orbital_city"
name = "Orbital City"
opened_by = "oneill_cylinder"
branch = "space"
scale_label = "residents"
description = """A rotating city in orbit, home to a population that lives entirely \
off-world under a sky you built. The largest habitat humanity has — it produces \
materials and research at scale and stands as the clearest proof that your \
company is now a civilization of its own."""
icon = "cylinder"

[orbital_city.scale]
starting_scale = 1000
scale_cap = 1000000
growth_rate = 0.035
exec_domain = "space_program"

[orbital_city.produces]
revenue_per_scale = 0.0006
[orbital_city.produces.resources]
off_world_materials = 0.0003
orbital_research = 0.00025

[orbital_city.consumes]
upkeep_per_scale = 0.00025
[orbital_city.consumes.resources]
clean_energy = 0.00008           # a city needs power (consumes orbital-solar output)

[orbital_city.power]
power_per_scale_tier = [ [10000, 2], [100000, 3], [500000, 4], [1000000, 5] ]

[orbital_city.events]
pool = "orbital_city_events"
crisis_chance = 0.035

[orbital_city.feeds_synergies]
off_world_materials = ["off_world_resources", "space_native_civilization"]
orbital_research = ["space_native_civilization"]

# ===========================================================================
# RING ACCESS — near-free launch (orbital ring)
# ===========================================================================
[ring_access]
id = "ring_access"
name = "Orbital Ring Access"
opened_by = "orbital_ring"
branch = "space"
scale_label = "access throughput"
description = """The ring's cargo and passenger capacity — the near-free road to \
orbit that collapses the cost of everything above the atmosphere. Its revenue is \
substantial, but its real gift is to every other space endeavor you run: when \
reaching orbit is almost free, all of it gets cheaper at once."""
icon = "circle-dashed"

[ring_access.scale]
starting_scale = 500
scale_cap = 50000
growth_rate = 0.045
exec_domain = "space_program"

[ring_access.produces]
revenue_per_scale = 0.004
[ring_access.produces.resources]
launch_access = 0.01             # near-free launch capacity feeding all space fronts

[ring_access.consumes]
upkeep_per_scale = 0.0015

[ring_access.power]
power_per_scale_tier = [ [5000, 2], [20000, 3], [50000, 5] ]

[ring_access.events]
pool = "ring_access_events"
crisis_chance = 0.04

[ring_access.feeds_synergies]
launch_access = ["near_free_launch", "space_native_civilization"]
```

## `content/sub_economies/energy.toml`

```toml
# content/sub_economies/energy.toml
# The energy branch — orbital solar power. Its clean_energy output lowers
# operating costs across the empire and feeds the abundant-clean-energy synergy.

[space_power]
id = "space_power"
name = "Orbital Power Grid"
opened_by = "orbital_solar_array"
branch = "energy"
scale_label = "grid capacity"
description = """A network of orbital collectors beaming clean, constant power to \
the ground — a utility with no fuel cost and no carbon. It earns as an energy \
business, and it lowers the operating cost of everything else you run. When you \
sell power to nations, the grid that depends on you depends on you for everything."""
icon = "sun"

[space_power.scale]
starting_scale = 200
scale_cap = 20000
growth_rate = 0.04
exec_domain = "space_program"

[space_power.produces]
revenue_per_scale = 0.008
[space_power.produces.resources]
clean_energy = 0.015             # lowers opex empire-wide + feeds energy synergy

[space_power.consumes]
upkeep_per_scale = 0.002

[space_power.power]
power_per_scale_tier = [ [2000, 2], [8000, 3], [20000, 4] ]

[space_power.events]
pool = "space_power_events"
crisis_chance = 0.035

[space_power.feeds_synergies]
clean_energy = ["abundant_clean_energy"]
```

## `content/sub_economies/intelligence.toml`

```toml
# content/sub_economies/intelligence.toml
# The intelligence branch — the research-speed feeders. exec_domain =
# chief_scientist. These are force-multiplier sub-economies: their main output is
# research_speed that accelerates all your R&D. Fast-growing (branch_pacing 1.4).

# ===========================================================================
# AGI SERVICES — huge revenue + research_speed + runs divisions
# ===========================================================================
[agi_services]
id = "agi_services"
name = "AGI Services"
opened_by = "artificial_general_intelligence"
branch = "intelligence"
scale_label = "service capacity"
description = """The general intelligence you built, offered to the world — and \
turned inward to accelerate everything you do. It earns enormous revenue as a \
service, speeds every research program you run, and can run divisions of your \
empire on its own. The most valuable thing any company has ever operated."""
icon = "sparkles"

[agi_services.scale]
starting_scale = 100
scale_cap = 50000
growth_rate = 0.06
exec_domain = "chief_scientist"

[agi_services.produces]
revenue_per_scale = 0.02         # huge revenue
[agi_services.produces.resources]
research_speed = 0.01            # accelerates ALL R&D
division_automation = 0.004      # can run divisions (eases exec load / ops cost)

[agi_services.consumes]
upkeep_per_scale = 0.005
[agi_services.consumes.resources]
compute = 0.002                  # AGI services run on your compute capacity

[agi_services.power]
power_per_scale_tier = [ [1000, 2], [10000, 4], [30000, 5], [50000, 5] ]

[agi_services.events]
pool = "agi_services_events"
crisis_chance = 0.05             # regulatory pressure, outages, alignment scrutiny

[agi_services.feeds_synergies]
research_speed = ["agi_accelerates_all_rd"]
division_automation = ["agi_runs_divisions"]

# ===========================================================================
# QUANTUM SERVICES — revenue + quantum advantage (materials/optimization)
# ===========================================================================
[quantum_services]
id = "quantum_services"
name = "Quantum Compute Services"
opened_by = "quantum_supremacy_platform"
branch = "intelligence"
scale_label = "qubit capacity"
description = """Fault-tolerant quantum compute offered at scale — solving in hours \
what classical machines never could. It earns as a platform and gives your \
research a quantum edge in chemistry, materials, and optimization that no rival \
without it can answer."""
icon = "atom"

[quantum_services.scale]
starting_scale = 50
scale_cap = 10000
growth_rate = 0.05
exec_domain = "chief_scientist"

[quantum_services.produces]
revenue_per_scale = 0.014
[quantum_services.produces.resources]
quantum_advantage = 0.006        # boosts materials/optimization research

[quantum_services.consumes]
upkeep_per_scale = 0.004
[quantum_services.consumes.resources]
compute = 0.001

[quantum_services.power]
power_per_scale_tier = [ [1000, 2], [5000, 3], [10000, 4] ]

[quantum_services.events]
pool = "quantum_services_events"
crisis_chance = 0.045            # cryptography panic, security scrutiny

[quantum_services.feeds_synergies]
quantum_advantage = ["quantum_advantage_all_rd", "cheap_raw_materials"]

# ===========================================================================
# DISCOVERY ENGINE — research_speed across ALL fronts (force multiplier)
# ===========================================================================
[discovery_engine]
id = "discovery_engine"
name = "Automated Discovery Engine"
opened_by = "accelerated_science_program"
branch = "intelligence"
scale_label = "research capacity"
description = """An AI-driven discovery engine pointed at every problem your empire \
works on — a machine for making breakthroughs that compounds your research pace in \
every front at once. It earns less directly than AGI services, and its value is \
the speed it lends everything else: the rate of progress itself, accelerated."""
icon = "flask"

[discovery_engine.scale]
starting_scale = 80
scale_cap = 20000
growth_rate = 0.055
exec_domain = "chief_scientist"

[discovery_engine.produces]
revenue_per_scale = 0.006
[discovery_engine.produces.resources]
research_speed = 0.014           # the biggest research-speed feeder

[discovery_engine.consumes]
upkeep_per_scale = 0.003
[discovery_engine.consumes.resources]
compute = 0.0015

[discovery_engine.power]
power_per_scale_tier = [ [2000, 2], [10000, 3], [20000, 4] ]

[discovery_engine.events]
pool = "discovery_engine_events"
crisis_chance = 0.03

[discovery_engine.feeds_synergies]
research_speed = ["all_rd_compounding", "agi_accelerates_all_rd"]
```

## `content/sub_economies/economic.toml`

```toml
# content/sub_economies/economic.toml
# The economic branch — the recurring-revenue engines. exec_domain =
# chief_executive. Fastest-scaling (branch_pacing 1.5); power comes from economic
# indispensability rather than physical infrastructure.

# ===========================================================================
# PLATFORM TOLLS — high-margin recurring revenue + economic lock-in
# ===========================================================================
[platform_tolls]
id = "platform_tolls"
name = "Sector Platform"
opened_by = "sector_dominance_platform"
branch = "economic"
scale_label = "platform volume"
description = """The toll road an entire industry runs on — every transaction in \
the sector passing through systems you own, each one a sliver of margin. High, \
recurring, and almost impossible to dislodge: the industry can't function without \
you, which is exactly why the revenue never stops."""
icon = "globe-lock"

[platform_tolls.scale]
starting_scale = 500
scale_cap = 100000
growth_rate = 0.06
exec_domain = "chief_executive"

[platform_tolls.produces]
revenue_per_scale = 0.01         # high-margin recurring
[platform_tolls.produces.resources]
market_lock_in = 0.003           # economic indispensability (power + defensive)

[platform_tolls.consumes]
upkeep_per_scale = 0.0015
[platform_tolls.consumes.resources]
compute = 0.0005

[platform_tolls.power]
power_per_scale_tier = [ [5000, 1], [30000, 2], [100000, 3] ]

[platform_tolls.events]
pool = "platform_tolls_events"
crisis_chance = 0.04             # antitrust scrutiny, lock-in backlash

[platform_tolls.feeds_synergies]
market_lock_in = ["economic_gravity", "industry_lock_in"]

# ===========================================================================
# AUTONOMOUS ECONOMY — the biggest economic engine
# ===========================================================================
[autonomous_economy]
id = "autonomous_economy"
name = "Autonomous Economy Platform"
opened_by = "autonomous_economy_platform"
branch = "economic"
scale_label = "platform volume"
description = """A growing share of the world's businesses born, run, and grown on \
your platform — software you own managing a meaningful slice of all economic \
activity. The single largest economic engine you operate, and the point at which \
the line between your company and the economy itself begins to disappear."""
icon = "building"

[autonomous_economy.scale]
starting_scale = 800
scale_cap = 500000
growth_rate = 0.06
exec_domain = "chief_executive"

[autonomous_economy.produces]
revenue_per_scale = 0.012        # massive revenue at scale
[autonomous_economy.produces.resources]
economic_substrate = 0.004
division_automation = 0.003      # also runs divisions (shares the AGI synergy)

[autonomous_economy.consumes]
upkeep_per_scale = 0.0018
[autonomous_economy.consumes.resources]
compute = 0.0008

[autonomous_economy.power]
power_per_scale_tier = [ [10000, 2], [100000, 3], [300000, 4], [500000, 4] ]

[autonomous_economy.events]
pool = "autonomous_economy_events"
crisis_chance = 0.045            # jobs backlash, antitrust, concentration fears

[autonomous_economy.feeds_synergies]
economic_substrate = ["economic_gravity"]
division_automation = ["agi_runs_divisions"]
```
