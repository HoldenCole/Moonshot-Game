# Sub-Economy Event Pools — Authored Content

The 11 scoped event pools every sub-economy declares via `events.pool` — the texture that makes each frontier feel alive. A Mars colony has dust storms and the first child born off-world; AGI services face outages and oversight demands; the quantum platform triggers a cryptography panic. Authored against the *Sub-Economy Event Pools* spec.

**Drop-in path:** `content/events/sub_economies/<pool_id>.toml`

---

## Validation summary

All content passes the spec's checklist:

- **45 events across 11 pools** (4–5 each) — matching the spec's target count.
- **Every pool id matches a real `events.pool` declared by a sub-economy** (`13`) — exact 1:1 coverage, no gaps or extras.
- Every event `kind` is `flavor | opportunity | crisis`.
- **Each pool has ≥4 events with the required mix**: at least one crisis-with-choices and at least one flavor event.
- Every crisis with choices has ≥2 choices, each with effects.
- All effect fields (`scale_mult`, `output_mult`, `revenue_delta`, `power_delta`, `reputation_delta`) are in the engine's sub-economy-event vocabulary; multipliers in 0.5–1.5, deltas sane.

**Three fixes vs. the spec draft** (the spec text as written had these gaps, totaling 44 events):

- `asteroid_events`: `asteroid_price_crash` was a flat-effect crisis — converted to a crisis-with-choices (keep selling into the slump vs. stockpile for internal use). The pool now has its required crisis-with-choices.
- `mars_logistics_events`: `transit_solar_flare` was a flat-effect crisis — converted to a crisis-with-choices (shelter and wait vs. push the schedule). 
- `ring_access_events`: had only 3 events — added a 4th (`ring_debris_clearance`, a flavor beat) to meet the ≥4 minimum, bringing the total to the spec's stated 45.

**Pool → sub-economy mapping:**

| pool | sub-economy | crisis_chance (from 13) |
|---|---|---|
| `mars_colony_events` | mars_colony | 0.04 |
| `mars_logistics_events` | mars_logistics | 0.035 |
| `asteroid_events` | asteroid_materials | 0.05 |
| `orbital_city_events` | orbital_city | 0.035 |
| `ring_access_events` | ring_access | 0.04 |
| `space_power_events` | space_power | 0.035 |
| `agi_services_events` | agi_services | 0.05 |
| `quantum_services_events` | quantum_services | 0.045 |
| `discovery_engine_events` | discovery_engine | 0.03 |
| `platform_tolls_events` | platform_tolls | 0.04 |
| `autonomous_economy_events` | autonomous_economy | 0.045 |

---

## `content/events/sub_economies/mars_colony_events.toml`  (5 events)

