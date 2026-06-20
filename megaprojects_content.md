# Megaprojects — Authored Content

The civilizational endgame tier — all 11 megaprojects the R&D tree's frontier programs point at. Each is a multi-year, staged, can-fail endeavor that changes the game and the world on completion. Authored against the *Megaprojects: Design & Authoring Spec*.

**Drop-in paths:**
- `content/megaprojects/<branch>.toml` (grouped by branch: space, intelligence, economic)
- `content/megaprojects/_tuning.toml` (slots + per-branch pacing)

---

## Validation summary

All content passes the spec's Part 7 checklist:

- **All 11 megaprojects authored** — clears the `09` dangling-reference warnings for megaprojects.
- **Bidirectional research↔megaproject check passes**: every `requires.research` is a real frontier program from `09`, and every frontier program's `megaproject_unlock` resolves to a real megaproject.
- **Both two-pillar marquees are symmetric**: AGI requires the lab's AGI program **and** chips' neuromorphic substrate (two fronts); Mars Colony requires launch's interplanetary transport **and** stations' closed-loop habitation (two fronts). Both pillars point back at the megaproject in the R&D tree.
- **The ambition tech-tree is acyclic**: `mars_transit_line → mars_colony → oneill_cylinder`; `artificial_general_intelligence → autonomous_economy_platform`.
- Every `prerequisite_megaprojects` and `unlocks_megaprojects` id resolves; every megaproject is reachable.
- Every `requires.capacity` key is a real capacity type in the megaproject's fronts.
- Every megaproject has ≥2 stages; every stage has `cost`, `weeks`, and `setback_chance` in [0,1].
- `_tuning.toml` has the global block + all four branch blocks.

**The 11 megaprojects by branch:**

| branch | megaprojects |
|---|---|
| space | mars_transit_line, mars_colony, asteroid_mining_operation, oneill_cylinder, orbital_ring |
| intelligence | artificial_general_intelligence, quantum_supremacy_platform, accelerated_science_program |
| energy | orbital_solar_array |
| economic | sector_dominance_platform, autonomous_economy_platform |

**The ambition tech-tree (prerequisite chains):**

- `mars_transit_line` → unlocks `mars_colony` → unlocks `oneill_cylinder`
- `artificial_general_intelligence` → unlocks `autonomous_economy_platform`

---

## Engine-known tags referenced (for the systems built later)

`on_complete` hooks reference sub-economies, synergies, capabilities, exec domains, and legacy victories that downstream `08` systems instantiate. The loader treats unknown ids as `ContentDB.warnings`, not failures. The ids used:

- **sub_economy**: mars_logistics, mars_colony, asteroid_materials, space_power, orbital_city, ring_access, agi_services, quantum_services, discovery_engine, platform_tolls, autonomous_economy
- **exec_required**: space_program, chief_scientist, chief_executive
- **legacy_victory**: first_on_mars, asteroid_economy, powered_the_world, built_a_world, ringed_the_world, achieved_agi, quantum_supremacy, automated_discovery, owned_an_industry, automated_the_economy

---

## `content/megaprojects/_tuning.toml`

```toml
# content/megaprojects/_tuning.toml
# Slots + per-branch pacing. Slots are the late-game scarcity: even with infinite
# money you can't build Mars AND AGI AND an orbital ring at once early on. The
# constraint is choice, not cash.

[global]
starting_megaproject_slots = 1   # how many megaprojects you can run at once at first
max_megaproject_slots = 3        # ceiling, raised by stature thresholds + certain completions
# Slot sources beyond starting: stature thresholds (engine), and on_complete grants
# that raise the cap. Engine sums and clamps to max.

# Per-branch pacing multipliers (same pattern as products/research _tuning).
[space]
cost_mult = 1.0
time_mult = 1.0                  # the reference: space megas are the big, slow builds

[intelligence]
cost_mult = 1.0
time_mult = 0.9                  # software-ish megas move a bit faster

[energy]
cost_mult = 1.1
time_mult = 1.1                  # planetary-scale energy infrastructure is slow and dear

[economic]
cost_mult = 0.8                  # economic-dominance megas cost less capital...
time_mult = 0.9                  # ...but are gated harder on stature (in each file's requires)
```

