# Executives & Delegation — Authored Content

The management layer that turns the player from operator into executive. Authored against the *Executives & Delegation: Design & Authoring Spec*. You author the *ingredients* the exec generator draws from (domains, traits, archetypes, name pools, tuning) — individual execs are procedural.

**Drop-in path:** `content/executives/`

---

## Validation summary

All content passes the spec's Part 5 checklist:

- **7 domains**: cto, cfo, coo, cro, chief_scientist, space_program, chief_executive.
- **Bidirectional domain↔megaproject check passes**: every domain's `gates_megaprojects` resolves to a real megaproject, and every megaproject's `exec_required` is a real domain — and the two sets match *exactly*. This clears the `exec_required` warnings from the megaproject spec.
- **11 traits**, each a named engine-known modifier; every archetype's trait pool respects each trait's `applies_to`.
- **16 archetypes**, ≥2 per domain, every domain with at least one high-variance and one steady option (so the character choice exists everywhere).
- `competence_range` within [0,100] (low<high); `trait_count` low≤high≤pool size.
- `_tuning.toml` has global/comp/retention blocks.

**The megaproject-gating domains (the `exec_required` link to the megaproject spec):**

| domain | gates these megaprojects |
|---|---|
| chief_scientist | artificial_general_intelligence, quantum_supremacy_platform, accelerated_science_program |
| space_program | mars_transit_line, mars_colony, asteroid_mining_operation, orbital_solar_array, oneill_cylinder, orbital_ring |
| chief_executive | sector_dominance_platform, autonomous_economy_platform |

**Design note:** every domain offers a real character choice — a high-variance archetype (visionary/aggressive/maverick traits) and a steady one (steady/cautious/loyalist). A great exec is a genuine force multiplier; a bad one genuinely costs you. Hiring is a bet on a person, not a stat purchase.

---

## `content/executives/_domains.toml`

The 7 executive domains. The three megaproject-gating domains carry gates_megaprojects matching the megaproject exec_required values exactly.

```toml
# content/executives/_domains.toml
# The 7 executive domains — each a slice of the company an exec runs autonomously.
# The three megaproject-gating domains (chief_scientist, space_program,
# chief_executive) carry gates_megaprojects matching the exec_required values in
# the megaproject files (10) exactly — this is the bidirectional link.

[cto]
id = "cto"
name = "Chief Technology Officer"
runs = "rd_and_products"
description = """Owns research direction and the product roadmap — what you build \
and how fast the tech advances. A great CTO turns your R&D budget into a lead; a \
weak one quietly wastes it on mistimed bets."""
unlock_stature = 0               # held by the founder until hired
gates_megaprojects = []
escalation_examples = ["commit the next cycle to a frontier program", "bet on a new product tier"]

[cfo]
id = "cfo"
name = "Chief Financial Officer"
runs = "finance_and_treasury"
description = """Runs financing, treasury, and the earnings game. Sets raise \
timing and terms, manages runway, and decides how hard to engineer the quarter. \
An aggressive CFO amplifies booms and busts alike."""
unlock_stature = 0
gates_megaprojects = []
escalation_examples = ["recommend a major raise", "propose a buyback or dividend", "guide-down warning"]

[coo]
id = "coo"
name = "Chief Operating Officer"
runs = "capacity_and_ops"
description = """Owns capacity and operations — when to expand fab lines, compute, \
launch slots; how well existing capacity is utilized. The difference between a \
smooth scale-up and a permanent bottleneck."""
unlock_stature = 0
gates_megaprojects = []
escalation_examples = ["approve a major capacity expansion", "reallocate capacity between products"]

[cro]
id = "cro"
name = "Chief Revenue Officer"
runs = "gtm_and_market"
description = """Runs go-to-market — pricing, share capture, contract wins. Turns \
a good product into market share, or leaves it stranded against hungrier rivals. \
Owns the customer relationships that revenue rides on."""
unlock_stature = 2000
gates_megaprojects = []
escalation_examples = ["approve aggressive discounting for a marquee deal", "set pricing on a new product"]

[chief_scientist]
id = "chief_scientist"
name = "Chief Scientist"
runs = "frontier_research"
description = """Runs the bleeding edge — frontier programs and the intelligence \
megaprojects. The person who can shepherd an AGI program without it going off the \
rails, and the reason regulators take your safety claims seriously."""
unlock_stature = 25000
gates_megaprojects = ["artificial_general_intelligence", "quantum_supremacy_platform", "accelerated_science_program"]
escalation_examples = ["proceed to the next AGI stage despite an alignment flag", "commit to a quantum platform"]

[space_program]
id = "space_program"
name = "Head of Space Program"
runs = "space_megaprojects"
description = """Leads the off-world endeavors — Mars, asteroid mining, orbital \
megastructures. Manages the staged builds and their setback risk; a steady hand \
here is the difference between a colony and a catastrophe in the headlines."""
unlock_stature = 22000
gates_megaprojects = ["mars_transit_line", "mars_colony", "asteroid_mining_operation", "orbital_solar_array", "oneill_cylinder", "orbital_ring"]
escalation_examples = ["proceed to the next colony stage", "respond to a launch setback"]

[chief_executive]
id = "chief_executive"
name = "President / Chief Executive"
runs = "economic_megaprojects_and_cross_domain"
description = """A president you install over the whole operation — runs the \
economic megaprojects and lends a small buff across every domain. The hire that \
lets you step back from operations entirely and act as owner and allocator."""
unlock_stature = 20000
gates_megaprojects = ["sector_dominance_platform", "autonomous_economy_platform"]
escalation_examples = ["proceed with an industry-dominance push", "approve a cross-domain reorganization"]
```