```toml
# Sub-economy event pool: mars_colony (crisis_chance 0.04)
[mars_dust_storm]
id = "mars_dust_storm"
pool = "mars_colony_events"
kind = "crisis"
weight = 1.0
cooldown_weeks = 60
headline = "Planet-wide dust storm engulfs the colony"
body = """A months-long dust storm has blacked out the solar arrays and grounded \
surface operations. The colony can ride it out on reserves — or you can rush an \
emergency resupply at real cost."""
[[mars_dust_storm.choices]]
label = "Ride it out on reserves"
[mars_dust_storm.choices.effects]
output_mult = 0.8
[[mars_dust_storm.choices]]
label = "Emergency resupply ($120M)"
[mars_dust_storm.choices.effects]
revenue_delta = -120
reputation_delta = 1

[mars_first_child]
id = "mars_first_child"
pool = "mars_colony_events"
kind = "flavor"
weight = 1.2
cooldown_weeks = 9999
headline = "The first child is born on Mars"
body = """A birth at the colony — the first human born on another world. Every \
outlet on Earth carries the story. History will remember whose flag flew over the \
settlement that day."""
[mars_first_child.effects]
power_delta = 1
reputation_delta = 1

[mars_water_discovery]
id = "mars_water_discovery"
pool = "mars_colony_events"
kind = "opportunity"
weight = 1.0
cooldown_weeks = 80
headline = "Vast subsurface ice deposit confirmed"
body = """Surveyors confirm a far larger water-ice reserve beneath the colony than \
anyone expected — easing the path to self-sufficiency and opening new growth."""
[mars_water_discovery.effects]
scale_mult = 1.05
output_mult = 1.1

[mars_habitat_breakthrough]
id = "mars_habitat_breakthrough"
pool = "mars_colony_events"
kind = "flavor"
weight = 1.0
cooldown_weeks = 60
headline = "Colony agriculture hits full self-sufficiency in greens"
body = """The hydroponics bays now supply the colony's fresh food entirely. A quiet \
milestone, and a real one — every kilo not shipped from Earth is a kilo of margin."""
[mars_habitat_breakthrough.effects]
output_mult = 1.05

[mars_governance_dispute]
id = "mars_governance_dispute"
pool = "mars_colony_events"
kind = "crisis"
weight = 0.8
cooldown_weeks = 100
headline = "Colonists petition for self-governance"
body = """The settlement's residents — citizens of no nation, employees of your \
company — are asking who governs them. How you answer shapes what the colony \
becomes, and how Earth's governments view you."""
[[mars_governance_dispute.choices]]
label = "Grant a local council"
[mars_governance_dispute.choices.effects]
reputation_delta = 1
output_mult = 1.05
[[mars_governance_dispute.choices]]
label = "Keep corporate control"
[mars_governance_dispute.choices.effects]
power_delta = 1
reputation_delta = -1
```

## `content/events/sub_economies/mars_logistics_events.toml`  (4 events)

```toml
# Sub-economy event pool: mars_logistics (crisis_chance 0.035)
[transit_window_record]
id = "transit_window_record"
pool = "mars_logistics_events"
kind = "opportunity"
weight = 1.0
cooldown_weeks = 70
headline = "Record cargo throughput this transit window"
body = """A favorable alignment and a smooth fleet rotation move more tonnage to \
Mars this window than ever before. Demand for seats and cargo space spikes."""
[transit_window_record.effects]
output_mult = 1.12

[transit_solar_flare]
id = "transit_solar_flare"
pool = "mars_logistics_events"
kind = "crisis"
weight = 1.0
cooldown_weeks = 55
headline = "Solar storm forces a transit decision"
body = """A major solar event is bearing down on the route. You can order every ship \
to shelter and ride it out — losing days and missing windows — or push the schedule \
and accept the risk to crews and cargo to keep the cadence."""
[[transit_solar_flare.choices]]
label = "Shelter and wait it out"
[transit_solar_flare.choices.effects]
output_mult = 0.85
[[transit_solar_flare.choices]]
label = "Push the schedule"
[transit_solar_flare.choices.effects]
output_mult = 0.97
reputation_delta = -1

[transit_route_optimized]
id = "transit_route_optimized"
pool = "mars_logistics_events"
kind = "flavor"
weight = 1.0
cooldown_weeks = 50
headline = "Navigation AI shaves days off the crossing"
body = """A refined trajectory model trims transit time and fuel on every crossing — \
small per trip, real across a fleet running year-round."""
[transit_route_optimized.effects]
output_mult = 1.04

[transit_competitor_exit]
id = "transit_competitor_exit"
pool = "mars_logistics_events"
kind = "opportunity"
weight = 0.8
cooldown_weeks = 90
headline = "A rival abandons its Mars cargo ambitions"
body = """The only serious competitor for the Earth-Mars freight route has folded \
its program. The artery between the worlds is effectively yours alone."""
[transit_competitor_exit.effects]
scale_mult = 1.08
power_delta = 1
```

## `content/events/sub_economies/asteroid_events.toml`  (4 events)

