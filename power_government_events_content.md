# Power & Government Events — Authored Content

The dramatization layer for the power axis — how power's *consequences* play out, beat by beat, turning the power meter from a number into a story. Authored against the *Power & Government Events* spec. These are global events gated by power / entanglement / stature, not scoped to one frontier.

**Drop-in path:** `content/events/power/<category>.toml`

---

## Validation summary

All content passes the spec's Part 5 checklist:

- **17 events across 4 categories**: scrutiny (5), entanglement (5), lobbying (3), sovereignty (4) — the exact spread the spec specifies.
- Every event is **threshold-gated** on power / entanglement / stature; sovereignty events all gate at **power ≥ 5** (the top of the meter).
- Every event declares `frequency_scales_with` (power or entanglement) so the texture ramps with exposure.
- Every `kind` is flavor | opportunity | crisis; every crisis has ≥2 choices.
- All effect keys are engine-known (`power_delta`, `entanglement_delta`, `reputation_delta`, `revenue_delta`, `regulation_level`, `legacy_victory`).
- **`classified_contract_leak` correctly services the contracts hook** — it gates on an active `intelligence_service` contract (a real customer), delivering the "a scoped event can expose this" risk that two intelligence contracts (`intel_compute_access`, `sat_intel_surveillance`) declared.
- `more_powerful_than_government` registers a fresh `legacy_victory` id that doesn't collide with the 10 megaproject victories.