## `content/executives/_traits.toml`

The personality vocabulary — 11 named behavior modifiers.

```toml
# content/executives/_traits.toml
# The personality vocabulary. Each trait is a named, engine-known behavior modifier
# that shapes HOW an exec runs their domain, beyond raw competence. effects keys are
# engine-known; applies_to (empty = any domain) restricts where a trait makes sense.
# comp_premium raises pay expectation; flight_risk (where set) raises defection odds.

[visionary]
id = "visionary"
name = "Visionary"
description = """Swings for the fences — pushes frontier and high-tier work hard. \
Generational wins, or expensive flops. High variance, and the reason your biggest \
breakthroughs (and biggest write-offs) happen."""
effects = { tier_bias = 0.3, variance = 0.4 }
applies_to = ["cto", "chief_scientist", "space_program"]
comp_premium = 0.1

[steady]
id = "steady"
name = "Steady operator"
description = """Compounds reliably; low variance; rarely leaps. The hand on the \
tiller who never misses a deadline and never bets the company — and never wins it \
in one swing either."""
effects = { variance = -0.3, consistency = 0.2 }
applies_to = []
comp_premium = 0.0

[aggressive]
id = "aggressive"
name = "Aggressive"
description = """Over-levers and over-invests — amplifies booms, dangerous in \
busts. A CFO with this trait will lever you to the hilt chasing growth; brilliant \
in a bull market, a bust risk when the cycle turns."""
effects = { risk_appetite = 0.4, leverage_bias = 0.3 }
applies_to = ["cfo", "coo", "cro", "chief_executive"]
comp_premium = 0.05

[cautious]
id = "cautious"
name = "Cautious"
description = """Conserves, keeps risk low, leaves some growth on the table. \
Protects you in a downturn and frustrates you in a boom. The opposite of \
aggressive — never the reason you blow up, sometimes the reason you fall behind."""
effects = { risk_appetite = -0.35, runway_bias = 0.25 }
applies_to = []
comp_premium = 0.0

[empire_builder]
id = "empire_builder"
name = "Empire builder"
description = """Grows their domain's headcount and budget hard — powerful output, \
but costly, and a frequent source of clashes with other execs fighting for the \
same resources. Give them room and they deliver; pair two and watch them fight."""
effects = { domain_growth = 0.4, budget_appetite = 0.3, clash_tendency = 0.3 }
applies_to = []
comp_premium = 0.1

[star]
id = "star"
name = "Star"
description = """Exceptional and knows it — a major performance boost, an expensive \
salary, and a flight risk if you don't pay to keep them. The hire everyone wants \
and the one rivals will try hardest to poach."""
effects = { competence_bonus = 0.15 }
applies_to = []
comp_premium = 0.4
flight_risk = 0.3

[loyalist]
id = "loyalist"
name = "Loyalist"
description = """Stays through thick and thin — low defection risk, weathers bad \
quarters and better offers. Not always the flashiest performer, but the one still \
in the chair when the storm hits."""
effects = { defection_resistance = 0.5 }
applies_to = []
comp_premium = -0.05

[maverick]
id = "maverick"
name = "Maverick"
description = """Occasionally ignores your mandate and does their own thing — \
spectacular when they're right, a liability when they're wrong. Hiring one is \
betting that their judgment beats yours often enough to be worth the surprises."""
effects = { mandate_deviation = 0.35, variance = 0.3 }
applies_to = ["cto", "chief_scientist", "cro", "space_program"]
comp_premium = 0.05

[ruthless]
id = "ruthless"
name = "Ruthless"
description = """Cuts hard and plays to win — great margins and execution, at a \
cost to morale and reputation. Squeezes every point of efficiency and makes \
enemies doing it. The fixer you bring in to turn a bloated division around."""
effects = { efficiency_bonus = 0.25, morale_cost = 0.2 }
applies_to = ["cfo", "coo", "chief_executive"]
comp_premium = 0.05

[diplomat]
id = "diplomat"
name = "Diplomat"
description = """Smooths clashes and keeps the team aligned — reduces conflict \
across the leadership and lifts everyone slightly. The glue that lets strong \
personalities coexist; quietly raises the whole team's ceiling."""
effects = { clash_resistance = 0.4, team_morale = 0.15 }
applies_to = ["chief_executive", "coo", "cfo"]
comp_premium = 0.1

[rising_star]
id = "rising_star"
name = "Rising star"
description = """Young, hungry, and cheaper than their ceiling — competence will \
climb with experience if you keep them. A bet on potential: underpriced now, a \
star later, and gone to a rival if you don't see it before they do."""
effects = { competence_growth = 0.3 }
applies_to = []
comp_premium = -0.15
flight_risk = 0.2
```

