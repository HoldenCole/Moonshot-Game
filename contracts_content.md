# Contracts — Authored Content

The mid-game power converter — the system that turns *who you sell to* into a strategic identity and lets the power meter start moving long before the endgame. Authored against the *Contracts: Design & Authoring Spec*. Commercial work is clean and free; government work pays well, grants power, and entangles you.

**Drop-in path:** `content/contracts/`

---

## Validation summary

All content passes the spec's Part 5 checklist:

- **5 customer archetypes** (1 commercial + 4 government tiers: defense ministry, space agency, intelligence service, allied bloc).
- **2-tier clearance ladder** (defense_secret → intelligence_ts), graph acyclic.
- **17 contract templates** — **every sub-industry has ≥1 commercial + ≥1 government** template, so the channel choice exists everywhere.
- Every template's `customer` resolves; every `requires.rd_levels` references a real line; every `product_tier` exists in that sub-industry; every `requires.clearance` resolves.
- **Channel rules hold exactly**: commercial customers and contracts have `entanglement = 0` and `power = 0`; every government customer and contract has both `> 0`.
- All `effects` use engine-known keys (`power`, `entanglement`, `reputation`); all payments have upfront + recurring + term.
- `_tuning.toml` has global pool sizes, the mix-identity thresholds (Independent → Government Partner → National Champion → State-Entangled), and the strategic-criticality knobs.

**Per-sub-industry channel coverage:**

| sub-industry | commercial | government |
|---|---|---|
| ai_chips | hyperscaler supply | defense chip supply, allied strategic fab |
| frontier_model_lab | enterprise licensing | classified compute (intel), defense decision-support |
| vertical_ai_saas | enterprise platform | government operations platform |
| launch_services | commercial manifest | national launch (space agency), responsive defense launch |
| satellite_constellations | commercial connectivity | gov Earth observation (space agency), classified surveillance (intel) |
| space_stations | commercial lease | national research (space agency), defense orbital platform |

**The design fork, made mechanical:** the government tiers ladder by entanglement and reputation — space-agency work is reputation-*positive* (+1) and the friendliest door in; defense is entangling and reputation-negative; intelligence work is the deepest entanglement (18) and highest reputational risk (-2), with a leak-event hook. So the player steers a genuine identity over the whole game: the free commercial giant, or the national champion the state both relies on and fears.

---

## `content/contracts/_customers.toml` — Customer archetypes

```toml
# content/contracts/_customers.toml
# Customer archetypes the contract generator instantiates against. Commercial =
# clean, no strings, zero entanglement/power. Government tiers = premium, stable,
# power-granting, and entangling. The channel choice is a strategic identity.

[commercial_enterprise]
id = "commercial_enterprise"
name = "Enterprise customer"
channel = "commercial"
description = """Businesses and consumers buying your products at market rate. \
Clean, flexible, no strings — take it or leave it, switch freely. The default way \
a company grows, and the channel that keeps you nimble and unwatched."""
entanglement_per_contract = 0
power_per_contract = 0
reputation_effect = 0
requires_clearance = ""

[defense_ministry]
id = "defense_ministry"
name = "Defense Ministry"
channel = "government"
description = """The military procurement arm of a major power. Pays a premium for \
capability and priority, demands clearance and discretion, and binds you to \
delivery. Working for them makes you matter — and makes you watched."""
entanglement_per_contract = 12
power_per_contract = 2
reputation_effect = -1
requires_clearance = "defense_secret"
escalation_flavor = ["a classified capability request", "a wartime priority order"]

[space_agency]
id = "space_agency"
name = "National Space Agency"
channel = "government"
description = """A government space program contracting your launch, satellite, or \
station capability. Prestigious, stable, less ethically fraught than defense — and \
a strong, visible source of strategic standing. The friendliest door into \
government work."""
entanglement_per_contract = 8
power_per_contract = 2
reputation_effect = 1
requires_clearance = ""
escalation_flavor = ["a flagship national mission", "a crewed-program milestone"]

[intelligence_service]
id = "intelligence_service"
name = "Intelligence Service"
channel = "government"
description = """The shadow customer — wants your compute, your models, your \
satellites pointed where they say, and your silence about it. The deepest \
entanglement and the highest reputational risk if it ever surfaces."""
entanglement_per_contract = 18
power_per_contract = 3
reputation_effect = -2
requires_clearance = "intelligence_ts"
escalation_flavor = ["a black-budget capability request", "a deniable operation"]

[allied_bloc]
id = "allied_bloc"
name = "Allied Government Bloc"
channel = "government"
description = """A coalition of allied states contracting at scale — the biggest \
government money and the broadest strategic standing, available only to a company \
of real stature and clearance. To work for the bloc is to become its arsenal."""
entanglement_per_contract = 15
power_per_contract = 3
reputation_effect = 0
requires_clearance = "defense_secret"
escalation_flavor = ["a multi-nation strategic program", "a coalition priority order"]
```

