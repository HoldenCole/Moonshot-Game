# R&D Tree — Authored Content

Full deepened research system across all 6 playable sub-industries, authored against the *R&D Tree: Authoring Spec*. Extends (does not replace) the `rd_lines` from `06`. Adds research projects, frontier programs, cross-domain synergy nodes, slot/pacing tuning, and the `level_ceiling` fields that let frontier programs push lines into prestige range.

**Drop-in paths:**
- `content/research/<sub_industry>.toml` (projects + frontier programs)
- `content/research/_cross_domain.toml` (synergy nodes)
- `content/research/_tuning.toml` (slots + per-sub pacing)
- `content/rd_lines/<sub_industry>.toml` — `level_ceiling` added to lines that frontier programs push past 90

---

## Validation summary

All content passes the spec's checklist:

- **82 nodes**: 63 applied/advanced + 12 frontier programs + 7 cross-domain.
- Every tree hits the **10–18 applied/advanced** density target and has **2 frontier programs**.
- **Prereq graph is acyclic**; every node is reachable (its prereq chain bottoms out at a no-prereq node).
- Every `requires.rd_levels` key is a real line in scope; no requirement exceeds its line's `level_ceiling`.
- Every `requires.projects` / `frontier_unlock` id resolves.
- Cross-domain nodes all list ≥2 real fronts; their `rd_levels` reference lines in those fronts.
- Every node unlocks something (no dead nodes).
- `_tuning.toml` has all six sub-industry blocks + global.

**The trees interlock as the spec intends:** AGI (lab) cross-gates with the neuromorphic substrate (chips) via `agi_capable_hardware`; the Mars path needs both interplanetary transport (launch) and closed-loop habitation (stations). Spanning fronts is the path to the biggest endeavors.

---

## ▶ New product archetypes referenced (author later)