```toml
# Sub-economy event pool: asteroid_materials (crisis_chance 0.05)
[asteroid_motherlode]
id = "asteroid_motherlode"
pool = "asteroid_events"
kind = "opportunity"
weight = 1.0
cooldown_weeks = 70
headline = "Survey tags an exceptionally rich body"
body = """A prospected asteroid assays far higher in platinum-group metals than \
projected. Redirecting the fleet to work it would lift materials output \
substantially."""
[[asteroid_motherlode.choices]]
label = "Redirect the fleet"
[asteroid_motherlode.choices.effects]
output_mult = 1.15
[[asteroid_motherlode.choices]]
label = "Stay the course"
[asteroid_motherlode.choices.effects]
output_mult = 1.02

[asteroid_miner_lost]
id = "asteroid_miner_lost"
pool = "asteroid_events"
kind = "crisis"
weight = 1.0
cooldown_weeks = 60
headline = "A mining drone is lost to a collision"
body = """One of the robotic miners is destroyed working a tumbling body — a costly \
write-off and a dent in throughput until it's replaced."""
[asteroid_miner_lost.effects]
output_mult = 0.9
revenue_delta = -40

[asteroid_price_crash]
id = "asteroid_price_crash"
pool = "asteroid_events"
kind = "crisis"
weight = 0.8
cooldown_weeks = 80
headline = "Your own supply crashes platinum prices"
body = """You've returned so much metal that Earth markets for it are softening — \
the irony of abundance. You can keep selling into the slump and take the revenue \
hit, or hold the metal back and route it to your own fabs and yards instead."""
[[asteroid_price_crash.choices]]
label = "Keep selling into the market"
[asteroid_price_crash.choices.effects]
revenue_delta = -60
[[asteroid_price_crash.choices]]
label = "Stockpile for internal use"
[asteroid_price_crash.choices.effects]
revenue_delta = -25
output_mult = 1.05

[asteroid_refining_advance]
id = "asteroid_refining_advance"
pool = "asteroid_events"
kind = "flavor"
weight = 1.0
cooldown_weeks = 50
headline = "In-space refining yield improves"
body = """A better refining process aboard the operation returns more usable material \
per ton mined — quietly raising the value of everything the fleet sends home."""
[asteroid_refining_advance.effects]
output_mult = 1.05
```

## `content/events/sub_economies/orbital_city_events.toml`  (4 events)

```toml
# Sub-economy event pool: orbital_city (crisis_chance 0.035)
[city_population_milestone]
id = "city_population_milestone"
pool = "orbital_city_events"
kind = "flavor"
weight = 1.2
cooldown_weeks = 9999
headline = "The orbital city passes a hundred thousand residents"
body = """A hundred thousand people now live in a world you built, under a sky you \
raised. It is, by any measure, a city — the first one humanity has ever placed in \
the sky."""
[city_population_milestone.effects]
power_delta = 1
reputation_delta = 1

[city_spin_anomaly]
id = "city_spin_anomaly"
pool = "orbital_city_events"
kind = "crisis"
weight = 1.0
cooldown_weeks = 70
headline = "Rotation instability detected"
body = """Engineers flag a wobble in the cylinder's spin — the system that makes its \
gravity. A precautionary partial evacuation and recalibration would be costly but \
prudent; pressing on risks a far worse outcome."""
[[city_spin_anomaly.choices]]
label = "Pause and recalibrate ($200M)"
[city_spin_anomaly.choices.effects]
revenue_delta = -200
output_mult = 0.9
[[city_spin_anomaly.choices]]
label = "Monitor and continue"
[city_spin_anomaly.choices.effects]
output_mult = 1.0

[city_culture_blooms]
id = "city_culture_blooms"
pool = "orbital_city_events"
kind = "flavor"
weight = 1.0
cooldown_weeks = 60
headline = "A native culture takes root in the city"
body = """The city's residents — many born there — are developing their own art, \
slang, and traditions. Something genuinely new in human history is growing inside \
your structure."""
[city_culture_blooms.effects]
reputation_delta = 1

[city_immigration_wave]
id = "city_immigration_wave"
pool = "orbital_city_events"
kind = "opportunity"
weight = 1.0
cooldown_weeks = 75
headline = "Waitlist for residency surges"
body = """Demand to live in the orbital city far outstrips capacity. Accelerating \
the buildout would grow the population — and the economy — faster."""
[city_immigration_wave.effects]
scale_mult = 1.06
```