## `content/contracts/_clearances.toml` — Clearance ladder

```toml
# content/contracts/_clearances.toml
# The clearance ladder. Getting cleared is itself an entanglement step — you've
# let the state vet you. Higher tiers unlock the biggest, most powerful, most
# entangling contracts. The graph is a simple chain (defense_secret ->
# intelligence_ts) and must stay acyclic.

[defense_secret]
id = "defense_secret"
name = "Defense Secret clearance"
description = """Vetting that unlocks classified defense contracts. The first real \
commitment to government work — the state now knows your people and your processes, \
and you can never quite un-know that they do."""
cost = 40
weeks = 26
entanglement_on_grant = 8
requires = { stature_min = 5000 }

[intelligence_ts]
id = "intelligence_ts"
name = "Intelligence Top Secret clearance"
description = """The deepest vetting — unlocks intelligence-service work. Granted \
only to a company already cleared for defense and large enough to be worth the \
scrutiny. Past this door, the contracts stop being public record."""
cost = 90
weeks = 39
entanglement_on_grant = 15
requires = { stature_min = 12000, prior_clearance = "defense_secret" }
```

## `content/contracts/ai.toml` — Contract templates — AI sub-industries (chips, lab, SaaS)

```toml
# content/contracts/ai.toml
# Contract templates for the AI sub-industries (ai_chips, frontier_model_lab,
# vertical_ai_saas). Each sub-industry gets >=1 commercial (clean, plentiful,
# zero entanglement) and >=1 government (premium, entangling, power-granting).
# requires.rd_levels reference real lines; product_tier exists in that sub.

# ============================ AI CHIPS ============================

[chips_commercial_supply]
id = "chips_commercial_supply"
customer = "commercial_enterprise"
name = "Hyperscaler supply agreement"
description = """A cloud provider commits to buy your accelerators in volume. Clean, \
high-volume commercial money — no clearances, no strings, and you can renegotiate \
or walk when the deal stops working."""
sub_industry = "ai_chips"
requires = { rd_levels = { architecture = 30 }, product_tier = 1, stature_min = 0 }
payment = { upfront = 30, recurring_per_year = 70, term_weeks = 104 }
deliverable = "priority_supply"
effects = { power = 0, entanglement = 0, reputation = 0 }

[defense_chip_supply]
id = "defense_chip_supply"
customer = "defense_ministry"
name = "Defense chip supply contract"
description = """A standing order for your most advanced silicon, hardened and \
prioritized for military systems. Lucrative, long, and binding — and it makes your \
fabs a national-security asset that the state will not let you walk away from."""
sub_industry = "ai_chips"
requires = { rd_levels = { process_node = 50 }, product_tier = 2, stature_min = 6000, clearance = "defense_secret" }
payment = { upfront = 80, recurring_per_year = 120, term_weeks = 156 }
deliverable = "priority_supply"
effects = { power = 2, entanglement = 12, reputation = -1 }
obligations = "Cannot reduce supply or exit without a major reputation + power penalty."

[chips_allied_fab]
id = "chips_allied_fab"
customer = "allied_bloc"
name = "Allied strategic fab partnership"
description = """A coalition of allied states funds priority access to your fabs as \
shared strategic infrastructure — enormous, stable money, and a seat at the table \
of national security for a bloc of nations. The deepest your silicon can be woven \
into the state."""
sub_industry = "ai_chips"
requires = { rd_levels = { process_node = 65, yield_line = 50 }, product_tier = 3, stature_min = 16000, clearance = "defense_secret" }
payment = { upfront = 220, recurring_per_year = 280, term_weeks = 208 }
deliverable = "priority_supply"
effects = { power = 3, entanglement = 15, reputation = 0 }
obligations = "Binds your top fab capacity to the bloc; exit triggers a major power + reputation penalty."

# ======================= FRONTIER MODEL LAB =======================

[lab_commercial_api]
id = "lab_commercial_api"
customer = "commercial_enterprise"
name = "Enterprise model licensing"
description = """A large enterprise licenses your models for its products. Clean \
recurring commercial revenue, fully flexible — the bread-and-butter way a lab \
monetizes without entangling itself with anyone."""
sub_industry = "frontier_model_lab"
requires = { rd_levels = { scaling = 25 }, product_tier = 1, stature_min = 0 }
payment = { upfront = 15, recurring_per_year = 50, term_weeks = 104 }
deliverable = "priority_model_access"
effects = { power = 0, entanglement = 0, reputation = 0 }

[intel_compute_access]
id = "intel_compute_access"
customer = "intelligence_service"
name = "Classified compute & model access"
description = """Priority access to your frontier models and compute for an \
intelligence service — for purposes you're not allowed to ask about. Enormous \
money, enormous entanglement, and a reputational time bomb if it ever leaks."""
sub_industry = "frontier_model_lab"
requires = { rd_levels = { scaling = 60 }, product_tier = 3, stature_min = 14000, clearance = "intelligence_ts" }
payment = { upfront = 200, recurring_per_year = 300, term_weeks = 208 }
deliverable = "priority_model_access"
effects = { power = 3, entanglement = 18, reputation = -2 }
obligations = "Leak risk: a scoped event can expose this contract for major reputation damage."

[lab_defense_analysis]
id = "lab_defense_analysis"
customer = "defense_ministry"
name = "Defense decision-support models"
description = """Tailored models for military planning and logistics — less \
shadowed than intelligence work, still firmly defense. Stable, premium revenue \
that makes your lab part of the national security apparatus."""
sub_industry = "frontier_model_lab"
requires = { rd_levels = { scaling = 45, alignment = 40 }, product_tier = 2, stature_min = 8000, clearance = "defense_secret" }
payment = { upfront = 90, recurring_per_year = 140, term_weeks = 156 }
deliverable = "priority_model_access"
effects = { power = 2, entanglement = 12, reputation = -1 }
obligations = "Binding multi-year delivery; exit carries a reputation + power penalty."

# ========================= VERTICAL AI SAAS =======================

[enterprise_saas_deal]
id = "enterprise_saas_deal"
customer = "commercial_enterprise"
name = "Enterprise platform deal"
description = """A large commercial customer adopts your platform across its \
operations. Clean money, no strings, and the sticky recurring revenue a SaaS \
business is built on. The channel that keeps you independent."""
sub_industry = "vertical_ai_saas"
requires = { product_tier = 1, stature_min = 0 }
payment = { upfront = 10, recurring_per_year = 30, term_weeks = 104 }
deliverable = "deployment"
effects = { power = 0, entanglement = 0, reputation = 0 }

[gov_agency_platform]
id = "gov_agency_platform"
customer = "defense_ministry"
name = "Government operations platform"
description = """A defense agency runs its internal operations on your platform — \
stable, long, and binding, and it embeds your software in the machinery of the \
state. Less fraught than weapons work, but entangling all the same: once an agency \
runs on you, it cannot easily stop."""
sub_industry = "vertical_ai_saas"
requires = { rd_levels = { platform = 45, domain_depth = 40 }, product_tier = 2, stature_min = 7000, clearance = "defense_secret" }
payment = { upfront = 70, recurring_per_year = 100, term_weeks = 182 }
deliverable = "deployment"
effects = { power = 2, entanglement = 10, reputation = 0 }
obligations = "Mission-critical government dependency; exit triggers a reputation + power penalty."
```

