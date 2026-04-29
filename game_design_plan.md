# Moonshot Inc — Design & Build Plan

*A Steam-first business sim in the vein of Coffee Inc 2, Plutocracy, and Wall Street Raider — set in the moonshot industries of Space, AI, Biotech, Energy & Climate, Defense, Advanced Manufacturing, Mobility, and Quantum. A focused mobile port to follow after Steam launch validates the core loop.*

---

## 1. Name Ideas

Strong options, ranked roughly by fit:

1. **Moonshot Inc** — directly evokes all three industries (space, AI, gene editing are *the* canonical moonshots). Echoes Coffee Inc 2's naming pattern. **My top pick.**
2. **Frontier** / **Frontier Tycoon** — captures bleeding-edge industries; clean and brandable.
3. **Magnate** — implies both empire-building and the lifestyle/wealth side (yachts, mansions).
4. **Cap Table** — insider-y, signals depth to sim fans; might be too jargon-heavy for casual.
5. **Founder Mode** — culturally current (Paul Graham essay), evokes the operator fantasy.
6. **Series Z** — playful VC reference; suggests endless growth.
7. **Exit Strategy** — IPO/acquisition fantasy front and center.
8. **Apex Inc**
9. **Conglomerate**
10. **Burn Rate**
11. **Vested**
12. **The Founder**

**Recommended shortlist for testing:** *Moonshot Inc*, *Frontier Tycoon*, *Magnate*. All three are clean, available-sounding, and signal genre. Run a quick App Store search and trademark check before committing.

---

## 2. Vision & Elevator Pitch

> Start with $50,000 and a dream. Found a rocket company, a frontier AI lab, or a gene therapy startup. Raise venture capital, hire engineers, ship products, IPO. Then do it again — and again. Build a portfolio of companies, a personal fortune, and an empire that bends industries. Live the founder-investor-magnate fantasy: from your first seed round to your name on a hospital wing.

The game sits at the intersection of three fantasies players already love:

- **Operator fantasy** (Coffee Inc 2): running a real business, decisions matter
- **Investor fantasy** (Trading Game): reading the market, sizing positions, getting rich
- **Magnate fantasy** (Bitlife / GTA wealth porn): the cars, the houses, the philanthropy, the influence

Most games do one. This does all three, with the deep economic simulation as the spine.

---

## 3. Core Game Loop

**Inner loop (per turn):**
Player makes decisions for the current week (hire, ship, invest, vote, buy) → clicks **Advance Week** → simulation ticks one game-week forward → player reviews changes (financials, news, market prices) → handles any new decisions → repeat.

The game is **fully turn-based**. No real-time pressure. Time advances only when the player clicks. For uneventful stretches, the player can fast-forward via **Advance Month** or **Advance to Next Event** — the engine auto-pauses the moment anything needs attention (board vote, term sheet, FDA decision, market shock, employee crisis). Players never miss anything important, and they never feel rushed.

Compare to Civilization VI, Crusader Kings III, or Stardew Valley's "sleep to advance day" — same pacing philosophy, different theme.

**Outer loop (session-to-session):**
Found company → raise rounds → grow → exit (IPO/acquisition) → use proceeds to invest, found another company, or live large → unlock higher-tier opportunities.

**Meta loop (across save files):**
Net worth milestones unlock new starting options, industries, and difficulty modifiers (e.g., "Start in 1995," "Hard mode: AI winter," "Sandbox: $1B starting cash").

---

## 4. Game Pillars

These constrain every design decision. If a feature doesn't serve a pillar, cut it.

1. **Decisions feel weighty.** Every major choice has trade-offs that play out over weeks of game time, not seconds.
2. **Numbers are honest.** Cap tables, valuations, dilution, P&L — they should resemble real-world finance closely enough that founders/finance people respect it. This is the moat vs. shallow tycoons.
3. **The world feels alive.** Procedural events, sector rotations, competitor moves, and macro cycles make every save unique.
4. **Three power loops, one game.** Operating, investing, and lifestyle/influence reinforce each other rather than competing for attention.
5. **Desktop-first density, depth-friendly pacing.** Built for the Steam sim audience — Bloomberg-grade information density, multi-panel workspaces, keyboard-driven navigation. Sessions can be a quick check-in or a 4-hour empire-building binge. Both feel good. A focused mobile port follows after Steam launch.

---

## 5. The Industries

A roster of **8 future-forward industries**, each with 3–7 sub-industries the player chooses from when founding a company. The sub-industry choice is one of the most consequential decisions in the game — sub-industries within a parent share some flavor (regulators, talent pool, news feed) but play *mechanically* differently. Founding a frontier AI lab vs. an AI chip foundry vs. a vertical AI SaaS should feel like three different games.

### How the Industries Differ (Cross-Cutting Texture)

Each industry has a signature profile. These shape pacing, risk, and what kinds of decisions matter.

| Industry | Capex | Time Horizon | Cycle Speed | Talent Cost | Regulatory | Binary Outcomes |
|---|---|---|---|---|---|---|
| Space | Extreme | Long | Slow | High | Heavy | Yes (launches) |
| Artificial Intelligence | High | Short | Fast | Extreme | Rising | No |
| Biotech & Gene Editing | High | Longest | Slow | High | Heaviest | Yes (trials) |
| Energy & Climate | Extreme | Long | Slow | Medium | Heavy | Mixed |
| Defense Tech | High | Medium | Slow | High | Heaviest | No |
| Advanced Mfg & Materials | High | Medium | Medium | Medium | Medium | No |
| Mobility & Autonomy | High | Medium | Medium | High | Medium | No |
| Quantum Computing | Medium | Longest | Slow | Extreme | Light | Mixed |

Variety across these axes is what gives the game replayability. A "speed-run an AI vertical SaaS to IPO in 4 game-years" run feels nothing like a "20-year fusion company that may or may not work" run.

---

### 5.1 Space
*Cinematic, capital-extreme, defined by binary launch events and government anchor customers.*

**Sub-industries:**
- **Launch services** — cadence-driven; revenue per successful launch; failures destroy customer payloads (lawsuits, insurance hikes)
- **Satellite constellations** — massive upfront capex, then recurring subscription revenue from data/comms customers
- **Space stations** — real-estate-like; lease modules to research, tourism, and in-space manufacturing tenants
- **Space mining** — ultra-long horizon; single missions are bet-the-company; commodity-price exposure on success
- **In-space manufacturing** — orbit-based factories producing materials (fiber optics, pharmaceuticals, exotic alloys) that command premium pricing
- **Space tourism** — B2C, seat economics, brand-driven; safety incidents are existential
- **Lunar / Mars logistics** — multi-decade government contracts; cost-plus economics

**Signature mechanic:** Launch events. Rocket attempts play out as scripted moments where R&D investment, manufacturing quality, weather, and luck combine into a probabilistic outcome. Players watch.

**Real-world archetypes:** SpaceX, Rocket Lab, Planet Labs, Astranis, Varda, Vast.

---

### 5.2 Artificial Intelligence
*The fastest-cycle industry. Talent wars, compute constraints, eroding moats.*

**Sub-industries:**
- **Frontier model labs** — massive compute capex, top-tier researchers, low early revenue, winner-take-most dynamics
- **Vertical AI SaaS** (legal, medical, financial, etc.) — predictable SaaS metrics (ARR, churn, NRR); standard B2B sales motion
- **AI chips / silicon** — long fab cycles, customer concentration, brutal margins until scale
- **AI infrastructure / data centers** — real-estate + power play; lease compute capacity to model labs
- **Robotics & humanoids** — hardware margins, supply chain, manufacturing complexity
- **Autonomy stack** (self-driving, robotaxis at the software level) — regulatory unlocks city-by-city; liability exposure
- **Creative & generative tools** — B2C dynamics, copyright lawsuit exposure, fast viral growth

**Signature mechanic:** Talent + compute as twin constraints. Top researchers can be poached for 8-figure packages and can leave you for competitors. GPU allocation is a real, managed resource. SOTA decays — what's proprietary today is open-source in 18 months.

**Real-world archetypes:** OpenAI, Anthropic, Mistral, Scale, Cerebras, Groq, Nvidia, Databricks, Figure, Wayve.

---

### 5.3 Biotech & Gene Editing
*Longest horizons, probabilistic outcomes, regulatory mountain.*

**Sub-industries:**
- **Gene therapeutics** (CRISPR, base editing) — rare disease and oncology programs; clinical trial pipeline as core mechanic
- **mRNA & cellular therapies** — platform technology; multiple shots on goal
- **Agricultural biotech** — drought-resistant crops, livestock genetics; regulatory varies by country
- **Synthetic biology / biomanufacturing** — engineered organisms producing chemicals, materials, food
- **Longevity & aging** — early-stage; long timelines; massive TAM if it works
- **Personalized medicine** — companion diagnostics, biomarker-driven trials
- **Bio-defense** — government-anchored, classified contracts

**Signature mechanic:** Clinical trial pipeline. Phase I → II → III with probabilistic outcomes (~15–25% combined approval rate). A single Phase III hit can be a 50x return; failures can wipe out a company. FDA timelines are non-negotiable.

**Real-world archetypes:** Vertex, Beam, Verve, Editas, Ginkgo, Recursion, Moderna, Altos Labs.

---

### 5.4 Energy & Climate
*Capital-intensive, policy-driven, the most mission-aligned vertical.*

**Sub-industries:**
- **Utility-scale solar** — project finance model; PPAs (power purchase agreements) drive revenue
- **Offshore & onshore wind** — site selection, turbine supply chain, long-term contracts
- **Battery & energy storage** — arbitrage revenue (charge cheap, discharge expensive); grid services
- **Green hydrogen** — needs massive scale to be cost-competitive; long path to profitability
- **Small modular nuclear (SMRs)** — 10+ year build cycles, regulatory mountain, but baseload contracts that print money once operating
- **Fusion** — still pre-commercial; the ultimate long bet; potential industry-redefining payoff
- **Direct air capture (DAC) & carbon removal** — revenue from carbon markets + offtake agreements
- **Smart grid & virtual power plants** — software margins, utility customers, regulatory tailwinds
- **Geothermal** — location-dependent; deep drilling tech enabling new sites

**Signature mechanic:** Project finance. Most energy plays are about getting projects financed, built, and operating. The mini-game is structuring deals: equity vs. debt, tax credits, PPAs, offtake agreements. Macro interest rates massively swing project economics.

**Real-world archetypes:** First Solar, Ørsted, Form Energy, Commonwealth Fusion, Helion, Climeworks, NuScale, Fervo.

---

### 5.5 Defense Tech
*Government-customer dominated, geopolitically-reactive, fastest-rising sector culturally.*

**Sub-industries:**
- **Autonomous systems** — drones (air, ground, maritime), loitering munitions
- **Hypersonics** — extreme-speed propulsion; major DoD programs of record
- **Cyber & electronic warfare** — software margins; classified contracts
- **Space defense** — anti-satellite, missile warning (overlaps with Space)
- **Military AI / decision support** — battlefield AI, ISR (intelligence, surveillance, reconnaissance)
- **Ammunition & propulsion** — industrial base; surge capacity is the asset
- **Soldier systems** — wearables, comms, AR