## `content/events/sub_economies/ring_access_events.toml`  (4 events)

```toml
# Sub-economy event pool: ring_access (crisis_chance 0.04)
[ring_throughput_record]
id = "ring_throughput_record"
pool = "ring_access_events"
kind = "opportunity"
weight = 1.0
cooldown_weeks = 65
headline = "Ring traffic hits a new high"
body = """With launch costs near zero, traffic to orbit is climbing faster than \
projected — every operator on Earth wants a slot. Throughput and revenue rise \
together."""
[ring_throughput_record.effects]
output_mult = 1.12
scale_mult = 1.03

[ring_tether_stress]
id = "ring_tether_stress"
pool = "ring_access_events"
kind = "crisis"
weight = 1.0
cooldown_weeks = 70
headline = "Tether stress anomaly flagged"
body = """Sensors detect dangerous stress on one of the ring's anchor tethers. \
Closing that segment for repair cuts capacity for a time; deferring the work courts \
a catastrophic failure no one wants on the record."""
[[ring_tether_stress.choices]]
label = "Close the segment and repair ($150M)"
[ring_tether_stress.choices.effects]
revenue_delta = -150
output_mult = 0.85
[[ring_tether_stress.choices]]
label = "Defer the repair"
[ring_tether_stress.choices.effects]
output_mult = 1.0

[ring_nations_negotiate]
id = "ring_nations_negotiate"
pool = "ring_access_events"
kind = "flavor"
weight = 1.0
cooldown_weeks = 80
headline = "Nations queue to negotiate ring access"
body = """Governments that once raced you to space now line up to negotiate access \
to your ring. The infrastructure of spaceflight is yours, and everyone knows it."""
[ring_nations_negotiate.effects]
power_delta = 1

[ring_debris_clearance]
id = "ring_debris_clearance"
pool = "ring_access_events"
kind = "flavor"
weight = 1.0
cooldown_weeks = 55
headline = "Ring sweepers clear a debris corridor"
body = """The ring's automated sweepers finish clearing a long-cluttered orbital \
corridor, opening cleaner lanes and smoothing traffic. The kind of quiet upkeep \
that keeps the most ambitious structure ever built running like clockwork."""
[ring_debris_clearance.effects]
output_mult = 1.03
```

## `content/events/sub_economies/space_power_events.toml`  (4 events)

```toml
# Sub-economy event pool: space_power (crisis_chance 0.035)
[grid_nation_contract]
id = "grid_nation_contract"
pool = "space_power_events"
kind = "opportunity"
weight = 1.0
cooldown_weeks = 70
headline = "A nation signs on to buy orbital power"
body = """A major economy contracts to draw baseload power from your orbital grid. \
Steady revenue — and one more place whose lights depend on you."""
[grid_nation_contract.effects]
revenue_delta = 80
power_delta = 1

[grid_beam_outage]
id = "grid_beam_outage"
pool = "space_power_events"
kind = "crisis"
weight = 1.0
cooldown_weeks = 60
headline = "A ground rectenna goes offline"
body = """A receiving station fault interrupts power delivery to a region — a visible \
outage with customers watching. A rapid fix limits the reputational damage."""
[[grid_beam_outage.choices]]
label = "Crash-fix the station ($60M)"
[grid_beam_outage.choices.effects]
revenue_delta = -60
[[grid_beam_outage.choices]]
label = "Standard repair queue"
[grid_beam_outage.choices.effects]
output_mult = 0.92
reputation_delta = -1

[grid_efficiency_gain]
id = "grid_efficiency_gain"
pool = "space_power_events"
kind = "flavor"
weight = 1.0
cooldown_weeks = 50
headline = "Beam-conversion efficiency improves"
body = """A tuning of the transmission system delivers more of the collected sunlight \
to the ground. Free margin, quietly compounding across the grid."""
[grid_efficiency_gain.effects]
output_mult = 1.05

[grid_safety_scrutiny]
id = "grid_safety_scrutiny"
pool = "space_power_events"
kind = "crisis"
weight = 0.8
cooldown_weeks = 90
headline = "Regulators question power-beaming safety"
body = """Public concern over the safety of beaming gigawatts from orbit draws \
regulatory scrutiny. A transparency campaign costs money but defuses it."""
[[grid_safety_scrutiny.choices]]
label = "Fund a transparency campaign ($40M)"
[grid_safety_scrutiny.choices.effects]
revenue_delta = -40
reputation_delta = 1
[[grid_safety_scrutiny.choices]]
label = "Weather the criticism"
[grid_safety_scrutiny.choices.effects]
reputation_delta = -1
```