## `content/contracts/space.toml` — Contract templates — space sub-industries (launch, satellites, stations)

```toml
# content/contracts/space.toml
# Contract templates for the space sub-industries (launch_services,
# satellite_constellations, space_stations). Each gets >=1 commercial + >=1
# government. Space-agency work is the prestigious, reputation-positive door into
# government; defense/intelligence space work is more entangling.

# ========================= LAUNCH SERVICES ========================

[launch_commercial_manifest]
id = "launch_commercial_manifest"
customer = "commercial_enterprise"
name = "Commercial launch manifest"
description = """A backlog of commercial satellite operators booking rides on your \
vehicles. Clean, flexible launch revenue — you fly who you want, when you want, \
and answer to no one but the manifest."""
sub_industry = "launch_services"
requires = { rd_levels = { reliability = 25 }, product_tier = 1, stature_min = 0 }
payment = { upfront = 25, recurring_per_year = 55, term_weeks = 78 }
deliverable = "launch_capacity"
effects = { power = 0, entanglement = 0, reputation = 0 }

[space_agency_launch]
id = "space_agency_launch"
customer = "space_agency"
name = "National launch services contract"
description = """A multi-year contract to fly a government space program's payloads \
— prestige, stable revenue, and a visible badge of strategic standing. The \
friendliest government money there is, and a real source of power without the \
ethical weight of defense work."""
sub_industry = "launch_services"
requires = { rd_levels = { reliability = 45 }, product_tier = 1, stature_min = 4000 }
payment = { upfront = 60, recurring_per_year = 90, term_weeks = 130 }
deliverable = "launch_capacity"
effects = { power = 2, entanglement = 8, reputation = 1 }

[launch_defense_responsive]
id = "launch_defense_responsive"
customer = "defense_ministry"
name = "Responsive defense launch"
description = """On-demand launch capability reserved for military payloads — \
priority access to your pads whenever the ministry calls. Premium and binding, and \
it makes your launch business an arm of national defense."""
sub_industry = "launch_services"
requires = { rd_levels = { reliability = 55, reusability = 45 }, product_tier = 2, stature_min = 9000, clearance = "defense_secret" }
payment = { upfront = 110, recurring_per_year = 150, term_weeks = 182 }
deliverable = "launch_capacity"
effects = { power = 2, entanglement = 12, reputation = -1 }
obligations = "Reserves priority launch capacity for the state; exit carries a power + reputation penalty."

# ===================== SATELLITE CONSTELLATIONS ===================

[sat_commercial_connectivity]
id = "sat_commercial_connectivity"
customer = "commercial_enterprise"
name = "Commercial connectivity contract"
description = """Telecoms and enterprises buying capacity on your constellation. \
Clean recurring revenue from the open market — broad, flexible, and free of any \
government's reach."""
sub_industry = "satellite_constellations"
requires = { rd_levels = { network = 25 }, product_tier = 1, stature_min = 0 }
payment = { upfront = 20, recurring_per_year = 60, term_weeks = 104 }
deliverable = "coverage"
effects = { power = 0, entanglement = 0, reputation = 0 }

[sat_gov_earth_observation]
id = "sat_gov_earth_observation"
customer = "space_agency"
name = "Government Earth-observation contract"
description = """A civil space or environmental agency contracts your imaging \
constellation for continuous Earth monitoring — prestigious, stable, and \
reputation-positive. Strategic standing earned by watching the planet, not \
weaponizing it."""
sub_industry = "satellite_constellations"
requires = { rd_levels = { satellite_tech = 45, network = 40 }, product_tier = 2, stature_min = 6000 }
payment = { upfront = 65, recurring_per_year = 95, term_weeks = 156 }
deliverable = "coverage"
effects = { power = 2, entanglement = 8, reputation = 1 }

[sat_intel_surveillance]
id = "sat_intel_surveillance"
customer = "intelligence_service"
name = "Classified surveillance tasking"
description = """An intelligence service pays to point your satellites where they \
say and keep quiet about it. The deepest entanglement your space business can take \
on, and a reputational catastrophe waiting if the tasking ever surfaces."""
sub_industry = "satellite_constellations"
requires = { rd_levels = { satellite_tech = 60, network = 55 }, product_tier = 2, stature_min = 13000, clearance = "intelligence_ts" }
payment = { upfront = 180, recurring_per_year = 240, term_weeks = 208 }
deliverable = "coverage"
effects = { power = 3, entanglement = 18, reputation = -2 }
obligations = "Leak risk: a scoped event can expose the tasking for major reputation damage."

# ========================= SPACE STATIONS =========================

[station_commercial_lease]
id = "station_commercial_lease"
customer = "commercial_enterprise"
name = "Commercial module lease"
description = """Research firms, manufacturers, and tourism operators leasing space \
on your station. Clean, premium commercial revenue from orbit — your tenants, your \
terms, no government in the loop."""
sub_industry = "space_stations"
requires = { rd_levels = { module_tech = 25 }, product_tier = 1, stature_min = 0 }
payment = { upfront = 30, recurring_per_year = 50, term_weeks = 130 }
deliverable = "module_construction"
effects = { power = 0, entanglement = 0, reputation = 0 }

[station_gov_research]
id = "station_gov_research"
customer = "space_agency"
name = "National research station contract"
description = """A government space agency leases long-term research capacity aboard \
your station — a prestigious anchor tenant, stable for years, and a visible mark of \
strategic standing. Government money at its least entangling."""
sub_industry = "space_stations"
requires = { rd_levels = { module_tech = 45, life_support = 40 }, product_tier = 2, stature_min = 7000 }
payment = { upfront = 80, recurring_per_year = 110, term_weeks = 182 }
deliverable = "module_construction"
effects = { power = 2, entanglement = 8, reputation = 1 }

[station_defense_platform]
id = "station_defense_platform"
customer = "defense_ministry"
name = "Defense orbital platform"
description = """A dedicated, access-controlled station module for military use — \
deeply entangling, premium-priced, and binding. It turns your orbital real estate \
into national-security infrastructure the state will not let go of."""
sub_industry = "space_stations"
requires = { rd_levels = { module_tech = 60, assembly = 55 }, product_tier = 3, stature_min = 15000, clearance = "defense_secret" }
payment = { upfront = 200, recurring_per_year = 260, term_weeks = 208 }
deliverable = "module_construction"
effects = { power = 3, entanglement = 15, reputation = -1 }
obligations = "Dedicates a station module to the state; exit triggers a major power + reputation penalty."
```