**Signature mechanic:** Programs of record. Long sales cycles (3–7 years from pitch to first dollar), but contracts are massive and sticky. Geopolitical events (procedurally generated wars, tensions) drive demand spikes. Reputation with DoD compounds — winning small contracts qualifies you for bigger ones.

**Real-world archetypes:** Anduril, Palantir, Shield AI, Saronic, Hadrian, Epirus.

---

### 5.6 Advanced Manufacturing & Materials
*Industrial backbone of the moonshot economy. Less glamorous, deeply profitable when scaled.*

**Sub-industries:**
- **Semiconductor fabs** — extreme capex ($10B+ per fab), long lead times, generational technology bets
- **3D printing & additive manufacturing** — democratizing production; high-mix low-volume parts
- **Advanced materials** — graphene, metamaterials, carbon nanotubes; B2B licensing model
- **Industrial robotics** — replacing factory labor; recurring service revenue
- **Lightweight composites** — aerospace, automotive, defense customers
- **Reshoring-focused contract manufacturing** — riding the geopolitical reshoring wave

**Signature mechanic:** Asset utilization and capacity planning. You build expensive facilities, then have to keep them running at high utilization to make money. Customer concentration risk is real.

**Real-world archetypes:** TSMC, Hadrian, Relativity, Boom, Carbon, Apptronik.

---

### 5.7 Mobility & Autonomy
*Where consumer-tech meets hard tech. Tesla-shaped opportunity space.*

**Sub-industries:**
- **Electric vehicles (consumer)** — capital-intense, brand-driven, factory ramp is the make-or-break
- **eVTOL / flying cars** — pre-commercial; FAA certification mountain
- **Autonomous trucking & freight** — B2B, route-by-route rollout, fleet operator partnerships
- **Robotaxis** — capital-light operator model OR full-stack like Waymo
- **Maritime autonomy** — autonomous shipping, naval applications
- **Last-mile delivery robotics** — sidewalk and aerial delivery
- **High-speed rail / hyperloop** — infrastructure-scale; government partnerships required

**Signature mechanic:** Manufacturing ramp + regulatory unlock. EVs and eVTOLs are about scaling production without quality collapse; autonomy is about expanding operational design domain (more cities, more weather, more situations) one approval at a time.

**Real-world archetypes:** Tesla, Rivian, Joby, Archer, Waymo, Aurora, Kodiak, Zipline.

---

### 5.8 Quantum Computing
*Longest-horizon hard tech bet. Maybe nothing for a decade, then everything overnight.*

**Sub-industries:**
- **Quantum hardware** — competing modalities (superconducting, trapped-ion, photonic, neutral atom); pick your physics
- **Quantum software & algorithms** — applications layer; works on whichever hardware wins
- **Quantum networking** — secure communication; long-distance entanglement
- **Post-quantum cryptography** — software margins; near-term enterprise demand driven by "harvest now, decrypt later" threat
- **Quantum sensing** — sensors that exploit quantum effects; defense and biomedical applications

**Signature mechanic:** Milestone-gated funding. Quantum companies live and die on technical milestones (logical qubits, error rates, gate fidelity). Hitting a milestone unlocks the next round; missing one stalls the company. Long stretches of pure R&D burn before any commercial revenue.

**Real-world archetypes:** PsiQuantum, IonQ, Rigetti, Atom Computing, Quantinuum, SandboxAQ.

---

### Cross-Industry Synergies

This is where the conglomerate fantasy lives. Owning paired companies creates in-game bonuses:

- **AI + Advanced Mfg** — your AI chip company gets priority allocation from your foundry partner
- **AI + Biotech** — drug discovery acceleration; faster trial design
- **Space + Advanced Mfg** — in-house composites and propulsion components
- **Space + Defense** — space defense contracts route to your launch company
- **Energy + Mobility** — battery integration; EV charging network advantages
- **Energy + AI** — data center power deals; grid-scale optimization software
- **Quantum + Defense** — post-quantum crypto contracts via DoD relationships
- **Biotech + AI** — protein design, computational chemistry

Late-game players who assemble well-paired portfolios get genuine strategic moats. This is the modern Berkshire-meets-Bond-villain endgame the game should make irresistible.

---

### Future Expansion (V2+ / DLC Candidates)

Not in the initial roster but strong candidates for later content drops:

- **Neurotech & BCI** (Neuralink-shaped) — extreme regulatory, ethical tension, late-game flavor
- **Synthetic media & XR/VR** — Apple Vision-shaped consumer tech
- **Ocean tech** — desalination, aquaculture, deep-sea mining
- **Asteroid defense** — pure late-game vanity industry; wildly expensive, government-funded, prestige play
- **Fintech infrastructure** — adjacent rather than moonshot but fits if you want a "boring profit machine" option

---

## 6. Company Building

### Lifecycle Phases

| Phase | Cash Range | Player Activities |
|---|---|---|
| Idea | $0–50K | Pick industry, sub-vertical, name, logo, write pitch |
| Pre-seed | $250K–2M | Hire 2–5 founding engineers, build MVP, choose product wedge |
| Seed | $2M–10M | First customers/users, hire executive team, define metrics |
| Series A | $10M–30M | Scale go-to-market, expand product, formalize org chart |
| Series B–D | $30M–500M | Geographic expansion, M&A, multiple product lines |
| Pre-IPO | $500M+ | Hire CFO, audit, S-1, roadshow |
| Public | $1B+ market cap | Quarterly earnings, analyst coverage, public scrutiny |

### Operating Levers (Generic Across Industries)

- **Hiring:** Engineers, sales, ops, executives. Each hire has skill stats, salary, equity expectations. Senior hires shift company culture.
- **R&D allocation:** % of budget into research vs. product vs. ops. Compounds over years.
- **Pricing:** For revenue-generating businesses, set price points; affects volume and margin.
- **Marketing & GTM:** Brand vs. performance vs. enterprise sales motion.
- **Strategic decisions:** Pivots, acquisitions, geographic expansion, product line launches.

### VC Fundraising Mechanics

This is one of the most distinctive systems and worth getting right.

A round has these knobs that the player negotiates against AI investors:

- **Pre-money valuation** (anchored by recent comparables in your sector + your metrics)
- **Round size** (how much you're raising)
- **Investor lineup** (tier-1 VCs give you legitimacy boosts but harder terms; tier-3 will sign anything but give weaker signaling)
- **Board seats** (lead investor usually gets one)
- **Liquidation preference** (1x non-participating preferred is "founder-friendly"; 2x participating is rough)
- **Anti-dilution** (full ratchet vs. weighted average)
- **Pro-rata rights**
- **Option pool top-up** (comes out of pre-money — a common founder trap)

**Negotiation mini-game:** Player picks a target valuation. Investors counter. Player can push back, sweeten with better terms, walk away, or accept. Pushing too hard with weak metrics → no term sheet. Each round, your **dilution** is calculated and shown on a live cap table.

**Cap table view:** This should be a hero screen. Live updating, beautiful, shows founder %, investor stakes, ESOP, and your fully-diluted ownership at any moment. Players who love numbers will obsess over this.

### IPO Process

- Requires meeting unlock thresholds: revenue scale, growth rate, audited financials, market window open
- **Roadshow** mini-sequence: pitch to public investors across 5–7 cities; performance affects pricing
- **Pricing decision:** Investment bank gives you a range; you pick. Underprice and leave money on the table; overprice and the stock tanks day one.
- **Lockup period:** 180 days where founders/early investors can't sell — adds tension.
- Post-IPO, your shares become liquid → massive net worth bump but also exposure to public market volatility.

### Delegation & the Executive Layer

The biggest scaling problem in any business sim: as the player accumulates companies, investments, and complexity, micromanagement becomes either impossible or boring. Delegation is the system that solves it — and it transforms gameplay from operator → executive → owner as scale grows.

**Key design insight:** Delegation IS the auto-decisions system. Whatever you've delegated runs automatically when you fast-forward; whatever you haven't, surfaces as a pause. One mechanic, two problems solved.

#### The Three-Stage Player Arc

1. **Founder mode** (early game, 1 company) — you handle everything directly. Hiring, pricing, product, fundraising, board prep.
2. **Executive mode** (mid game, 1–3 companies) — you've hired execs to run departments. You set strategy and approve big decisions; they execute.
3. **Owner mode** (late game, multiple companies + investments + VC fund) — you've hired CEOs to run entire companies. You're a board member, capital allocator, and strategist. Day-to-day is invisible; you read quarterly reports and intervene only when needed.

The game should make this transition feel earned and meaningful, not like a feature unlock. The first time you trust a CEO to run a company autonomously is a real moment.

#### Hireable Roles

Per operating company:

| Role | Owns | Authority Without Player Approval |
|---|---|---|
| **CEO** | Overall strategy, all functions | Everything below CEO; escalates M&A, fundraising terms, IPO timing, executive hires |
| **CTO / Head of Engineering** | Technology, R&D, eng hires | Eng team hires, tech stack, technical roadmap (within product strategy) |
| **CFO** | Finance, capital allocation | Budgeting, planning, audits, reporting; escalates fundraising terms |
| **COO** | Operations, supply chain | Operational hires, vendor decisions, process improvements |
| **CRO / VP Sales** | Revenue, pipeline, pricing | Sales hires, pricing within bands, large customer concessions |
| **CPO** | Product roadmap, design | Features, design decisions, user research priorities |
| **CMO** | Marketing, brand, PR | Campaigns, brand decisions, press strategy |
| **General Counsel** | Legal, compliance | Routine legal, contracts, regulatory filings |
| **Chief People Officer** | Talent, culture | Compensation philosophy, performance reviews |

Beyond operating companies, the same system extends to:
- **Family Office Director** — runs personal investment portfolio per the thesis you set
- **Chief of Staff** — manages your time, filters opportunities, schedules meetings
- **Estate Manager** — handles property purchases/sales, maintenance, taxes
- **Foundation Director** — runs philanthropy operations, recommends causes
- **Fund GP / Managing Partners** — run your VC fund (sourcing, diligence, board seats, LP relations)

#### Executive Stats

Every hireable exec has visible stats:

- **Skill** (1–100 in their function) — directly affects performance outcomes
- **Strategic style** — Cost-cutter / Growth-pusher / Innovator / Operator
- **Risk tolerance** — Conservative / Moderate / Aggressive
- **Loyalty** (1–100) — likelihood of staying when poached
- **Integrity** (1–100, partially hidden) — likelihood of cutting corners or causing scandal
- **Ambition** (1–100) — high ambition = drive *and* flight risk
- **Reputation** (1–100) — affects hiring cost and what they signal to the market

When recruiting, you see ranges. Once hired, exact numbers reveal over time as you observe their behavior.

#### Delegation Levels (Per Role, Per Company)

Granular sliders the player sets for each executive:

- **Hands-off** — handles everything; escalates only company-threatening decisions
- **Standard** — executes; escalates strategic decisions and anything above a $X threshold
- **Active** — recommends; you approve most decisions
- **Hands-on** — you make the calls; they execute

Plus per-decision-type toggles:
- "Always escalate hires above $X salary"
- "Always escalate spending above $X"
- "Always escalate any board vote"
- "Always escalate press appearances or external commitments"
- "Auto-handle routine operations"

Sensible defaults ship with each role; players can customize per company.

#### Recruiting

You don't pick executives from a menu — you recruit them.

- **Tier 1 talent** (proven, prior unicorn exits, big-tech alumni) — extremely expensive, hard to land, only join companies they believe in
- **Tier 2 talent** — solid track record; reasonable to recruit
- **Tier 3 talent** — junior or unproven; affordable but risk-laden

Compensation packages have multiple knobs: base salary, bonus structure, equity grant + vesting, signing bonus, severance terms. Top execs negotiate hard. Recruiting Tier 1 talent for a Series A startup requires either an exceptional founder reputation, a compelling company narrative, or both.

Reputation compounds here: once you've shipped one unicorn, top execs return your calls. Until then, you're scraping.

#### Risks of Delegation (it's not a cheat code)

- **Bad hires execute poorly** — low-skill execs miss numbers, make bad calls
- **Good hires might disagree** — high-integrity execs push back on bad strategies; high-ambition ones might lobby the board against you
- **Scandals** — low-integrity execs can blow up (fraud, harassment, misconduct) and you take reputation damage as the person who hired them
- **Information asymmetry** — execs sometimes know things you don't; if you're not paying attention, problems compound before they reach you
- **Late-game coup risk** — a charismatic CEO with strong board relationships can lead an effort to push you out of your own company. The Steve Jobs scenario.

These risks scale with how hands-off you are. Pure hands-off play with three rogue execs is a real failure mode.

#### Reporting & Oversight

For each delegated company:

- **Quarterly executive report** — auto-generated summary of company performance, key decisions made, items flagged for attention
- **Real-time alerts** — anything crossing an escalation threshold pings the player immediately
- **Multi-company dashboard** — status grid showing revenue trend, headcount, runway, key issues across all companies
- **Drill-down** — click any company to see full state and override decisions
- **Performance reviews** — quarterly reviews per exec; rate, retain, promote, fire, regrant equity

#### When to Introduce This (MVP Phasing)

Don't ship V1 with the full system. The arc is:

- **V1.0** — Founder mode only. You run one company directly. Delegation is not in the game yet. This is correct: founder mode is the most engaging baseline gameplay, and delegation only becomes necessary at scale.
- **V1.5** — Basic delegation for your first company once it reaches Series B+. Escalation thresholds + auto-handle routine ops. Lets you focus on strategic decisions as the company grows. This pairs naturally with multi-company play (also V1.5).
- **V2.0** — Full executive layer with personality stats, recruiting, comp negotiation, scandals, retention dynamics.
- **V2.5** — Delegation extended to family office, fund GPs, estate manager, foundation director.

This phasing means delegation enters the game exactly when the player needs it, not before.

### The Holding Company

Once the player controls **3 or more companies** (>50% economic interest, or effective control via super-voting share class), the option to **form a holding company** unlocks. This is the late-game endgame structure — the Berkshire Hathaway / Alphabet / LVMH play.

The holdco changes gameplay fundamentally. You're no longer running businesses; you're **allocating capital across them**. The role shift mirrors the real-world arc of capital allocators like Warren Buffett, Bernard Arnault, and Barry Diller — your job becomes choosing which subsidiaries get cash, which get acquired, which get spun off.

This is also the player arc's natural fourth stage:

> **Founder → Executive → Owner → Capital Allocator**

#### Forming the Holdco

The player triggers formation when they're ready. Steps:

- Choose a name (Magnate Holdings, Apex Industries, Frontier Capital, etc.)
- Choose a structure type:
  - **Operating holdco** (Berkshire-style) — actively manages subs; deep synergies; slower to spin off
  - **Pure investment holdco** (PE-style) — hands-off; treats subs as portfolio investments
  - **Strategic holdco** (Alphabet-style) — distinct mission per sub; lighter integration
- Subs roll up — each becomes a subsidiary of the new parent
- A new governance layer emerges: holdco board, holdco CEO (probably you), holdco CFO

Each structure trades integration depth for flexibility. Operating holdcos extract more synergy but face more bureaucratic drag.

#### The Capital Allocation Pool — the Core Mechanic

Profitable subs throw off cash to the parent through dividends and retained earnings sweeps. The holdco accumulates a treasury. Each quarter, the player decides where to deploy it:

- **Fund a struggling sub** — buy time for a turnaround
- **Acquire new companies** — bolt on adjacent businesses
- **Incubate new subs** — start companies inside the holdco using internal capital
- **Buy back holdco shares** — return capital, signal undervaluation
- **Pay holdco dividends** — shareholders get cash
- **Hold cash** — wait for opportunities (Buffett's "elephant gun")
- **Move to personal portfolio** — convert holdco cash to your personal wealth (tax implications apply)

This is the heart of the late-game loop. Reading the dynamic world (per Section 12), spotting opportunities, and timing deployment is what great capital allocators do. **This mechanic IS the realization of the Berkshire fantasy.**

#### Cross-Subsidiary Synergies

Owning paired subs unlocks visible bonuses (callbacks to the cross-industry synergies in Section 5):

- **Technology sharing** — your AI sub powers your Space sub's autonomy; your Biotech sub uses your AI sub for protein design
- **Customer sharing** — your Defense sub's DoD relationships open doors for your Space sub
- **Talent rotation** — move a top exec from a struggling sub to a growing one
- **Procurement leverage** — buy compute, chips, or materials at consolidated scale
- **Brand halo** — a strong holdco brand raises trust for new subs

Each pair gives a small effect. Cumulatively, a well-paired conglomerate has real edge.

#### Shared Services

Centralize legal, finance, HR, and IT at the parent:

- **Cost savings** — one legal team beats many
- **Loss of responsiveness** — sub-specific needs get less attention
- Player tunes the centralization slider per service; sensible defaults ship

#### Tax Efficiency

Consolidated tax filing lets losses in one sub offset gains in another. Effective tax rate drops by ~3–8 percentage points vs. separate filings. This compounds once you're profitable across multiple subs.

#### Holdco-Level Financing

Capital raises now happen at the parent:

- **Holdco bonds** — debt issued by the parent at favorable rates due to diversification
- **Sub equity as collateral** — borrow against the value of your subs
- **Cross-collateralization** — raise more cheaply than any single sub could alone

This is how real conglomerates achieve disproportionate financial firepower.

#### M&A as the Holdco's Core Activity

Once formed, the holdco becomes an acquisition platform:

- **Friendly acquisitions** — negotiate purchase; target board agrees
- **Hostile takeovers** — accumulate public shares quietly until you can force a vote
- **Stock-for-stock deals** — use holdco shares as currency (only works if your stock trades at a premium)
- **Tender offers** — public bids for control of a target

Each acquisition triggers integration choices: fold the target into an existing sub, or keep it standalone?

#### Spin-offs

The reverse move: separate a sub back into a standalone company.

- Distribute sub shares to existing holdco shareholders
- Sub becomes independently traded (if public) or independently owned
- **Why spin off?** Sometimes the sum of parts is worth more separated (conglomerate discount). Sometimes a sub doesn't fit strategy anymore. Sometimes activist pressure forces your hand.
- Trade-off: lose synergies, gain focus, often unlock value

#### Going Public — the Berkshire Endgame

You can IPO the holdco itself. Distinct mechanics from a regular IPO:

- **Conglomerate discount applies** — public market typically values diversified holdcos at 80–95% of the sum of the parts. Realistic, and creates strategic tension.
- **Dual-class share structure** — Berkshire-style Class A (your control shares) + Class B (public liquidity). You can run it indefinitely without losing control.
- **Annual shareholder letter** — flavor mechanic. The player writes a few lines each year that surface in the news cycle and modestly affect stock price. Iconic, deeply satisfying for the Buffett-coded player.

#### Risks of the Holdco Structure

Real downsides keep the late game tense:

- **Conglomerate discount** — public market punishes complexity
- **Activist pressure** — when the discount widens, activists agitate for spin-offs (procedural events)
- **Bureaucratic drag** — decisions slow as layers multiply
- **Cross-sub contagion** — scandal at one sub damages the whole; your holdco stock tanks even when other subs are fine
- **Internal politics** — sub CEOs fight for capital allocation; coalitions form
- **Regulatory scrutiny** — at extreme scale, antitrust attention
- **Second-derivative problem** — at huge scale, a single great sub no longer moves the needle for the whole

These risks scale with size. A 5-sub holdco has minor friction; a 30-sub mega-conglomerate has real drag — and that drag is the natural ceiling on uncontrolled empire-building.

#### UI: The Holdco Dashboard

When the holdco is active, a new top-level view appears (replacing or augmenting the Companies tab):

- **Consolidated financials** — revenue, profit, cash, debt, market cap
- **Subsidiary grid** — mini-status per sub (revenue trend, profit, runway, key issues)
- **Capital allocation interface** — visual deployment of treasury cash across subs and opportunities
- **Synergy opportunities** — flagged paired moves
- **M&A pipeline** — current acquisition targets with diligence stage
- **Annual letter editor** — when public

This becomes the player's "command center" at scale.

#### How the Gameplay Rhythm Changes

Forming the holdco visibly shifts the rhythm:

- Daily/weekly decisions decrease; **quarterly capital allocation** becomes the meta-game
- Sub CEOs run their companies under delegation; you supervise via quarterly reports
- Time horizon shifts — you're thinking in years, not weeks
- The dashboard shows fewer urgent alerts, more strategic options
- News and macro signals matter more (you're betting on cycles, not on customer counts)

This is the late-game feature, not a bug. The pacing should slow and the decisions should grow heavier as you scale.

#### MVP Phasing

Holdco core mechanics enter in **V2.0** ("Conglomerate Era") — the natural fit, alongside multi-industry play and the full executive layer:

- V1.0 — single company, founder mode (no holdco)
- V1.5 — multi-company play unlocks; basic delegation
- V2.0 — **holdco system unlocks** at 3+ controlled companies: capital allocation, synergies, shared services, tax efficiency, basic M&A, structure choice
- V2.5 — public holdco listing, dual-class shares, annual letter, activist mechanics
- V3.0 — advanced M&A (hostile takeovers), regulatory antitrust events, mega-conglomerate scale

---

## 7. Investment & Portfolio System

### Public Markets
- **Stock screen:** Hundreds of procedurally-named (with some real-feeling archetypes) public companies across all sectors, not just the three core industries.
- **Per-stock data:** Price chart, P/E, market cap, revenue, recent news, your position.
- **Order types:** Market, limit, stop-loss. (Options as a late-game unlock.)
- **Dividends, splits, buybacks** as quarterly events.
- **Index funds & ETFs** for passive players who want broad exposure.

### Private Markets
- **Angel investments:** Small checks ($25K–500K) into procedurally-generated startups. High failure rate, occasional 100x.
- **LP positions in VC funds:** Set-and-forget; returns over 7–10 game years.
- **Direct investments:** Lead or follow rounds in private companies. Requires capital + reputation.
- **Liquidity:** Private positions are locked until exit (acquisition, IPO, write-off). Secondary market unlocks late game.

### Your Own VC Fund (Late Game)
- **Fund formation:** Raise from LPs (procedural family offices, pensions, sovereign wealth, you can be the GP + anchor LP).
- **Fund economics:** 2/20 (2% management fee, 20% carry) is the default; can be negotiated.
- **Deal flow:** You see startups pitching you. Pick which to fund. Build a portfolio across stages and sectors.
- **Reputation feedback loop:** Good returns → easier to raise Fund II → bigger checks → bigger wins.
- **End state:** Player can be a founder, public company executive, *and* GP of a top-decile fund simultaneously.

---

## 8. Governance & Influence

This is where ownership turns into power. Use the thresholds you proposed:

| Threshold | Right Unlocked |
|---|---|
| 1% (public) | Receive shareholder communications, attend annual meetings |
| 5% (public) | Schedule 13D filing, can submit shareholder proposals, activist status |
| 10% (public) | Insider trading rules apply; can call special meetings |
| 20%+ (public) | Effective control consideration; FTC review on further accumulation |
| 20% (private) | Can recommend strategic ideas to leadership; observer board status |
| 33% (private) | Blocking minority on major decisions |
| 50%+ | Control |

### Board Mechanics
- Board seats are negotiated at fundraising or won via shareholder vote
- Board votes appear as discrete decisions: M&A approvals, exec comp packages, dividend policy, strategic pivots
- Each board member has a personality (financially-driven, mission-driven, risk-averse, etc.) that you can model with roll-based voting
- Player's vote weight depends on seat — and persuasion via earlier 1:1 lobbying

### Recommending Strategies
- At ≥20% private / ≥5% public, the player can submit *recommendations*: a new product line, a hiring push, an acquisition target, a market exit
- Management evaluates recommendations based on fit, founder relationship, board support, and current company state
- Successful adoption = you helped steer a company you don't fully control. This is where the *influence* fantasy lives.

---

## 9. Personal Wealth & Lifestyle

The "magnate" leg of the stool. Treat these as collectibles + status systems, not just money sinks.

### Real Estate
- **Properties:** Apartments, houses, mansions, ranches, private islands across global cities (NYC, SF, LA, London, Singapore, Dubai, Aspen, Hawaii)
- **Each property:** Purchase price, current market value (fluctuates with city's market), maintenance cost, prestige score
- **Flipping & appreciation:** Real estate as an investment class with its own cycle
- **Functional bonuses:** Owning property in a city unlocks easier deal flow there (you have a base of operations)

### Vehicles & Toys
- **Cars:** From Civic to Bugatti to Pagani. Some appreciate (collector market for limited editions).
- **Yachts, jets, helicopters:** Massive ongoing costs; pure status purchases with mild functional bonuses (faster travel between cities = more meetings per game-month).
- **Art collection:** Auction events, appreciation, prestige.

### Personal Development
- **Education:** MBA at Stanford / Harvard / Wharton — boosts certain stats (negotiation, finance, network)
- **Skill points:** Earned by experience, allocated to operator / investor / dealmaker / public-figure trees

### Status Effects (the secret sauce)
Lifestyle isn't just vanity — high status unlocks:
- Better deal flow (top founders pitch *you*, not cold inbound)
- Lower interest rates on personal loans
- Invites to Davos / Sun Valley / Allen & Co. (annual events that gate certain plot beats)
- Press coverage that swings stock prices when you speak

---

## 10. Philanthropy

Underrated mechanic that ties everything together.

- **Recipients:** Universities, hospitals, churches, museums, foundations, political causes, scientific research, climate, AI safety, etc.
- **Mechanics:** Lump sum donation, endowment, named building/wing, foundation creation
- **Reputation:** Each donation builds long-term reputation in specific spheres (academic, religious, political, medical)
- **Tax efficiency:** Donations reduce taxable income; donor-advised funds and foundations let you defer/optimize
- **Naming rights:** "The [Player Name] Center for Computational Biology at MIT" — these persist across save file as visible legacy
- **Mission alignment:** Donating to AI safety while running an AI company gives you talent recruiting bonuses; donating to gene therapy research unlocks academic partnerships

---

## 11. Procedural Events Engine

The engine that keeps every save unique. Events fire at multiple scales:

### Macro (global, affects everything)
- Recessions, expansions, rate cycles, oil shocks, pandemics, wars, election cycles
- Each has duration, severity, sector-specific impact multipliers
- Long-tail rare events (financial crisis, AI winter, pandemic) reshape the world for 1–3 game years

### Industry-level
- **Space:** Launch failures from competitors, new propulsion breakthroughs, asteroid mining IPO wave
- **AI:** Open-source releases that commoditize moats, copyright rulings, breakthrough scaling laws, talent exoduses
- **Gene editing:** FDA approval waves, ethical scandals, breakthrough modalities (mRNA-style step changes)

### Company-specific
- Founder scandal, product launch reception, key hire poached, lawsuit, partnership, acquisition offer

### Personal
- Health events, marriage/divorce (divorce should genuinely sting financially), media exposes, legal trouble, kidnapping (rare, late-game ultra-wealth tax)

### Engineering Approach
- Event templates with parameter ranges (severity, scope, duration, affected entities)
- Weighted scheduler with cooldowns to prevent same event spamming
- Player choices in early events influence later event probabilities (consequence chains)
- A "world memory" of past events keeps the simulation coherent

---

## 12. Economy Simulation — The Dynamic World Model

This is the core spine of replayability. The goal is a world where:

- **Some forces are persistent** (always influence good/bad outcomes — interest rates always affect valuations, FDA always slows biotech)
- **Some forces are procedural** (vary every save — which industries are hot right now, when the next recession hits, what black swans show up)
- **Forces interact via feedback loops** (capital flows toward hot sectors → valuations inflate → mediocre companies get funded → eventually the bubble pops)

The result: every game has the same physics, but a different weather pattern.

### Design Goals

1. **Realistic enough** that finance/sim players respect it
2. **Variable enough** that no two games feel the same
3. **Forgiving enough** that good decisions reliably outperform bad luck over a long playthrough
4. **Legible** — the player can read the environment and adapt; the world isn't a black box

The third point is the key tension. Total realism means most startups fail — that's not fun. Total fairness means everyone wins — that's not interesting. The right answer: **skill compounds, RNG creates texture but doesn't dominate over a 20–30 year game.**

---

### The Three-Layer Model

#### Layer 1: Persistent Forces (the "physics" — always on)

These never change between saves. They give the world consistency and let players build intuition.

- **Interest rates compress/expand multiples.** Low rates → higher valuations across the board. Always.
- **Capital intensity is industry-fixed.** Space is always expensive. Software is always cheap.
- **Regulatory drag is industry-fixed.** Biotech trials always take years. AI always moves fast.
- **Talent scarcity has industry-specific shape.** Top AI researchers are always rare; top mfg engineers are abundant but specialized.
- **Binary risk is industry-fixed.** Rocket launches always have failure probability. Phase III trials always have ~50% pass rate.
- **Public market mean-reverts.** P/E ratios always pull toward historical norms over time.
- **Macro feedback loops always work.** Inflation → rate hikes → valuation compression → harder fundraising.
- **Reputation compounds.** Whether you're playing in a boom or bust, having credibility always helps you raise.

These give the player something stable to learn. After a few games, they internalize "low rates = raise more, high rates = focus on revenue."

#### Layer 2: Procedural Variables (the "weather" — varies every save)

These are randomized at game start and evolve over time. They're what makes save 1 feel different from save 2.

**Set at game start:**
- **Macro starting state:** boom / mid-cycle / late-cycle / recession (weighted toward mid-cycle)
- **Industry hype scores** (0–100 each) for all 8 industries — independently rolled
- **Industry cycle phases** — each industry is in cold / heating / peak / cooling
- **VC climate score** (0–100) — global capital availability
- **IPO window state** — open / cracking / closed
- **Public market valuation level** — undervalued / fair / overvalued
- **Pre-scheduled macro events** — the next 1–3 major events (recession, war, pandemic) have rough timing slotted at game start

**Evolve over time:**
- All scores drift via mean reversion + event impacts
- Cycles transition based on duration + triggers
- New procedural events get scheduled as old ones expire

The pre-scheduling matters. If you randomly roll "is there a recession?" every tick, the macro feels jittery and incoherent. Instead: at game start, schedule "recession in year 7–9 of magnitude moderate." Build toward it with leading indicators players can read. This creates narrative coherence.

#### Layer 3: Dynamic Feedback Loops (how the weather changes)

These are what make the world feel alive over time.

**Capital reflexivity** *(the most important loop)*
1. Industry has a string of big exits → hype score rises
2. VCs raise more sector-focused funds → capital available rises
3. Valuations inflate → more founders enter the space
4. Quality of new companies degrades (everyone gets funded, including marginal ones)
5. Some marginal companies fail spectacularly → hype drops
6. Capital exits → valuations compress → bubble deflates
7. Survivors emerge stronger → cycle restarts

This loop runs on a 4–7 year period per industry, asynchronously. At any given time, some industries are heating, some peaking, some cooling.

**Talent migration**
- Hot sector pulls engineers from cold sectors
- Salaries in hot sector inflate (AI researchers at $5M/yr in peak hype)
- Cold sectors can hire talent cheap if they can convince anyone to come
- When hype rotates, talent flows back

**Regulatory backlash cycle**
- Industry has scandal/failure → regulators tighten
- New rules slow companies for 1–3 years
- Industry adapts, lobbies, regulators eventually loosen
- Cycle repeats

**Macro cycle**
- 8–12 year economic cycle (boom → late-cycle → recession → recovery)
- Drives interest rates, IPO windows, VC climate
- Each phase has different optimal player strategy

---

### The Five Master Variables (Player-Visible)

Most of the underlying state is hidden, but the player should see five top-line indicators that summarize the world:

| Variable | Range | What it does | Where shown |
|---|---|---|---|
| **Macro Cycle Phase** | Boom / Mid / Late / Recession | Drives everything indirectly | Macro dashboard |
| **VC Climate** | 0–100 | Capital availability for fundraising | Fundraising screen, dashboard |
| **IPO Window** | Open / Cracking / Closed | Whether public exits are viable | Exit planning screen |
| **Industry Hype** | 0–100 per industry | Sector multiples, fundraising ease, talent costs | Sector heat map |
| **Interest Rate** | 0–15% | Discount rate for everything | Macro dashboard |

These five are the player's "weather report." Reading them well is a skill that compounds across playthroughs.

---

### Specific Mechanic: Industry Hype Cycle

Each of the 8 industries has a hidden 0–100 hype score that:

- **Mean-reverts toward 50** (regression to the mean — nothing stays hot forever)
- **Spikes on positive events** (big exit: +5 to +15; breakthrough: +10 to +20; wave of approvals: +8)
- **Drops on negative events** (high-profile failure: −5 to −15; scandal: −10; regulatory crackdown: −10)
- **Influences:**
  - VC capital available to that industry (multiplier 0.5x–2.0x of baseline)
  - Valuation multiples on fundraising (0.6x–1.8x of comps)
  - IPO valuation premiums (0.7x–1.5x)
  - Public market sector P/E (0.7x–1.6x)
  - Talent acquisition cost (0.8x–1.5x)
  - Customer demand for new products (0.8x–1.3x)

**Cycle duration varies by industry** to add texture:
- AI: 2–3 years per phase (fast cycles)
- Biotech: 5–7 years per phase (slow cycles)
- Space: 4–5 years
- Energy & Climate: 6–8 years
- Quantum: 8+ years (mostly cold with rare spikes)

Player-visible via the **sector heat map** (grid showing all 8 industries with hype-coded colors and trend arrows).

---

### Specific Mechanic: VC Climate

A single global score 0–100 representing aggregate capital availability.

**Inputs (continuously updated):**
- Recent exit performance across the market (last 12 game-months)
- Public market sentiment
- Interest rate level (low rates → higher VC climate)
- Recent fund formation news (mega-funds raising → climate up)
- Macro phase

**How it modulates fundraising:**
- Effective fundraising difficulty = `f(VC climate × industry hype × your metrics × your reputation)`
- A founder with great metrics in a hot sector during peak climate raises easily at premium valuations
- The same founder in a recession with cold sector hype struggles — but still raises if metrics are strong, just at a 40% discount

**This is how realism stays fair:** good metrics always raise money, just at varying terms.

---

### Specific Mechanic: IPO Window

Three states with binary effects:

- **OPEN** — IPOs price at sector premiums, first-day pops are common, players can exit. Trigger: 3 of last 5 IPOs trading above issue price + low public market volatility.
- **CRACKING** — IPOs still possible but at discount, first-day flat or negative. Trigger: mixed signals.
- **CLOSED** — IPOs delayed indefinitely. Companies that need to go public are stuck. Trigger: 2+ failed IPOs OR major macro event OR high public market volatility.

A closed IPO window is a known historical pattern (2008, 2022). Players who built only for IPO exits get punished; players who built for cash-flow profitability survive. This rewards strategic diversity.

**Cracked windows in particular are texture-rich** — you can still IPO but you'll leave money on the table. Some players will rush, others will wait. Both are valid.

---

### Specific Mechanic: Macro Cycle

A 8–12 game-year economic cycle modeled with five state variables:

- **Real GDP growth:** −3% to +5%
- **Inflation:** 0% to 10%
- **Federal funds rate:** 0% to 8%
- **Unemployment:** 3% to 12%
- **Consumer confidence:** 30 to 130

These move via a simple but coherent rule set (Taylor rule for rates, Phillips curve influences, etc.) plus random shocks. The cycle has identifiable phases:

- **Boom** — rates low, growth high, sentiment euphoric. Everything looks easy. Strategic risk: overpaying.
- **Late-cycle** — rates rising, growth still positive, sentiment cautious. Prepare cash.
- **Recession** — rates falling, growth negative, sentiment fearful. Buy assets cheap. Hard to fundraise but rate cuts coming.
- **Recovery** — rates low, growth picking up, sentiment improving. Best fundraising window.

Phase length is procedural (recessions can be quick like 2020 or grinding like 2008–11). At game start, the next major macro event (recession, war, pandemic) is roughly scheduled but with ±2 year jitter.

---

### Procedural Black Swans (Layered on Top)

In addition to the macro cycle, ~10–15 black swan events are seeded at game start with rough timing windows:

- Pandemic
- Major war
- Financial crisis
- Energy shock
- Major sector crash (one industry's bubble bursts)
- Geopolitical realignment (sanctions, trade war)
- Surprise breakthrough (one sub-industry leaps forward)
- Surprise failure (a darling sub-industry collapses)
- Regulatory hammer (one industry hit hard)
- Cultural backlash (one industry becomes politically toxic)

Across a 30-year game, expect 4–8 of these to actually fire. Each has industry-specific impacts. Variance in *which* black swans fire and *when* is a major driver of replayability.

**Rule:** The game schedules these at game start with rough windows but doesn't pre-tell the player. Leading indicators surface in news feeds 6–18 months before fire. Attentive players can prepare; inattentive players get surprised.

---

### Three Sample Game Narratives

These should all be possible from the same systems:

**Game A — "Bubble Founder."** You start in late-cycle euphoria. AI hype is 92, VC climate is 88. You found a frontier model lab and raise a $400M Series A at $4B post — terms that would be insane in any other environment but look normal here. Year 4: the AI bubble pops (scheduled black swan), sector hype crashes to 35. You'd burned aggressively, but you raised so much in good times that you survive. By year 8, AI is heating again and you IPO at $25B.

**Game B — "Recession Founder."** You start in a recession. Every score is depressed. You bootstrap an AI vertical SaaS for 18 months because no one will fund you. By year 3 macro recovers, you raise a Series A at unimpressive terms but with strong revenue. The recession-trained discipline becomes your moat — you reach $100M ARR while bubble-era competitors flame out.

**Game C — "Defense Cycle."** Year 2: war breaks out (procedural). Defense Tech hype rockets from 45 to 85. You pivot your AI company into defense AI. Government contracts pour in — $200M in year 3 alone. By year 5 you're a major prime contractor. Year 7: peace treaty. Defense budgets get cut. You've already used the war years to diversify into civilian autonomy.

If your systems can't produce all three of these from the same rule set, the design isn't dynamic enough.

---

### What the Player Sees (UI Surfaces)

To make the world legible without overwhelming, expose state through six specific screens:

1. **Sector Heat Map** — 8-cell grid, color + trend arrow per industry. The single most useful screen.
2. **Macro Dashboard** — GDP / inflation / rates / unemployment as 5-year sparklines. Cycle phase badge.
3. **Comparables Widget** — "Recent Series A in your sub-industry: median $8M / $32M post." Updated continuously based on procedural events.
4. **News Feed** — Headlines that telegraph shifts. ("Sequoia raises $5B AI-focused fund" = AI hype rising. "Three biotech IPOs delayed" = window cracking.)
5. **VC Climate Indicator** — Single 0–100 gauge with directional arrow, on the fundraising screen.
6. **Comp Tearsheet** — When fundraising, show recent comparable rounds in your sub-industry as anchor data.

Together these let a thoughtful player read the room. A casual player can ignore them and just react to events.

---

### Difficulty: Sliders + News Cycle Selector

Rather than locked Easy/Medium/Hard presets, give players **independent sliders** to tune world variance, plus a **dedicated news cycle selector** that controls how clearly the world telegraphs what's coming. These are orthogonal axes — a player can want a brutal world but still want clear news, or a forgiving world with cryptic news. Both should be possible.

#### World Variance Sliders (per save, locked once started)

Eight continuous sliders, each roughly 1–10 with sensible defaults at 5:

| Slider | Low end | High end | What it controls |
|---|---|---|---|
| **Macro Volatility** | Mild | Brutal | Recession depth, cycle severity, interest rate swings |
| **Black Swan Frequency** | Rare | Constant | How often pandemics, wars, crises, sector crashes fire over 30 years |
| **Sector Volatility** | Stable | Wild | Magnitude of industry hype swings; how fast bubbles form and pop |
| **Fundraising Difficulty** | Founder-Friendly | Investor-Friendly | Term harshness, valuation generosity, close rates |
| **Operating Difficulty** | Forgiving | Punishing | Burn rate sensitivity, customer demand stickiness, churn rates |
| **Binary Event Variance** | Predictable | Random | Launch and trial outcomes closer to expected odds vs. wild |
| **Starting Capital** | $5M | $25K | Direct cash floor — biggest single difficulty lever |
| **Tax & Cost Burden** | Light | Heavy | Corporate tax, personal tax, overhead, regulatory compliance costs |

**Three preset bundles** for players who don't want to fiddle:
- **Forgiving** — sliders biased low; for casual or first-time players
- **Realistic** — defaults across the board; the recommended experience
- **Brutal** — sliders biased high; for sim veterans who want to suffer

Sliders **lock when a save begins** so players can't crank to Easy mid-recession. Want different difficulty? Start a new game.

#### News Cycle Difficulty (separate selector — Easy / Medium / Hard)

This controls how much help the player gets reading the world. It scales *strategic* difficulty without making RNG harsher. Even on Hard News, the underlying world is the same — you just have less help interpreting it.

**Easy News** *(for players who want clear signals)*
- Headlines explicitly telegraph events 9–12 months out: "Analysts Warn of Recession Within a Year"
- Hype shifts get plain-language coverage: "Investors Cool on AI as Valuations Stretch"
- VC climate changes narrated: "Capital Pulls Back as Rates Rise"
- Comparable rounds widely advertised with full terms
- Black swans get clear warning shots: "Tensions Rising in Eastern Europe"

**Medium News** *(realistic mix)*
- Some headlines clear ("Sequoia Closes $5B AI-Focused Fund") and some ambiguous ("Analysts Divided on Tech Outlook")
- Leading indicators present but require interpretation
- Comparable rounds reported but with selective detail
- Black swans get partial telegraphing — the careful reader can spot it
- Mix of signal and noise

**Hard News** *(for sim veterans)*
- Subtle hints only
- Headlines often misleading or noisy ("Strong Quarter Despite Headwinds" two weeks before a crash)
- Have to actually read fundamentals — track sector ETFs, watch comparable round trends, monitor public market valuation indicators
- Black swans get minimal warning (1–2 months) or none
- The world isn't lying, but it isn't helping either

This separation matters. A player can run **Brutal world variance + Easy news** to get harsh-but-readable difficulty, or **Forgiving variance + Hard news** for a chill game where you still feel smart for predicting things. Both are valid play styles.

#### Hidden vs. Visible State

Hype scores, event schedules, and underlying calculations stay **hidden from the player at all difficulties**. The five master variables (Macro Phase, VC Climate, IPO Window, Industry Hype gauge, Interest Rate) are always visible — but their *causes* are not. The news cycle selector controls how much narrative interpretation the player gets, not whether the underlying numbers are exposed.

---

### Realistic But Not Punishing — Five Specific Rules

To hit "realistic but not too hard":

1. **No instant death from RNG.** Bad timing slows you, but a careful player can always survive. Even a closed IPO window doesn't kill you — you can stay private and grow revenue.
2. **Strategic counterplay always exists.** In bad climates: pivot to government contracts, focus on profitability, slow burn, M&A targets become cheap. The losing strategy is *not adapting*, not bad luck.
3. **Concentration risk is what kills you, not cycles.** A player who put 90% of net worth in one Space company is vulnerable to a launch failure. A player with portfolio breadth survives anything.
4. **Leading indicators always exist.** Black swans show up in the news feed before they fire. Macro shifts have lead time. Players who watch can prepare; players who don't, can't complain.
5. **Skill > luck over 30 years.** A good player should outperform a bad player ~85% of the time on equal seeds. RNG creates texture and stories, not outcomes.

---

### Architecture Recommendation (For When You Build)

**World state object** — single source of truth. Updated each tick (1 game-week or 1 game-month, your call — I'd start with 1 week).

```
WorldState {
  macro: { gdp, inflation, rates, unemployment, confidence }
  cyclePhase: enum
  industries: [8x { hype, cycleStage, capitalAvailable, talentCost }]
  vcClimate: float
  ipoWindow: enum
  scheduledEvents: [{ year, type, magnitude, sectors[] }]
  publicMarket: { p_e_avg, volatility, sentiment }
}
```

**Update loop each tick:**
1. Fire any scheduled events whose time has come
2. Update macro variables via Taylor-rule-ish function
3. Mean-revert hype scores; apply event impacts
4. Recompute derived signals (VC climate, IPO window)
5. Generate procedural news headlines based on what changed
6. Update all UI bindings

**Save format includes the full schedule** so reloading a game gives identical futures (deterministic from seed). Players who learn to read indicators feel rewarded; the world isn't lying to them.

**Tuning is the actual job.** Once the architecture is in place, you'll spend 3–6 months tuning: how fast does hype mean-revert, how big are event impacts, how often do black swans fire, how harsh are recessions. Ship-blocking work. Budget for it.

---

## 13. Progression & Meta Systems

### Net Worth Milestones (the spine)
$1M → $10M → $100M → $1B → $10B → $100B → $1T

Each milestone unlocks:
- Cosmetic title ("Millionaire" → "Centibillionaire")
- New starting options on next save (start with a small VC fund, start in a different decade, etc.)
- New endgame mechanics (private island, sovereign wealth involvement, geopolitical influence)

### Achievements
- "First IPO," "Unicorn Founder," "Decabillionaire," "Pulled an Elon" (run 3 companies simultaneously, each $10B+), "Pulled a Madoff" (?? — probably leave this one out)

### Steam Achievements & Leaderboards

- **50+ achievements** covering progression milestones, signature plays, and easter eggs (e.g., "First Unicorn," "Decabillionaire," "Pulled an Elon" for running 3 simultaneous unicorns, "Buffett Mode" for holdco capital allocator runs, "Clean Hands" for 30+ years without an ethics violation)
- **Steam-native leaderboards:** highest net worth at game year 10 / 20 / 30, fastest billion, largest exit, most companies founded, longest holdco-conglomerate streak
- Achievements seeded across difficulty tiers — some accessible to all players, some that require Brutal sliders + Hard news cycle so committed players have status to chase

### New Game Plus
- Carry over a percentage of net worth, or a starting investment portfolio
- Unlock harder difficulty modes

---

## 14. UI/UX (Steam-First Desktop)

Steam players expect data density. Reference the UIs they already love: Crusader Kings III (info-dense panels, character portraits), Football Manager (the apex of data density in any genre), Stellaris (galaxy view + drill-down), Bloomberg Terminal (the godfather of dense financial UI), Frostpunk (mood plus information). Embrace the desktop. Use the screen real estate.

### Layout: The Workspace Model

Single primary window divided into resizable panels. Players can rearrange to taste; we ship a sensible default.

**Default layout:**

- **Top bar (~50px):** Net worth ticker, current date, time controls (Advance Week / Month / Event), key world indicators (Macro Phase, VC Climate, IPO Window) as compact gauges.
- **Left sidebar (~250px, collapsible):** Navigation — Dashboard, Companies, Investments, Life, World. Expand a section to drill in.
- **Center workspace (the hero area):** The current view — a company dashboard, the cap table, the sector heat map, the M&A pipeline, etc. Can be split into two side-by-side panels for power users.
- **Right context panel (~300px, collapsible):** Active alerts, recent news, current decision queue, quick stats relevant to the center view.
- **Bottom bar (~30px):** Scrolling news ticker (always live), status indicators (autosave, current speed, modifier flags).

Think Civilization VI's left-panel + main-stage layout, but applied to spreadsheet-shaped data.

### Information Architecture

Five primary modes (sidebar sections):

1. **Dashboard** — net worth, alerts, weekly news feed, links to active decisions, big Advance Week button
2. **Companies** — your operating companies, drill into any
3. **Investments** — public + private holdings, watchlist, your VC fund (if you have one)
4. **Life** — properties, vehicles, philanthropy, personal stats, ethics tracker
5. **World** — macro dashboard, sector heat map, public companies index, news archive, "Who Owns What" / Cap Map graph, AI rivals roster

Each section opens with an overview and lets you drill in. Multi-window support — open two companies side-by-side, or pop the news feed into its own window on a second monitor.

### Pacing & Time

Same as before — turn-based, click to advance:

- **Advance Week** — primary action; persistent button + Spacebar
- **Advance Month** — Shift+Space
- **Advance to Next Event** — Ctrl+Space; fast-forward until something needs attention
- **Auto-pause** on any decision-required event regardless of speed

### Design Principles (Desktop)

- **Information density first.** This audience wants Bloomberg, not a phone. A typical screen should show 3–5x more information than a mobile equivalent. Use it.
- **Tables with teeth.** Every list is sortable, filterable, exportable to CSV. Keyboard navigation with arrow keys.
- **Charts everywhere, interactive.** Stock prices, company revenue, net worth, sector performance, comparable rounds. Hover to brush, click to drill, scroll to zoom.
- **Hover states matter.** Hover any number → see context, source, history. This is where desktop shines vs. mobile.
- **Right-click context menus.** Right-click any company → buy stock, research, add to watchlist, set alert. Right-click any executive → review, fire, transfer, lobby.
- **Keyboard shortcuts everywhere.** Power users will use them; everyone else won't notice. Examples:
  - `Space` — Advance Week
  - `Shift+Space` — Advance Month
  - `Ctrl+Space` — Advance to Next Event
  - `Tab` — Cycle workspace panels
  - `Ctrl+1–5` — Jump to sidebar section
  - `/` — Quick search any company, person, asset
  - `?` — Cheat sheet overlay
- **Saved layouts.** Players save custom panel arrangements as named layouts (e.g., Operator Mode, Investor Mode, Magnate Mode).
- **Multiple monitors welcomed.** Detachable panels can pop out into their own windows.

### Tone

Newsroom-meets-Bloomberg, unchanged. Headlines like "Q3 Earnings Beat Sends [Company] Stock Soaring" — not gamey notifications. Treat players as adults role-playing executives.

### Polish Touches Steam Players Notice

- **Smooth animations** on number changes, panel transitions
- **High-quality typography** — Inter or IBM Plex Sans for body, JetBrains Mono for numbers/code
- **Sound design** — subtle audio cues for events, market shifts, notifications. Mute toggle, individual sound category sliders
- **Theme support** — dark mode default (sim audience preference), light mode option, accent color chooser
- **Localization-ready** — design with multi-language in mind from day one. EFIGS + Russian + Simplified Chinese covers ~80% of the Steam sim audience
- **Accessibility** — colorblind-friendly palettes, scalable UI, full keyboard navigation, high-contrast mode

### Mobile Port (V2.0+) — The Adapted Experience

When the mobile port comes after Steam launch, it should not try to cram the desktop UI onto a phone. Instead, it's a **focused, simpler experience** built around the most engaging core loops:

- **Founder mode emphasis** — the start → grow → exit arc, beautifully rendered for touch
- **Portfolio check-in optimized** — quick glance at companies, key alerts, weekly summary
- **Tab-bar IA** (5 tabs instead of sidebar) — the original mobile design from earlier doc versions still mostly applies here
- **Cut features** for mobile: probably no "Who Owns What" graph, simplified holdco view, fewer financial instruments, possibly fewer industries at launch
- **Cross-save with Steam** via cloud sync — players can run their Steam empire on the train via mobile
- **Casual session focus** — 60-second sessions feel complete on mobile, hour-long sessions feel right on Steam

The mobile audience is broader and more casual. Don't try to win the hardcore on mobile; serve the curious sim-adjacent player who'd never download Wall Street Raider but loves Game Dev Tycoon.

---

## 15. Tech Stack (Steam-First, Mobile-Port-Ready, Claude-Code-Optimized)

The tech choice matters more than usual because you're building with Claude Code, and Claude Code's strengths should shape the stack — picking a stack it's weaker in costs you 2–3x in iteration speed.

### Recommended: Tauri + React + TypeScript

**Why this stack specifically for a Claude-Code build:**

- Claude Code is exceptional at TypeScript and React — meaningfully more so than at GDScript or C#. For a solo or small-team build, this is the single biggest velocity multiplier available.
- The game is **UI/data-density heavy, not graphics heavy**. React + Tailwind + shadcn/ui + Recharts is exactly the toolset built for this kind of dense, interactive, table-and-chart UI. You'll write less custom UI code than in any game engine.
- **Tauri** ships native desktop binaries (Windows, Mac, Linux) with much smaller footprints than Electron — final game binary around 5–15 MB vs. Electron's 100+ MB.
- **Hot reload** during development. Save a file, see the change instantly. This iteration speed is decisive for a content-heavy sim where you'll be tuning constantly.
- **The mobile port path is short.** React Native or Capacitor can reuse most of the game logic; only UI components need redesign. Going Steam-first with Tauri/React positions the mobile port as a sibling project, not a rewrite.

**The toolchain:**

- **Tauri** — Rust-based desktop app shell (Steam-friendly, lightweight, fast)
- **React 18+** — UI framework
- **TypeScript** — type safety, especially valuable for cap table / financial logic where bugs eat hours of debugging
- **Tailwind CSS** + **shadcn/ui** — design system; gets you to good-looking dense UI fast
- **Recharts** or **visx** — interactive charts
- **TanStack Table** — for the dense, sortable, filterable data tables you'll have everywhere
- **Zustand** — state management (simpler than Redux Toolkit, plenty powerful for a single-player sim)
- **SQLite** (via Tauri's bundled support) — local saves, simple, robust
- **Vite** — build tool, fast dev server

**The risk to acknowledge:** some Steam users are skeptical of "web-tech games." Tauri mitigates this significantly (it's not Electron — final binaries are small, launch fast, feel native), but the perception risk exists. Counter it with polish: smooth animations, native-feel keyboard handling, proper window chrome, fast launch time. Most players won't know or care; the Steam reviewers who would are a small minority.

### Alternative: Godot 4 (C#)

If the web-tech perception risk feels unacceptable, **Godot 4 with C#** is the strongest "real game engine" alternative.

- Free, open source, no royalties or runtime fees
- Native UI tooling that's surprisingly capable for 2D dense interfaces
- C# is well-supported by Claude Code (better than GDScript)
- Built-in scene management, signal system, save/load primitives
- Smaller learning curve than Unity
- Mobile port via Godot's Android/iOS targets (a nice property)

Trade-offs vs. Tauri+React: slower iteration (compile times), smaller ecosystem of UI components and charting libraries (you'll build more from scratch), Claude Code is meaningfully less productive in C# than in TypeScript.

### Alternative: Unity (C#)

Industry standard. Works fine. **Probably overkill for a 2D UI-heavy sim.** Strong asset store and large community. The 2023 runtime-fee saga spooked many indies; the policy was reversed but trust took a hit. If you already know Unity, it's reasonable. If not, the others are faster paths.

### Why Not Native (Rust + egui or C++ + Dear ImGui)

You could write this in raw Rust + egui or C++ + Dear ImGui. Maximum performance, single tiny binary. But for a 2D data-heavy sim, you don't need the performance, and the iteration speed cost is severe — Claude Code is meaningfully less productive in these languages than in TypeScript. Skip unless you have a strong reason (existing codebase, team expertise).

### Recommended Decision Matrix

| Priority | Pick |
|---|---|
| Maximum velocity with Claude Code | **Tauri + React + TS** |
| Maximum "this is a real game" Steam perception | Godot 4 + C# |
| Best mobile port path while staying in one codebase | **Tauri + React + TS** (with React Native for mobile) |
| Existing team experience in C# | Godot 4 or Unity |
| Existing team experience in web tech | **Tauri + React + TS** |

For most readers of this doc, **Tauri + React + TypeScript** is the answer.

### Saves & Persistence

- **Local SQLite** for save files — robust, fast, queryable for late-game stats screens
- **JSON export/import** so players can share saves and back them up
- **Steam Cloud** sync for cross-machine play
- **Save versioning from day one** — design save format with version numbers. You'll change the schema dozens of times during development; backwards compatibility matters or you'll burn players whose saves break

### Data-Driven Architecture (Critical for Modding & Iteration)

Define industries, sub-industries, events, rivals, properties, archetypes — all in editable config files (TOML or YAML), not hardcoded.

- Speeds up your tuning iteration massively (no recompile to change a number)
- Enables **Steam Workshop modding later** without architectural rework
- Makes content-pack DLCs trivial to ship
- Lets you hire a content designer who doesn't code

This is the single most important architectural decision after picking the language. **Get it right from day one** or it's expensive to retrofit.

### Steam-Specific Tech

- **Steamworks SDK** — achievements, leaderboards, cloud saves, Steam Workshop
- **Tauri has community Steamworks bindings** — usable but rougher than Unity/Godot's first-party support
- **Build pipeline** — use Steamworks' depot upload tools; automate via GitHub Actions for nightly builds

### Anti-Cheat / DRM

Don't bother. Steam's audience is hostile to invasive DRM, and the kind of player who pirates a $19 sim isn't going to buy it anyway. Ship Steam-DRM-free or with the lightest Steam wrapper. Save cycles for actual game features.

---

## 16. Monetization

### Steam Launch — Premium Upfront

**Recommended: $14.99 launch (or $19.99 if scope at launch is generous).**

- Sits comfortably alongside reference titles. Plutocracy is around $20; Capitalism Lab is in the $40s; Game Dev Tycoon launched at $8 and rose. Wall Street Raider's remaster is expected in similar territory.
- Steam sim audience pays well for depth. The complaint isn't price; it's shallow content at any price.
- Plan a **15% launch-week discount** to spike wishlist conversions.
- Roll into seasonal sales (Summer, Winter, Autumn) at 25–40% off. Steam's algorithm rewards titles that engage with sales cycles.
- A **free demo** in Steam Next Fest before launch is essentially mandatory for this genre — wishlist conversion in sim/strategy is heavily demo-driven.

### Long-Term: Content Updates + Optional DLC

- **Free V1.5 / V2.0 content updates** for the first 12–18 months. Steam reviewers reward post-launch support; the score lifts.
- **Paid DLC at year 2+** ($4.99–9.99 each) — additional industries, scenarios, or eras. Examples: a Climate Tech expansion, a 1990s-era starting decade pack, a Geopolitical Crisis scenario pack.
- Avoid: microtransactions, lootboxes, time-skip purchases. The audience will eviscerate you in reviews.

### Mobile Port Pricing (V2.0+)

When the focused mobile port ships, a different pricing model fits the broader mobile audience:

- **Premium $4.99–6.99** (the Coffee Inc 2 / Game Dev Tycoon pattern), or
- **Free with one-time $4.99 unlock** of full content (the "try before you buy" path)
- No subscription, no ads, no IAP grinding

Cross-buy logic: players who own the Steam version get a discount or free unlock on mobile. Sells goodwill, costs little.

### Soft Launch Strategy

- **Steam Playtest** (free, invite-only) 2–3 months before launch — recruit testers from r/incremental_games, r/gamedev, r/Games, sim Discords
- **Steam Next Fest** demo — time the demo to coincide with one of these events for free visibility
- **Wishlist campaign** — start collecting wishlists 6+ months before launch; high wishlist counts trigger Steam algorithmic visibility at launch
- Mobile port follows similar pattern with TestFlight (iOS) and Play Console internal testing (Android)

---

## 17. MVP vs. Full Vision

The full vision above is a 2–4 year project for a small team. Here's how I'd carve it for an MVP that's shippable in 6–9 months solo or 4–6 with a small team.

### MVP Scope (V1.0) — "AI Tycoon"
- **One industry, deeply done** — AI, with all 7 sub-industries (frontier labs, vertical SaaS, chips, infrastructure, robotics, autonomy, creative tools) so V1 still has internal variety
- **Founder loop fully implemented**: idea → seed → A → B → IPO
- **Basic public market** with ~150 procedural public companies across all 8 industries (so the world *feels* full even though you can only operate in AI)
- **Personal wealth basics**: 5–10 properties, 10–20 cars, simple philanthropy
- **Core procedural events engine** (50–80 event templates)
- **Cap table, fundraising, board votes** — the depth differentiators
- **No own VC fund yet, no private investing in startups, no multi-company simultaneous play**

### V1.5 — "Hard Tech Update"
- Add **Space** and **Energy & Climate** industries (full sub-industry rosters)
- Add **private investing** (angel checks into procedurally-generated startups across all industries)
- Add second-tier real estate (international, status properties)
- Add **multi-company simultaneous play** (the headline replayability unlock)
- Add **basic delegation** — escalation thresholds + auto-handle routine ops at Series B+; the system that makes multi-company play sane

### V2.0 — "Conglomerate Era"
- Add **Biotech & Gene Editing** and **Defense Tech**
- Add **player's own VC fund** with 2/20 economics
- Add **full executive layer** — personality stats, recruiting, comp negotiation, scandals, retention dynamics, coup risk
- Add **holding company structure** — unlocks at 3+ controlled companies; capital allocation across subs, shared services, cross-sub synergies, tax efficiency, basic M&A platform
- Cross-industry synergies fully wired up
- Expanded philanthropy & legacy systems
- iPad-optimized "executive dashboard" view

### V2.5 — "Industrial Backbone"
- Add **Advanced Manufacturing & Materials** and **Mobility & Autonomy**
- Deeper M&A mechanics (hostile takeovers, stock-for-stock deals)
- Secondary markets for private shares
- **Public holdco listing** — dual-class shares, annual shareholder letter, activist investor mechanics
- **Personal delegation layer** — Family Office Director, Chief of Staff, Estate Manager, Foundation Director

### V3.0+
- Add **Quantum Computing** (the longest-horizon bet)
- Multiplayer leaderboard seasons
- DLC: **Neurotech & BCI**
- DLC: a wildcard industry voted on by the community

This phasing is deliberate: each release roughly doubles the playable surface area, which gives players a reason to come back and gives you a reason to charge for major updates (or ship them free to keep reviews glowing — your call).

---

## 18. Development Roadmap

| Phase | Duration | Goals |
|---|---|---|
| **Pre-production** | 4–6 weeks | Lock design doc; build clickable React prototype of cap table + fundraising negotiation; validate "is the math fun?" in a spreadsheet first |
| **Vertical slice** | 2–3 months | One industry (AI), one company, full lifecycle from founding to IPO playable end-to-end. Steam page goes up; wishlist farming begins |
| **Content & systems build-out** | 3–4 months | Public market, personal wealth, events engine, polish; build out remaining V1 features |
| **Closed Steam Playtest** | 4–6 weeks | Invite-only beta via Steamworks; private Discord for testers; balance pass; performance tuning |
| **Steam Next Fest demo** | 1–2 weeks event | Free demo with first-hour content; wishlist push; trailer drops |
| **Steam launch** | — | Public launch with 15% launch-week discount; community management mode |
| **Post-launch (V1.5–V2.0)** | 6–18 months | Free content updates: additional industries, multi-company play, basic delegation, holdco system. Patches and balance based on reviews |
| **Mobile port (V2.0+)** | 4–6 months | Adapted UI for iOS/Android; focused subset of features; cross-save with Steam via cloud sync |
| **Paid DLC (year 2+)** | per pack | Themed expansions: Climate Tech industry, Crisis Era scenario pack, etc. |

**Critical path risks:**

- Balancing fundraising negotiation — too hard and players bounce; too easy and the depth fantasy collapses
- Procedural event variety — you'll need many more events than you think; budget time for content
- Performance on weaker Steam machines if simulation tick gets heavy (test on Steam Deck explicitly — that audience overlaps heavily with sim players)
- Wishlist count at launch — sim genre lives or dies on launch-day visibility, which is wishlist-driven; underinvesting in pre-launch marketing is the most common indie failure mode
- Save format breakage during development — version your saves from day one; bad backwards compatibility burns players whose 30-game-year empire becomes unloadable

---

## 19. Open Questions & Decisions Needed

### Decisions Made

- ✅ **Pacing model:** Turn-based, click-to-advance. Player advances 1 week per click by default, with Advance Month and Advance-to-Next-Event skip options. Auto-pause on any decision-required event. No real-time pressure anywhere.
- ✅ **Difficulty system:** Eight independent world-variance sliders (Macro Volatility, Black Swan Frequency, Sector Volatility, Fundraising Difficulty, Operating Difficulty, Binary Event Variance, Starting Capital, Tax & Cost Burden), locked once a save begins. Three preset bundles (Forgiving / Realistic / Brutal) for players who don't want to fiddle.
- ✅ **News cycle:** Separate three-mode selector (Easy / Medium / Hard) controlling how clearly the world telegraphs upcoming events. Orthogonal to world variance — any combination is valid.
- ✅ **Hidden state:** Hype scores, event schedules, and underlying simulation math stay hidden from the player at all difficulties. The five master variables (Macro Phase, VC Climate, IPO Window, Industry Hype, Interest Rate) are always visible.
- ✅ **Auto-decisions during skip-ahead:** Solved by the delegation system. Whatever the player has delegated runs automatically; whatever they haven't surfaces as a pause. Engine-critical events (term sheets, FDA decisions, board votes, market shocks) always pause regardless of delegation settings.

### Still to Decide

1. **Single life or generational?** Does the player age and die (Bitlife-style), or play indefinitely? *Recommendation: indefinite by default, with optional "mortal mode" where you live ~40 game-years.*
2. **Real-world references or fully fictional?** Can the player buy "Apple" stock, or is everything procedurally named? *Recommendation: fully fictional companies with archetype hints; avoids legal risk and keeps each save fresh.*
3. **Save file approach?** One save vs. multiple? *Recommendation: multiple named saves, cloud-synced.*
4. **Tutorial design?** This is a deep game — a guided first company is essential. Can the tutorial *feel* like the game rather than a chore?

---

## 20. Lessons from Plutocracy & Wall Street Raider

Two reference titles worth studying in depth. Plutocracy is a contemporary indie business sim covering the late 19th / early 20th century robber-baron era. Wall Street Raider is a 40-year-old cult financial simulator originally written by a Harvard-trained lawyer/CPA in 1986, now being remastered for a new generation. Both have devoted niche audiences. Both have lessons worth stealing — and pitfalls to avoid.

### Plutocracy — What Works

- **Character-driven shareholder system.** The game models around 15,000 characters — shareholders, officials, politicians — each with personal interests, fears, ambitions, and traits that can be leveraged. Negotiation isn't with a faceless market; it's with a specific person whose psychology matters.
- **Multi-channel power.** Players can pursue economic dominance through fair competition, political influence (lobbyists, sponsoring elections, bribery), media manipulation, or covert sabotage (organizing strikes against competitors, blocking production, blackmail). Multiple paths to the same outcome.
- **Region-level economic differentiation.** Different US states have different prices, laws, and conditions. Cross-regional play creates real geographic strategy.
- **Holding company drives vertical integration** across regions — players have specifically called this out as a motivating mechanic.
- **Real-world economic effects at scale.** Once large enough, the player can influence GDP, unemployment, and prices at the country level.
- **Manual + automatic management.** The dev team explicitly built delegation in to combat micromanagement fatigue.

### Plutocracy — What Fails

The complaints are remarkably consistent across player reviews:

- **Repetitive negotiation grind.** A common late-game complaint: "talking to 4/5 people per company, negotiate, make holding, expand" turns into a slog once you're scaling. Players literally describe wanting the system replaced with fixed probabilities.
- **Punishing influence economy.** Failed negotiations burn global influence. Chains of failures can leave the player in a state where no one will deal with them — an unrecoverable corner.
- **Weak AI competition.** Reviewers note effectively one good way to play; competitors aren't actively in your way; risk of failure is low.
- **No real endgame.** Once you've bought everything in a state, the question becomes "what now?" Players actively ask this.
- **Information gaps make stocks feel like gambling**, not analysis.
- **Per-unit decisions for routine ops.** A memorable critique compares it to "deciding for every Age of Empires soldier whether his training succeeds" — granular RNG that should be abstracted.

### Wall Street Raider — What Works

WSR has been refined over four decades — the depth is real:

- **Astonishing simulation depth.** Around 1,590 simulated companies across ~70 industry groups, with consolidated tax accounting modeled on actual IRS regulations.
- **Hidden karma system.** Player ethical violations are tracked silently; the more you cheat, the higher your probability of getting caught. Real cost for shady tactics without forbidding them.
- **Living news ticker.** A constantly-running scroll of market events and headlines creates the feeling that the world exists without the player.
- **Complete corporate raider toolkit.** Hostile takeovers, greenmail, leveraged buyouts, junk bond financing, mergers, spin-offs, antitrust lawsuits as harassment, IPOs, private offerings — a full vocabulary.
- **Auto-pause on critical events.** At higher game speeds, the engine halts on hostile bids, SEC investigations, and critical banking events. (This validates a design we already chose.)
- **Sticky bull/bear regimes with mean reversion.** Macro variables (GDP growth, inflation) drift toward long-run averages; sentiment runs on momentum. Realistic and gameplay-friendly.
- **Multiple instruments.** Stocks, options, bonds, ETFs, commodities, crypto, interest rate swaps — players can express any thesis financially.
- **AI rivals competing for the same opportunities.** Named computer opponents acting in the same world, building empires alongside (and against) you.
- **"Who Owns What" tool** for mapping ownership relationships across the simulation.

### Wall Street Raider — What Fails

The challenges (and what to avoid):

- **Forbidding UI.** The classic version was famously dense and required a ~270-page strategy manual sold separately. The remaster aims to fix this — the lesson is don't ship the original UI.
- **Steep learning cliff.** Decades of accreted features means new players face an enormous ramp.
- **Starting too rich.** Reviewers historically noted the game starts the player with such a fortune that the rational move feels like retiring rather than competing. No founding arc, no scrappy beginning.
- **Niche audience by necessity.** Pure finance-sim depth caps audience size.

### Specific Mechanics to Adopt

#### A. Player Ethics / Karma System (from WSR)

Add a hidden integrity score (0–100) tracking shady actions: insider trading, accounting tricks, regulatory violations, executive scandal cover-ups, lobbying excesses, cap-table manipulation. Effects:

- **Probability of getting caught** scales with violation count
- **Recruiting friction** — high-integrity executives won't join low-integrity players
- **Reputation loop** — exposure causes news cycle damage, stock drops, board pushback
- **Investigation events** — SEC, DOJ, FTC, FDA inquiries trigger procedurally based on score
- **Strategic counterplay** — players can cut corners but face compounding risk; clean players build slower but face no ceiling

This adds an "ethics dimension" that complements net worth. Some players will min-max ethics; others will optimize speed. Both valid.

#### B. AI Rivals (from WSR + Plutocracy)

Beyond procedural companies, add a small roster (~20–40) of **named, persistent rival capitalists** competing across decades. Each rival has:

- A signature industry focus
- A strategy archetype (Buffett-style allocator, Musk-style operator, Icahn-style activist, Soros-style trader)
- Personality stats (aggressive, ethical, ambitious)
- A net worth that grows alongside yours
- Visible public actions reported in the news

Rivals appear in fundraising rounds (competing investors), M&A (counter-bidders), recruiting (poaching execs), public markets (taking opposing positions), and procedural events. Some become collaborators on co-investments; others adversaries. Tracking their net worth becomes a metagame.

#### C. Antitrust & Regulatory Scrutiny (from WSR + Plutocracy)

At scale, regulators come for you. Track market share within industries; trigger investigations at thresholds (e.g., 30% market share in a single sub-industry, 60% control via holdco):

- **FTC investigations** block proposed acquisitions
- **DOJ antitrust lawsuits** as multi-year proceedings; outcomes can force spin-offs
- **Forced divestitures** if you lose — sub spun off at fire-sale prices
- **Regulatory inquiry** as a live event that drives news, stock impact, distraction cost

This creates a real ceiling on uncontrolled empire-building. Combined with conglomerate discount, big holdcos face natural pressure to stay focused.

#### D. Character-Driven Negotiation (from Plutocracy, fixed)

We have personality stats for executives. Extend to:

- **VC investors** — each named, with traits, prior portfolio, prior relationship with you
- **Board members** — beyond the exec layer; named members with voting patterns
- **Government officials** — specific regulators, judges, legislators

**Critical fix vs. Plutocracy:** avoid the "negotiate with 4–5 people per company × every company" grind. Solutions:

- Default delegated relationships handled by your Chief of Staff
- Only key counterparties surface for direct interaction
- Relationships persist across deals — a VC who funded your last company comes back; no need to re-introduce
- Procedural variety in negotiations driven by counterparty personality + macro context, so no two negotiations feel identical

This gets the texture without the slog.

#### E. Live News Ticker (from WSR)

An always-on scrolling feed in the World tab. Even on weeks the player skips, the ticker shows what the world did. Headlines about rivals' moves, sector shifts, macro events, scandals. Creates the "world is alive without me" feeling that's critical for replayability.

The ticker should explicitly surface rivals' moves ("Marcus Vale acquires GenoPharma for $3.2B") so the world feels populated, not abstract.

#### F. Multiple Financial Instruments (from WSR, phased)

Our plan has stocks. Expand progressively:

- **V1** — Stocks + ETFs
- **V1.5** — Corporate & government bonds (fixed income for risk-off periods)
- **V2** — Options (calls, puts) for leverage and hedging
- **V2.5** — Index futures (macro bets)
- **V3** — Distressed debt, currency exposure, advanced derivatives

This pacing matches when players actually need them. Don't ship V1 with all of WSR's instruments; that's a learning cliff. Add as the player's sophistication grows.

#### G. "Who Owns What" Visualization (from WSR)

A dedicated screen showing the ownership graph: your holdings, holdco structure, board seats, cross-positions with rivals. Visual node graph, not a spreadsheet. At scale this becomes essential — without it, complexity collapses.

Add to the World tab as a "Cap Map" view, ideally landscape-optimized for iPad.

### Six Anti-Patterns to Avoid

1. **Don't punish failure unrecoverably.** Plutocracy's influence cliff (3 failed negotiations = no one will deal with you) is brutal. Always give players a path back, even if slow.
2. **Don't make the same mini-game appear hundreds of times.** Players will tolerate a great mini-game once per session, not once per turn. Fundraising should vary by counterparty + macro state. Negotiations should not reduce to repetitive clicks.
3. **Don't ship a manual-required UI.** WSR's classic version is unplayable without docs. Mobile-first turn-based is the opposite goal — but watch density throughout playtest.
4. **Don't start the player rich.** Founder mode at $50K is the right call. The arc from scrappy founder to capital allocator is our distinctive identity.
5. **Don't let one strategy dominate.** Plutocracy criticism: "only one good way to play." Our dimensions (8 industries × 8 difficulty sliders × news cycle × 3 holdco structures × ethics axis) should provide path diversity, but watch for accidental dominant strategies during playtest.
6. **Don't forget the late game.** Plutocracy's "owned the state, now what?" trap. Our holdco system, antitrust, activist pressure, rivals catching up, and procedural late-game events all need careful tuning. The plan has scaffolding; tuning will determine whether late game stays interesting.

### What Makes Moonshot Inc Different

Drawing on these learnings, our distinct positioning:

- **WSR's depth, modernized for mobile.** Cap tables, fundraising mechanics, governance — all rendered for turn-based, phone-friendly play.
- **Plutocracy's living world, future-forward.** Characters, politics, dynamic economy — set in space/AI/biotech rather than steel/oil/railroads.
- **The founder arc neither game has.** Both start you wealthy. We start you with $50K and a dream. Founder → executive → owner → capital allocator is where our identity lives.
- **Mobile-first turn-based pacing.** Both reference titles assume a desk and time. Ours assumes a phone and 90 seconds.

The combination is genuinely novel. Both reference games target the same psychographic; neither has aged well or scaled to mobile. There's a real opening.

---

## 21. What to Do This Week

If I were you, I'd spend the first week on three things:

1. **Play the references for 5+ hours each.** Coffee Inc 2, Trading Game, Game Dev Tycoon, Capitalism Lab, Software Inc, **Plutocracy**, and **Wall Street Raider** (the new remaster on Steam, or the free classic version on itch.io). Take notes on what feels good and what frustrates.
2. **Prototype the cap table + fundraising loop in a spreadsheet.** Forget code. Can you build a fundraising negotiation in Excel that *feels fun*? If yes, the game's core works. If no, redesign before writing a line of Swift.
3. **Lock the name and reserve everything.** Do a Steam name search and a US trademark search for "Moonshot Inc" (and your shortlist alternatives). Register the **Steamworks account** ($100 one-time fee — required to publish). Reserve the **Steam app ID and store page** (just a placeholder is enough — the wishlist count starts accumulating from day one and Steam's algorithm rewards long wishlist histories at launch). Buy the **domain** (moonshot-inc.com or similar). All cheap, all save headaches later.

If you're committed to building this, also start a **public devlog** — a Twitter/X account, a Discord, or a development blog. Sim audiences love watching games being built. Crusader Kings, Frostpunk, Stardew Valley all built audiences before launch via devlog content. Three months of consistent devlog posting before your Steam page goes live is worth more than any single marketing push.

Good luck. This is a great concept — the "moonshot industries" framing genuinely differentiates it from existing tycoon games, and the operator + investor + magnate three-leg design is the kind of thing that builds a cult audience. Build the cap table beautifully, get the fundraising negotiation right, and the rest follows.