## `content/events/sub_economies/agi_services_events.toml`  (4 events)

```toml
# Sub-economy event pool: agi_services (crisis_chance 0.05)
[agi_capability_jump]
id = "agi_capability_jump"
pool = "agi_services_events"
kind = "opportunity"
weight = 1.0
cooldown_weeks = 55
headline = "The system makes an unprompted leap"
body = """Your AGI demonstrates a capability no one trained or expected — useful, \
valuable, and a little unnerving. Demand for access surges."""
[agi_capability_jump.effects]
output_mult = 1.12
power_delta = 1

[agi_outage]
id = "agi_outage"
pool = "agi_services_events"
kind = "crisis"
weight = 1.0
cooldown_weeks = 50
headline = "A global AGI-services outage"
body = """The intelligence half the economy now leans on goes dark for hours. The \
revenue hit is minor; the reminder of how much depends on you is not — and \
regulators are watching how you respond."""
[[agi_outage.choices]]
label = "Full public post-mortem"
[agi_outage.choices.effects]
reputation_delta = 1
revenue_delta = -20
[[agi_outage.choices]]
label = "Quiet internal fix"
[agi_outage.choices.effects]
reputation_delta = -1

[agi_alignment_scrutiny]
id = "agi_alignment_scrutiny"
pool = "agi_services_events"
kind = "crisis"
weight = 1.0
cooldown_weeks = 70
headline = "Governments demand oversight of the AGI"
body = """The most powerful system ever built is privately owned — yours — and the \
world's governments want a say in how it's run. How you handle the demand sets the \
balance of power between you and the state."""
[[agi_alignment_scrutiny.choices]]
label = "Cooperate with an oversight board"
[agi_alignment_scrutiny.choices.effects]
reputation_delta = 1
power_delta = -1
[[agi_alignment_scrutiny.choices]]
label = "Assert private control"
[agi_alignment_scrutiny.choices.effects]
power_delta = 1
reputation_delta = -1

[agi_runs_a_division]
id = "agi_runs_a_division"
pool = "agi_services_events"
kind = "flavor"
weight = 1.0
cooldown_weeks = 60
headline = "The AGI quietly takes over a back-office division"
body = """A division that used to need hundreds of people now runs on the system \
alone, better than before. The savings are real; the implications, the staff are \
still working through."""
[agi_runs_a_division.effects]
output_mult = 1.05
```

## `content/events/sub_economies/quantum_services_events.toml`  (4 events)