## `content/contracts/_tuning.toml` — Tuning — pools, decay, mix-identity, criticality

```toml
# content/contracts/_tuning.toml
# Pool sizes, entanglement decay, the mix-identity thresholds, and the emergent
# strategic-criticality knobs. Tuned so neither channel is strictly better:
# commercial is plentiful and free; government is rarer, premium, and entangling.

[global]
commercial_pool_size = 8          # commercial contracts available at once (plentiful)
government_pool_size = 3          # government contracts rarer
market_refresh_weeks = 13
entanglement_decay_per_year = 6   # entanglement falls slowly if you stop taking gov work

[mix_identity]
# commercial:government revenue ratio -> identity label (engine reads).
# Evaluated low-to-high on government revenue share.
thresholds = [
  { gov_share_below = 0.10, label = "Independent" },
  { gov_share_below = 0.35, label = "Government Partner" },
  { gov_share_below = 0.60, label = "National Champion" },
  { gov_share_above = 0.60, label = "State-Entangled" },
]

[strategic_criticality]
# Emergent power from being humanity-critical, regardless of contract channel —
# the Apple/TSMC effect. A pure-commercial titan that dominates a critical market
# becomes strategically important without ever signing a government contract.
market_share_for_criticality = 0.4   # dominate >40% of a critical market -> power
criticality_power = 2
```