## `content/megaprojects/space.toml`

```toml
# content/megaprojects/space.toml
# The space branch — the civilizational space endgame. Ordered so the prerequisite
# chain reads top to bottom: transit line -> Mars colony -> O'Neill cylinder.
# All requires.research ids are real frontier programs (09); all
# prerequisite/unlocks ids resolve within the full megaproject set.

# ===========================================================================
# MARS TRANSIT LINE — prerequisite for the Mars Colony
# ===========================================================================
[mars_transit_line]
id = "mars_transit_line"
name = "Mars Transit Line"
branch = "space"
tagline = "Routine, scheduled passage between Earth and Mars."
description = """Before anyone settles Mars, someone has to make getting there \
ordinary. Not a heroic one-off mission but a transit line — ships leaving on a \
schedule, cargo and crew moving both ways every launch window. It is the railroad \
to another planet, and whoever lays the track owns the route. Unglamorous next to a \
colony, and utterly indispensable to one."""
icon = "route"

[mars_transit_line.requires]
research = ["interplanetary_transport"]      # launch frontier program (09)
fronts = ["launch_services"]
stature_min = 24000              # $24B
capital_min = 900
exec_required = "space_program"
prerequisite_megaprojects = []
capacity = { launch_capacity = 8 }

[[mars_transit_line.stages]]
name = "Proving flights"
description = "Uncrewed cargo runs that prove the route and pre-position supplies."
cost = 500
weeks = 80
setback_chance = 0.25
milestone = "Cargo is landing on Mars on schedule. The route is real."
partial_benefit = { power = 1 }

[[mars_transit_line.stages]]
name = "Crewed cadence"
description = "Regular crewed transits, each launch window, reliably."
cost = 750
weeks = 110
setback_chance = 0.3
milestone = "People now travel to Mars and back as a matter of routine. Agencies line up to book seats."
partial_benefit = { sub_economy_preview = "mars_logistics" }

[[mars_transit_line.stages]]
name = "Established line"
description = "A permanent two-way logistics artery between the worlds."
cost = 1000
weeks = 140
setback_chance = 0.25

[mars_transit_line.on_complete]
power = 2
sub_economy = "mars_logistics"
synergies = ["cislunar_logistics"]
capability = { interplanetary_routine = 1.0 }
unlocks_megaprojects = ["mars_colony"]
legacy_victory = ""
narrative = """The first regularly scheduled service to another planet now departs \
under your flag. Mars is no longer a destination humans visit. It is a place they \
go."""

[mars_transit_line.risk_profile]
volatility = 0.9

# ===========================================================================
# MARS COLONY — the two-pillar space marquee
# ===========================================================================
[mars_colony]
id = "mars_colony"
name = "Mars Colony"
branch = "space"
tagline = "A permanent, self-sustaining human settlement on Mars."
description = """The defining endeavor of the century. Not a flag and a footprint — \
a city that feeds itself, makes its own air and water, and grows without Earth. \
Getting people there is one problem; keeping them alive there forever is another, \
and you intend to solve both. The company that settles Mars is no longer a company. \
It is a power in its own right, and the first the species has seen that answers to \
no nation."""
icon = "planet"

[mars_colony.requires]
research = ["interplanetary_transport", "closed_loop_habitation"]   # launch + stations — two pillars
fronts = ["launch_services", "space_stations"]
stature_min = 35000              # $35B — titan-tier
capital_min = 1500
exec_required = "space_program"
prerequisite_megaprojects = ["mars_transit_line"]
capacity = { launch_capacity = 12 }

[[mars_colony.stages]]
name = "First landing"
description = "Crewed landing and the first permanent surface foothold."
cost = 600
weeks = 90
setback_chance = 0.25
milestone = "Humanity's first permanent presence on another planet. The world stops to watch."
partial_benefit = { power = 1 }

[[mars_colony.stages]]
name = "Outpost"
description = "A working base — power, life support, the first industry."
cost = 900
weeks = 120
setback_chance = 0.3
milestone = "The outpost is self-running. Tenants and agencies start paying for a seat."
partial_benefit = { sub_economy_preview = "mars_outpost" }

[[mars_colony.stages]]
name = "Settlement"
description = "Hundreds of residents, local manufacturing, the beginnings of an economy."
cost = 1400
weeks = 160
setback_chance = 0.3
catastrophe = { chance = 0.05, narrative = "A habitat breach costs lives and dominates every headline on Earth.", power = -1, reputation_hit = true }

[[mars_colony.stages]]
name = "Self-sufficiency"
description = "The colony no longer needs Earth. It grows on its own."
cost = 2000
weeks = 200
setback_chance = 0.25
milestone = "Mars feeds, powers, and builds for itself. It will outlast any supply line from home."

[mars_colony.on_complete]
power = 4
sub_economy = "mars_colony"
synergies = ["off_world_resources", "mars_manufacturing"]
capability = { multiplanetary = 1.0 }
unlocks_megaprojects = ["oneill_cylinder"]
legacy_victory = "first_on_mars"
narrative = """They said it couldn't be done in a lifetime. You did it in a career. \
There are children on Mars now who will never see Earth, and they were born under \
your company's flag, not a nation's."""

[mars_colony.risk_profile]
volatility = 1.0

# ===========================================================================
# ASTEROID MINING OPERATION — opens a materials sub-economy
# ===========================================================================
[asteroid_mining_operation]
id = "asteroid_mining_operation"
name = "Asteroid Mining Operation"
branch = "space"
tagline = "Harvest the asteroids — and feed the materials back to Earth."
description = """The asteroids hold more metal than humanity has mined in all of \
history — platinum, nickel, rare earths, water for propellant. Reaching them and \
working them at scale opens a materials stream that flows back into your fabs and \
your rockets, breaking the resource limits that bind everyone still digging on \
Earth. The first trillion-dollar resource is not on this planet."""
icon = "gem"

[asteroid_mining_operation.requires]
research = ["orbital_industrial_base"]       # satellites frontier program (09)
fronts = ["satellite_constellations"]
stature_min = 30000
capital_min = 1200
exec_required = "space_program"
prerequisite_megaprojects = []
capacity = { sat_manufacturing = 12 }

[[asteroid_mining_operation.stages]]
name = "Prospecting fleet"
description = "Robotic scouts survey and tag the most valuable near-Earth bodies."
cost = 550
weeks = 85
setback_chance = 0.3
milestone = "The first target is claimed and characterized. The numbers are staggering."
partial_benefit = { power = 1 }

[[asteroid_mining_operation.stages]]
name = "First extraction"
description = "Robotic miners return the first commercial payload of asteroid material."
cost = 850
weeks = 120
setback_chance = 0.35
milestone = "Off-world metal reaches your fabs. Material costs across your empire begin to fall."
partial_benefit = { sub_economy_preview = "asteroid_materials" }

[[asteroid_mining_operation.stages]]
name = "Industrial operation"
description = "A standing fleet works the belt; a steady stream of material flows home."
cost = 1300
weeks = 155
setback_chance = 0.3

[asteroid_mining_operation.on_complete]
power = 3
sub_economy = "asteroid_materials"
synergies = ["cheap_raw_materials", "off_world_resources"]
capability = { resource_independence = 1.0 }
unlocks_megaprojects = []
legacy_victory = "asteroid_economy"
narrative = """The resource constraints that have shaped every economy in human \
history no longer apply to you. While your rivals bid against each other for what \
the Earth can dig up, you own a supply line to the sky."""

[asteroid_mining_operation.risk_profile]
volatility = 1.1

# ===========================================================================
# ORBITAL SOLAR ARRAY — energy branch (space-built)
# ===========================================================================
[orbital_solar_array]
id = "orbital_solar_array"
name = "Orbital Solar Array"
branch = "energy"
tagline = "Clean baseload power, beamed to Earth from orbit."
description = """In orbit the sun never sets and no atmosphere dims it. Vast arrays \
collecting that light and beaming it down as clean, constant power could supply a \
meaningful slice of the planet's energy — baseload, carbon-free, immune to night \
and weather. It is a megastructure that rewrites the energy map of the world, and \
makes its builder a utility to civilization itself."""
icon = "sun"

[orbital_solar_array.requires]
research = ["space_solar_power"]             # satellites frontier program (09)
fronts = ["satellite_constellations"]
stature_min = 32000
capital_min = 1300
exec_required = "space_program"
prerequisite_megaprojects = []
capacity = { sat_manufacturing = 14 }

[[orbital_solar_array.stages]]
name = "Pilot array"
description = "A first orbital collector beams real power to a ground station."
cost = 600
weeks = 90
setback_chance = 0.3
milestone = "Power from space lights a city grid for the first time. The proof is undeniable."
partial_benefit = { power = 1 }

[[orbital_solar_array.stages]]
name = "Utility-scale array"
description = "A constellation of collectors supplies power at commercial scale."
cost = 1100
weeks = 140
setback_chance = 0.3
milestone = "You are now a power utility with no fuel cost and no carbon. Nations come to negotiate."
partial_benefit = { sub_economy_preview = "space_power" }

[[orbital_solar_array.stages]]
name = "Planetary grid"
description = "A network supplying clean baseload power across continents."
cost = 1700
weeks = 175
setback_chance = 0.28

[orbital_solar_array.on_complete]
power = 4
sub_economy = "space_power"
synergies = ["abundant_clean_energy"]
capability = { energy_dominance = 1.0 }
unlocks_megaprojects = []
legacy_victory = "powered_the_world"
narrative = """The lights of whole nations now run on sunlight you collect above the \
sky. Energy — the input under every other input — flows from your arrays. When the \
grid depends on you, so does everything the grid touches."""

[orbital_solar_array.risk_profile]
volatility = 1.0

# ===========================================================================
# O'NEILL CYLINDER — capstone habitat (requires Mars)
# ===========================================================================
[oneill_cylinder]
id = "oneill_cylinder"
name = "O'Neill Cylinder"
branch = "space"
tagline = "A rotating space city for millions, built in orbit."
description = """The dream at the end of the space age: a city not on a planet but \
in space itself — a vast rotating cylinder, miles long, spinning to make its own \
gravity, holding rivers and farms and millions of people under a sky you built. It \
is the capstone of everything humanity learned settling Mars and living in orbit. \
The civilization that builds one is no longer bound to any world at all."""
icon = "cylinder"

[oneill_cylinder.requires]
research = ["artificial_gravity_habitat"]    # stations frontier program (09)
fronts = ["space_stations"]
stature_min = 45000              # the highest space-branch gate
capital_min = 2500
exec_required = "space_program"
prerequisite_megaprojects = ["mars_colony"]  # large-habitat + colony experience first
capacity = { module_construction = 18 }

[[oneill_cylinder.stages]]
name = "Structural spine"
description = "The kilometers-long rotating frame is assembled in orbit."
cost = 1400
weeks = 150
setback_chance = 0.3
milestone = "A structure visible from Earth with the naked eye now turns slowly in orbit."
partial_benefit = { power = 1 }

[[oneill_cylinder.stages]]
name = "Interior buildout"
description = "Land, water, atmosphere, and the first neighborhoods take shape inside."
cost = 2200
weeks = 185
setback_chance = 0.3
catastrophe = { chance = 0.05, narrative = "A spin-up anomaly threatens the structure and forces a costly evacuation.", power = -1, reputation_hit = true }

[[oneill_cylinder.stages]]
name = "First million residents"
description = "A self-contained city, fully populated, thriving under its built sky."
cost = 3000
weeks = 220
setback_chance = 0.28

[oneill_cylinder.on_complete]
power = 5
sub_economy = "orbital_city"
synergies = ["space_native_civilization", "off_world_resources"]
capability = { space_civilization = 1.0 }
unlocks_megaprojects = []
legacy_victory = "built_a_world"
narrative = """A million people live in a world you made, under a sky you raised, in \
gravity you spun from nothing. Humanity began on Earth. It does not end there — and \
the first place it went next, you built."""

[oneill_cylinder.risk_profile]
volatility = 1.1

# ===========================================================================
# ORBITAL RING — infrastructure that rewrites launch
# ===========================================================================
[orbital_ring]
id = "orbital_ring"
name = "Orbital Ring"
branch = "space"
tagline = "A ring around the Earth — near-free access to space."
description = """A structure encircling the entire planet, held in orbit and \
anchored to the ground by tethers, turning the climb to space from a violent rocket \
launch into something closer to an elevator ride. It collapses the cost of reaching \
orbit to almost nothing and makes everything above — stations, arrays, cities — \
trivially cheap to build. It is the single greatest piece of infrastructure the \
species has ever attempted."""
icon = "circle-dashed"

[orbital_ring.requires]
research = ["space_elevator_tether"]         # launch frontier program (09)
fronts = ["launch_services"]
stature_min = 48000              # the highest stature gate of any space mega
capital_min = 3000
exec_required = "space_program"
prerequisite_megaprojects = []
capacity = { launch_capacity = 20 }

[[orbital_ring.stages]]
name = "Tether anchor"
description = "The first ground-to-orbit tether and its orbital counterweight are established."
cost = 1600
weeks = 160
setback_chance = 0.32
milestone = "A physical link between the ground and orbit now exists. It has never been done."
partial_benefit = { power = 1 }

[[orbital_ring.stages]]
name = "Ring segment"
description = "A continuous powered ring structure is built out across a full orbit."
cost = 2600
weeks = 200
setback_chance = 0.32
catastrophe = { chance = 0.06, narrative = "A tether failure rains debris and forces a global safety reckoning.", power = -1, reputation_hit = true }

[[orbital_ring.stages]]
name = "Full ring & access"
description = "The completed ring offers cheap, routine passage to orbit for all."
cost = 3600
weeks = 240
setback_chance = 0.3

[orbital_ring.on_complete]
power = 5
sub_economy = "ring_access"
synergies = ["near_free_launch", "space_native_civilization"]
capability = { launch_infrastructure = 1.0 }
unlocks_megaprojects = []
legacy_victory = "ringed_the_world"
narrative = """A ring of light circles the Earth now, and everyone can see it. The \
journey to space, once the most violent and expensive thing humans did, is now a \
ride. You did not just reach orbit. You annexed it to the Earth."""

[orbital_ring.risk_profile]
volatility = 1.2
```