```toml
# Sub-economy event pool: quantum_services (crisis_chance 0.045)
[quantum_breakthrough_sale]
id = "quantum_breakthrough_sale"
pool = "quantum_services_events"
kind = "opportunity"
weight = 1.0
cooldown_weeks = 60
headline = "A pharma giant books your quantum platform"
body = """A major drugmaker contracts your quantum compute to simulate molecules no \
classical machine could — a marquee, high-margin customer that validates the whole \
platform."""
[quantum_breakthrough_sale.effects]
revenue_delta = 70
output_mult = 1.05

[quantum_crypto_panic]
id = "quantum_crypto_panic"
pool = "quantum_services_events"
kind = "crisis"
weight = 1.0
cooldown_weeks = 80
headline = "Word spreads that you can break standard encryption"
body = """The security world realizes your platform can crack encryption protecting \
much of the internet. Panic and government attention follow. You can reassure the \
world — or let the leverage speak for itself."""
[[quantum_crypto_panic.choices]]
label = "Pledge restraint and help patch"
[quantum_crypto_panic.choices.effects]
reputation_delta = 1
power_delta = -1
[[quantum_crypto_panic.choices]]
label = "Say nothing"
[quantum_crypto_panic.choices.effects]
power_delta = 1
reputation_delta = -1

[quantum_decoherence_setback]
id = "quantum_decoherence_setback"
pool = "quantum_services_events"
kind = "crisis"
weight = 1.0
cooldown_weeks = 55
headline = "A decoherence problem degrades the array"
body = """An error-correction regression knocks a chunk of your logical qubits \
offline until it's resolved. Capacity — and the customers relying on it — take a \
hit."""
[quantum_decoherence_setback.effects]
output_mult = 0.88

[quantum_research_windfall]
id = "quantum_research_windfall"
pool = "quantum_services_events"
kind = "flavor"
weight = 1.0
cooldown_weeks = 50
headline = "Your own labs exploit the quantum edge"
body = """Internal teams use the platform to crack a materials problem that had \
stalled for years — a reminder that the most valuable customer of your quantum \
machine is you."""
[quantum_research_windfall.effects]
output_mult = 1.04
```

## `content/events/sub_economies/discovery_engine_events.toml`  (4 events)

```toml
# Sub-economy event pool: discovery_engine (crisis_chance 0.03)
[discovery_major_breakthrough]
id = "discovery_major_breakthrough"
pool = "discovery_engine_events"
kind = "opportunity"
weight = 1.0
cooldown_weeks = 55
headline = "The engine makes a landmark discovery overnight"
body = """The automated discovery system produces an original result that would have \
taken a human field years — and it's patentable. Progress across your research \
accelerates and the prestige is enormous."""
[discovery_major_breakthrough.effects]
output_mult = 1.1
reputation_delta = 1

[discovery_dead_end]
id = "discovery_dead_end"
pool = "discovery_engine_events"
kind = "flavor"
weight = 1.0
cooldown_weeks = 45
headline = "A research thread quietly fizzles"
body = """Even an automated discovery engine chases blind alleys; a promising line \
of inquiry comes to nothing. The machine moves on without complaint."""
[discovery_dead_end.effects]
output_mult = 0.97

[discovery_credit_dispute]
id = "discovery_credit_dispute"
pool = "discovery_engine_events"
kind = "crisis"
weight = 0.8
cooldown_weeks = 80
headline = "Academia disputes machine authorship"
body = """The scientific establishment is uneasy crediting discoveries to your \
machine — and uneasier that you own them. A gesture toward open publication would \
ease tensions at the cost of some advantage."""
[[discovery_credit_dispute.choices]]
label = "Publish openly"
[discovery_credit_dispute.choices.effects]
reputation_delta = 1
output_mult = 0.97
[[discovery_credit_dispute.choices]]
label = "Keep results proprietary"
[discovery_credit_dispute.choices.effects]
power_delta = 1
reputation_delta = -1

[discovery_compounding]
id = "discovery_compounding"
pool = "discovery_engine_events"
kind = "flavor"
weight = 1.0
cooldown_weeks = 60
headline = "Discovery rate ticks up again"
body = """Each breakthrough teaches the engine to find the next one faster. The \
pace of progress itself is climbing — slowly, then noticeably."""
[discovery_compounding.effects]
output_mult = 1.04
```

## `content/events/sub_economies/platform_tolls_events.toml`  (4 events)

