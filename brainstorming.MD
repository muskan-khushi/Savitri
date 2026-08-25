# Savitri
### An AI decision-layer for solar-powered smallholder agriculture in India

> "She did not fight Death. She walked beside him, spoke with patience and truth, and brought the harvest back from the edge."

**Savitri** (from Sanskrit *Savitr*, a name for the life-giving sun) is named after the Mahabharata story of Savitri and Satyavan — a wife who follows Yama, the god of death, not with force but with quiet, patient wisdom, and wins her husband's life back. Every season, Indian smallholder farms face a hundred small versions of that same moment: a crop one hot day from wilting, produce one missed cold-storage slot from rotting, a harvest sold too early or too late for want of the right information at the right time. Savitri is built to walk alongside that moment and pull the harvest back — not with new machinery, but with timely, patient, correct information, delivered the way the farmer already talks — in voice, in their own language.

---

## 1. The Problem Statement (as given)

**Challenge:** Sustainable Agriculture — Energy, Water & Productivity
**Framing line:** *Feeding a billion people cleanly, efficiently, and resiliently.*

**The challenge, in full:**
> The opportunity is to combine distributed renewable energy, precision irrigation, low-cost sensing and farmer-facing digital tools to improve productivity, affordability and climate resilience.

**Key numbers cited in the brief:**
- **40%+** of India's workforce is employed in agriculture
- **90%** of freshwater withdrawals in India are used for agriculture
- **15–20%** post-harvest losses across key crops and value chains

**Full problem context (as given):**
> Indian agriculture employs more than 40% of the workforce and accounts for nearly 90% of freshwater withdrawals, yet the sector remains highly vulnerable to erratic monsoons, rising input costs, and post-harvest losses estimated at 15–20% of produce value.
>
> Farm power is dominated by heavily subsidised, inefficient electric and diesel pump sets. Irrigation scheduling is largely manual and water-wasteful, while smallholder farmers often lack real-time information about soil health, crop stress, or market prices.
>
> Climate change is intensifying these pressures. Shifting rainfall patterns, prolonged dry spells, and extreme heat events threaten agricultural yields precisely as demand continues to grow.
>
> At the same time, India's renewable-energy expansion offers an important opportunity. Affordable distributed solar power could replace diesel, operate precision-irrigation systems, enable cold storage, and connect remote farms to digital services — provided that appropriate software, business models, and farmer-facing tools are developed.

**What the solution should achieve (the 4 pillars / judging lens):**
1. **Reduce energy and water intensity** — cut energy/water use per unit of output through smarter scheduling, precision techniques, efficient equipment.
2. **Minimize post-harvest losses** — use low-cost sensing, controlled storage, and logistics analytics to preserve produce from field to market.
3. **Empower the smallholder** — deliver actionable, vernacular, and affordable decision-support to farmers with limited literacy and connectivity.
4. **Strengthen climate resilience** — help farming systems adapt to irregular rainfall, heat stress, and soil degradation through data-driven interventions.

**What the submission must include:**
- A detailed solution write-up (how it works, key assumptions, why suited to Indian smallholder conditions)
- A system/architecture diagram (components + data/energy/money flows)
- Supporting design artifacts (UX wireframes, sensor/data-model designs, process/service designs)
- A software prototype or simulation (encouraged, not mandatory — **no physical hardware build expected**)
- A quantified benefit (water/energy saved per hectare, post-harvest loss reduction, or yield improvement, against a stated baseline)
- A deployment and scale-up plan (target crops, geographies, farmer profiles, unit economics)

**Illustrative solution areas suggested by the brief:**
- Solar-powered precision irrigation using soil-moisture sensors and crop-growth models
- AI-based crop-health monitoring using low-cost cameras or satellite imagery
- Solar-powered farm-gate cold-chain and micro-storage, supported by logistics-optimisation software
- Vernacular advisory chatbots/voice interfaces (weather, input-cost, market-price info)
- Aggregation/cooperative platforms for bulk procurement, collective storage, direct market linkages

---

## 2. Core positioning — the one idea everything else hangs on

**India already has the hardware. Nobody has the intelligence layer on top of it. Savitri is that layer.**

