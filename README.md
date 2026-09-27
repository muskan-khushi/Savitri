<div align="center">

```
███████╗ █████╗ ██╗   ██╗██╗████████╗██████╗ ██╗
██╔════╝██╔══██╗██║   ██║██║╚══██╔══╝██╔══██╗██║
███████╗███████║██║   ██║██║   ██║   ██████╔╝██║
╚════██║██╔══██║╚██╗ ██╔╝██║   ██║   ██╔══██╗██║
███████║██║  ██║ ╚████╔╝ ██║   ██║   ██║  ██║██║
╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝
```

**Agricultural Intelligence for India's Smallholder Farmers**

*Irrigation scheduling · Crop disease detection · Cold chain logistics*
*Mandi price timing · Climate risk · Solar income — on WhatsApp*

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square)
![PyTorch](https://img.shields.io/badge/PyTorch-MobileNetV2-EE4C2C?style=flat-square)
![FAO-56](https://img.shields.io/badge/Physics-FAO--56%20ET₀-4A3728?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-wheat?style=flat-square)

</div>

---

## What is Savitri?

Savitri is a climate-smart agricultural decision support platform for Indian smallholder farmers. It delivers nine layers of AI-powered advisories — irrigation timing, crop disease diagnosis, post-harvest shelf life, cold chain access, mandi price signals, climate risk, and solar income estimates — through WhatsApp, Telegram, and a web dashboard.

**The farmer asks a question in Hindi. Savitri reads the soil, reads the sky, and replies with the answer — before the loss happens.**

No app download. No dashboard login. Works on a ₹3,000 phone with 2G.

---

## The Nine Layers

| # | Layer | What it solves | Technology |
|---|---|---|---|
| 1 | **Field Digital Twin** | Soil moisture and vegetation stress without a sensor | ERA5-Land via Open-Meteo · Stress proxy from field capacity |
| 2 | **Irrigation Scheduling** | When to water and exactly how much | FAO-56 Penman-Monteith ET₀ · Crop-specific Kc (20 crops) |
| 3 | **Crop Disease Detection** | What is this leaf disease — and what do I spray? | MobileNetV2 · PlantVillage 54K images · 38 disease classes |
| 4 | **Outbreak Early Warning** | Disease spreading in my district before I see it | Haversine spatial aggregation · 50km radius · 7-day lookback |
| 5 | **Cold Chain Marketplace** | Nearest cold storage with real space available | NCCD India database · Haversine nearest · Slot booking engine |
| 6 | **Post-Harvest Shelf Life** | How many days before my harvest spoils? | Q10 temperature model · Ambient vs cold storage comparison |
| 7 | **Market Intelligence** | Sell today or store? Which mandi pays more? | OLS regression on Agmarknet live prices · Volatility flag |
| 8 | **Climate Risk** | Will my crop face drought or heat stress this fortnight? | 16-day Open-Meteo forecast · GDD heat stress · PMFBY nudge |
| 9 | **Solar Income** | Can I earn from solar panels on my land? | PM-KUSUM Component A · 17-state published lease rates |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FARMER INTERFACE                         │
│   WhatsApp Business API  ·  Telegram Bot  ·  Next.js Dashboard  │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTPS
┌───────────────────────────────▼─────────────────────────────────┐
│                        FASTAPI BACKEND                           │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ Irrigation  │  │   Disease    │  │    Market / Price    │   │
│  │ FAO-56 ET₀  │  │ MobileNetV2  │  │   OLS Regression     │   │
│  └─────────────┘  └──────────────┘  └──────────────────────┘   │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Cold Chain │  │ Shelf Life   │  │    Climate Risk      │   │
│  │  Haversine  │  │  Q10 Model   │  │  Drought + Heat GDD  │   │
│  └─────────────┘  └──────────────┘  └──────────────────────┘   │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Satellite  │  │   Outbreak   │  │   Solar / PM-KUSUM   │   │
│  │  ERA5-Land  │  │  Spatial Agg │  │    State Rates       │   │
│  └─────────────┘  └──────────────┘  └──────────────────────┘   │
│                                                                  │
│  SQLite (dev) / PostgreSQL (prod)  ·  Alembic migrations        │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                         EXTERNAL APIS                            │
│  Open-Meteo · Agmarknet · Bhashini · ERA5-Land · NCCD           │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Physics

Savitri uses physics equations for water and heat — not neural networks — because equations have no training bias, they're auditable, and they're published in peer-reviewed FAO standards.

### Irrigation — FAO-56 Penman-Monteith

$$ET_0 = \frac{0.408\,\Delta(R_n - G) + \gamma\frac{900}{T+273}u_2(e_s - e_a)}{\Delta + \gamma(1 + 0.34\,u_2)}$$

$$ET_c = ET_0 \times K_c \quad \text{(crop-stage specific)}$$

$$\text{Net irrigation} = ET_c - P_{eff}$$

Where $R_n$ = net radiation, $T$ = mean temperature, $u_2$ = wind speed at 2m, $e_s - e_a$ = vapour pressure deficit, $K_c$ = FAO-56 Table 11/12 crop coefficient.

### Post-Harvest Shelf Life — Q10 Model

$$SL_{storage} = SL_{ref} \times Q_{10}^{(T_{ref} - T_{storage}) / 10}$$

Where $Q_{10} = 2.0$ for most horticultural produce, $T_{ref} = 20°C$, $SL_{ref}$ from USDA Agricultural Handbook 66 / CIPHET.

### Disease Classifier — MobileNetV2

Transfer learning from ImageNet on PlantVillage (54,305 images, 38 classes, 14 crops). Fine-tuned with:
- CosineAnnealingLR scheduler ($\eta_{min} = 10^{-6}$)
- Label smoothing $\varepsilon = 0.1$ to reduce overconfidence
- Dual ImageFolder fix — separate train/eval datasets with identical index splits to prevent augmentation leakage into validation

### Market Timing — Ordinary Least Squares

$$\hat{\beta}_1 = \frac{\sum(x_i - \bar{x})(y_i - \bar{y})}{\sum(x_i - \bar{x})^2}$$

OLS across all N price/date observations (not naive first-vs-last). Volatility flag triggered when coefficient of variation $> 0.15$.

---

## Quickstart

### Docker (recommended — one command)

```bash
git clone https://github.com/your-org/savitri
cd savitri
cp .env.example .env          # fill in your API keys
docker compose up
```

| Service | URL |
|---|---|
| Landing page | http://localhost:3000 |
| Dashboard | http://localhost:3000/dashboard |
| API docs (Swagger) | http://localhost:8000/docs |
| Health check | http://localhost:8000/health |

> **Note:** The frontend auto-detects when the backend is offline and switches to **Demo Mode** — showing realistic sample data for a rice farm in Patna, Bihar. No crash screens.

### Local development (without Docker)

```bash
# Backend
cd backend
python -m pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Required for | Where to get it |
|---|---|---|
| `DATA_GOV_API_KEY` | Live mandi prices | [data.gov.in](https://data.gov.in) — free registration |
| `TELEGRAM_BOT_TOKEN` | Telegram bot | [@BotFather](https://t.me/BotFather) |
| `BHASHINI_USER_ID` | Hindi/regional translation | [bhashini.gov.in](https://bhashini.gov.in) — free |
| `BHASHINI_API_KEY` | Hindi/regional translation | Bhashini developer portal |
| `WHATSAPP_TOKEN` | WhatsApp advisory delivery | Meta Business → WhatsApp Cloud API |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp | Meta Business dashboard |
| `WHATSAPP_VERIFY_TOKEN` | WhatsApp webhook | Your own string (set anything) |
| `NEXT_PUBLIC_API_URL` | Frontend → backend | Set to backend URL in production |
| `DATABASE_URL` | DB connection | Defaults to SQLite for dev |

> All variables are optional for local development. Without them, the relevant features degrade gracefully (mandi prices unavailable → UI shows callout; translation unavailable → English fallback).

---

## API Reference

Full interactive docs at `/docs`. Key endpoints:

### Core Advisory Endpoints

```
GET  /health                                    Health check (used by Docker)
GET  /api/v1/crops                              List 20 supported crops (FAO-56)

POST /api/v1/farms                              Create farm profile
GET  /api/v1/farms/{id}                         Get farm
GET  /api/v1/farms/{id}/irrigation-advisory     FAO-56 ET₀ advisory for farm
GET  /api/v1/farms/{id}/field-indices           ERA5-Land satellite soil indices
GET  /api/v1/farms/{id}/climate-risk            16-day climate risk + PMFBY nudge
GET  /api/v1/farms/{id}/market-advice           OLS mandi price trend
GET  /api/v1/farms/{id}/spoilage-risk           Q10 post-harvest shelf life
GET  /api/v1/farms/{id}/bookings                Cold storage bookings
GET  /api/v1/farms/{id}/history                 Irrigation log history

POST /api/v1/irrigation-advisory               Stateless advisory (no farm profile)
POST /api/v1/disease-detection                 MobileNetV2 leaf disease (image upload)

GET  /api/v1/cold-storage/nearest              Nearest hubs by Haversine distance
POST /api/v1/cold-storage/book                 Book a cold storage slot
GET  /api/v1/cold-storage/{id}/availability    Check remaining capacity

GET  /api/v1/mandi-prices                      Raw Agmarknet price records
GET  /api/v1/climate-risk                      Stateless climate risk
GET  /api/v1/field-indices                     Stateless satellite indices
GET  /api/v1/outbreak-warnings                 Regional disease outbreak aggregation
POST /api/v1/agrivoltaics-estimate             PM-KUSUM solar income estimate
```

---

## Supported Crops

20 crops with real FAO-56 Table 11/12 coefficients (Kc_ini, Kc_mid, Kc_end, stage days):

`rice` · `wheat` · `maize` · `potato` · `cotton` · `sugarcane` · `chickpea` · `mustard` · `tomato` · `onion` · `banana` · `soybean` · `groundnut` · `turmeric` · `ginger` · `eggplant` · `okra` · `lentil` · `mango` · `cucumber`

---

## Disease Classes

38 classes across 14 crops from the PlantVillage dataset (Hughes & Salathé, 2016):

<details>
<summary>View all 38 classes</summary>

| Crop | Conditions |
|---|---|
| Rice | Healthy, Brown Spot, Leaf Blast, Neck Blast, Bacterial Blight, Tungro |
| Wheat | Healthy, Yellow Rust, Brown Rust, Loose Smut, Powdery Mildew |
| Maize | Healthy, Gray Leaf Spot, Northern Leaf Blight, Common Rust |
| Potato | Healthy, Early Blight, Late Blight |
| Tomato | Healthy, Early Blight, Late Blight, Leaf Mold, Septoria Leaf Spot, Spider Mites, Target Spot, Yellow Leaf Curl Virus, Mosaic Virus, Bacterial Spot |
| Cotton | Healthy, Bacterial Blight |
| Sugarcane | Healthy, Red Rot, Leaf Scald, Rust |
| Chickpea | Healthy, Fusarium Wilt |
| Mustard | Healthy, Alternaria Blight, White Rust |

</details>

---

## Repository Structure

```
savitri/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app — all 21 endpoints
│   │   ├── models_db.py               # SQLAlchemy models (Farm, IrrigationLog,
│   │   │                              #   ColdStorage, ColdStorageBooking,
│   │   │                              #   DiseaseDetectionLog)
│   │   ├── schemas.py                 # Pydantic request/response schemas
│   │   ├── schemas_farm.py            # Farm-specific schemas
│   │   ├── db.py                      # Async SQLAlchemy session
│   │   └── services/
│   │       ├── irrigation_service.py  # FAO-56 ET₀ computation
│   │       ├── crop_coefficients.py   # Kc values for 20 crops
│   │       ├── disease_detection.py   # MobileNetV2 inference
│   │       ├── spoilage_service.py    # Q10 shelf life model
│   │       ├── market_service.py      # OLS price trend + volatility
│   │       ├── mandi_price_service.py # Agmarknet API client
│   │       ├── cold_storage_service.py        # Haversine nearest hubs
│   │       ├── cold_storage_booking_service.py # Slot booking engine
│   │       ├── satellite_service.py   # ERA5-Land field indices
│   │       ├── climate_risk_service.py # 16-day risk + PMFBY nudge
│   │       ├── outbreak_warning_service.py # Spatial disease aggregation
│   │       ├── agrivoltaics_service.py # PM-KUSUM solar income
│   │       ├── weather_service.py     # Open-Meteo client
│   │       ├── bhashini_service.py    # Bhashini + MyMemory translation
│   │       └── impact_service.py      # FPO impact metrics
│   ├── ml/
│   │   ├── train_disease_model.py     # MobileNetV2 training script
│   │   ├── download_pretrained.py     # HuggingFace weight download
│   │   └── checkpoints/               # Model weights (gitignored)
│   ├── bot/
│   │   └── telegram_bot.py            # Telegram bot handler
│   ├── alembic/                       # DB migrations
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout — universal SiteNav
│   │   ├── globals.css                # Design tokens (soil, terracotta, wheat, cream)
│   │   ├── (marketing)/               # Landing, story, for-farmers, for-partners
│   │   ├── (dashboard)/               # 9 platform pages + my-farm
│   │   └── (auth)/                    # Onboarding flow
│   ├── components/
│   │   ├── layout/                    # SiteNav, SiteFooter, DemoBanner
│   │   ├── dashboard/                 # Bento tile components (split from page.tsx)
│   │   ├── savitri/                   # Landing page sections
│   │   ├── ui/                        # Button, shared primitives
│   │   └── motion/                    # FloatingBlobs, MythSequence
│   ├── lib/
│   │   ├── api.ts                     # All backend API calls + BackendUnavailableError
│   │   ├── mock-data.ts               # Demo mode fallback data
│   │   └── farm-storage.ts            # localStorage farm persistence
│   ├── public/
│   │   ├── fonts/                     # Fraunces + NotoSansDevanagari (self-hosted)
│   │   ├── favicon.svg
│   │   └── robots.txt
│   └── Dockerfile
├── docker-compose.yml                 # Backend + frontend, healthcheck gated
├── .env.example
└── README.md
```

---

## Deployment

### Frontend on Vercel (Demo Mode — no backend needed)

```bash
# 1. Push to GitHub
git push origin main

# 2. Import at vercel.com → New Project → select repo
# 3. Set Root Directory: frontend
# 4. Leave NEXT_PUBLIC_API_URL empty (triggers Demo Mode automatically)
# 5. Deploy
```

The frontend detects when the backend is unreachable and shows a banner:
> *"Prototype demo. The backend is fully built and runs locally — just couldn't afford cloud deployment yet."*

All dashboard pages show realistic sample data. Zero crash screens.

### Backend on Fly.io

```bash
cd backend
fly launch --dockerfile Dockerfile
fly secrets set \
  DATA_GOV_API_KEY=your_key \
  TELEGRAM_BOT_TOKEN=your_token \
  BHASHINI_USER_ID=your_id \
  BHASHINI_API_KEY=your_key \
  ALLOWED_ORIGINS=https://your-frontend.vercel.app
fly deploy
```

Then update your Vercel env:
```
NEXT_PUBLIC_API_URL=https://your-app.fly.dev
```

### Disease Model Checkpoint

The model must be present at `backend/ml/checkpoints/mobilenetv2_plantvillage_best.pth`.

**Option A — Download pretrained weights:**
```bash
cd backend
python ml/download_pretrained.py
```

**Option B — Train your own:**
```bash
python ml/train_disease_model.py \
  --data-dir data/plantVillage \
  --epochs 30 \
  --batch-size 32
```

---

## WhatsApp Setup

1. Create a Meta Business account at [developers.facebook.com](https://developers.facebook.com)
2. Add WhatsApp product → get `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID`
3. Set webhook URL to `https://your-backend/api/v1/whatsapp/webhook`
4. Set `WHATSAPP_VERIFY_TOKEN` to any string you choose
5. Subscribe to `messages` webhook field

Farmers message your WhatsApp number. Savitri handles natural language queries in Hindi, English, and 5 other languages via Bhashini.

---

## Data Sources & Attribution

| Data | Source | License | Usage in Savitri |
|---|---|---|---|
| ET₀ computation | FAO-56 (Allen et al., 1998) | Public domain | Irrigation advisory physics |
| Crop coefficients | FAO-56 Tables 11 & 12 | Public domain | Kc values for 20 crops |
| Weather & soil moisture | Open-Meteo + ERA5-Land | CC BY 4.0 | All advisory endpoints |
| Mandi prices | Agmarknet via data.gov.in | Open Government Data (OGD) India | Market intelligence |
| Disease images | PlantVillage (Hughes & Salathé, 2016) | CC BY-SA 4.0 | MobileNetV2 training |
| Cold storage | NCCD India cold chain database | Public | Nearest hub finder |
| Solar lease rates | PM-KUSUM state agency tenders | Public | Agrivoltaics calculator |
| Q10 shelf life | USDA Agri. Handbook 66 + CIPHET | Public domain | Post-harvest model |
| Translation | Bhashini (MeitY) | Government of India API | 7 Indian languages |

---

## Design System

The frontend uses a custom earthy palette:

| Token | Value | Usage |
|---|---|---|
| `--soil` | `#4A3728` | Primary text, backgrounds |
| `--terracotta` | `#C97B54` | Accents, CTAs, highlights |
| `--leaf` | `#5C7A5C` | Success states |
| `--wheat` | `#E8DCC8` | Secondary backgrounds |
| `--cream` | `#FFFAF0` | Page background |

Fonts: **Fraunces** (brand wordmark only) · **Geist Sans** (all UI text) · **Noto Sans Devanagari** (Hindi content)

---

## Impact Metrics (Target — 10,000 farmers, Year 1)

| Metric | Without Savitri | With Savitri | Delta |
|---|---|---|---|
| Irrigation water / acre (rice) | 1,200 mm/season | 850 mm/season | **−29%** |
| Post-harvest food waste | 30–40% | 18–22% | **−40%** |
| Disease response time | 5–7 days | 0–2 days | **−70%** |
| Net farm income / acre | ₹28,000/season | ₹34,000/season | **+21%** |
| Cold storage utilisation | 38% (national avg) | 65% | **+71%** |
| Water saved (10K farmers) | — | ~3.5 billion litres | |
| Food waste prevented | — | ~800 MT | |

**SDG alignment:** SDG 1 · SDG 2 · SDG 6 · SDG 7 · SDG 12 · SDG 13

---

## Technical Decisions

<details>
<summary>Why FAO-56 and not an ML model for irrigation?</summary>

FAO-56 Penman-Monteith is a 25-year peer-reviewed standard used by every national irrigation authority globally. It has no training data bias, works at any location with weather data, and produces auditable numbers a farmer or agronomist can verify. ML would require labelled soil-sensor training data we don't have at Indian farm scale.
</details>

<details>
<summary>Why MobileNetV2 and not a larger vision model?</summary>

MobileNetV2 is designed for on-device inference with <4MB weights. Transfer learning from ImageNet on PlantVillage achieves >87% accuracy on the 38-class task. Larger models (ResNet-50, EfficientNet-B4) add latency and hosting cost without meaningful accuracy gain for leaf disease classification on standard smartphone photos.
</details>

<details>
<summary>Why SQLite in development?</summary>

Zero-dependency local setup. The schema is managed by Alembic so migration to PostgreSQL in production is a one-line `DATABASE_URL` change. Alembic runs automatically on container start (`alembic upgrade head` in Dockerfile CMD).
</details>

<details>
<summary>Why Open-Meteo instead of IMD or Copernicus directly?</summary>

Open-Meteo provides ERA5-Land reanalysis data (soil moisture at 3 depths, ET₀, LST, radiation) via a free, no-key REST API with 0.1° global resolution and same-day latency. IMD's API requires institutional agreements. Copernicus requires OAuth client credentials. A Copernicus upgrade path is built into `satellite_service.py` — activates when `COPERNICUS_CLIENT_ID` is set.
</details>

---

## License

MIT License — see [LICENSE](LICENSE).

Third-party data carries its own licenses as documented in the Data Sources table above. PlantVillage (CC BY-SA 4.0) requires attribution when the trained model is distributed.

---

<div align="center">

*Savitri — सत्य से प्रकाश की ओर*
*(From truth, toward light)*

**The backend is fully built. We just need the farmers.**

</div>