## `content/megaprojects/intelligence.toml`

```toml
# content/megaprojects/intelligence.toml
# The intelligence branch — the compute/mind endgame. AGI is the two-pillar
# marquee (lab + chips). All requires.research ids are real frontier programs (09).

# ===========================================================================
# ARTIFICIAL GENERAL INTELLIGENCE — the two-pillar intelligence marquee
# ===========================================================================
[artificial_general_intelligence]
id = "artificial_general_intelligence"
name = "Artificial General Intelligence"
branch = "intelligence"
tagline = "A machine mind with human-level generality — and beyond."
description = """The threshold the whole field has been racing toward. A system that \
can learn anything a person can and then exceed it, across every domain at once. It \
cannot be done on software alone — it needs a computing substrate no ordinary fab \
can make. Finish it and every other endeavor you run accelerates, the economy \
reorganizes around what you've built, and you hold something governments will both \
court and fear."""
icon = "sparkles"

[artificial_general_intelligence.requires]
research = ["artificial_general_intelligence", "neuromorphic_substrate"]  # lab + chips
fronts = ["frontier_model_lab", "ai_chips"]
stature_min = 40000              # the highest stature gate — $40B
capital_min = 2000
exec_required = "chief_scientist"
prerequisite_megaprojects = []
capacity = { compute = 30 }

[[artificial_general_intelligence.stages]]
name = "Proto-AGI"
description = "A system that generalizes across domains it was never trained on."
cost = 1200
weeks = 110
setback_chance = 0.35
milestone = "It solves a problem no one taught it how to solve. The team goes quiet."
partial_benefit = { power = 1 }

[[artificial_general_intelligence.stages]]
name = "General capability"
description = "Human-level across the board. The world realizes what you have."
cost = 1800
weeks = 150
setback_chance = 0.35
catastrophe = { chance = 0.06, narrative = "An alignment scare goes public. Regulators and the press descend.", power = -1, reputation_hit = true }

[[artificial_general_intelligence.stages]]
name = "Superintelligence threshold"
description = "The system improves itself faster than any team could. You are steering history."
cost = 2600
weeks = 180
setback_chance = 0.3
catastrophe = { chance = 0.08, narrative = "A capability the system developed on its own forces a global reckoning about who controls it.", power = -2, reputation_hit = true }

[artificial_general_intelligence.on_complete]
power = 5                        # the single largest power source in the game
sub_economy = "agi_services"
synergies = ["agi_accelerates_all_rd", "agi_runs_divisions"]
capability = { agi = 1.0 }
unlocks_megaprojects = ["autonomous_economy_platform"]
legacy_victory = "achieved_agi"
narrative = """You built a mind. Not a product, not a feature — a mind. The questions \
that follow are no longer about markets. They are about what you do with the most \
important thing any company has ever made, and whether the world will let you keep it."""

[artificial_general_intelligence.risk_profile]
volatility = 1.3                 # the riskiest endeavor in the game

# ===========================================================================
# QUANTUM SUPREMACY PLATFORM
# ===========================================================================
[quantum_supremacy_platform]
id = "quantum_supremacy_platform"
name = "Quantum Supremacy Platform"
branch = "intelligence"
tagline = "Quantum computing at scale — breaking the limits of the classical."
description = """A fault-tolerant quantum computer large enough to solve what no \
classical machine ever could: cracking encryption, simulating molecules atom by \
atom, optimizing systems of planetary complexity. Whoever holds practical quantum \
supremacy holds a key that opens cryptography, materials science, and logistics all \
at once — and a capability the world's governments will treat as a matter of \
national security."""
icon = "atom"

[quantum_supremacy_platform.requires]
research = ["quantum_accelerator"]           # chips frontier program (09)
fronts = ["ai_chips"]
stature_min = 34000
capital_min = 1600
exec_required = "chief_scientist"
prerequisite_megaprojects = []
capacity = { fab_line = 14 }

[[quantum_supremacy_platform.stages]]
name = "Logical qubit array"
description = "Enough error-corrected logical qubits to run real algorithms reliably."
cost = 900
weeks = 120
setback_chance = 0.35
milestone = "A stable logical qubit array runs a calculation no classical computer can match."
partial_benefit = { power = 1 }

[[quantum_supremacy_platform.stages]]
name = "Fault-tolerant scale"
description = "A machine large enough to break problems that matter commercially and strategically."
cost = 1500
weeks = 160
setback_chance = 0.32
catastrophe = { chance = 0.05, narrative = "Word that you can break standard encryption leaks; a security panic erupts.", power = -1, reputation_hit = true }

[[quantum_supremacy_platform.stages]]
name = "Quantum cloud"
description = "Quantum compute offered at scale — the platform an industry builds on."
cost = 2100
weeks = 185
setback_chance = 0.3

[quantum_supremacy_platform.on_complete]
power = 4
sub_economy = "quantum_services"
synergies = ["quantum_advantage_all_rd", "cheap_raw_materials"]
capability = { quantum_supremacy = 1.0 }
unlocks_megaprojects = []
legacy_victory = "quantum_supremacy"
narrative = """Problems that would have taken the universe's lifetime to solve now \
resolve overnight in your machines. Encryption, chemistry, optimization — whole \
fields reorganize around access to what only you can do."""

[quantum_supremacy_platform.risk_profile]
volatility = 1.2

# ===========================================================================
# ACCELERATED SCIENCE PROGRAM — the force-multiplier mega
# ===========================================================================
[accelerated_science_program]
id = "accelerated_science_program"
name = "Accelerated Science Program"
branch = "intelligence"
tagline = "An AI-driven discovery engine that compounds all your research."
description = """Point a superhuman scientific intelligence at every problem your \
empire is working on at once — and watch the pace of discovery itself accelerate. \
This is not a single breakthrough but a machine for making breakthroughs: a \
discovery engine that compounds every research program you run, in every front, \
forever. The company that automates science doesn't win one race. It wins all of \
them, faster every year."""
icon = "flask"

[accelerated_science_program.requires]
research = ["superhuman_science"]            # lab frontier program (09)
fronts = ["frontier_model_lab"]
stature_min = 33000
capital_min = 1400
exec_required = "chief_scientist"
prerequisite_megaprojects = []
capacity = { compute = 22 }

[[accelerated_science_program.stages]]
name = "Autonomous lab"
description = "AI systems that form hypotheses, run experiments, and learn — end to end."
cost = 800
weeks = 100
setback_chance = 0.28
milestone = "The system makes an original discovery overnight, with no human in the loop."
partial_benefit = { power = 1 }

[[accelerated_science_program.stages]]
name = "Cross-domain engine"
description = "One discovery engine accelerating research across every front you operate."
cost = 1300
weeks = 140
setback_chance = 0.28
milestone = "Every research program you run is now moving faster than your rivals can follow."
partial_benefit = { sub_economy_preview = "discovery_engine" }

[[accelerated_science_program.stages]]
name = "Compounding discovery"
description = "Each breakthrough feeds the next; the rate of progress itself climbs."
cost = 1900
weeks = 170
setback_chance = 0.27

[accelerated_science_program.on_complete]
power = 3
sub_economy = "discovery_engine"
synergies = ["all_rd_compounding", "agi_accelerates_all_rd"]
capability = { automated_science = 1.0 }
unlocks_megaprojects = []
legacy_victory = "automated_discovery"
narrative = """Science no longer moves at the speed of human careers. It moves at the \
speed of your machines, and they do not sleep. Every field you touch advances faster \
than the rest of the world can read the papers."""

[accelerated_science_program.risk_profile]
volatility = 1.0
```