## `content/executives/archetypes.toml`

16 archetype templates the generator instantiates — 2-4 per domain, each with a high-variance and a steady option.

```toml
# content/executives/archetypes.toml
# Templates the generator instantiates per domain. Each has a competence range, a
# trait pool the generator picks from (respecting each trait's applies_to), a
# trait_count, a stature floor, and flavor titles. Every domain has at least one
# high-variance option and one steady option, so the character choice exists
# everywhere.

# ============================ CTO ============================

[frontier_cto]
id = "frontier_cto"
domain = "cto"
name = "Frontier CTO"
description = """A research-pedigree technologist who lives at the edge — the kind \
who'll bet the lab on the next architecture and sometimes be right in a way that \
remakes the company."""
competence_range = [60, 95]
trait_pool = ["visionary", "star", "maverick"]
trait_count = [1, 2]
min_stature = 8000
flavor_titles = ["ex-frontier-lab research lead", "founder of a sold AI startup", "famous architecture pioneer"]

[operator_cto]
id = "operator_cto"
domain = "cto"
name = "Operator CTO"
description = """A ship-it pragmatist who compounds steadily and rarely misses a \
deadline. Won't reinvent your roadmap, but will execute it like clockwork."""
competence_range = [50, 80]
trait_pool = ["steady", "loyalist", "cautious"]
trait_count = [1, 2]
min_stature = 0
flavor_titles = ["VP Eng at a public tech company", "serial startup CTO", "longtime platform architect"]

[wildcard_cto]
id = "wildcard_cto"
domain = "cto"
name = "Wildcard CTO"
description = """Brilliant and unpredictable — ignores the plan as often as follows \
it, and is right just often enough to be worth the heartburn. A bet on raw judgment \
over process."""
competence_range = [55, 90]
trait_pool = ["maverick", "visionary", "rising_star"]
trait_count = [1, 2]
min_stature = 3000
flavor_titles = ["dropout-genius hacker", "controversial ex-CTO", "cult-favorite engineer"]

# ============================ CFO ============================

[growth_cfo]
id = "growth_cfo"
domain = "cfo"
name = "Growth CFO"
description = """A financier who levers up and funds the land-grab — turns a hot \
market into a war chest, and a cold one into a crisis if you're not careful. \
Plays offense with the balance sheet."""
competence_range = [55, 90]
trait_pool = ["aggressive", "star", "empire_builder"]
trait_count = [1, 2]
min_stature = 4000
flavor_titles = ["ex-growth-fund partner", "CFO of a unicorn IPO", "former investment banker"]

[disciplined_cfo]
id = "disciplined_cfo"
domain = "cfo"
name = "Disciplined CFO"
description = """A conservative steward who guards the runway and never over-promises \
the Street. Keeps you alive through the downturn that takes out the over-levered — \
and leaves a little growth on the table to do it."""
competence_range = [50, 85]
trait_pool = ["cautious", "steady", "loyalist"]
trait_count = [1, 2]
min_stature = 0
flavor_titles = ["public-company CFO", "ex-Big-Four partner", "turnaround finance chief"]

[fixer_cfo]
id = "fixer_cfo"
domain = "cfo"
name = "The Fixer"
description = """Brought in to cut, tighten, and restore margins — ruthless and \
effective, and not loved for it. The CFO you hire when the books need discipline \
more than they need a friend."""
competence_range = [60, 88]
trait_pool = ["ruthless", "aggressive", "star"]
trait_count = [1, 2]
min_stature = 6000
flavor_titles = ["restructuring specialist", "private-equity operating partner", "cost-cutting veteran"]

# ============================ COO ============================

[scaling_coo]
id = "scaling_coo"
domain = "coo"
name = "Scaling COO"
description = """An operations leader built for the ramp — stands up capacity fast \
and keeps utilization high through explosive growth. Aggressive on expansion, and \
worth it when demand is outrunning you."""
competence_range = [55, 90]
trait_pool = ["aggressive", "empire_builder", "star"]
trait_count = [1, 2]
min_stature = 5000
flavor_titles = ["ex-manufacturing VP", "scaled a hardware unicorn", "supply-chain turnaround lead"]

[reliable_coo]
id = "reliable_coo"
domain = "coo"
name = "Reliable COO"
description = """A steady operator who runs a tight, predictable shop — capacity \
comes online on time and on budget, every time. Won't over-build, won't get caught \
short, won't surprise you."""
competence_range = [50, 82]
trait_pool = ["steady", "cautious", "loyalist", "diplomat"]
trait_count = [1, 2]
min_stature = 0
flavor_titles = ["plant operations director", "logistics chief", "veteran ops manager"]

# ============================ CRO ============================

[hunter_cro]
id = "hunter_cro"
domain = "cro"
name = "Hunter CRO"
description = """A revenue leader who chases the marquee logo and wins it — \
aggressive on price and pipeline, lands the deals that define a category. Sometimes \
buys growth with margin, but fills the funnel."""
competence_range = [55, 90]
trait_pool = ["aggressive", "star", "maverick"]
trait_count = [1, 2]
min_stature = 4000
flavor_titles = ["enterprise sales legend", "ex-CRO of a SaaS leader", "rainmaker dealmaker"]

[builder_cro]
id = "builder_cro"
domain = "cro"
name = "Builder CRO"
description = """A go-to-market leader who builds durable, compounding revenue — \
disciplined pricing, high retention, a machine that keeps producing. Slower to a \
splashy win, steadier to a big number."""
competence_range = [50, 84]
trait_pool = ["steady", "loyalist", "cautious"]
trait_count = [1, 2]
min_stature = 0
flavor_titles = ["built a sales org from scratch", "retention-obsessed revenue chief", "channel strategy veteran"]

# ============================ CHIEF SCIENTIST ============================

[moonshot_scientist]
id = "moonshot_scientist"
domain = "chief_scientist"
name = "Moonshot Scientist"
description = """A field-defining mind who pushes the frontier programs hard and \
fast — the person who could get you to AGI first, or burn a fortune learning why \
not. The highest-variance, highest-ceiling hire in the company."""
competence_range = [70, 98]
trait_pool = ["visionary", "star", "maverick"]
trait_count = [1, 3]
min_stature = 25000
flavor_titles = ["Turing-laureate researcher", "legendary lab director", "the name on the seminal papers"]

[safety_scientist]
id = "safety_scientist"
domain = "chief_scientist"
name = "Safety-First Scientist"
description = """A rigorous, safety-minded leader who advances the frontier \
carefully — slower to the breakthrough, far less likely to trigger the alignment \
scare that brings regulators down on you. The steady hand on the most dangerous \
work in the building."""
competence_range = [65, 92]
trait_pool = ["steady", "cautious", "loyalist"]
trait_count = [1, 2]
min_stature = 25000
flavor_titles = ["alignment research pioneer", "ex-national-lab director", "trusted safety authority"]

# ============================ SPACE PROGRAM ============================

[visionary_space_lead]
id = "visionary_space_lead"
domain = "space_program"
name = "Visionary Space Lead"
description = """A bold program director who pushes the off-world endeavors at full \
throttle — gets to Mars faster, and accepts the setback risk that comes with moving \
fast on the hardest engineering humanity has attempted."""
competence_range = [65, 95]
trait_pool = ["visionary", "star", "maverick"]
trait_count = [1, 2]
min_stature = 22000
flavor_titles = ["ex-NASA program director", "founder of a launch startup", "legendary mission architect"]

[veteran_space_lead]
id = "veteran_space_lead"
domain = "space_program"
name = "Veteran Space Lead"
description = """A seasoned director who runs the staged builds with discipline and \
margin — slower, costlier per stage, and dramatically less likely to put a habitat \
breach on every front page. The safe hands for a project where failure means lives."""
competence_range = [60, 90]
trait_pool = ["steady", "cautious", "loyalist"]
trait_count = [1, 2]
min_stature = 22000
flavor_titles = ["40-year aerospace veteran", "ran a national space agency", "reliability-obsessed engineer"]

# ============================ CHIEF EXECUTIVE ============================

[empire_president]
id = "empire_president"
domain = "chief_executive"
name = "Empire-Builder President"
description = """A president who runs the whole operation for scale and dominance — \
aggressive, expansive, and a powerful force multiplier across every domain. Costly, \
and prone to clashes, but the engine of an empire in full sprint."""
competence_range = [70, 96]
trait_pool = ["empire_builder", "star", "ruthless", "aggressive"]
trait_count = [1, 3]
min_stature = 20000
flavor_titles = ["ex-CEO of a trillion-dollar firm", "serial empire-building operator", "legendary turnaround chief"]

[steady_president]
id = "steady_president"
domain = "chief_executive"
name = "Steady President"
description = """A president who runs a calm, aligned, well-governed company — keeps \
the leadership team rowing together and the whole machine humming. Less explosive \
growth, far fewer fires, and the trust that lets you finally step back as owner."""
competence_range = [65, 92]
trait_pool = ["steady", "diplomat", "loyalist"]
trait_count = [1, 2]
min_stature = 20000
flavor_titles = ["respected public-company CEO", "consensus-building operator", "veteran chair and steward"]
```