- PM-KUSUM has already solarized **10 lakh+ pumps**, with Budget 2026 nearly doubling funding to ₹5,000 crore, and a further ~₹50,000 crore PM-KUSUM 2.0 in the pipeline.
- EESL and private players have deployed decentralized 5–10 MT solar cold storage units; FPOs are building their own farm-gate collection points.
- Bhashini (India's National Language Translation Mission) already offers free voice/translation AI in all 22 scheduled languages, and Bharat-VISTAAR (launched Budget 2026) is a new national AI+voice initiative specifically for farmers, built on Bhashini.

Because of this, Savitri's build philosophy is: **do not build new hardware, and do not build new base-level AI infrastructure.** Build the decision layer that makes the pumps water at the right time, routes produce to the right cold room, and speaks to the farmer in their own voice using tools the government has already paid to build. This is also why the brief's note that *"no physical hardware build is expected"* is not a constraint to work around — it's the whole strategy.

---

## 3. Full Feature Set

### Layer 1 — Field Digital Twin (the data foundation, no per-field sensors required)
- Farmer confirms a field boundary once (phone GPS, or pulled from AgriStack land records where available).
- Pulls **free satellite data** for that exact plot: vegetation/water stress indices (Sentinel-2 NDVI/NDWI), land surface temperature (MODIS/Landsat), soil moisture proxies (SMAP/Bhuvan).
- Combines with weather-API rainfall/evapotranspiration data to run a standard crop-water-balance model (FAO Penman-Monteith) per crop growth stage.
- Where cheap sensors *do* exist at FPO/cluster level (₹500–2,000 each), they calibrate and sharpen the satellite model locally — treated as a bonus, never a dependency.
- *Why this matters:* per-field IoT costs ₹25,000–50,000/acre for a full commercial kit — unaffordable at smallholder scale. A satellite-first model gives a "good enough" signal, for free, on day one, for every field in India.

### Layer 2 — Irrigation Copilot ("when to water")
- Converts the water-balance model into one plain-language voice note: *"Field 3 — irrigate 40 minutes tomorrow, 11am–1pm. Skip today, 12mm rain expected."*
- Timed to daylight solar-generation windows, so the farmer runs the KUSUM pump when solar output is highest — cutting both water waste and grid/diesel dependence.
- Feeds back against PM-KUSUM's own Remote Monitoring System (RMS) data where available, to compare recommended vs. actual pump runtime over time.
- **Directly targets Pillar 1 (energy/water intensity).**

### Layer 3 — Crop Health Early Warning ("is something wrong, before I can see it")
- Photo-based diagnosis (à la Plantix) for reactive checks.
- The differentiator: **proactive, not reactive** — regional outbreak signals (crowd-sourced uploads + agri-extension bulletins) trigger a warning *before* local symptoms appear, not after.
- **Targets Pillar 4 (climate/pest resilience).**

### Layer 4 — Spoilage-Risk & Harvest-Timing Engine ("The Walk")
- Combines crop-specific shelf-life curves, forecast heat/humidity, and days-to-harvest into a spoilage-risk score, days ahead of harvest.
- Named internally after the Savitri story — this is literally the feature that "walks beside" a crop heading toward loss and intervenes early.
- Turns post-harvest loss from a *reactive* problem (rotting produce at the market) into a *planned* one.
- **Directly targets Pillar 2 (post-harvest loss).**

### Layer 5 — Shared Cold-Storage Marketplace ("where to store")
- EESL/FPO/private solar cold-storage units list live free capacity.
- A ride-hailing-style allocation algorithm matches a farmer's harvest window and travel distance to the nearest available slot.
- Includes a transparent, logged slot-allocation history — a small governance detail addressing the real-world FPO complaint that "whoever shouts loudest gets the slot."
- **Targets Pillar 2 (post-harvest loss) and Pillar 3 (empowerment — fair access).**

### Layer 6 — Sell-Now-vs-Store Economics ("what should I do today")
- Pulls live mandi prices (e-NAM/Agmarknet) for nearby markets, nets out transport cost and storage fee (~₹1.5/kg benchmark from existing solar pre-cooling models), and outputs one number: *expected ₹/kg gain from storing 3 more days vs. selling today.*
- Replaces gut-feel with a concrete number, delivered as one spoken line.
- **Directly targets Pillar 3 (empowerment).**

### Layer 7 — Climate Resilience & Insurance Nudges
- Seasonal drought/heat-wave risk index (IMD extended forecasts) → crop-choice and PMFBY crop-insurance nudges before sowing.
- **Enhancement:** the same satellite/weather pipeline used for irrigation can double as a trigger for **parametric micro-insurance** — auto-flagging drought/heat-stress conditions that would justify a payout, cutting claim time from months to days.
- **Targets Pillar 4 (climate resilience).**

### Layer 8 — "Second Income Advisor" (Agrivoltaics) — *new*
- Evaluates whether part of a farmer's land is a good candidate for **agrivoltaics** (raised solar panels with shade-tolerant crops grown underneath — turmeric, ginger, leafy greens, etc.).
- Cites real state schemes (e.g. Odisha ₹20,000/acre/year, Delhi ₹8,333/acre/month for hosting panels) and the documented finding that combined power+crop output can exceed either alone (Land Equivalent Ratio ~1.41 in Indian pilot data).
- The shading effect also **reduces soil-moisture evaporation and heat stress on the crop underneath** — so this single feature touches Pillar 1 (energy), Pillar 3 (new income), and Pillar 4 (climate resilience) at once.
- Positioned as a forward-looking, optional recommendation — not a day-to-day nudge like Layers 2–6.

### Layer 9 — Vernacular Voice Interface (the delivery mechanism for everything above)
- Built on **Bhashini** (free government ASR/TTS/translation APIs, 22 languages) and designed to interoperate with **Bharat-VISTAAR**, the national farmer-facing AI voice initiative launched in Budget 2026 — rather than building a proprietary language model from scratch.
- **Feature-phone-first**: primary interface is a voice call/IVR flow, with WhatsApp as an upgrade path for smartphone users — most competing apps assume a smartphone + data plan, which excludes a real share of the target users.
- Every recommendation includes a one-line *why*, in-language, to build trust with low-literacy users who won't act on an unexplained instruction.
- **Directly targets Pillar 3 (empowerment — literacy/connectivity constraints).**

---

## 4. System Architecture (text diagram)

```
                         ┌────────────────────────────┐
                         │   FREE / PUBLIC DATA LAYER  │
                         │  Satellite (NDVI/NDWI/LST)  │
                         │  Weather / IMD forecasts    │
                         │  e-NAM / Agmarknet prices   │
                         │  AgriStack land records     │
                         │  Bhashini language APIs     │
                         └──────────────┬───────────────┘
                                        │
                                        ▼
                     ┌───────────────────────────────────┐
                     │        SAVITRI DECISION ENGINE      │
                     │                                     │
                     │  L1  Field Digital Twin             │
                     │  L2  Irrigation Copilot             │
                     │  L3  Crop Health Early Warning       │
                     │  L4  Spoilage-Risk Engine ("The Walk")│
                     │  L5  Cold-Storage Allocation Engine  │
                     │  L6  Sell-vs-Store Economics         │
                     │  L7  Climate Risk & Insurance Trigger│
                     │  L8  Agrivoltaics "2nd Income" Model │
                     └──────────────┬────────────────────┘
                                        │
                                        ▼
                     ┌───────────────────────────────────┐
                     │   L9  VOICE / VERNACULAR INTERFACE  │
                     │   (Bhashini + Bharat-VISTAAR,       │
                     │    IVR call + WhatsApp)             │
                     └──────────────┬────────────────────┘
                                        │
                                        ▼
              ┌──────────────────────────────────────────────┐
              │                  FARMER                        │
              │  hears one line: what to do, and why           │
              └──────────────────────────────────────────────┘
                                        │
                    feeds back actual actions taken ▲
                                        │
                     ┌───────────────────────────────────┐
                     │   EXISTING PHYSICAL INFRASTRUCTURE  │
                     │   (not built by us — used by us)    │
                     │   PM-KUSUM solar pumps              │
                     │   EESL / FPO solar cold storage     │
                     │   FPO collection centres            │
                     └───────────────────────────────────┘
```

**Money flow (for the business-model section):** farmer pays a small per-use fee for cold-storage booking / sell-vs-store queries → OR the platform earns a share from input/insurance/credit partners bundled alongside advice → OR FPOs/aggregators/agri-companies pay a platform licence fee because Savitri makes their existing farmer network more efficient (see Section 6).

---

## 5. Market Research Summary

### Global market size (context, not our addressable market alone)
- Global "precision agriculture" market: **~$11–21 billion**, growing ~9–13% CAGR through 2030–35.
- Global "agritech platform" market: **~$18.9 billion (2026) → $47.6 billion (2033)**, 14.1% CAGR — Asia-Pacific is the fastest-growing region (19.3% CAGR), driven by India, China, Indonesia smallholder digitisation.
- India's agritech platform market alone: **~$870 million by 2026**, with **140 million smallholder farming households** — the largest single addressable market globally for mobile-first, vernacular agritech.

### Two very different "flavors" of this industry
| | Rich-country model (US/EU) | Smallholder model (Africa, India) |
|---|---|---|
| Examples | CropX, Semios, Arable, Climate FieldView | Apollo Agriculture (Kenya), ColdHubs (Nigeria), DeHaat (India) |
| Approach | Sell hardware + software subscription to large farms | Sell an *outcome* (a stored crate, a season of inputs) via a shared/bundled model |
| Price point | $500+ per sensor, $1,000s/year subscription | Cents-per-use, or bundled into credit/insurance farmers already need |
| Why it works there | Large farms can absorb capital cost | Poor farmers can't — so the model has to be shared-asset or bundled, not "sell an app" |

**Lesson for Savitri: we are building the smallholder-model kind of company, not the CropX kind.** Don't sell tech directly — sell (or subsidize) an outcome, and monetize through partners, shared infrastructure, or bundled financial products.

### Competitive landscape

| Player | What it does | Gap Savitri fills |
|---|---|---|
| **Plantix / Kisan AI** | Photo-based crop disease diagnosis, 8+ languages, ~90% accuracy | Reactive only; no link to irrigation, storage, or sell/store economics |
| **Ecozen (Ecofrost)** | Solar farm-gate pre-cooling, ~₹1.5/kg vs ₹3–3.7/kg market rate; 35,000+ farms | Hardware-centric; no software layer deciding *which* produce goes *where* |
| **DeHaat / Gramophone** | Full-stack inputs + advisory + market linkage via 11,000+ centres, 503 FPOs; cites 50–70% income uplift | Advisory is generic/seasonal, not a live optimization engine |
| **CropX / Semios / Arable** | Enterprise-grade sensor + software for large farms | Priced far above smallholder reach; not India-focused |
| **Apollo Agriculture (Kenya)** | Bundles inputs + credit + insurance + advisory via mobile | Africa-only; proves the "bundle, don't sell an app" model works |
| **ColdHubs (Nigeria)** | Pay-as-you-store solar cold rooms, $0.50/crate/day; cut spoilage 80%, extended shelf life 2→21 days | Proves shared-asset pricing works; no allocation/matching software layer |
| **PM-KUSUM (govt)** | Subsidizes the solar pump itself (60–80% subsidy) | Says nothing about *when* to irrigate |
| **Bhashini / Bharat-VISTAAR (govt)** | Free vernacular voice AI infrastructure for farmers | Infrastructure only — no decision-engine built on top yet |

---

## 6. Business Model Options (not yet decided — options on the table)

1. **Pay-per-use** (ColdHubs-style): tiny fee only when a farmer books cold storage or checks sell-vs-store — low trust barrier, easy to start.
2. **Bundled with financing/inputs/insurance** (Apollo-style): advice is "free" to the farmer; Savitri earns a cut from partnered seed/fertiliser/credit/insurance providers.
3. **B2B2Farmer / platform licensing** (DeHaat-style): sell Savitri as software to FPOs, cold-storage operators, or agri-aggregators who already have the farmer relationship; farmer never pays directly.

*(Open question — see Section 8.)*

---

## 7. Quantified Benefit — baseline numbers to build the actual calculation from

- **Post-harvest loss baseline:** NABARD estimates 20–30% national loss post-harvest; brief cites 15–20%.
- **Solar cold storage (Ecozen):** ~₹1.5/kg pre-cooling cost vs ₹3–3.7/kg conventional.
- **PCM solar cold storage field trial (Dharwad, 2025):** ~28% lower daily energy use, up to 4× shelf life, ~22% higher price realization, ~2.05× 3-year ROI.
- **Micro-irrigation:** subsurface drip saves 35–65% water vs. flood irrigation.
- **ColdHubs (Nigeria):** shelf life 2 days → 21 days; spoilage cut ~80%.
- **DeHaat/FPO aggregation:** 50–70% income enhancement reported across 503 FPOs, 1.8M+ farmers.
- **Agrivoltaics:** Land Equivalent Ratio ~1.41 in Indian pilot data (combined crop+power output > either alone); Odisha pays ₹20,000/acre/year, Delhi ₹8,333/acre/month for hosting panels.
- **PM-KUSUM scale (addressable base):** 10 lakh+ pumps solarized to date; ₹5,000 crore Budget 2026 allocation; ~₹50,000 crore PM-KUSUM 2.0 planned.

*Still to do:* pick one representative crop + region and run the full worked example (₹/hectare/season, against a stated baseline) — this is the single most important missing piece before the write-up is submission-ready. See Section 8.

---

## 8. Open Questions / What Still Needs Work

This section exists so we both know, at a glance, what's solid and what's still a gap.

**Solid (researched, grounded, defensible):**
- ✅ Problem framing and alignment to the four judging pillars
- ✅ Positioning strategy (software layer on existing infrastructure)
- ✅ Competitive landscape, globally and in India
- ✅ Feature list (Layers 1–9) with a clear "why" for each
- ✅ Data sources identified for a real prototype (satellite indices, weather APIs, e-NAM, Bhashini)

**Needs work before this is submission/investor-ready:**
- ❌ **One worked numeric example.** We have baseline stats but haven't yet run them together for a single crop (e.g., "1 hectare of tomatoes in Nashik") to produce one clean ₹/hectare/season number. This is required by the brief and is currently the biggest gap.
- ❌ **Business model decision.** Three options are listed in Section 6, but none chosen — needs a decision before unit economics can be written.
- ❌ **Target crop(s) and geography for launch.** "All of India" isn't a deployment plan — need to pick 1–2 crops and 1–2 states for the pilot, ideally where PM-KUSUM adoption + FPO density are both already high.
- ❌ **UX wireframes / mockups.** The brief explicitly asks for these; we've only described the voice-flow conceptually, not drawn it.
- ❌ **Software prototype scope.** Need to decide what's actually buildable in the time available — likely candidates: a script pulling one real weather/satellite API + a toy cold-storage allocation algorithm + a mocked WhatsApp conversation.
- ❌ **Data-privacy/land-record access.** AgriStack integration assumes access that may not be trivial to get for a prototype — need a fallback (manual polygon drawing) confirmed as primary path.
- ❌ **Farmer trust/adoption mechanics** beyond the "explainability" and "fair allocation log" ideas — how do we actually get the first 100 farmers to try it?

---

## 9. Sources

PM-KUSUM scheme details (MNRE/Budget 2026 coverage); NABARD post-harvest loss report; Ecozen/EESL solar cold storage case studies; 2025 PCM solar cold storage field trial (Dharwad); DeHaat/FPO impact reporting; Plantix/Cropin/Fasal product documentation; published IoT/drip-irrigation cost and water-savings figures; Apollo Agriculture and ColdHubs case studies; global/India agritech and precision-agriculture market reports (BCC Research, Mordor Intelligence, Persistence Market Research, Market.us); Bhashini/Bharat-VISTAAR government documentation; India agrivoltaics pilot and state-scheme coverage (Drishti IAS, Ornate Solar, IBEF, NITI Aayog Frontier Tech).