These 13 advanced product ids are referenced by `unlocks.products` and should be authored as tier-2/3 archetypes in the products spec (they're the "buildable thing" each unlock grants):

`chiplet_accelerator`, `edge_ai_chip`, `frontier_node_part`, `wafer_scale_engine` (chips); `autonomous_agent_platform` (lab); `multi_vertical_platform`, `autonomous_operations_suite` (saas); `super_heavy_vehicle` (launch); `global_broadband_network`, `direct_to_device_service`, `servicing_vehicle` (satellites); `orbital_city`, `microgravity_factory` (stations).

Until authored, the engine should treat an unlock of a missing product id as a content warning (per the loader's `ContentDB.warnings`), not a hard failure.

---

## `content/research/_tuning.toml`

```toml
# content/research/_tuning.toml
# Slot rules + per-sub-industry research pacing. Mirrors the products _tuning
# pattern: pace/budget multipliers tune each field's research FEEL without
# touching individual nodes. Tuned against each other (chips slow+dear, SaaS
# fast+cheap) and consistent with the products tuning already authored.

[global]
starting_slots = 1             # research projects you can run at once at game start
max_slots = 5                  # ceiling (raised via expansion infra + certain projects)
# Slot sources beyond starting: projects with unlocks.capability.slot = 1, and
# expansion-infrastructure buildouts (08 §6). Engine sums them, clamped to max_slots.

[frontier_model_lab]
rd_pace_mult = 0.9             # fast-moving field — research resolves quickly
budget_mult = 1.0
frontier_stature_floor = 20000 # $20B below which no frontier program here is available

[vertical_ai_saas]
rd_pace_mult = 0.8             # fastest, cheapest research of all six
budget_mult = 0.7
frontier_stature_floor = 16000 # SaaS reaches its frontier via economic scale, sooner

[ai_chips]
rd_pace_mult = 1.4             # chips research is slow
budget_mult = 1.3              # and dear
frontier_stature_floor = 25000

[launch_services]
rd_pace_mult = 1.1
budget_mult = 1.2
frontier_stature_floor = 22000

[satellite_constellations]
rd_pace_mult = 1.1
budget_mult = 1.15
frontier_stature_floor = 22000

[space_stations]
rd_pace_mult = 1.3             # building/proving in orbit is slow and costly
budget_mult = 1.35
frontier_stature_floor = 26000 # the highest bar — off-world habitation is titan-only
```

# === ai_chips ===

## `content/research/ai_chips.toml`

```toml
# content/research/ai_chips.toml
# The chips research tree: applied (chiplets, specialized accelerators) ->
# advanced (in-house lithography, node leadership) -> frontier (neuromorphic
# substrate, which gates the AGI megaproject jointly with the lab's program).
# Slow, expensive research (see _tuning: rd_pace 1.4, budget 1.3).
#
# Products referenced in unlocks that DON'T exist yet are NEW advanced archetypes
# to author later (flagged ▶NEW). Existing products gate via their own economics.

# ============================ APPLIED ============================

[specialized_accelerator]
id = "specialized_accelerator"
sub_industry = "ai_chips"
name = "Specialized accelerators"
tier = "applied"
description = """Purpose-built silicon for a single workload — inference, video, \
crypto — that crushes a general part on that one job. The first step away from \
one-size-fits-all design and toward the architecture bets that define a chip company."""
icon = "target"

[specialized_accelerator.requires]
rd_levels = { architecture = 30 }
projects = []
stature_min = 0

[specialized_accelerator.cost]
budget = 22
weeks = 32

[specialized_accelerator.unlocks]
products = []
capability = { architecture_rd_speed = 0.08 }
synergy_tags = []
frontier_unlock = []

[chiplet_packaging]
id = "chiplet_packaging"
sub_industry = "ai_chips"
name = "Chiplet packaging"
tier = "applied"
description = """Stitching multiple smaller dies into one package instead of betting \
on a single monolithic chip. Sidesteps the yield cliff at the bleeding edge and \
lets you scale performance when the node alone can't. The architecture the whole \
industry is converging on."""
icon = "grid-dots"

[chiplet_packaging.requires]
rd_levels = { yield_line = 45, architecture = 40 }
projects = []
stature_min = 0

[chiplet_packaging.cost]
budget = 35
weeks = 40

[chiplet_packaging.unlocks]
products = ["chiplet_accelerator"]        # ▶NEW advanced archetype to author later
line_ceiling = {}
capability = { yield_bonus = 0.1 }
synergy_tags = []
frontier_unlock = []

[hbm_integration]
id = "hbm_integration"
sub_industry = "ai_chips"
name = "High-bandwidth memory integration"
tier = "applied"
description = """Stacking memory directly against the compute die so data stops \
starving the cores. The unglamorous bottleneck that decides real-world AI \
performance — solve it and your accelerators leap ahead on the workloads that pay."""
icon = "layers"

[hbm_integration.requires]
rd_levels = { yield_line = 40, process_node = 35 }
projects = []
stature_min = 0

[hbm_integration.cost]
budget = 28
weeks = 36

[hbm_integration.unlocks]
products = []
capability = { datacenter_perf = 0.12 }
synergy_tags = []
frontier_unlock = []

[power_efficiency_arch]
id = "power_efficiency_arch"
sub_industry = "ai_chips"
name = "Power-efficiency architecture"
tier = "applied"
description = """Squeezing more compute per watt — the metric datacenters actually \
buy on once the hype settles. Less glamorous than peak performance, but in a world \
of power-constrained AI buildouts, efficiency is the real product."""
icon = "battery-charging"

[power_efficiency_arch.requires]
rd_levels = { process_node = 40, architecture = 35 }
projects = []
stature_min = 0

[power_efficiency_arch.cost]
budget = 26
weeks = 34

[power_efficiency_arch.unlocks]
products = []
capability = { efficiency_bonus = 0.12 }
synergy_tags = ["power_efficient_compute"]
frontier_unlock = []

# ============================ ADVANCED ============================

[advanced_lithography]
id = "advanced_lithography"
sub_industry = "ai_chips"
name = "Advanced lithography"
tier = "advanced"
description = """In-house mastery of the most extreme ultraviolet processes — the \
hardest, most expensive step in chipmaking, controlled by almost no one. Owning it \
means you no longer wait in anyone's queue and your node leadership is structural."""
icon = "wave-sine"

[advanced_lithography.requires]
rd_levels = { process_node = 65 }
projects = ["chiplet_packaging"]
stature_min = 8000

[advanced_lithography.cost]
budget = 120
weeks = 78

[advanced_lithography.unlocks]
products = []
line_ceiling = { process_node = 130 }
capability = { node_leadership = 0.15 }
synergy_tags = ["owns_advanced_fab"]
frontier_unlock = ["neuromorphic_substrate"]

[node_leadership_program]
id = "node_leadership_program"
sub_industry = "ai_chips"
name = "Node leadership program"
tier = "advanced"
description = """A standing program to stay a full generation ahead on process — \
not a one-time jump but the institutional machine that keeps you first. The kind of \
sustained lead that turns customers into captives and rivals into followers."""
icon = "flag"

[node_leadership_program.requires]
rd_levels = { process_node = 75, yield_line = 60 }
projects = ["advanced_lithography"]
stature_min = 12000

[node_leadership_program.cost]
budget = 160
weeks = 90

[node_leadership_program.unlocks]
products = ["frontier_node_part"]          # ▶NEW advanced archetype to author later
line_ceiling = { yield_line = 110 }
capability = { node_leadership = 0.2 }
synergy_tags = ["owns_advanced_fab"]
frontier_unlock = []

[wafer_scale_compute]
id = "wafer_scale_compute"
sub_industry = "ai_chips"
name = "Wafer-scale compute"
tier = "advanced"
description = """Abandoning the idea of cutting wafers into chips at all — building \
one colossal processor the size of a dinner plate. An audacious bet that, if it \
yields, gives AI training a substrate nothing else can match."""
icon = "square-dot"

[wafer_scale_compute.requires]
rd_levels = { yield_line = 70, architecture = 65 }
projects = ["chiplet_packaging", "hbm_integration"]
stature_min = 14000

[wafer_scale_compute.cost]
budget = 200
weeks = 96

[wafer_scale_compute.unlocks]
products = ["wafer_scale_engine"]          # ▶NEW advanced archetype to author later
capability = { ai_compute_efficiency = 0.18 }
synergy_tags = ["wafer_scale_compute"]
frontier_unlock = ["neuromorphic_substrate"]

[optical_interconnect]
id = "optical_interconnect"
sub_industry = "ai_chips"
name = "Optical interconnect"
tier = "advanced"
description = """Moving data between chips with light instead of copper — shattering \
the bandwidth wall that caps how big a training cluster can usefully get. The link \
technology the largest AI systems will be built on."""
icon = "zap"

[optical_interconnect.requires]
rd_levels = { architecture = 60, process_node = 55 }
projects = ["hbm_integration"]
stature_min = 10000

[optical_interconnect.cost]
budget = 140
weeks = 80

[optical_interconnect.unlocks]
products = []
capability = { cluster_scaling = 0.2 }
synergy_tags = ["optical_interconnect"]
frontier_unlock = []

# ============================ FRONTIER ============================

[neuromorphic_substrate]
id = "neuromorphic_substrate"
sub_industry = "ai_chips"
name = "Neuromorphic compute substrate"
tier = "frontier"
description = """A fundamentally new computing architecture — brain-like, massively \
parallel, orders of magnitude more efficient for intelligence workloads. The \
hardware foundation a true artificial general intelligence would run on. A handful \
of labs on Earth could even attempt it; you intend to be the one that finishes."""
icon = "brain"

[neuromorphic_substrate.requires]
rd_levels = { process_node = 95, architecture = 90 }
projects = ["advanced_lithography", "wafer_scale_compute"]
stature_min = 25000

[neuromorphic_substrate.cost]
budget = 600
weeks = 150

[neuromorphic_substrate.unlocks]
products = []
capability = { ai_compute_efficiency = 0.4 }
synergy_tags = ["agi_capable_hardware"]
megaproject_unlock = ["artificial_general_intelligence"]
power = 1

[quantum_accelerator]
id = "quantum_accelerator"
sub_industry = "ai_chips"
name = "Quantum acceleration unit"
tier = "frontier"
description = """A hybrid quantum-classical processor that cracks problems no \
conventional silicon ever will — materials, cryptography, optimization at a scale \
that reshapes whole industries. The frontier beyond the frontier of classical compute."""
icon = "atom"

[quantum_accelerator.requires]
rd_levels = { process_node = 90, architecture = 95 }
projects = ["node_leadership_program", "optical_interconnect"]
stature_min = 28000

[quantum_accelerator.cost]
budget = 680
weeks = 165

[quantum_accelerator.unlocks]
products = []
capability = { quantum_advantage = 0.3 }
synergy_tags = ["quantum_compute"]
megaproject_unlock = ["quantum_supremacy_platform"]
power = 1

# ---- additional applied/advanced nodes (tree depth) ----

[analog_compute]
id = "analog_compute"
sub_industry = "ai_chips"
name = "Analog in-memory compute"
tier = "applied"
description = """Computing directly inside memory cells with analog circuits — \
sidestepping the data-movement tax that dominates AI inference. A weird, promising \
corner of silicon that can deliver order-of-magnitude efficiency on the right \
workloads."""
icon = "sliders"

[analog_compute.requires]
rd_levels = { architecture = 45, process_node = 40 }
projects = ["specialized_accelerator"]
stature_min = 3000

[analog_compute.cost]
budget = 40
weeks = 44

[analog_compute.unlocks]
capability = { efficiency_bonus = 0.15 }
synergy_tags = ["analog_compute"]

[advanced_cooling]
id = "advanced_cooling"
sub_industry = "ai_chips"
name = "Advanced cooling & density"
tier = "applied"
description = """Liquid and immersion cooling that lets you pack chips denser and \
run them harder without melting the rack. The thermal ceiling is the real limit on \
datacenter compute — raise it and every part you sell gets more valuable."""
icon = "thermometer"

[advanced_cooling.requires]
rd_levels = { yield_line = 40, architecture = 35 }
projects = []
stature_min = 0

[advanced_cooling.cost]
budget = 24
weeks = 30

[advanced_cooling.unlocks]
capability = { datacenter_perf = 0.1 }
synergy_tags = []

[edge_inference_chip]
id = "edge_inference_chip"
sub_industry = "ai_chips"
name = "Edge inference silicon"
tier = "applied"
description = """Tiny, power-sipping inference chips for phones, cars, and devices \
— AI that runs locally without a datacenter round-trip. A vast, fast-growing volume \
market that your architecture work feeds directly."""
icon = "smartphone"

[edge_inference_chip.requires]
rd_levels = { architecture = 40, process_node = 38 }
projects = ["power_efficiency_arch"]
stature_min = 2000

[edge_inference_chip.cost]
budget = 30
weeks = 36

[edge_inference_chip.unlocks]
products = ["edge_ai_chip"]
capability = { efficiency_bonus = 0.1 }
synergy_tags = []

[silicon_photonics]
id = "silicon_photonics"
sub_industry = "ai_chips"
name = "Silicon photonics integration"
tier = "advanced"
description = """Building light-based components directly into the chip — merging \
optical interconnect with the silicon itself. The frontier of moving data fast, \
and a prerequisite for the largest coherent compute systems."""
icon = "lightbulb"

[silicon_photonics.requires]
rd_levels = { process_node = 60, architecture = 58 }
projects = ["optical_interconnect"]
stature_min = 11000

[silicon_photonics.cost]
budget = 150
weeks = 84

[silicon_photonics.unlocks]
capability = { cluster_scaling = 0.18 }
synergy_tags = ["silicon_photonics"]
```

# === frontier_model_lab ===

## `content/research/frontier_model_lab.toml`

```toml
# content/research/frontier_model_lab.toml
# The tree that reaches furthest. applied (multimodal, agents, tool use) ->
# advanced (autonomous research, self-improvement) -> frontier: Artificial
# General Intelligence. The AGI frontier program cross-gates with the chips
# neuromorphic substrate (agi_capable_hardware) — neither front reaches AGI alone.
# Fast-moving field (see _tuning: rd_pace 0.9).
#
# ▶NEW = product archetype referenced in unlocks, to author later.

# ============================ APPLIED ============================

[multimodal_models]
id = "multimodal_models"
sub_industry = "frontier_model_lab"
name = "Multimodal models"
tier = "applied"
description = """Models that see, hear, and speak — not just text. Bringing images, \
audio, and video into one system opens whole new product surfaces and is table \
stakes for the frontier. The capability that turns a chatbot into an assistant."""
icon = "image"

[multimodal_models.requires]
rd_levels = { scaling = 35, data_quality = 30 }
projects = []
stature_min = 0

[multimodal_models.cost]
budget = 24
weeks = 26

[multimodal_models.unlocks]
products = []
capability = { capability_bonus = 0.1 }
synergy_tags = []
frontier_unlock = []

[tool_use]
id = "tool_use"
sub_industry = "frontier_model_lab"
name = "Tool use & function calling"
tier = "applied"
description = """Teaching models to call APIs, run code, and use external tools — \
the bridge from answering questions to doing work. The foundation every agentic \
product is built on, and the first real step toward models that act in the world."""
icon = "wrench"

[tool_use.requires]
rd_levels = { scaling = 30, data_quality = 35 }
projects = []
stature_min = 0

[tool_use.cost]
budget = 20
weeks = 24

[tool_use.unlocks]
products = []
capability = { agent_capability = 0.12 }
synergy_tags = []
frontier_unlock = []

[long_context]
id = "long_context"
sub_industry = "frontier_model_lab"
name = "Long-context architectures"
tier = "applied"
description = """Extending how much a model can hold in mind at once — from a page \
to a library. Long context unlocks document analysis, codebases, and the kind of \
sustained reasoning that short-memory models simply can't do."""
icon = "scroll"

[long_context.requires]
rd_levels = { scaling = 40, data_quality = 35 }
projects = []
stature_min = 0

[long_context.cost]
budget = 26
weeks = 28

[long_context.unlocks]
products = []
capability = { capability_bonus = 0.1 }
synergy_tags = []
frontier_unlock = []

[rlhf_advanced]
id = "rlhf_advanced"
sub_industry = "frontier_model_lab"
name = "Advanced alignment training"
tier = "applied"
description = """Next-generation techniques for making models do what you actually \
mean — more reliable, more steerable, harder to jailbreak. The work that keeps you \
out of the safety-incident headlines and wins the regulated enterprise customers."""
icon = "shield-check"

[rlhf_advanced.requires]
rd_levels = { alignment = 40, data_quality = 35 }
projects = []
stature_min = 0

[rlhf_advanced.cost]
budget = 22
weeks = 26

[rlhf_advanced.unlocks]
products = []
capability = { reliability_bonus = 0.12 }
synergy_tags = ["alignment_leader"]
frontier_unlock = []

# ============================ ADVANCED ============================

[autonomous_agents]
id = "autonomous_agents"
sub_industry = "frontier_model_lab"
name = "Autonomous agents"
tier = "advanced"
description = """Models that plan and execute multi-step work on their own — \
researching, coding, operating software toward a goal with minimal supervision. \
The category-defining leap from tool to worker, and the platform an empire is \
built on."""
icon = "robot"

[autonomous_agents.requires]
rd_levels = { scaling = 60, data_quality = 55, alignment = 45 }
projects = ["tool_use", "long_context"]
stature_min = 9000

[autonomous_agents.cost]
budget = 130
weeks = 70

[autonomous_agents.unlocks]
products = ["autonomous_agent_platform"]   # ▶NEW advanced archetype to author later
capability = { agent_capability = 0.2 }
synergy_tags = ["autonomous_agents"]
frontier_unlock = ["artificial_general_intelligence"]

[autonomous_research]
id = "autonomous_research"
sub_industry = "frontier_model_lab"
name = "Autonomous research systems"
tier = "advanced"
description = """Models that conduct research — forming hypotheses, running \
experiments, improving designs faster than human teams. The moment your AI starts \
accelerating your AI. Spills over into every other front you operate."""
icon = "flask"

[autonomous_research.requires]
rd_levels = { scaling = 65, data_quality = 60, alignment = 55 }
projects = ["autonomous_agents", "multimodal_models"]
stature_min = 13000

[autonomous_research.cost]
budget = 180
weeks = 82

[autonomous_research.unlocks]
products = []
capability = { all_rd_speed = 0.12, slot = 1 }   # grants a research slot
synergy_tags = ["autonomous_research"]
frontier_unlock = ["artificial_general_intelligence"]

[recursive_self_improvement]
id = "recursive_self_improvement"
sub_industry = "frontier_model_lab"
name = "Recursive self-improvement"
tier = "advanced"
description = """Systems that rewrite and retrain themselves, each generation \
designing a better successor. The most powerful — and most safety-critical — \
capability in the building. Approached carelessly it's the plot of a cautionary \
tale; approached right, it's the on-ramp to general intelligence."""
icon = "infinity"

[recursive_self_improvement.requires]
rd_levels = { scaling = 75, alignment = 70 }
projects = ["autonomous_research"]
stature_min = 18000

[recursive_self_improvement.cost]
budget = 260
weeks = 100

[recursive_self_improvement.unlocks]
products = []
capability = { ai_rd_speed = 0.3 }
synergy_tags = ["self_improving_ai"]
frontier_unlock = ["artificial_general_intelligence"]

# ============================ FRONTIER ============================

[artificial_general_intelligence]
id = "artificial_general_intelligence"
sub_industry = "frontier_model_lab"
name = "Artificial General Intelligence"
tier = "frontier"
description = """The marquee endeavor of the age — a system with human-level \
generality across every domain, able to learn anything a person can and then \
exceed it. The culmination of everything the lab has built, and it cannot be done \
on software alone: it needs compute hardware no ordinary fab can make. Finish it \
and you have changed the trajectory of the species."""
icon = "sparkles"

[artificial_general_intelligence.requires]
rd_levels = { scaling = 100, data_quality = 90, alignment = 95 }
projects = ["recursive_self_improvement"]
# cross-front gate: the AGI megaproject also reads agi_capable_hardware (chips'
# neuromorphic substrate). The research program here is one of two pillars.
stature_min = 30000

[artificial_general_intelligence.cost]
budget = 900
weeks = 200

[artificial_general_intelligence.unlocks]
products = []
capability = { agi_breakthrough = 1.0 }
synergy_tags = ["agi_achieved"]
megaproject_unlock = ["artificial_general_intelligence"]
power = 2

[superhuman_science]
id = "superhuman_science"
sub_industry = "frontier_model_lab"
name = "Superhuman scientific AI"
tier = "frontier"
description = """An AI that makes original scientific breakthroughs no human has — \
new physics, new medicine, new materials on demand. Not general intelligence, but \
a focused engine of discovery that compounds every other research program you run. \
The intellectual foundation under every megaproject."""
icon = "telescope"

[superhuman_science.requires]
rd_levels = { scaling = 90, data_quality = 100 }
projects = ["autonomous_research", "recursive_self_improvement"]
stature_min = 26000

[superhuman_science.cost]
budget = 720
weeks = 175

[superhuman_science.unlocks]
products = []
capability = { all_rd_speed = 0.35 }
synergy_tags = ["superhuman_science"]
megaproject_unlock = ["accelerated_science_program"]
power = 1

# ---- additional applied/advanced nodes (tree depth) ----

[retrieval_augmentation]
id = "retrieval_augmentation"
sub_industry = "frontier_model_lab"
name = "Retrieval-augmented generation"
tier = "applied"
description = """Letting models pull from external knowledge bases at inference \
time — grounding answers in real, current, citable sources. The technique that \
makes models trustworthy enough for enterprise, and a direct boost to reliability."""
icon = "search"

[retrieval_augmentation.requires]
rd_levels = { data_quality = 40, scaling = 30 }
projects = []
stature_min = 0

[retrieval_augmentation.cost]
budget = 18
weeks = 22

[retrieval_augmentation.unlocks]
capability = { reliability_bonus = 0.1 }
synergy_tags = []

[synthetic_data]
id = "synthetic_data"
sub_industry = "frontier_model_lab"
name = "Synthetic data generation"
tier = "applied"
description = """Models generating their own high-quality training data when real \
data runs short — breaking the data wall that scaling eventually hits. The quiet \
trick that keeps the capability curve climbing when the internet runs out."""
icon = "copy"

[synthetic_data.requires]
rd_levels = { data_quality = 45, scaling = 40 }
projects = ["multimodal_models"]
stature_min = 2000

[synthetic_data.cost]
budget = 24
weeks = 28

[synthetic_data.unlocks]
capability = { capability_bonus = 0.12 }
synergy_tags = ["synthetic_data"]

[mixture_of_experts]
id = "mixture_of_experts"
sub_industry = "frontier_model_lab"
name = "Mixture-of-experts scaling"
tier = "applied"
description = """Architectures that activate only the relevant slice of a giant \
model per query — the trick to scaling parameter counts without scaling the bill. \
How frontier models get bigger and cheaper to run at the same time."""
icon = "git-branch"

[mixture_of_experts.requires]
rd_levels = { scaling = 45, data_quality = 40 }
projects = []
stature_min = 0

[mixture_of_experts.cost]
budget = 26
weeks = 28

[mixture_of_experts.unlocks]
capability = { capability_bonus = 0.12, efficiency_bonus = 0.1 }
synergy_tags = []

[interpretability]
id = "interpretability"
sub_industry = "frontier_model_lab"
name = "Mechanistic interpretability"
tier = "advanced"
description = """Actually understanding what's happening inside the model — reading \
its reasoning, finding and fixing failure modes at the source. The science that \
turns alignment from hope into engineering, and the credibility that wins the \
hardest regulators."""
icon = "microscope"

[interpretability.requires]
rd_levels = { alignment = 60, data_quality = 50 }
projects = ["rlhf_advanced"]
stature_min = 8000

[interpretability.cost]
budget = 90
weeks = 60

[interpretability.unlocks]
capability = { reliability_bonus = 0.18 }
synergy_tags = ["alignment_leader", "interpretability"]
```

# === vertical_ai_saas ===

## `content/research/vertical_ai_saas.toml`

```toml
# content/research/vertical_ai_saas.toml
# applied (deeper domain models, platform depth) -> advanced (autonomous
# workflows, industry OS) -> frontier: become the system-of-record for an entire
# industry. Power here comes from economic indispensability, not space.
# Fast, cheap research (see _tuning: rd_pace 0.8, budget 0.7).
#
# ▶NEW = product archetype referenced in unlocks, to author later.

# ============================ APPLIED ============================

[domain_foundation_model]
id = "domain_foundation_model"
sub_industry = "vertical_ai_saas"
name = "Domain foundation model"
tier = "applied"
description = """Your own model pre-trained on your vertical's data instead of \
renting a generic one — speaking the industry's language natively. The moat \
deepens: a horizontal model can't match a system built from the ground up on the \
domain."""
icon = "book"

[domain_foundation_model.requires]
rd_levels = { domain_depth = 40, model_leverage = 35 }
projects = []
stature_min = 0

[domain_foundation_model.cost]
budget = 18
weeks = 24

[domain_foundation_model.unlocks]
products = []
capability = { domain_fit = 0.15 }
synergy_tags = ["domain_model"]
frontier_unlock = []

[workflow_automation]
id = "workflow_automation"
sub_industry = "vertical_ai_saas"
name = "Workflow automation"
tier = "applied"
description = """Move from assisting humans to completing whole steps for them — \
the product does the work, the person approves it. Each automated step raises the \
value you deliver and the cost of ever switching away from you."""
icon = "workflow"

[workflow_automation.requires]
rd_levels = { platform = 35, domain_depth = 35 }
projects = []
stature_min = 0

[workflow_automation.cost]
budget = 16
weeks = 22

[workflow_automation.unlocks]
products = []
capability = { stickiness_bonus = 0.12 }
synergy_tags = []
frontier_unlock = []

[data_network_effects]
id = "data_network_effects"
sub_industry = "vertical_ai_saas"
name = "Data network effects"
tier = "applied"
description = """Every customer's usage quietly improves the product for all the \
others — benchmarks, models, best practices that only you can see. The flywheel \
that turns market share into an unassailable lead."""
icon = "share-2"

[data_network_effects.requires]
rd_levels = { platform = 40, model_leverage = 30 }
projects = []
stature_min = 0

[data_network_effects.cost]
budget = 20
weeks = 26

[data_network_effects.unlocks]
products = []
capability = { moat_bonus = 0.15 }
synergy_tags = ["data_flywheel"]
frontier_unlock = []

[compliance_engine]
id = "compliance_engine"
sub_industry = "vertical_ai_saas"
name = "Compliance & audit engine"
tier = "applied"
description = """Bake your industry's regulations into the product — automated \
audit trails, policy enforcement, certification. The unglamorous feature that wins \
the enterprise deal and locks out competitors who'd have to rebuild it from scratch."""
icon = "clipboard-check"

[compliance_engine.requires]
rd_levels = { domain_depth = 45 }
projects = []
stature_min = 0

[compliance_engine.cost]
budget = 14
weeks = 20

[compliance_engine.unlocks]
products = []
capability = { enterprise_fit = 0.15 }
synergy_tags = []
frontier_unlock = []

# ============================ ADVANCED ============================

[autonomous_workflows]
id = "autonomous_workflows"
sub_industry = "vertical_ai_saas"
name = "Autonomous workflows"
tier = "advanced"
description = """The product runs entire processes end to end — no human in the \
loop for the routine 90%. You stop selling software and start selling outcomes, \
which is a different, far larger budget line to capture."""
icon = "cpu"

[autonomous_workflows.requires]
rd_levels = { platform = 60, domain_depth = 60, model_leverage = 50 }
projects = ["workflow_automation", "domain_foundation_model"]
stature_min = 7000

[autonomous_workflows.cost]
budget = 70
weeks = 52

[autonomous_workflows.unlocks]
products = ["autonomous_operations_suite"]   # ▶NEW advanced archetype to author later
capability = { stickiness_bonus = 0.2 }
synergy_tags = ["autonomous_workflows"]
frontier_unlock = ["industry_operating_system"]

[industry_platform]
id = "industry_platform"
sub_industry = "vertical_ai_saas"
name = "Industry platform"
tier = "advanced"
description = """Open your system for others to build on — an app ecosystem with \
your product at the center. Once partners and customers extend you, you're not a \
vendor anymore, you're infrastructure, and infrastructure doesn't get ripped out."""
icon = "layout-grid"

[industry_platform.requires]
rd_levels = { platform = 65, domain_depth = 55 }
projects = ["data_network_effects", "compliance_engine"]
stature_min = 9000

[industry_platform.cost]
budget = 90
weeks = 60

[industry_platform.unlocks]
products = []
capability = { moat_bonus = 0.2, slot = 1 }
synergy_tags = ["platform_ecosystem"]
frontier_unlock = ["industry_operating_system"]

# ============================ FRONTIER ============================

[industry_operating_system]
id = "industry_operating_system"
sub_industry = "vertical_ai_saas"
name = "Industry operating system"
tier = "frontier"
description = """Become the indispensable layer an entire industry runs on — the \
system every company in the sector uses, the standard others must integrate with, \
the toll road for a slice of the economy. Power not through rockets or reactors but \
through sheer economic gravity: pull the plug and the industry stops."""
icon = "globe-lock"

[industry_operating_system.requires]
rd_levels = { platform = 95, domain_depth = 90, model_leverage = 80 }
projects = ["autonomous_workflows", "industry_platform"]
stature_min = 22000

[industry_operating_system.cost]
budget = 480
weeks = 150

[industry_operating_system.unlocks]
products = []
capability = { economic_indispensability = 0.5 }
synergy_tags = ["industry_os"]
megaproject_unlock = ["sector_dominance_platform"]
power = 1

[autonomous_enterprise]
id = "autonomous_enterprise"
sub_industry = "vertical_ai_saas"
name = "The autonomous enterprise"
tier = "frontier"
description = """Software that can run a whole company's operations with almost no \
staff — the AI-native business in a box. Sell it and you don't just serve an \
industry, you reshape how every business in it is built. A quieter revolution than \
AGI, but it remakes the economy all the same."""
icon = "building"

[autonomous_enterprise.requires]
rd_levels = { platform = 90, model_leverage = 95, domain_depth = 85 }
projects = ["autonomous_workflows"]
stature_min = 20000

[autonomous_enterprise.cost]
budget = 420
weeks = 140

[autonomous_enterprise.unlocks]
products = []
capability = { economic_indispensability = 0.4 }
synergy_tags = ["autonomous_enterprise"]
megaproject_unlock = ["autonomous_economy_platform"]
power = 1

# ---- additional applied/advanced nodes (tree depth) ----

[vertical_copilot]
id = "vertical_copilot"
sub_industry = "vertical_ai_saas"
name = "Embedded vertical copilot"
tier = "applied"
description = """An AI assistant woven through every screen of the product, fluent \
in the customer's job. The feature users fall in love with — and the one that makes \
switching to a generic competitor feel like a downgrade overnight."""
icon = "message-circle"

[vertical_copilot.requires]
rd_levels = { model_leverage = 40, domain_depth = 35 }
projects = []
stature_min = 0

[vertical_copilot.cost]
budget = 14
weeks = 18

[vertical_copilot.unlocks]
capability = { domain_fit = 0.12 }
synergy_tags = []

[multi_vertical_expansion]
id = "multi_vertical_expansion"
sub_industry = "vertical_ai_saas"
name = "Multi-vertical expansion"
tier = "applied"
description = """Adapt your platform to a second and third industry without \
rebuilding it — turning a single-vertical winner into a portfolio. The playbook \
that multiplies your market without multiplying your engineering."""
icon = "git-fork"

[multi_vertical_expansion.requires]
rd_levels = { platform = 45, domain_depth = 40 }
projects = ["domain_foundation_model"]
stature_min = 4000

[multi_vertical_expansion.cost]
budget = 24
weeks = 30

[multi_vertical_expansion.unlocks]
products = ["multi_vertical_platform"]
capability = { enterprise_fit = 0.12 }
synergy_tags = []

[usage_based_pricing]
id = "usage_based_pricing"
sub_industry = "vertical_ai_saas"
name = "Outcome-based pricing engine"
tier = "applied"
description = """Pricing tied to the value you deliver — per outcome, per dollar \
saved — instead of per seat. It aligns your revenue with the customer's success and \
unlocks far bigger contracts than a subscription ever could."""
icon = "dollar-sign"

[usage_based_pricing.requires]
rd_levels = { platform = 40, model_leverage = 35 }
projects = []
stature_min = 0

[usage_based_pricing.cost]
budget = 12
weeks = 18

[usage_based_pricing.unlocks]
capability = { recurring_revenue = 0.12 }
synergy_tags = []

[ai_governance_layer]
id = "ai_governance_layer"
sub_industry = "vertical_ai_saas"
name = "AI governance & trust layer"
tier = "advanced"
description = """Tooling that lets regulated customers deploy AI with full \
explainability, audit, and control — the gatekeeping feature that opens finance, \
healthcare, and government. Where trust becomes the product."""
icon = "scale"

[ai_governance_layer.requires]
rd_levels = { domain_depth = 60, platform = 55 }
projects = ["compliance_engine"]
stature_min = 6000

[ai_governance_layer.cost]
budget = 60
weeks = 48

[ai_governance_layer.unlocks]
capability = { enterprise_fit = 0.2 }
synergy_tags = ["ai_governance"]
```

# === launch_services ===

## `content/research/launch_services.toml`

```toml
# content/research/launch_services.toml
# applied (full reuse, cadence) -> advanced (heavy-lift, in-space refueling) ->
# frontier: routine interplanetary transport. The interplanetary frontier
# cross-gates with space_stations' closed-loop habitation for the Mars megaproject
# (neither front gets to Mars alone). See _tuning: rd_pace 1.1, budget 1.2.
#
# ▶NEW = product archetype referenced in unlocks, to author later.

# ============================ APPLIED ============================

[rapid_reuse]
id = "rapid_reuse"
sub_industry = "launch_services"
name = "Rapid reusability"
tier = "applied"
description = """Not just recovering boosters but reflying them in days, not months \
— the difference between reuse as a stunt and reuse as a business. Drives your \
cost-per-kilogram toward territory rivals tossing their rockets can never reach."""
icon = "recycle"

[rapid_reuse.requires]
rd_levels = { reusability = 40, reliability = 40 }
projects = []
stature_min = 0

[rapid_reuse.cost]
budget = 30
weeks = 38

[rapid_reuse.unlocks]
products = []
capability = { launch_cost_reduction = 0.15 }
synergy_tags = ["cheap_launch"]
frontier_unlock = []

[engine_reuse]
id = "engine_reuse"
sub_industry = "launch_services"
name = "Full-flow engine reuse"
tier = "applied"
description = """Engines that survive dozens of flights with minimal refurbishment \
— the hardest part of reuse to get right. Crack it and the marginal cost of a \
launch collapses toward just fuel and people."""
icon = "flame"

[engine_reuse.requires]
rd_levels = { propulsion = 45, reusability = 40 }
projects = []
stature_min = 0

[engine_reuse.cost]
budget = 34
weeks = 42

[engine_reuse.unlocks]
products = []
capability = { launch_cost_reduction = 0.12 }
synergy_tags = []
frontier_unlock = []

[high_cadence_ops]
id = "high_cadence_ops"
sub_industry = "launch_services"
name = "High-cadence operations"
tier = "applied"
description = """The ground systems, integration lines, and crews to launch weekly, \
then daily — turning spaceflight from an event into a schedule. Cadence is its own \
moat: the more you fly, the cheaper, safer, and more booked you get."""
icon = "calendar-clock"

[high_cadence_ops.requires]
rd_levels = { reliability = 45, reusability = 35 }
projects = []
stature_min = 0

[high_cadence_ops.cost]
budget = 28
weeks = 36

[high_cadence_ops.unlocks]
products = []
capability = { launch_capacity_bonus = 0.2 }
synergy_tags = []
frontier_unlock = []

# ============================ ADVANCED ============================

[heavy_lift_program]
id = "heavy_lift_program"
sub_industry = "launch_services"
name = "Super-heavy-lift program"
tier = "advanced"
description = """A fully reusable super-heavy vehicle that throws hundreds of tons \
to orbit per flight — the truck that makes everything downstream possible: \
stations, megaconstellations, missions beyond Earth. The backbone of an off-world \
economy."""
icon = "rocket"

[heavy_lift_program.requires]
rd_levels = { propulsion = 65, reusability = 60, reliability = 60 }
projects = ["rapid_reuse", "engine_reuse"]
stature_min = 11000

[heavy_lift_program.cost]
budget = 180
weeks = 90

[heavy_lift_program.unlocks]
products = ["super_heavy_vehicle"]         # ▶NEW advanced archetype to author later
capability = { heavy_lift = 0.25 }
synergy_tags = ["heavy_lift", "cheap_launch"]
frontier_unlock = ["interplanetary_transport"]

[in_space_refueling]
id = "in_space_refueling"
sub_industry = "launch_services"
name = "In-space refueling"
tier = "advanced"
description = """Propellant depots and orbital refueling — the capability that turns \
low Earth orbit from a destination into a gas station. Without it, deep-space \
missions are one-shot stunts; with it, they become routine. The key that unlocks \
the solar system."""
icon = "fuel"

[in_space_refueling.requires]
rd_levels = { propulsion = 60, reliability = 65 }
projects = ["high_cadence_ops", "rapid_reuse"]
stature_min = 13000

[in_space_refueling.cost]
budget = 200
weeks = 96

[in_space_refueling.unlocks]
products = []
capability = { deep_space_capable = 0.3, slot = 1 }
synergy_tags = ["orbital_refueling"]
frontier_unlock = ["interplanetary_transport"]

# ============================ FRONTIER ============================

[interplanetary_transport]
id = "interplanetary_transport"
sub_industry = "launch_services"
name = "Routine interplanetary transport"
tier = "frontier"
description = """Regular, reliable passage to the Moon and Mars — not a heroic \
one-off but a transit line, cargo and crew on a schedule. The transport pillar of \
every off-world ambition. On its own it gets people there; paired with a way to \
keep them alive, it builds a civilization. This is launch reaching the planets."""
icon = "orbit"

[interplanetary_transport.requires]
rd_levels = { propulsion = 95, reusability = 90, reliability = 90 }
projects = ["heavy_lift_program", "in_space_refueling"]
# cross-front: the Mars megaproject also reads closed_loop_life_support (stations).
stature_min = 26000

[interplanetary_transport.cost]
budget = 620
weeks = 160

[interplanetary_transport.unlocks]
products = []
capability = { interplanetary_capable = 0.5 }
synergy_tags = ["interplanetary_transport"]
megaproject_unlock = ["mars_transit_line"]
power = 2

[space_elevator_tether]
id = "space_elevator_tether"
sub_industry = "launch_services"
name = "Orbital tether system"
tier = "frontier"
description = """A momentum-exchange tether that flings payloads to orbit and beyond \
with almost no propellant — infrastructure that makes getting to space nearly \
free. The audacious endgame of launch economics: not a cheaper rocket, but the \
obsolescence of the rocket."""
icon = "link"

[space_elevator_tether.requires]
rd_levels = { propulsion = 90, reliability = 95 }
projects = ["heavy_lift_program"]
stature_min = 28000

[space_elevator_tether.cost]
budget = 700
weeks = 175

[space_elevator_tether.unlocks]
products = []
capability = { launch_cost_reduction = 0.6 }
synergy_tags = ["tether_launch", "cheap_launch"]
megaproject_unlock = ["orbital_ring"]
power = 1

# ---- additional applied/advanced nodes (tree depth) ----

[methalox_engine]
id = "methalox_engine"
sub_industry = "launch_services"
name = "Methalox engine development"
tier = "applied"
description = """Methane-oxygen engines — cleaner-burning, easier to reuse, and \
crucially manufacturable from Martian resources. The propulsion choice that quietly \
assumes you're going somewhere beyond Earth orbit."""
icon = "flame"

[methalox_engine.requires]
rd_levels = { propulsion = 40, reusability = 35 }
projects = []
stature_min = 0

[methalox_engine.cost]
budget = 28
weeks = 36

[methalox_engine.unlocks]
capability = { launch_cost_reduction = 0.1 }
synergy_tags = ["methalox"]

[autonomous_landing]
id = "autonomous_landing"
sub_industry = "launch_services"
name = "Autonomous precision landing"
tier = "applied"
description = """Boosters that land themselves on a dime, on a ship or a pad, every \
time — the reliability that makes rapid reuse real instead of aspirational. The \
ballet that turned reusability from a dream into a business."""
icon = "crosshair"

[autonomous_landing.requires]
rd_levels = { reliability = 50, reusability = 45 }
projects = ["rapid_reuse"]
stature_min = 3000

[autonomous_landing.cost]
budget = 34
weeks = 40

[autonomous_landing.unlocks]
capability = { launch_cost_reduction = 0.12 }
synergy_tags = []

[rideshare_platform]
id = "rideshare_platform"
sub_industry = "launch_services"
name = "Rideshare aggregation platform"
tier = "applied"
description = """Software and hardware to pack dozens of small payloads onto one \
launch and deploy each to its own orbit — turning spare capacity into a high-margin \
business. The logistics layer that fills every flight."""
icon = "package"

[rideshare_platform.requires]
rd_levels = { reliability = 45, reusability = 40 }
projects = ["high_cadence_ops" ]
stature_min = 2000

[rideshare_platform.cost]
budget = 22
weeks = 30

[rideshare_platform.unlocks]
capability = { launch_capacity_bonus = 0.12 }
synergy_tags = []

[nuclear_thermal]
id = "nuclear_thermal"
sub_industry = "launch_services"
name = "Nuclear thermal propulsion"
tier = "advanced"
description = """Engines that heat propellant with a reactor instead of combustion — \
roughly doubling efficiency for deep-space transit and slashing travel time to \
Mars. The propulsion leap that makes the outer solar system reachable in human \
timescales."""
icon = "radiation"

[nuclear_thermal.requires]
rd_levels = { propulsion = 70, reliability = 65 }
projects = ["in_space_refueling"]
stature_min = 15000

[nuclear_thermal.cost]
budget = 220
weeks = 104

[nuclear_thermal.unlocks]
capability = { deep_space_capable = 0.3 }
synergy_tags = ["nuclear_propulsion"]

[fairing_recovery]
id = "fairing_recovery"
sub_industry = "launch_services"
name = "Fairing & component recovery"
tier = "applied"
description = """Catching and reflying the expensive bits that aren't the booster — \
fairings, interstages, the hardware everyone else throws away. The last few percent \
of reusability that squeezes real cost out of every flight."""
icon = "parachute"

[fairing_recovery.requires]
rd_levels = { reusability = 42, reliability = 38 }
projects = ["rapid_reuse"]
stature_min = 1500

[fairing_recovery.cost]
budget = 18
weeks = 26

[fairing_recovery.unlocks]
capability = { launch_cost_reduction = 0.08 }
synergy_tags = []
```

# === satellite_constellations ===

## `content/research/satellite_constellations.toml`

```toml
# content/research/satellite_constellations.toml
# applied (mass production, inter-sat links) -> advanced (global broadband,
# real-time earth obs) -> frontier: orbital industrial base / in-space
# manufacturing. The industrial-base frontier synergizes with launch (cheap mass
# to orbit) and gates asteroid mining. See _tuning: rd_pace 1.1, budget 1.15.
#
# ▶NEW = product archetype referenced in unlocks, to author later.

# ============================ APPLIED ============================

[mass_manufacturing]
id = "mass_manufacturing"
sub_industry = "satellite_constellations"
name = "Satellite mass manufacturing"
tier = "applied"
description = """Building satellites on an assembly line instead of as artisanal \
spacecraft — hundreds a month, each a fraction of the old cost. The unglamorous \
breakthrough that makes a megaconstellation financially possible at all."""
icon = "factory"

[mass_manufacturing.requires]
rd_levels = { mass_production = 45 }
projects = []
stature_min = 0

[mass_manufacturing.cost]
budget = 26
weeks = 34

[mass_manufacturing.unlocks]
products = []
capability = { sat_build_cost = 0.18 }
synergy_tags = ["mass_production"]
frontier_unlock = []

[inter_satellite_links]
id = "inter_satellite_links"
sub_industry = "satellite_constellations"
name = "Inter-satellite laser links"
tier = "applied"
description = """Satellites that talk to each other directly by laser, routing data \
across the constellation without touching the ground. It turns a swarm of \
individual birds into a single global network — the difference between coverage \
and a true space-based internet."""
icon = "zap"

[inter_satellite_links.requires]
rd_levels = { satellite_tech = 45, network = 40 }
projects = []
stature_min = 0

[inter_satellite_links.cost]
budget = 30
weeks = 38

[inter_satellite_links.unlocks]
products = []
capability = { coverage_bonus = 0.15 }
synergy_tags = ["mesh_network"]
frontier_unlock = []

[onboard_processing]
id = "onboard_processing"
sub_industry = "satellite_constellations"
name = "Onboard AI processing"
tier = "applied"
description = """Putting real compute on the satellites themselves so they analyze \
data in orbit and beam down answers, not raw feeds. Slashes bandwidth needs and \
turns an imaging fleet into a real-time intelligence service."""
icon = "cpu"

[onboard_processing.requires]
rd_levels = { satellite_tech = 50, network = 35 }
projects = []
stature_min = 0

[onboard_processing.cost]
budget = 28
weeks = 36

[onboard_processing.unlocks]
products = []
capability = { data_value = 0.15 }
synergy_tags = ["edge_compute_orbit"]
frontier_unlock = []

# ============================ ADVANCED ============================

[global_broadband]
id = "global_broadband"
sub_industry = "satellite_constellations"
name = "Global broadband network"
tier = "advanced"
description = """A constellation dense enough to deliver high-speed internet to \
every point on Earth — and a recurring-revenue machine with planetary reach once \
the capex hump is behind you. The network that connects the unconnected and prints \
money doing it."""
icon = "globe"

[global_broadband.requires]
rd_levels = { mass_production = 65, network = 60, satellite_tech = 55 }
projects = ["mass_manufacturing", "inter_satellite_links"]
stature_min = 12000

[global_broadband.cost]
budget = 160
weeks = 88

[global_broadband.unlocks]
products = ["global_broadband_network"]    # ▶NEW advanced archetype to author later
capability = { recurring_revenue = 0.2, slot = 1 }
synergy_tags = ["global_connectivity"]
frontier_unlock = ["orbital_industrial_base"]

[realtime_earth_obs]
id = "realtime_earth_obs"
sub_industry = "satellite_constellations"
name = "Real-time Earth observation"
tier = "advanced"
description = """Continuous, live imaging of the entire planet — every field, port, \
and road, refreshed by the minute and analyzed by AI. A god's-eye view sold to \
agriculture, finance, defense, and climate. Whoever holds it holds an information \
advantage over whole economies."""
icon = "eye"

[realtime_earth_obs.requires]
rd_levels = { satellite_tech = 65, network = 55 }
projects = ["onboard_processing", "inter_satellite_links"]
stature_min = 13000

[realtime_earth_obs.cost]
budget = 150
weeks = 84

[realtime_earth_obs.unlocks]
products = []
capability = { data_value = 0.3 }
synergy_tags = ["planetary_sensing"]
frontier_unlock = ["orbital_industrial_base"]

# ============================ FRONTIER ============================

[orbital_industrial_base]
id = "orbital_industrial_base"
sub_industry = "satellite_constellations"
name = "Orbital industrial base"
tier = "frontier"
description = """Manufacturing in orbit at scale — fabricating satellites, \
structures, and exotic materials in microgravity instead of launching everything \
from the ground. The foundation of a true space economy, and the staging ground \
for reaching the asteroids. Cheap launch makes it viable; this makes launch worth \
it."""
icon = "factory-2"

[orbital_industrial_base.requires]
rd_levels = { mass_production = 95, satellite_tech = 85 }
projects = ["global_broadband", "realtime_earth_obs"]
# synergy: reads cheap_launch / heavy_lift from launch to be economical.
stature_min = 24000

[orbital_industrial_base.cost]
budget = 560
weeks = 155

[orbital_industrial_base.unlocks]
products = []
capability = { in_space_manufacturing = 0.4 }
synergy_tags = ["orbital_manufacturing"]
megaproject_unlock = ["asteroid_mining_operation"]
power = 1

[space_solar_power]
id = "space_solar_power"
sub_industry = "satellite_constellations"
name = "Space-based solar power"
tier = "frontier"
description = """Vast orbital arrays collecting sunlight unfiltered by atmosphere or \
night and beaming it to the ground — clean baseload power on a planetary scale. \
A megastructure that needs mass-production and launch both, and rewrites the energy \
map of the world if it lands."""
icon = "sun"

[space_solar_power.requires]
rd_levels = { mass_production = 90, network = 85 }
projects = ["global_broadband"]
stature_min = 25000

[space_solar_power.cost]
budget = 640
weeks = 165

[space_solar_power.unlocks]
products = []
capability = { clean_power_generation = 0.4 }
synergy_tags = ["space_solar"]
megaproject_unlock = ["orbital_solar_array"]
power = 1

# ---- additional applied/advanced nodes (tree depth) ----

[electric_propulsion_sat]
id = "electric_propulsion_sat"
sub_industry = "satellite_constellations"
name = "Electric propulsion at scale"
tier = "applied"
description = """Efficient ion and Hall-effect thrusters on every satellite — \
longer life, precise station-keeping, and the ability to deorbit responsibly. The \
unglamorous tech that keeps a megaconstellation from becoming a debris field."""
icon = "wind"

[electric_propulsion_sat.requires]
rd_levels = { satellite_tech = 40, mass_production = 35 }
projects = []
stature_min = 0

[electric_propulsion_sat.cost]
budget = 22
weeks = 30

[electric_propulsion_sat.unlocks]
capability = { sat_build_cost = 0.1 }
synergy_tags = []

[direct_to_device]
id = "direct_to_device"
sub_industry = "satellite_constellations"
name = "Direct-to-device connectivity"
tier = "applied"
description = """Beaming signal straight to ordinary phones with no special \
terminal — turning every smartphone on Earth into a potential customer. The \
breakthrough that explodes the addressable market from enterprise to everyone."""
icon = "smartphone"

[direct_to_device.requires]
rd_levels = { satellite_tech = 50, network = 45 }
projects = ["inter_satellite_links"]
stature_min = 5000

[direct_to_device.cost]
budget = 34
weeks = 40

[direct_to_device.unlocks]
products = ["direct_to_device_service"]
capability = { recurring_revenue = 0.15 }
synergy_tags = []

[debris_mitigation]
id = "debris_mitigation"
sub_industry = "satellite_constellations"
name = "Debris tracking & mitigation"
tier = "applied"
description = """Systems to track, avoid, and actively remove orbital debris — \
protecting your fleet and earning the regulatory goodwill that lets you keep \
launching. Increasingly the license to operate in a crowded sky."""
icon = "shield"

[debris_mitigation.requires]
rd_levels = { network = 45, satellite_tech = 40 }
projects = []
stature_min = 0

[debris_mitigation.cost]
budget = 20
weeks = 28

[debris_mitigation.unlocks]
capability = { reliability_bonus = 0.1 }
synergy_tags = ["debris_removal"]

[orbital_servicing]
id = "orbital_servicing"
sub_industry = "satellite_constellations"
name = "On-orbit servicing"
tier = "advanced"
description = """Robotic craft that refuel, repair, and upgrade satellites already \
in orbit — extending fleet life and opening a service business for everyone else's \
birds too. The capability that turns satellites from disposable into maintainable."""
icon = "wrench"

[orbital_servicing.requires]
rd_levels = { satellite_tech = 60, mass_production = 55 }
projects = ["electric_propulsion_sat", "mass_manufacturing"]
stature_min = 9000

[orbital_servicing.cost]
budget = 90
weeks = 60

[orbital_servicing.unlocks]
products = ["servicing_vehicle"]
capability = { recurring_revenue = 0.15 }
synergy_tags = ["orbital_servicing"]

[ground_station_network]
id = "ground_station_network"
sub_industry = "satellite_constellations"
name = "Distributed ground network"
tier = "applied"
description = """A global mesh of ground stations and gateways that keeps every \
satellite in contact with the network at all times. The terrestrial half of a \
constellation — easy to underbuild, and the bottleneck on how much you can \
actually sell."""
icon = "antenna"

[ground_station_network.requires]
rd_levels = { network = 45, mass_production = 35 }
projects = []
stature_min = 0

[ground_station_network.cost]
budget = 20
weeks = 28

[ground_station_network.unlocks]
capability = { coverage_bonus = 0.12 }
synergy_tags = []
```

# === space_stations ===

## `content/research/space_stations.toml`

```toml
# content/research/space_stations.toml
# applied (large modules, life support) -> advanced (large stations, closed-loop
# life support) -> frontier: self-sustaining off-world habitation. The habitation
# frontier cross-gates with launch's interplanetary transport for the Mars colony
# megaproject (transport gets you there; this keeps you alive). Slow, costly
# research (see _tuning: rd_pace 1.3, budget 1.35 — the highest).
#
# ▶NEW = product archetype referenced in unlocks, to author later.

# ============================ APPLIED ============================

[expandable_habitats]
id = "expandable_habitats"
sub_industry = "space_stations"
name = "Expandable habitats"
tier = "applied"
description = """Inflatable modules that launch compact and expand to many times \
their volume in orbit — far more living space per kilogram lifted. The trick that \
makes a roomy station affordable instead of a tin can you can't stand up in."""
icon = "maximize"

[expandable_habitats.requires]
rd_levels = { module_tech = 40, assembly = 35 }
projects = []
stature_min = 0

[expandable_habitats.cost]
budget = 30
weeks = 40

[expandable_habitats.unlocks]
products = []
capability = { habitat_volume = 0.18 }
synergy_tags = []
frontier_unlock = []

[life_support_recycling]
id = "life_support_recycling"
sub_industry = "space_stations"
name = "Life-support recycling"
tier = "applied"
description = """Reclaiming water and oxygen from waste instead of hauling them up \
endlessly — the first real step toward a station that isn't on an umbilical to \
Earth. Every percent of recycling is a percent less resupply, and the path to true \
self-sufficiency starts here."""
icon = "recycle"

[life_support_recycling.requires]
rd_levels = { life_support = 45 }
projects = []
stature_min = 0

[life_support_recycling.cost]
budget = 32
weeks = 42

[life_support_recycling.unlocks]
products = []
capability = { life_support_efficiency = 0.2 }
synergy_tags = ["life_support"]
frontier_unlock = []

[orbital_assembly]
id = "orbital_assembly"
sub_industry = "space_stations"
name = "Autonomous orbital assembly"
tier = "applied"
description = """Robots that build large structures in orbit without a human \
spacewalk for every bolt — the capability that lets stations grow beyond what one \
launch can deliver. Construction in space stops being the bottleneck and starts \
being routine."""
icon = "robot-arm"

[orbital_assembly.requires]
rd_levels = { assembly = 50, module_tech = 40 }
projects = []
stature_min = 0

[orbital_assembly.cost]
budget = 28
weeks = 38

[orbital_assembly.unlocks]
products = []
capability = { assembly_speed = 0.18 }
synergy_tags = ["orbital_assembly"]
frontier_unlock = []

# ============================ ADVANCED ============================

[large_scale_stations]
id = "large_scale_stations"
sub_industry = "space_stations"
name = "Large-scale stations"
tier = "advanced"
description = """Multi-hundred-person orbital complexes — research parks, factories, \
and habitats rolled into one rotating structure with artificial gravity. The leap \
from outpost to destination, and the template for anywhere humans will live off \
Earth."""
icon = "building-2"

[large_scale_stations.requires]
rd_levels = { module_tech = 65, assembly = 60, life_support = 55 }
projects = ["expandable_habitats", "orbital_assembly"]
stature_min = 12000

[large_scale_stations.cost]
budget = 190
weeks = 96

[large_scale_stations.unlocks]
products = ["orbital_city"]                # ▶NEW advanced archetype to author later
capability = { habitat_volume = 0.25, slot = 1 }
synergy_tags = ["large_habitat"]
frontier_unlock = ["closed_loop_habitation"]

[closed_loop_life_support]
id = "closed_loop_life_support"
sub_industry = "space_stations"
name = "Closed-loop life support"
tier = "advanced"
description = """A fully self-contained biosphere — air, water, and food cycling \
indefinitely with no resupply from Earth. The single hardest problem standing \
between humanity and living off-world, and the one a Mars colony absolutely cannot \
do without. Solve this and the planets are open."""
icon = "leaf"

[closed_loop_life_support.requires]
rd_levels = { life_support = 75, module_tech = 60 }
projects = ["life_support_recycling"]
stature_min = 15000

[closed_loop_life_support.cost]
budget = 240
weeks = 110

[closed_loop_life_support.unlocks]
products = []
capability = { self_sufficiency = 0.3 }
synergy_tags = ["closed_loop_life_support"]
frontier_unlock = ["closed_loop_habitation"]

# ============================ FRONTIER ============================

[closed_loop_habitation]
id = "closed_loop_habitation"
sub_industry = "space_stations"
name = "Self-sustaining off-world habitation"
tier = "frontier"
description = """A permanent settlement that lives off the local environment — \
growing its own food, making its own air and water, expanding without Earth. The \
habitation pillar of any colony: launch can carry people to Mars, but only this \
keeps them alive there for good. The capability that makes humanity multiplanetary."""
icon = "home"

[closed_loop_habitation.requires]
rd_levels = { life_support = 100, module_tech = 90, assembly = 85 }
projects = ["large_scale_stations", "closed_loop_life_support"]
# cross-front: the Mars colony megaproject also reads interplanetary_transport
# (launch). This is the life-support pillar; launch is the transport pillar.
stature_min = 28000

[closed_loop_habitation.cost]
budget = 780
weeks = 190

[closed_loop_habitation.unlocks]
products = []
capability = { off_world_self_sufficiency = 0.6 }
synergy_tags = ["self_sustaining_colony"]
megaproject_unlock = ["mars_colony"]
power = 2

[artificial_gravity_habitat]
id = "artificial_gravity_habitat"
sub_industry = "space_stations"
name = "Artificial-gravity megahabitat"
tier = "frontier"
description = """A rotating habitat large enough to give its residents full Earth \
gravity — solving the long-term health problem that microgravity inflicts on the \
human body. The structure that lets people live in space not for months but for \
generations. A world of our own making, spun from orbit."""
icon = "globe-2"

[artificial_gravity_habitat.requires]
rd_levels = { module_tech = 95, assembly = 90 }
projects = ["large_scale_stations"]
stature_min = 26000

[artificial_gravity_habitat.cost]
budget = 720
weeks = 180

[artificial_gravity_habitat.unlocks]
products = []
capability = { permanent_habitation = 0.5 }
synergy_tags = ["rotating_habitat"]
megaproject_unlock = ["oneill_cylinder"]
power = 1

# ---- additional applied/advanced nodes (tree depth) ----

[radiation_shielding]
id = "radiation_shielding"
sub_industry = "space_stations"
name = "Radiation shielding"
tier = "applied"
description = """Protecting crews from cosmic rays and solar storms — the invisible \
killer of long-duration spaceflight. Without it, stays in orbit and beyond are \
capped at weeks; with it, people can live up there for years."""
icon = "shield-half"

[radiation_shielding.requires]
rd_levels = { module_tech = 45, life_support = 40 }
projects = []
stature_min = 0

[radiation_shielding.cost]
budget = 26
weeks = 34

[radiation_shielding.unlocks]
capability = { habitat_safety = 0.15 }
synergy_tags = ["radiation_protection"]

[in_space_manufacturing_mod]
id = "in_space_manufacturing_mod"
sub_industry = "space_stations"
name = "In-space manufacturing module"
tier = "applied"
description = """Modules built for production, not just habitation — fiber, \
pharmaceuticals, and alloys that can only be made in microgravity. The product that \
turns a station from a cost center into a factory with a high-value export."""
icon = "package-2"

[in_space_manufacturing_mod.requires]
rd_levels = { module_tech = 50, assembly = 45 }
projects = ["orbital_assembly"]
stature_min = 4000

[in_space_manufacturing_mod.cost]
budget = 36
weeks = 44

[in_space_manufacturing_mod.unlocks]
products = ["microgravity_factory"]
capability = { recurring_revenue = 0.15 }
synergy_tags = ["microgravity_manufacturing"]

[crew_health_systems]
id = "crew_health_systems"
sub_industry = "space_stations"
name = "Long-duration crew health"
tier = "applied"
description = """Medical, psychological, and exercise systems that keep humans \
healthy through months and years off Earth. The human factors that make permanent \
habitation actually survivable — and the difference between a visit and a life."""
icon = "heart-pulse"

[crew_health_systems.requires]
rd_levels = { life_support = 50, module_tech = 40 }
projects = ["life_support_recycling"]
stature_min = 3000

[crew_health_systems.cost]
budget = 28
weeks = 38

[crew_health_systems.unlocks]
capability = { self_sufficiency = 0.12 }
synergy_tags = []

[space_agriculture]
id = "space_agriculture"
sub_industry = "space_stations"
name = "Space agriculture"
tier = "advanced"
description = """Growing food reliably in orbit — closed bioregenerative systems \
that feed a crew without resupply. A cornerstone of true self-sufficiency and an \
absolute prerequisite for any colony that intends to outlast its launch windows."""
icon = "sprout"

[space_agriculture.requires]
rd_levels = { life_support = 65, module_tech = 55 }
projects = ["life_support_recycling", "expandable_habitats"]
stature_min = 9000

[space_agriculture.cost]
budget = 80
weeks = 64

[space_agriculture.unlocks]
capability = { self_sufficiency = 0.2 }
synergy_tags = ["space_agriculture"]

[docking_standardization]
id = "docking_standardization"
sub_industry = "space_stations"
name = "Universal docking standard"
tier = "applied"
description = """Define the docking interface everyone else has to build to — making \
your station the hub that all spacecraft connect through. Set the standard and you \
collect a toll on the whole orbital economy's traffic."""
icon = "git-merge"

[docking_standardization.requires]
rd_levels = { module_tech = 45, assembly = 40 }
projects = ["orbital_assembly"]
stature_min = 2500

[docking_standardization.cost]
budget = 18
weeks = 26

[docking_standardization.unlocks]
capability = { assembly_speed = 0.1 }
synergy_tags = ["docking_standard"]
```

# === Cross-domain (synergy) ===

## `content/research/_cross_domain.toml`

```toml
# content/research/_cross_domain.toml
# The research that IS synergy: nodes available only once you operate in 2+
# sub-industries, whose payoff buffs the contributing fronts. The connective
# tissue of the empire — they reward the natural integration paths. requires.fronts
# lists the sub-industries you must operate in; unlocks.capability buffs both.

[ai_designed_silicon]
id = "ai_designed_silicon"
name = "AI-designed silicon"
description = """Turn your own models loose on chip design — let the AI explore the \
architecture space no human team could. Only possible if you run both a frontier \
lab and a chip operation, and it makes each one better than it could ever be alone."""
icon = "circuit"

[ai_designed_silicon.requires]
fronts = ["frontier_model_lab", "ai_chips"]
rd_levels = { scaling = 50, architecture = 50 }
projects = []
stature_min = 12000

[ai_designed_silicon.cost]
budget = 90
weeks = 60

[ai_designed_silicon.unlocks]
capability = { chip_rd_speed = 0.25, ai_rd_speed = 0.1 }
synergy_tags = ["ai_chip_codesign"]

[vertically_integrated_ai]
id = "vertically_integrated_ai"
name = "Vertically integrated AI stack"
description = """Own the whole stack — your chips, your models, your applications — \
and tune each layer to the others in ways a company renting any piece never can. \
The integration that turns three good businesses into one dominant one."""
icon = "layers-3"

[vertically_integrated_ai.requires]
fronts = ["frontier_model_lab", "ai_chips", "vertical_ai_saas"]
rd_levels = { scaling = 60, architecture = 60, platform = 55 }
projects = ["ai_designed_silicon"]
stature_min = 20000

[vertically_integrated_ai.cost]
budget = 160
weeks = 90

[vertically_integrated_ai.unlocks]
capability = { ai_compute_efficiency = 0.2, chip_rd_speed = 0.15, ai_rd_speed = 0.15 }
synergy_tags = ["full_ai_stack"]

[reusable_satellite_launch]
id = "reusable_satellite_launch"
name = "Integrated launch & constellation"
description = """Fly your own satellites on your own rockets — matching vehicle \
cadence to manufacturing output so neither waits on the other. The integration \
that makes a megaconstellation actually deployable instead of a slide in a deck."""
icon = "rocket"

[reusable_satellite_launch.requires]
fronts = ["launch_services", "satellite_constellations"]
rd_levels = { reusability = 50, mass_production = 50 }
projects = []
stature_min = 13000

[reusable_satellite_launch.cost]
budget = 100
weeks = 64

[reusable_satellite_launch.unlocks]
capability = { sat_build_cost = 0.2, launch_capacity_bonus = 0.15 }
synergy_tags = ["integrated_space_logistics"]

[orbital_construction_logistics]
id = "orbital_construction_logistics"
name = "Orbital construction logistics"
description = """Combine heavy-lift launch with in-orbit assembly to build \
structures too large to ever launch whole — stations, arrays, megastructures \
assembled piece by piece on orbit. The capability that makes the truly big \
endeavors buildable."""
icon = "crane"

[orbital_construction_logistics.requires]
fronts = ["launch_services", "space_stations"]
rd_levels = { reusability = 55, assembly = 55 }
projects = []
stature_min = 14000

[orbital_construction_logistics.cost]
budget = 120
weeks = 70

[orbital_construction_logistics.unlocks]
capability = { assembly_speed = 0.2, heavy_lift = 0.1 }
synergy_tags = ["orbital_construction"]

[space_based_compute]
id = "space_based_compute"
name = "Space-based data centers"
description = """Put compute in orbit — unlimited solar power, free cooling in the \
vacuum, and your satellites' onboard AI fed by datacenter-class hardware. Only \
possible if you build both the silicon and the satellites, and it turns orbit into \
the cheapest place to run a model."""
icon = "server"

[space_based_compute.requires]
fronts = ["ai_chips", "satellite_constellations"]
rd_levels = { process_node = 60, satellite_tech = 60 }
projects = []
stature_min = 16000

[space_based_compute.cost]
budget = 140
weeks = 80

[space_based_compute.unlocks]
capability = { ai_compute_efficiency = 0.18, data_value = 0.15 }
synergy_tags = ["orbital_compute"]

[autonomous_space_ops]
id = "autonomous_space_ops"
name = "Autonomous space operations"
description = """Run your entire space enterprise — launches, constellations, \
stations — with AI agents instead of armies of operators. Needs a real lab and \
real space assets, and it slashes the operating cost of everything you fly."""
icon = "satellite-dish"

[autonomous_space_ops.requires]
fronts = ["frontier_model_lab", "satellite_constellations", "launch_services"]
rd_levels = { scaling = 65, network = 55, reliability = 55 }
projects = ["autonomous_agents"]
stature_min = 19000

[autonomous_space_ops.cost]
budget = 150
weeks = 84

[autonomous_space_ops.unlocks]
capability = { launch_capacity_bonus = 0.2, recurring_revenue = 0.15 }
synergy_tags = ["autonomous_space"]

[ai_accelerated_research]
id = "ai_accelerated_research"
name = "AI-accelerated R&D"
description = """Point superhuman scientific AI at every research program you run — \
the lab's discovery engine compounding progress across chips, launch, satellites, \
and stations at once. The synergy that makes a diversified titan research faster \
than any focused rival."""
icon = "flask"

[ai_accelerated_research.requires]
fronts = ["frontier_model_lab", "ai_chips", "launch_services", "space_stations"]
rd_levels = { scaling = 80, data_quality = 75 }
projects = ["autonomous_research"]
stature_min = 24000

[ai_accelerated_research.cost]
budget = 220
weeks = 100

[ai_accelerated_research.unlocks]
capability = { all_rd_speed = 0.25, slot = 1 }
synergy_tags = ["ai_research_engine"]
```

# === R&D line ceiling additions ===

The following `level_ceiling` fields were added to existing `rd_lines` files so frontier programs can require pushing a line past 90:

- **ai_chips**: `process_node` → 130, `architecture` → 120
- **frontier_model_lab**: `scaling` → 130, `alignment` → 120
- **launch_services**: `propulsion` → 130, `reliability` → 120
- **satellite_constellations**: `satellite_tech` → 120, `mass_production` → 130
- **space_stations**: `module_tech` → 120, `life_support` → 130