## `content/executives/_names.toml`

Name + bio-fragment pools for procedural exec generation.

```toml
# content/executives/_names.toml
# Name + flavor-bio fragment pools for procedural exec generation (like procedural
# companies/VCs). The generator combines first + last, picks a flavor title from the
# archetype, and may append a bio fragment for color. Dedupe within a save.

[names]
first = [
  "Diane", "Marcus", "Priya", "Walter", "Elena", "Sam", "Catherine", "Raj",
  "Nadia", "Theo", "Grace", "Hideki", "Lena", "Omar", "Sofia", "Daniel",
  "Mei", "Kwame", "Ingrid", "Tomas", "Aisha", "Viktor", "Yuki", "Clara",
  "Andre", "Fatima", "Niko", "Rosa", "Idris", "Hannah", "Leon", "Amara",
  "Cyrus", "Naomi", "Felix", "Zara", "Gideon", "Maya", "Anton", "Selina",
]
last = [
  "Okafor", "Vance", "Sharma", "Renn", "Cruz", "Boone", "Vos", "Mehta",
  "Halberd", "Sterling", "Whitmore", "Bedrock", "Cole", "Tanaka", "Frost",
  "Nakamura", "Adeyemi", "Larsson", "Reyes", "Khoury", "Petrov", "Sato",
  "Brandt", "Okonkwo", "Lindqvist", "Moreau", "Castellanos", "Bauer",
  "Abara", "Sinclair", "Ferro", "Nakashima", "Olsen", "Diallo", "Marsh",
]

# Bio fragments the generator can append for flavor (per-domain leanings optional).
[bio_fragments]
generic = [
  "known for turning around a struggling division",
  "left a senior role to take a bigger swing",
  "built a reputation for hiring exceptionally well",
  "famous for a contrarian call that paid off",
  "quietly respected across the industry",
  "carries a Rolodex that opens any door",
]
technical = [
  "holds foundational patents in the field",
  "mentored a generation of researchers",
  "shipped the product that defined a category",
]
financial = [
  "navigated a company cleanly through a downturn",
  "structured one of the decade's landmark deals",
  "known for never missing a number",
]
```