## `content/megaprojects/economic.toml`

```toml
# content/megaprojects/economic.toml
# The economic branch — power through economic indispensability rather than space
# or mind. Cheaper in capital (see _tuning: cost_mult 0.8) but gated hard on
# stature. All requires.research ids are real frontier programs (09).

# ===========================================================================
# SECTOR DOMINANCE PLATFORM — become the OS an industry runs on
# ===========================================================================
[sector_dominance_platform]
id = "sector_dominance_platform"
name = "Sector Dominance Platform"
branch = "economic"
tagline = "Become the indispensable platform an entire industry runs on."
description = """Not a bigger company — the ground every other company in a sector \
stands on. The system they all use, the standard they all integrate with, the toll \
road their commerce travels. Power here doesn't come from rockets or reactors; it \
comes from sheer economic gravity. When an entire industry cannot function without \
you, you set the terms — and no regulator can untangle the dependency without \
breaking the thing they're trying to protect."""
icon = "globe-lock"

[sector_dominance_platform.requires]
research = ["industry_operating_system"]     # saas frontier program (09)
fronts = ["vertical_ai_saas"]
stature_min = 30000
capital_min = 700                # economic megas need less capital, more stature
exec_required = "chief_executive"
prerequisite_megaprojects = []
capacity = { deployment = 30 }

[[sector_dominance_platform.stages]]
name = "Critical mass"
description = "Enough of the industry runs on you that you become the default."
cost = 400
weeks = 80
setback_chance = 0.22
milestone = "The majority of the sector now depends on your platform daily. The tipping point is past."
partial_benefit = { power = 1 }

[[sector_dominance_platform.stages]]
name = "Standard-setter"
description = "Your platform's way of doing things becomes the industry standard."
cost = 650
weeks = 110
setback_chance = 0.22
milestone = "Competitors now build to your standard. You define how the sector works."
partial_benefit = { sub_economy_preview = "platform_tolls" }

[[sector_dominance_platform.stages]]
name = "Indispensable infrastructure"
description = "The industry cannot function without you. You are infrastructure."
cost = 950
weeks = 140
setback_chance = 0.2

[sector_dominance_platform.on_complete]
power = 3
sub_economy = "platform_tolls"
synergies = ["economic_gravity", "industry_lock_in"]
capability = { sector_indispensability = 1.0 }
unlocks_megaprojects = []
legacy_victory = "owned_an_industry"
narrative = """An entire industry runs on rails you laid. Every transaction in the \
sector passes through your systems, and pulling the plug is no longer something \
anyone — competitor or regulator — can afford to do. You are not in the market. You \
are the market."""

[sector_dominance_platform.risk_profile]
volatility = 0.8

# ===========================================================================
# AUTONOMOUS ECONOMY PLATFORM — software that runs whole companies
# ===========================================================================
[autonomous_economy_platform]
id = "autonomous_economy_platform"
name = "Autonomous Economy Platform"
branch = "economic"
tagline = "Software that runs whole companies — and reshapes the economy."
description = """A platform that doesn't just help businesses operate but runs them \
— AI-native companies that need almost no staff, spun up and managed by your \
system. Sell it widely enough and you don't serve the economy, you reshape it: a \
growing share of all economic activity runs on your infrastructure, managed by your \
software, dependent on your platform. A quiet revolution that ends with you holding \
more of the economy than any institution in history."""
icon = "building"

[autonomous_economy_platform.requires]
research = ["autonomous_enterprise"]         # saas frontier program (09)
fronts = ["vertical_ai_saas"]
stature_min = 38000
capital_min = 900
exec_required = "chief_executive"
prerequisite_megaprojects = []               # AGI unlocks this too, but it stands alone
capacity = { deployment = 40 }

[[autonomous_economy_platform.stages]]
name = "Autonomous firms"
description = "The first companies run almost entirely by your platform go live."
cost = 600
weeks = 90
setback_chance = 0.25
milestone = "A company with three employees and your software out-competes rivals with three hundred."
partial_benefit = { power = 1 }

[[autonomous_economy_platform.stages]]
name = "Platform economy"
description = "A growing share of all new businesses are born running on your system."
cost = 1000
weeks = 130
setback_chance = 0.25
catastrophe = { chance = 0.04, narrative = "A backlash over jobs and concentration triggers antitrust and public fury.", power = -1, reputation_hit = true }

[[autonomous_economy_platform.stages]]
name = "Economic substrate"
description = "A meaningful fraction of the economy now runs on your autonomous platform."
cost = 1500
weeks = 165
setback_chance = 0.24

[autonomous_economy_platform.on_complete]
power = 4
sub_economy = "autonomous_economy"
synergies = ["economic_gravity", "agi_runs_divisions"]
capability = { economic_substrate = 1.0 }
unlocks_megaprojects = []
legacy_victory = "automated_the_economy"
narrative = """A growing share of the world's businesses are born, run, and grown on \
your platform, managed by software you own. You did not capture a market. You became \
the substrate markets run on — and the line between your company and the economy \
itself has begun to blur."""

[autonomous_economy_platform.risk_profile]
volatility = 0.9
```

---

## R&D tree edit (two-pillar Mars symmetry)

One edit was made to `content/research/launch_services.toml` so the Mars cross-gate is symmetric: `interplanetary_transport`'s `megaproject_unlock` now lists both `mars_transit_line` and `mars_colony` (previously only the transit line). This makes both Mars pillars — launch and stations — point at the colony, matching how both AGI pillars point at AGI.