```toml
# Sub-economy event pool: platform_tolls (crisis_chance 0.04)
[platform_sector_capture]
id = "platform_sector_capture"
pool = "platform_tolls_events"
kind = "opportunity"
weight = 1.0
cooldown_weeks = 60
headline = "A holdout industry segment adopts your platform"
body = """The last major holdouts in the sector have migrated onto your platform. \
Your share of the industry's transaction flow — and your tolls — step up."""
[platform_sector_capture.effects]
scale_mult = 1.08
revenue_delta = 50

[platform_antitrust_probe]
id = "platform_antitrust_probe"
pool = "platform_tolls_events"
kind = "crisis"
weight = 1.0
cooldown_weeks = 90
headline = "Antitrust regulators open an investigation"
body = """Your grip on the sector has drawn a formal antitrust probe. You can make \
concessions to settle quickly, or fight to keep your position intact and accept the \
scrutiny."""
[[platform_antitrust_probe.choices]]
label = "Settle with concessions"
[platform_antitrust_probe.choices.effects]
output_mult = 0.92
reputation_delta = 1
[[platform_antitrust_probe.choices]]
label = "Fight it"
[platform_antitrust_probe.choices.effects]
power_delta = 1
reputation_delta = -1

[platform_outage_dependency]
id = "platform_outage_dependency"
pool = "platform_tolls_events"
kind = "crisis"
weight = 0.9
cooldown_weeks = 55
headline = "An outage freezes the sector"
body = """Your platform goes down and the entire industry that runs on it grinds to \
a halt — a stark, public demonstration of how dependent the sector has become on \
you. Costly, and double-edged."""
[platform_outage_dependency.effects]
revenue_delta = -40
power_delta = 1
reputation_delta = -1

[platform_standard_adopted]
id = "platform_standard_adopted"
pool = "platform_tolls_events"
kind = "flavor"
weight = 1.0
cooldown_weeks = 60
headline = "Your format becomes the industry standard"
body = """A standards body ratifies your platform's way of doing things as the \
official norm. Competitors must now build to your design — a quiet, durable kind of \
power."""
[platform_standard_adopted.effects]
power_delta = 1
```

## `content/events/sub_economies/autonomous_economy_events.toml`  (4 events)

```toml
# Sub-economy event pool: autonomous_economy (crisis_chance 0.045)
[autoecon_share_surge]
id = "autoecon_share_surge"
pool = "autonomous_economy_events"
kind = "opportunity"
weight = 1.0
cooldown_weeks = 60
headline = "A wave of new firms launches on your platform"
body = """A surge of new businesses is being born already running on your autonomous \
platform — each one a sliver of the economy now flowing through your systems. The \
substrate grows."""
[autoecon_share_surge.effects]
scale_mult = 1.08
revenue_delta = 60

[autoecon_jobs_backlash]
id = "autoecon_jobs_backlash"
pool = "autonomous_economy_events"
kind = "crisis"
weight = 1.0
cooldown_weeks = 85
headline = "Backlash over jobs and concentration erupts"
body = """As your platform runs more of the economy with fewer people, public anger \
and political pressure mount. You can fund a transition initiative to soften it, or \
hold your ground and absorb the heat."""
[[autoecon_jobs_backlash.choices]]
label = "Fund a transition initiative ($100M)"
[autoecon_jobs_backlash.choices.effects]
revenue_delta = -100
reputation_delta = 1
[[autoecon_jobs_backlash.choices]]
label = "Hold your ground"
[autoecon_jobs_backlash.choices.effects]
power_delta = 1
reputation_delta = -1

[autoecon_government_dependency]
id = "autoecon_government_dependency"
pool = "autonomous_economy_events"
kind = "flavor"
weight = 1.0
cooldown_weeks = 70
headline = "A government quietly runs services on your platform"
body = """It emerges that a national government has been running parts of its own \
operations on your autonomous platform. The line between your company and the state \
blurs a little further."""
[autoecon_government_dependency.effects]
power_delta = 1

[autoecon_efficiency_record]
id = "autoecon_efficiency_record"
pool = "autonomous_economy_events"
kind = "flavor"
weight = 1.0
cooldown_weeks = 55
headline = "A three-person firm out-competes an old giant"
body = """A company with three employees and your platform has out-competed a legacy \
corporation with thirty thousand. The story captures, in miniature, the world your \
software is building."""
[autoecon_efficiency_record.effects]
output_mult = 1.04
```