## `content/executives/_tuning.toml`

Candidate market, comp, and retention knobs.

```toml
# content/executives/_tuning.toml
# Candidate market, compensation, and retention knobs. Starting points for
# playtest tuning. Money in $M, equity in fractions, time in weeks.

[global]
candidate_pool_size = 6          # execs visible in the hiring market at once
market_refresh_weeks = 26        # how often the candidate pool rotates
headhunt_cost = 20               # $M to surface a better-than-usual candidate
# Candidate quality is gated by stature: an archetype only appears once your
# stature >= its min_stature, and competence rolls trend higher with stature.

[comp]
base_salary_by_competence = 0.05 # $M/yr per competence point (90-comp ≈ $4.5M/yr base)
equity_expectation_range = [0.005, 0.03]   # 0.5%-3% equity, scaled by competence + traits
# trait comp_premium (from _traits.toml) multiplies the salary+equity expectation.
# Equity grants dilute the cap table (ties into the company's shares_out).

[retention]
underpay_defection_per_quarter = 0.08      # base per-quarter defection chance when underpaid
star_poach_multiplier = 2.0                # 'star'/flight_risk traits multiply poach odds
loyalist_defection_multiplier = 0.3        # loyalists are much stickier
mandate_misfit_penalty = 0.05              # added defection chance when mandate clashes with traits
fire_severance_weeks = 26                  # severance cost when firing (weeks of salary)
fire_morale_hit = 0.1                      # company-wide morale hit from a firing
clash_performance_penalty = 0.15           # per-domain performance drag while a clash is unresolved

[mandate]
# The high-level directions the player can set per exec (engine reads these).
directions = ["chase_the_frontier", "defend_margins", "grow_aggressively", "extend_runway", "balanced"]
default = "balanced"
```
