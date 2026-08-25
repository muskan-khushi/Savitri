# Savitri — Technical Build Plan
### Full-stack build guide: architecture, directory structure, real data sources, zero-mock policy

---

## 1. Stack decision (and why)

You asked for Next.js frontend, and backend in "Python/MERN." Here's the actual recommendation, explained honestly rather than just picked:

**Frontend:** Next.js (React) — as requested.
**Backend + ML:** Python only, using **FastAPI**. Not a separate Node/Express layer.

**Why not split into MERN (Node) + Python ML service:**
Every core piece of Savitri's intelligence — the irrigation water-balance formula, the disease-detection model, the spoilage-risk calculation, the cold-storage allocation algorithm — is Python. If the backend were Node/Express, you'd need a *second* service just for ML, talking to the first over HTTP, which means two codebases, two deployment targets, two places for bugs to hide, and two things that can go down — for a team with zero budget and (presumably) limited hands. FastAPI is a full production-grade backend framework (routing, auth, validation, background jobs, WebSockets) **and** it's the same language as every ML/data model you'll write. One backend, one language, one deployment. This isn't a shortcut — it's what most real agri-data startups (CropX, DeHaat's data layer, etc.) actually do.

If later you specifically need something Node is better at (e.g. a very chatty real-time UI), you can add a small Node service for just that — but don't start there.

**Database:** PostgreSQL with the PostGIS extension (for real GPS field-boundary storage and distance calculations) — free tier via **Supabase** or **Neon**.

**Hosting (all free-tier):** Vercel (frontend), Render or Fly.io (FastAPI backend — note: free web-service tiers sleep after inactivity, which is fine for a prototype), Supabase/Neon (Postgres).

---

## 2. Directory Structure

```
savitri/
│
├── frontend/                          # Next.js app
│   ├── app/
│   │   ├── (dashboard)/               # farmer/admin web dashboard
│   │   ├── (auth)/
│   │   ├── api/                       # thin proxy routes to FastAPI only — no logic here
│   │   └── layout.tsx
│   ├── components/
│   │   ├── FieldMap.tsx               # Leaflet/Mapbox map of field polygons
│   │   ├── IrrigationCard.tsx
│   │   ├── SpoilageRiskCard.tsx
│   │   ├── ColdStorageBooking.tsx
│   │   └── PriceTrendChart.tsx
│   ├── lib/
│   └── package.json
│
├── backend/                           # FastAPI — all business logic + ML lives here
│   ├── app/
│   │   ├── main.py
│   │   ├── api/                       # route handlers only — thin, call services/
│   │   │   ├── irrigation.py
│   │   │   ├── crop_health.py
│   │   │   ├── cold_storage.py
│   │   │   ├── market.py
│   │   │   ├── agrivoltaics.py
│   │   │   └── voice.py
│   │   ├── core/                      # config, DB session, auth
│   │   ├── models/                    # SQLAlchemy: Farmer, Field, ColdStore, Booking, PriceLog
│   │   ├── schemas/                   # Pydantic request/response models
│   │   ├── services/                  # REAL LOGIC LIVES HERE (see Section 4)
│   │   │   ├── satellite_service.py       # Copernicus / Sentinel Hub calls
│   │   │   ├── weather_service.py         # Open-Meteo calls
│   │   │   ├── water_balance.py           # FAO-56 Penman-Monteith calculation
│   │   │   ├── mandi_price_service.py     # data.gov.in Agmarknet calls
│   │   │   ├── spoilage_model.py          # shelf-life-curve based risk scoring
│   │   │   ├── allocation_engine.py       # real nearest-slot matching algorithm
│   │   │   ├── agrivoltaics_calc.py       # real state-tariff based income model
│   │   │   ├── bhashini_service.py        # ASR / TTS / translation
│   │   │   └── bot_gateway.py             # Telegram / WhatsApp message handling
│   │   └── ml/
│   │       ├── disease_model/
│   │       │   ├── train.py               # trains on real PlantVillage dataset
│   │       │   ├── infer.py
│   │       │   └── weights/               # saved model checkpoint (.pt/.h5)
│   │       └── reference_data/
│   │           ├── crop_kc_values.csv     # FAO-56 crop coefficient tables
│   │           └── shelf_life_by_crop.csv # published postharvest shelf-life data
│   ├── requirements.txt
│   └── alembic/                       # DB migrations
│
├── data/
│   ├── raw/                           # downloaded PlantVillage etc. (gitignored, large)
│   ├── reference/                     # small, versioned, CITED real reference tables
│   └── notebooks/                     # exploration / model training notebooks
│
├── infra/
│   ├── docker-compose.yml             # local Postgres+PostGIS, backend, frontend
│   └── deploy/                        # render.yaml, vercel.json
│
├── docs/                              # earlier planning docs live here
│   ├── SAVITRI_README.md
│   └── sustainable-agriculture-hackathon-ideas.md
│
└── README.md
```

---

## 3. Real, Free Data Sources — the full table

Every one of these is a live, working, zero-cost API or dataset as of this research. Nothing here is a placeholder.

| Need | Source | Cost | Access | Used in |
|---|---|---|---|---|
| Weather, rainfall, solar radiation, wind, humidity, **soil moisture & temperature at multiple depths**, evapotranspiration | **Open-Meteo** (`api.open-meteo.com`) | Free, **no API key**, up to 10,000 calls/day non-commercial | Just an HTTP GET | Layer 2 (irrigation), Layer 7 (climate risk) |
| Satellite vegetation/water stress imagery (Sentinel-2 NDVI/NDWI), land surface temp (Sentinel-3) | **Copernicus Data Space Ecosystem** (`dataspace.copernicus.eu`) incl. Sentinel Hub API | Free, generous processing-unit quota for general users | Free account + OAuth token | Layer 1 (field digital twin) |
| Daily mandi (market) prices — min/max/modal, by commodity and market | **data.gov.in — Agmarknet dataset** ("Current Daily Price of Various Commodities from Various Markets") | Free | Register on data.gov.in, get instant API key | Layer 6 (sell-vs-store economics) |
| Labelled plant disease images for training a real classifier (38 classes, 14 crop species, ~54,000 images) | **PlantVillage dataset** (Kaggle / HuggingFace / GitHub spMohanty repo) | Free for research/prototyping | Direct download | Layer 3 (crop health model training) |
| Crop water-use coefficients (Kc values) by crop and growth stage | **FAO Irrigation & Drainage Paper 56** (published reference tables) | Free, public domain | Manually transcribed once into `crop_kc_values.csv` | Layer 2 (real Penman-Monteith calc) |
| Postharvest shelf-life vs. temperature/humidity data by crop | Published postharvest handling references (e.g. USDA Agricultural Handbook 66, ICAR/CIPHET postharvest technology publications) | Free, public domain | Manually transcribed once into `shelf_life_by_crop.csv` | Layer 4 (spoilage-risk engine) |
| Vernacular voice — speech-to-text, text-to-speech, translation, 22 Indian languages | **Bhashini (ULCA APIs)**, government of India | Free tier for developers/startups | Register at bhashini.gov.in/ulca, get `userID` + `ulcaApiKey` + `InferenceApiKey` | Layer 9 (voice interface) |
| Messaging channel to reach farmers | **Telegram Bot API** (fully free, unlimited, forever) — primary MVP channel. **WhatsApp Cloud API** — free for *service* conversations (replies within 24h of the farmer messaging first); paid only for business-initiated "marketing/utility" pushes | Free (Telegram) / free-with-constraint (WhatsApp) | BotFather (Telegram) instant; WhatsApp needs Meta Business verification | Delivery layer for all 9 feature layers |
| Field boundary geocoding / place lookup | **OpenStreetMap Nominatim** | Free, rate-limited (1 req/sec) | No key needed | Layer 1 |
| Land records (stretch goal, not required for MVP) | **AgriStack** (govt initiative) | Public infrastructure, access process still maturing | To confirm access process before depending on it | Layer 1 (optional upgrade) |

**One honest gap, flagged clearly:** there is currently **no public API listing live solar cold-storage capacity** in India (EESL/FPO units aren't exposed this way yet). For the prototype, this must be **hand-curated real data** — a small real list of actual solar cold-storage locations (name, real GPS coordinates, real rated capacity in MT) collected by us from public sources (news coverage, EESL/state announcements, FPO directories), not simulated. This is explicitly called out so it's never confused with "real-time" data — it's real but manually maintained until (if) an official feed exists.

---

## 4. Zero-Mock-Logic Policy — exactly how each module computes its answer

This is the section that matters most given what you said. Every module below states its real method and real inputs. None of this is `random.uniform()` standing in for intelligence.

### Irrigation Copilot (Layer 2)
**Method:** FAO-56 Penman-Monteith reference evapotranspiration equation — the internationally standard formula for crop water requirement, published by the UN Food and Agriculture Organization. Real inputs: temperature, wind speed, humidity, solar radiation (all from Open-Meteo, live), multiplied by the crop coefficient (Kc) for the plant's current growth stage (from the real FAO-56 reference table). Output: an actual millimetres-of-water figure, converted into a real pump-runtime recommendation given the farmer's known pump flow rate. **Not** a rule-of-thumb or randomized suggestion — it's the same equation irrigation engineers use.

### Crop Health Early Warning (Layer 3)
**Method:** A convolutional neural network (transfer learning on a lightweight backbone, e.g. MobileNetV2) trained on the real, labelled **PlantVillage dataset** — actual photographs of actual diseased and healthy leaves, actual disease labels. Reported accuracy will be whatever the model actually achieves on a real held-out test split (published research on this exact dataset typically reports ~90%+, but *our* number will be measured, not assumed). Regional-outbreak warnings are built from real aggregated user-submitted diagnoses in a geographic radius — a real count, not a fabricated "outbreak likelihood."

### Spoilage-Risk Engine (Layer 4)
**Method:** A lookup/interpolation against real published shelf-life-vs-temperature-and-humidity curves per crop (from postharvest handling literature), combined with the real weather forecast for the days ahead. If a crop's published shelf life at forecast conditions is, say, 4 days, and it's 3 days since harvest, the engine flags it — a deterministic calculation against cited reference data, not a random risk percentage.

### Cold-Storage Allocation Engine (Layer 5)
**Method:** A real nearest-available-slot matching algorithm — computes the actual great-circle (Haversine) distance between the farmer's real field coordinates and each real cold-storage location's coordinates, checks real remaining capacity against real booked slots in the database, and assigns the nearest facility with available capacity at the needed time. This is a deterministic assignment algorithm (can be upgraded to a proper bipartite-matching/linear-programming optimizer later) — never a random pick.

### Sell-Now-vs-Store Economics (Layer 6)
**Method:** Pulls the real historical daily price series for the crop/market from Agmarknet, computes the actual recent trend (e.g. a simple linear regression or week-over-week average change — a real, explainable statistic, not a guess), and nets out a real transport-cost estimate (distance × a stated ₹/km/kg assumption, clearly labelled as an assumption, not disguised as fact) and the real ~₹1.5/kg pre-cooling benchmark from published solar cold-storage case studies. Output is one number with its calculation shown, so it can be audited.

### Agrivoltaics "Second Income" Advisor (Layer 8)
**Method:** Uses the farmer's real stated/measured land area and the real, cited per-acre tariff/subsidy figures for their state (e.g. Odisha ₹20,000/acre/year, Delhi ₹8,333/acre/month — both real published scheme numbers), producing a genuine arithmetic projection, clearly labelled as an estimate based on current public scheme rates (which can change).

### Voice Interface (Layer 9)
**Method:** Real ASR/TTS via Bhashini's actual government-run models — not a canned phrase list. Every spoken output is generated from the real numeric result of the module above it, translated into the farmer's language via a real translation call, not a pre-written script pretending to be dynamic.

**Engineering note on the satellite data specifically:** Copernicus/Sentinel Hub has a free but *limited* processing-unit quota — so the field digital twin should **cache and refresh on a schedule** (e.g. once every 3–5 days, matching Sentinel-2's actual revisit time) rather than call live on every user request. This isn't a shortcut around real data — it's simply respecting how often the real satellite actually passes overhead.

---

## 5. Build Order (phases)

1. **Data plumbing first, no UI yet.** Get real responses from Open-Meteo, Agmarknet, and Copernicus into your backend for one test field with real coordinates. Confirm you can compute a real Penman-Monteith number before building anything else.
2. **Irrigation Copilot end-to-end.** Real weather in → real ET₀/Kc calculation → a real recommended irrigation window, returned via API.
3. **Disease model.** Train the PlantVillage classifier, wrap it in an `/infer` endpoint that accepts an uploaded photo.
4. **Cold storage + allocation.** Hand-curate a real short list of actual cold-storage locations (start with one state/region), build the Haversine-based allocation engine.
5. **Market economics module.** Real Agmarknet price pull + trend calculation + sell-vs-store number.
6. **Agrivoltaics calculator.** Simple, real, cited-rate arithmetic module.
7. **Bhashini + Telegram bot glue.** Wire the above into one voice/text conversation flow — start with Telegram (zero friction, zero cost, zero approval wait) before attempting WhatsApp Cloud API's business-verification process.
8. **Frontend dashboard last.** A web view of the same data (map of fields, cards for each module) — useful for demoing to judges/investors, but the farmer-facing product is the bot.

---

## 6. What's still an open decision (carried over from the README)

- Target crop + region for the one worked numeric example (still needed for the pitch)
- Business model choice (pay-per-use vs. bundled vs. B2B2Farmer)
- Real cold-storage location list — needs actual manual research/outreach, not just API integration
- Whether to pursue AgriStack land-record access now or defer it (fallback: manual polygon drawing is fine for MVP)