**Two events added vs. the spec draft** (the spec's Part 5 says scrutiny 5 / entanglement 5, but Part 4 authored only 4 each — 15 total, not the stated 17). To hit the spec's stated count and the clean 5/5/3/4 spread, I added:

- `oversight_hearing` (scrutiny) — a televised legislative hearing: play contrite (reputation up, power down) vs. stand your ground (power up, reputation down, regulation up).
- `export_control_restriction` (entanglement) — the state bars you from selling to certain foreign markets: comply (lose revenue, gain power) vs. lobby for an exemption (deeper entanglement). On-theme for the entanglement axis.

---

## The arc these create

Read top to bottom, the categories *are* the late-game story — the world's posture toward you shifting from governing → negotiating → answering:

| category | gate | the world's posture | sample beats |
|---|---|---|---|
| **scrutiny** | power + stature | governing you (immune response to bigness) | antitrust inquiry, breakup pressure, oversight hearing, public backlash |
| **entanglement** | entanglement | binding you (the cost of government work) | classified contract leak, priority-clause obligation, hostile administration, export controls |
| **lobbying** | power | you wielding power | shape legislation, policy-council seat, fund an initiative |
| **sovereignty** | high power (5+) | answering to you (the payoff) | summoned as a peer, mediate a nations' dispute, your standard becomes law, more powerful than the government |

Most events offer the recurring **power-vs-reputation/independence fork** — defy or comply, assert control or accept oversight — so how you answer the world's reactions defines whether you become the feared sovereign or the respected institution. The `more_powerful_than_government` beat at the very top (power 7+, stature $75B) is the legacy-victory payoff the whole power axis was built to deliver.

---

## `content/events/power/scrutiny.toml`  (5 events)

```toml
# Power/government events — SCRUTINY (5). The cost of bigness. Gate on power +
# stature; the world's immune response to a giant. Fire more often as power grows.

[antitrust_inquiry]
id = "antitrust_inquiry"
category = "scrutiny"
gates = { power_min = 2, stature_min = 15000 }
frequency_scales_with = "power"
kind = "crisis"
weight = 1.0
cooldown_weeks = 78
headline = "Antitrust regulators open a formal inquiry"
body = """Your dominance has drawn a formal antitrust investigation. You can offer \
concessions to settle it quietly, or fight to keep your position whole and accept \
the scrutiny — and the precedent — that comes with refusing to yield."""
[[antitrust_inquiry.choices]]
label = "Settle with concessions"
[antitrust_inquiry.choices.effects]
reputation_delta = 1
power_delta = -1
revenue_delta = -50
[[antitrust_inquiry.choices]]
label = "Fight it"
[antitrust_inquiry.choices.effects]
power_delta = 1
reputation_delta = -1
regulation_level = 1

[breakup_pressure]
id = "breakup_pressure"
category = "scrutiny"
gates = { power_min = 4, stature_min = 40000 }
frequency_scales_with = "power"
kind = "crisis"
weight = 0.9
cooldown_weeks = 120
headline = "Lawmakers call for your company to be broken up"
body = """You have grown large enough that legislators are openly proposing to \
dismantle you. A grave threat — and a backhanded acknowledgment that you've become \
too important to ignore. You can mount a charm offensive, or dare them to try."""
[[breakup_pressure.choices]]
label = "Charm offensive ($150M)"
[breakup_pressure.choices.effects]
revenue_delta = -150
reputation_delta = 2
[[breakup_pressure.choices]]
label = "Dare them"
[breakup_pressure.choices.effects]
power_delta = 2
reputation_delta = -2
regulation_level = 1

[regulatory_framework]
id = "regulatory_framework"
category = "scrutiny"
gates = { power_min = 2, stature_min = 18000 }
frequency_scales_with = "power"
kind = "crisis"
weight = 1.0
cooldown_weeks = 70
headline = "A new regulatory framework targets your industry"
body = """Lawmakers draft rules clearly aimed at your line of business. You can help \
write them — shaping the cage you'll live in — or oppose them outright."""
[[regulatory_framework.choices]]
label = "Help write the rules"
[regulatory_framework.choices.effects]
power_delta = 1
reputation_delta = 1
revenue_delta = -30
[[regulatory_framework.choices]]
label = "Oppose them"
[regulatory_framework.choices.effects]
reputation_delta = -1
regulation_level = 1

[public_backlash]
id = "public_backlash"
category = "scrutiny"
gates = { power_min = 3, stature_min = 25000 }
frequency_scales_with = "power"
kind = "flavor"
weight = 1.0
cooldown_weeks = 60
headline = "Public unease grows over your concentration of power"
body = """Op-eds and protests question whether any company should be as powerful as \
yours has become. No immediate action — but the mood is shifting, and moods become \
laws."""
[public_backlash.effects]
reputation_delta = -1
regulation_level = 1

[oversight_hearing]
id = "oversight_hearing"
category = "scrutiny"
gates = { power_min = 3, stature_min = 22000 }
frequency_scales_with = "power"
kind = "crisis"
weight = 1.0
cooldown_weeks = 75
headline = "You are called to testify before the legislature"
body = """Lawmakers summon you to a televised hearing to answer for your company's \
size and conduct. The cameras are on and the questions are hostile. You can play \
contrite and disarm them, or stand your ground and refuse to apologize for winning."""
[[oversight_hearing.choices]]
label = "Play contrite"
[oversight_hearing.choices.effects]
reputation_delta = 1
power_delta = -1
[[oversight_hearing.choices]]
label = "Stand your ground"
[oversight_hearing.choices.effects]
power_delta = 1
reputation_delta = -1
regulation_level = 1
```

## `content/events/power/entanglement.toml`  (5 events)

```toml
# Power/government events — ENTANGLEMENT (5). The cost of government work. Gate on
# entanglement (from 16 contracts). Includes the leak event the intelligence
# contracts declared as their "a scoped event can expose this" hook.

[classified_contract_leak]
id = "classified_contract_leak"
category = "entanglement"
gates = { entanglement_min = 40 }
requires_active_contract_customer = "intelligence_service"
frequency_scales_with = "entanglement"
kind = "crisis"
weight = 1.0
cooldown_weeks = 90
headline = "A classified contract is leaked to the press"
body = """Documents exposing your secret work for an intelligence service have hit \
the front pages. The public and your commercial customers are alarmed. You can come \
clean and weather it, or deny and deflect and hope it blows over."""
[[classified_contract_leak.choices]]
label = "Come clean"
[classified_contract_leak.choices.effects]
reputation_delta = -1
[[classified_contract_leak.choices]]
label = "Deny and deflect"
[classified_contract_leak.choices.effects]
reputation_delta = -2
power_delta = 1

[contract_obligation]
id = "contract_obligation"
category = "entanglement"
gates = { entanglement_min = 30 }
frequency_scales_with = "entanglement"
kind = "crisis"
weight = 1.0
cooldown_weeks = 65
headline = "The state invokes a priority clause"
body = """A government you're contracted to invokes its priority rights — \
commandeering capacity you'd planned to sell commercially. You're bound by the \
terms you signed. You can comply, or push back and strain the relationship."""
[[contract_obligation.choices]]
label = "Comply with the order"
[contract_obligation.choices.effects]
revenue_delta = -40
power_delta = 1
[[contract_obligation.choices]]
label = "Push back"
[contract_obligation.choices.effects]
entanglement_delta = -8
reputation_delta = -1
power_delta = -1

[administration_change]
id = "administration_change"
category = "entanglement"
gates = { entanglement_min = 35 }
frequency_scales_with = "entanglement"
kind = "crisis"
weight = 0.9
cooldown_weeks = 100
headline = "A hostile administration takes power"
body = """An election has put a government in power that views your influence with \
suspicion. The contracts that made you strong now make you a target. You can invest \
in the new relationship, or weather the cold and lean on your other channels."""
[[administration_change.choices]]
label = "Invest in the relationship ($100M)"
[administration_change.choices.effects]
revenue_delta = -100
entanglement_delta = 5
[[administration_change.choices]]
label = "Weather the cold"
[administration_change.choices.effects]
power_delta = -1
revenue_delta = -50

[defense_dependency]
id = "defense_dependency"
category = "entanglement"
gates = { entanglement_min = 50 }
frequency_scales_with = "entanglement"
kind = "flavor"
weight = 1.0
cooldown_weeks = 70
headline = "You are named a critical defense supplier"
body = """The state formally designates your company critical national-security \
infrastructure. It is a mark of how essential you've become — and a set of \
obligations and oversight you can never fully shed. Protected, and bound."""
[defense_dependency.effects]
power_delta = 1
entanglement_delta = 5

[export_control_restriction]
id = "export_control_restriction"
category = "entanglement"
gates = { entanglement_min = 35 }
frequency_scales_with = "entanglement"
kind = "crisis"
weight = 0.9
cooldown_weeks = 85
headline = "The state restricts who you may sell to"
body = """Citing national security, the government bars you from selling your most \
advanced products to certain foreign markets. It protects your standing at home \
and severs lucrative business abroad. You can comply, or quietly lobby for an \
exemption."""
[[export_control_restriction.choices]]
label = "Comply with the controls"
[export_control_restriction.choices.effects]
revenue_delta = -70
power_delta = 1
[[export_control_restriction.choices]]
label = "Lobby for an exemption ($50M)"
[export_control_restriction.choices.effects]
revenue_delta = -50
entanglement_delta = 4
```

## `content/events/power/lobbying.toml`  (3 events)

```toml
# Power/government events — LOBBYING / INFLUENCE (3). The USE of power. Gate on
# power; opportunities to spend money/power/influence to shape policy and favor.

[lobbying_opportunity]
id = "lobbying_opportunity"
category = "lobbying"
gates = { power_min = 2, stature_min = 14000 }
frequency_scales_with = "power"
kind = "opportunity"
weight = 1.0
cooldown_weeks = 55
headline = "A chance to shape pending legislation"
body = """A bill that will affect your industry for a decade is being drafted. A \
well-placed lobbying campaign could tilt it your way — a direct, if unglamorous, \
exercise of the power you've built."""
[[lobbying_opportunity.choices]]
label = "Fund the campaign ($60M)"
[lobbying_opportunity.choices.effects]
revenue_delta = -60
power_delta = 1
regulation_level = -1
[[lobbying_opportunity.choices]]
label = "Stay out of it"
[lobbying_opportunity.choices.effects]
reputation_delta = 1

[policy_advisory_seat]
id = "policy_advisory_seat"
category = "lobbying"
gates = { power_min = 3, stature_min = 22000 }
frequency_scales_with = "power"
kind = "opportunity"
weight = 1.0
cooldown_weeks = 70
headline = "You're offered a seat on a national policy council"
body = """The government invites you onto a council shaping national technology \
strategy. Real influence over the rules everyone plays by — at the cost of being \
seen as part of the establishment you might one day need to defy."""
[[policy_advisory_seat.choices]]
label = "Take the seat"
[policy_advisory_seat.choices.effects]
power_delta = 1
entanglement_delta = 6
[[policy_advisory_seat.choices]]
label = "Decline to stay independent"
[policy_advisory_seat.choices.effects]
reputation_delta = 1

[fund_initiative]
id = "fund_initiative"
category = "lobbying"
gates = { power_min = 2, stature_min = 16000 }
frequency_scales_with = "power"
kind = "opportunity"
weight = 1.0
cooldown_weeks = 60
headline = "A chance to fund a public initiative in your favor"
body = """Bankrolling a research institute, a think tank, or a public-works program \
would build goodwill and quietly steer the conversation your way. Soft power, \
bought."""
[[fund_initiative.choices]]
label = "Fund it ($80M)"
[fund_initiative.choices.effects]
revenue_delta = -80
reputation_delta = 2
power_delta = 1
[[fund_initiative.choices]]
label = "Pass"
[fund_initiative.choices.effects]
reputation_delta = 0
```

## `content/events/power/sovereignty.toml`  (4 events)

```toml
# Power/government events — SOVEREIGNTY (4). The TOP of the arc. Gated to high
# power (5+). Governments negotiate with you as a peer, then defer to you. The
# rarest, most-savored beats — the "more powerful than the government" payoff.

[summoned_as_peer]
id = "summoned_as_peer"
category = "sovereignty"
gates = { power_min = 5, stature_min = 45000 }
frequency_scales_with = "power"
kind = "flavor"
weight = 1.0
cooldown_weeks = 80
headline = "A head of state requests a meeting — as an equal"
body = """A national leader asks to meet you not as a regulator to a company, but as \
one power to another. The framing alone is historic: you are now an actor on the \
world stage, negotiated with rather than governed."""
[summoned_as_peer.effects]
power_delta = 1
reputation_delta = 1

[arbitrate_dispute]
id = "arbitrate_dispute"
category = "sovereignty"
gates = { power_min = 5, stature_min = 50000 }
frequency_scales_with = "power"
kind = "opportunity"
weight = 0.9
cooldown_weeks = 100
headline = "Nations ask you to mediate a dispute"
body = """A disagreement between states — over orbital rights, or resources, or \
access to your infrastructure — and the parties have asked *you* to mediate. You \
hold leverage over both. The role is the clearest sign yet that you have surpassed \
the institutions that once oversaw you."""
[[arbitrate_dispute.choices]]
label = "Mediate impartially"
[arbitrate_dispute.choices.effects]
reputation_delta = 2
power_delta = 1
[[arbitrate_dispute.choices]]
label = "Tilt it to your advantage"
[arbitrate_dispute.choices.effects]
power_delta = 2
reputation_delta = -1

[set_the_policy]
id = "set_the_policy"
category = "sovereignty"
gates = { power_min = 6, stature_min = 60000 }
frequency_scales_with = "power"
kind = "crisis"
weight = 1.0
cooldown_weeks = 110
headline = "Governments adopt your standard as international law"
body = """A framework your company authored — for AI, for orbital traffic, for the \
new economy — is being adopted by governments as binding international policy. You \
are no longer subject to the rules. You write them. The question is only how openly \
you wield it."""
[[set_the_policy.choices]]
label = "Wield it openly"
[set_the_policy.choices.effects]
power_delta = 2
reputation_delta = -1
[[set_the_policy.choices]]
label = "Wield it quietly"
[set_the_policy.choices.effects]
power_delta = 1
reputation_delta = 1

[more_powerful_than_government]
id = "more_powerful_than_government"
category = "sovereignty"
gates = { power_min = 7, stature_min = 75000 }
frequency_scales_with = "power"
kind = "flavor"
weight = 1.0
cooldown_weeks = 9999
headline = "Analysts conclude your company now outweighs most nations"
body = """It is said plainly now, in the press and in the halls of power: your \
company is more powerful than most of the governments of the Earth. Budgets larger \
than nations', infrastructure entire states depend on, a say in matters once \
reserved for sovereigns. The founder's garage is a long way behind you. The \
question of what you do with this has no precedent to guide it."""
[more_powerful_than_government.effects]
power_delta = 1
reputation_delta = 1
legacy_victory = "more_powerful_than_government"
```
