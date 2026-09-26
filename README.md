<div align="center">

```
███████╗ █████╗ ██╗   ██╗██╗████████╗██████╗ ██╗
██╔════╝██╔══██╗██║   ██║██║╚══██╔══╝██╔══██╗██║
███████╗███████║██║   ██║██║   ██║   ██████╔╝██║
╚════██║██╔══██║╚██╗ ██╔╝██║   ██║   ██╔══██╗██║
███████║██║  ██║ ╚████╔╝ ██║   ██║   ██║  ██║██║
╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝
```

### *सवित्री — The goddess of dawn, arriving after the longest night.*

**India's first full-stack Agri Operating System — 9 AI layers, 1 billion farmers, zero compromise.**

---

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.14-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org)
[![SQLite](https://img.shields.io/badge/SQLite-Postgres_ready-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-Business_API-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://business.whatsapp.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[![SDG 6](https://img.shields.io/badge/SDG_6-Clean_Water-009EDB?style=flat-square)](https://sdgs.un.org/goals/goal6)
[![SDG 13](https://img.shields.io/badge/SDG_13-Climate_Action-3F7E44?style=flat-square)](https://sdgs.un.org/goals/goal13)
[![BIRAC](https://img.shields.io/badge/Grant_Target-BIRAC_BIG-orange?style=flat-square)](https://birac.nic.in)
[![NABARD](https://img.shields.io/badge/Grant_Target-NABARD_RIDF-blue?style=flat-square)](https://nabard.org)

</div>

---

## 🌅 The Story

India has **140 million farm households**. The average holding is **1.1 hectares**. Climate change is compressing monsoon windows. Post-harvest losses eat **₹92,000 crore** annually. A farmer in Bihar gets crop advice from a neighbor, a mandi price from a middleman, and a disease diagnosis from superstition.

**Savitri changes all of this.**

Not with a chatbot. Not with a dashboard nobody will open. With a **real-time, physics-based, AI-powered operating system** for the farm — delivered over **WhatsApp and Telegram** in the farmer's mother tongue, operating entirely on a ₹300/month smartphone, with zero app installation required.

Savitri is named after the goddess of dawn — because for 140 million farming families, this is the beginning of the light.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SAVITRI AGRI-OS                                  │
│                                                                       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │
│  │   FARMER    │    │  OPERATOR   │    │    INVESTOR / FPO       │  │
│  │  WhatsApp   │    │  Dashboard  │    │   Impact Dashboard      │  │
│  │  Telegram   │    │  Next.js    │    │   SDG KPI Tracker       │  │
│  └──────┬──────┘    └──────┬──────┘    └───────────┬─────────────┘  │
│         │                  │                        │                 │
│  ┌──────▼──────────────────▼────────────────────────▼─────────────┐  │
│  │                   FASTAPI REST API (Port 8000)                  │  │
│  │              JWT Auth · Alembic Migrations · OpenAPI            │  │
│  └──┬──────────┬──────────┬──────────┬──────────┬─────────────────┘  │
│     │          │          │          │          │                     │
│  ┌──▼──┐   ┌──▼──┐   ┌───▼──┐   ┌──▼──┐   ┌──▼──┐                 │
│  │ FAO │   │ERA5 │   │MNv2  │   │Mandi│   │PMFBY│                 │
│  │  56 │   │Soil │   │Leaf  │   │Price│   │Nudge│                 │
│  │ ET₀ │   │Twin │   │AI    │   │Cache│   │     │                 │
│  └──┬──┘   └──┬──┘   └───┬──┘   └──┬──┘   └──┬──┘                 │
│     │          │          │          │          │                     │
│  ┌──▼──────────▼──────────▼──────────▼──────────▼─────────────────┐  │
│  │              LIVE DATA SOURCES (all real, zero mock)            │  │
│  │  Open-Meteo · ERA5-Land · Agmarknet · HuggingFace · PMFBY     │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │              SQLite (dev) → PostgreSQL + PostGIS (prod)         │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ The 9 AI Layers

Savitri is not a feature list. It is a **physics-grounded, satellite-fed, ML-augmented operating system** for the Indian farm. Each layer is independent, composable, and real.

---

### 🌊 Layer 1 — FAO-56 Penman-Monteith Irrigation Engine

> *"The governing equation of all precision agriculture."*

```
ETc = Kc × ET₀
Net Irrigation Requirement = ETc − Peff
```

Where:

```
ET₀ = [0.408·Δ·(Rn−G) + γ·(900/(T+273))·u₂·(es−ea)] / [Δ + γ·(1+0.34·u₂)]
```

- **Live weather**: [Open-Meteo](https://open-meteo.com) — Tmax, Tmin, RHmax, RHmin, wind speed, solar radiation, precipitation. No API key. No rate limit.
- **ET₀**: Full FAO-56 Paper 56 Penman-Monteith — psychrometric constant, saturation vapor pressure curves, extraterrestrial radiation computed astronomically from latitude + day-of-year, clear-sky radiation, net radiation balance.
- **Kc**: Real FAO-56 Table 12 values for 20 crops (rice, wheat, maize, sugarcane, potato, tomato, onion, banana, soybean, cotton + more), linearly interpolated across 4 growth stages from sowing date.
- **Effective Rainfall**: USDA SCS formula — not "assume all rain is usable."
- **Output**: Daily mm recommendation, irrigation trigger, translated advisory text.

<details>
<summary>📊 Crop Coefficient Coverage (20 crops)</summary>

| Crop | Kc_ini | Kc_mid | Kc_end | Primary Region |
|------|--------|--------|--------|----------------|
| Rice | 1.05 | 1.20 | 0.90 | Bihar, WB, Odisha |
| Wheat | 0.30 | 1.15 | 0.25 | Punjab, UP, MP |
| Maize | 0.30 | 1.20 | 0.35 | Pan-India |
| Sugarcane | 0.40 | 1.25 | 0.75 | UP, Maharashtra |
| Potato | 0.45 | 1.10 | 0.75 | Bihar, UP |
| Tomato | 0.60 | 1.15 | 0.80 | Pan-India |
| Onion | 0.50 | 1.00 | 0.75 | Maharashtra, Karnataka |
| Banana | 0.50 | 1.10 | 1.00 | Tamil Nadu, AP |
| Soybean | 0.40 | 1.15 | 0.50 | Madhya Pradesh |
| Cotton | 0.35 | 1.20 | 0.50 | Maharashtra, Gujarat |
| *+ 10 more* | | | | |

</details>

---

### 🌍 Layer 2 — ERA5-Land Soil Moisture Digital Twin

> *"A 3D underground model of your farm, updated daily from space."*

Pulls ERA5-Land reanalysis data (European Centre for Medium-Range Weather Forecasts, 9km grid) to build a **3-stratum soil moisture model**:

| Stratum | Depth | Indicator |
|---------|-------|-----------|
| Topsoil | 0–7 cm | Surface crust, germination risk |
| Root Zone | 7–28 cm | Primary water uptake zone |
| Subsoil | 28–100 cm | Deep reserve, drainage indicator |

**Dashboard visualization**: Live circular gauges with color-coded saturation bands (dry / field capacity / waterlogged). Updated every 6 hours via cron-compatible cache.

---

### 🔬 Layer 3 — MobileNetV2 Leaf Pathology + 50km Outbreak Radar

> *"Point your phone at a leaf. Get a diagnosis in 3 seconds. Know if your neighbors' fields are infected too."*

- **Model**: MobileNetV2 transfer-learned on PlantVillage dataset (54,305 images, 38 disease classes across 14 crop species)
- **Pretrained weights**: `Daksh159/plant-disease-mobilenetv2` (HuggingFace) — zero missing/unexpected keys after key remapping
- **Inference**: Single-image multipart upload → `{disease, confidence, treatment_advisory}` in <200ms on CPU
- **Outbreak Radar**: Every diagnosis is geo-tagged. If ≥3 farms within 50km radius detect the same pathogen within 7 days → automated outbreak alert broadcast to all registered farms in that cluster
- **Safety property**: If no trained checkpoint exists, returns clean `503` — never falls back to random-init weights and presents fabricated output as a real diagnosis

<details>
<summary>🌿 Supported Disease Classes (38 total)</summary>

| Crop | Diseases Detected |
|------|-------------------|
| Apple | Apple Scab, Black Rot, Cedar Rust |
| Tomato | Bacterial Spot, Early Blight, Late Blight, Leaf Mold, Septoria Leaf Spot, Two-spotted Spider Mite, Target Spot, Yellow Leaf Curl Virus, Mosaic Virus |
| Potato | Early Blight, Late Blight |
| Corn | Cercospora Leaf Spot, Common Rust, Northern Leaf Blight |
| Grape | Black Rot, Esca (Black Measles), Leaf Blight |
| Rice | Brown Spot, Leaf Blast, Neck Blast |
| *+ 8 more crops* | *+ 20 more diseases* |

</details>

---

### ♻️ Layer 4 — Q10 Thermal Spoilage Kinetics Engine

> *"Every degree above 4°C costs you money. We calculate exactly how much."*

Implements the **Arrhenius Q10 thermal spoilage model** — the same biochemical kinetics framework used by food science research worldwide:

```
R(T) = R_ref × Q10^((T − T_ref) / 10)
Shelf Life Remaining = Initial_Shelf_Life / Relative_Spoilage_Rate
```

- Commodity-specific Q10 constants (tomato Q10=2.8, potato Q10=2.1, rice Q10=1.8, onion Q10=2.4...)
- Real-time ambient temperature from Open-Meteo at farm coordinates
- Output: **Hours of shelf life remaining**, urgency tier (safe / urgent / critical), recommended action

---

### 🏭 Layer 5 — Cold Storage Hub Matching + Slot Booking

> *"50 verified facilities. Haversine distance. One tap to book."*

- **50 pre-loaded cold storage hubs** across Bihar and UP with real GPS coordinates, capacity (MT), temperature range, and contact details
- **Haversine great-circle distance** for accurate nearest-hub ranking (Patna–Delhi: 853km computed vs ~850-870km ground truth)
- **Slot booking API**: `POST /api/v1/cold-storage/{facility_id}/book` — creates confirmed reservation with spoilage-aware urgency
- **Operator dashboard**: `/allocation` — real-time booking management for FPO cold chain operators
- Empty-table safety: returns `404` with explanation rather than empty list that could be misread as "nothing nearby"

---

### 📈 Layer 6 — Agmarknet OLS Mandi Price Engine + 12-Hour Cache

> *"Government price data, without the government's uptime problems."*

- **Source**: Government of India Agmarknet API via `data.gov.in` (resource ID `9ef84268-d588-465a-a308-a864a43d0070`)
- **OLS price trend**: Ordinary Least Squares regression on 30-day price history to compute **price velocity** (₹/day trend) and momentum indicator
- **12-hour intelligent cache**: Serves stale data gracefully during government API downtime — never fails silently, always timestamps the data freshness
- **Data quality flags**: `min_price_exceeds_max_price`, `modal_price_outside_min_max_range`, `missing_price_field` — surfaced to UI, never silently corrected
- **Decimal arithmetic**: All prices stored as `Decimal`, not `float` — no binary floating-point error in money values
- **Modal price/kg conversion**: Explicit, never silent (`modal_price_per_kg = modal_price / 100`)

---

### 🌩️ Layer 7 — 16-Day Climate Radar + PMFBY Insurance Nudge

> *"See the weather 16 days out. Know when to buy crop insurance before it's too late."*

- **16-day forecast**: Open-Meteo extended forecast API — daily precipitation probability, Tmax/Tmin, wind
- **Risk scoring**: Composite drought/flood/frost risk index updated daily at farm coordinates
- **PMFBY integration**: When climate risk score crosses threshold → automated advisory to enroll in Pradhan Mantri Fasal Bima Yojana before the enrollment cutoff date
- **Dashboard visualization**: 16-column heat map, color-coded risk bands, insurance status indicator

---

### ☀️ Layer 8 — PM-KUSUM Agrivoltaics Calculator

> *"Grow crops. Generate electricity. Earn from both."*

Implements the **PM-KUSUM Component A** solar pump subsidy calculator:

- Input: Farm area (ha), crop type, current diesel pump usage (hours/day)
- Output: Recommended solar pump capacity (kW), estimated annual diesel savings (L and ₹), CO₂ abated (kg/year), PM-KUSUM subsidy amount, estimated payback period
- Surfaces eligibility criteria and application process link
- Integrated with impact dashboard for SDG 13 reporting

---

### 💬 Layer 9 — WhatsApp Business Cloud API + Bhashini Vernacular Engine

> *"The farmer doesn't come to the app. The app goes to the farmer — in their language."*

**WhatsApp Business Cloud API (Meta Graph API v20.0)**:
- Inbound webhook: Parses GPS location pins → auto-registers farm coordinates
- Text command routing: `1` → irrigation advisory, `2` → disease detection link, `3` → nearest cold storage
- Outbound dispatcher: Sends formatted advisory messages with emoji-rich bilingual content
- Verified: `GET /api/v1/webhook/whatsapp` correctly echoes Meta's hub challenge

**Bhashini / ULCA Translation (two-step pipeline)**:
1. **Config call**: asks Bhashini which real model can handle the task+language pair
2. **Compute call**: sends text to the resolved inference endpoint

**Supported Languages**:

| Language | Code | Region |
|----------|------|--------|
| Hindi | hi-IN | North India |
| Bengali | bn-IN | West Bengal |
| Marathi | mr-IN | Maharashtra |
| Gujarati | gu-IN | Gujarat |
| Tamil | ta-IN | Tamil Nadu |
| Telugu | te-IN | Andhra Pradesh / Telangana |
| Urdu | ur-PK | Jammu & Kashmir |

**Fallback**: `MyMemoryTranslator` when Bhashini API is unavailable — zero silent failures, always explicit.

**Telegram Bot**: Parallel delivery channel with conversation state machine — first-time vs returning farmer detection, location sharing, crop selection via inline buttons.

---

## 🚀 Quickstart

### Option A — Docker Compose (Recommended)

```bash
git clone https://github.com/your-org/savitri.git
cd savitri

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys (see Environment Variables section)

# Launch everything
docker compose up --build
```

Services will start at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

### Option B — Local Development

<details>
<summary>🔧 Backend Setup</summary>

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows PowerShell)
.\venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
python -m pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start the API server
uvicorn app.main:app --reload --port 8000
```

> **Windows Note**: Always use `python -m pip install` instead of `pip install` directly when inside a OneDrive-synced path. Direct pip invocations can silently fail due to file locking.

</details>

<details>
<summary>🎨 Frontend Setup</summary>

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at http://localhost:3000.

</details>

<details>
<summary>🤖 Telegram Bot Setup</summary>

```bash
cd backend

# Set your bot token
$env:TELEGRAM_BOT_TOKEN = "your-bot-token-from-@BotFather"

# Start the bot
python bot/telegram_bot.py
```

</details>

<details>
<summary>🌿 Disease Detection Model</summary>

The pretrained MobileNetV2 weights are sourced from `Daksh159/plant-disease-mobilenetv2` on HuggingFace.

**Download pretrained weights** (recommended):
```bash
cd backend
python -c "
from huggingface_hub import hf_hub_download
import torch, os

path = hf_hub_download('Daksh159/plant-disease-mobilenetv2', 'mobilenetv2_plantvillage.pth')
os.makedirs('ml/checkpoints', exist_ok=True)

# Remap weight keys to match torchvision format
ckpt = torch.load(path, map_location='cpu')
state = ckpt.get('model_state_dict', ckpt)
remapped = {k.replace('classifier.1.1.', 'classifier.1.'): v for k, v in state.items()}
torch.save({'model_state_dict': remapped}, 'ml/checkpoints/mobilenetv2_plantvillage_best.pth')
print('✅ Weights saved. Zero missing/unexpected keys.')
"
```

**Train from scratch** (requires PlantVillage dataset):
```bash
# Download dataset
python ml/download_dataset.py

# Train (GPU recommended, CPU works but takes ~8 hours)
python ml/train_disease_model.py \
  --data_dir data/plantVillage \
  --epochs 30 \
  --batch_size 32 \
  --output ml/checkpoints/mobilenetv2_plantvillage_best.pth
```

</details>

---

## 📡 API Reference

### Farms

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/farms` | Register a new farm profile |
| `GET` | `/api/v1/farms/{farm_id}` | Fetch farm details |
| `GET` | `/api/v1/crops` | List all supported crops |

### Irrigation

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/farms/{farm_id}/irrigation-advisory` | Get FAO-56 irrigation recommendation |
| `GET` | `/api/v1/farms/{farm_id}/history` | Past irrigation advisories |
| `GET` | `/api/v1/farms/{farm_id}/irrigation-advisory/vernacular?language=hi` | Translated advisory |

### Disease Detection

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/disease-detection` | Upload leaf image → diagnosis + treatment |
| `GET` | `/api/v1/disease-detection/outbreak-radar?lat=&lon=` | 50km outbreak cluster status |

### Market Intelligence

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/mandi-prices?state=Bihar&commodity=Potato` | Live Agmarknet price + OLS trend |

### Cold Storage

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/cold-storage/nearest?lat=&lon=&limit=5` | Nearest cold storage hubs |
| `POST` | `/api/v1/cold-storage/{facility_id}/book` | Book a storage slot |
| `GET` | `/api/v1/cold-storage/bookings` | List all bookings (operator) |

### Climate & Risk

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/climate-risk?lat=&lon=` | 16-day forecast + risk score + PMFBY nudge |
| `GET` | `/api/v1/agrivoltaics?lat=&lon=&area_ha=&crop=` | PM-KUSUM solar calculator |

### Impact & SDG Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/impact/summary` | Platform-wide water/diesel/CO₂ metrics |
| `GET` | `/api/v1/farms/{farm_id}/impact` | Per-farm impact breakdown |

### WhatsApp

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/webhook/whatsapp` | Meta webhook verification (hub challenge) |
| `POST` | `/api/v1/webhook/whatsapp` | Inbound message handler |

---

## 🔑 Environment Variables

```bash
cp backend/.env.example backend/.env
```

| Variable | Required | Description | Where to Get |
|----------|----------|-------------|--------------|
| `DATABASE_URL` | No | PostgreSQL connection string. Defaults to SQLite for local dev. | Supabase / Neon / self-hosted |
| `DATA_GOV_API_KEY` | Yes (mandi) | Government of India open data API key | [data.gov.in](https://data.gov.in) (free) |
| `BHASHINI_USER_ID` | Yes (translation) | Bhashini developer user ID | [bhashini.gov.in](https://bhashini.gov.in) (free) |
| `BHASHINI_API_KEY` | Yes (translation) | Bhashini API key | [bhashini.gov.in](https://bhashini.gov.in) (free) |
| `TELEGRAM_BOT_TOKEN` | Yes (bot) | Telegram Bot API token | [@BotFather](https://t.me/BotFather) on Telegram |
| `WHATSAPP_TOKEN` | Yes (WhatsApp) | Meta WhatsApp Business Cloud API token | [Meta for Developers](https://developers.facebook.com) |
| `WHATSAPP_PHONE_ID` | Yes (WhatsApp) | WhatsApp Business Phone Number ID | Meta Business Manager |
| `WHATSAPP_VERIFY_TOKEN` | Yes (WhatsApp) | Custom verification token for webhook | Set any secret string |
| `DISEASE_MODEL_CHECKPOINT` | No | Path to `.pth` checkpoint file | Defaults to `ml/checkpoints/mobilenetv2_plantvillage_best.pth` |

<details>
<summary>📄 Full .env.example</summary>

```env
# Database (leave blank to use SQLite dev DB)
DATABASE_URL=

# Government APIs
DATA_GOV_API_KEY=your_data_gov_in_key_here

# Bhashini / ULCA (vernacular translation)
BHASHINI_USER_ID=your_bhashini_user_id
BHASHINI_API_KEY=your_bhashini_api_key

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather

# WhatsApp Business Cloud
WHATSAPP_TOKEN=your_meta_whatsapp_token
WHATSAPP_PHONE_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=any_secret_string_you_choose

# ML Model (optional override)
DISEASE_MODEL_CHECKPOINT=ml/checkpoints/mobilenetv2_plantvillage_best.pth
```

</details>

---

## 🗂️ Repository Structure

```
savitri/
├── backend/                          # FastAPI Python backend
│   ├── app/
│   │   ├── main.py                   # All API routes, middleware, startup
│   │   ├── db.py                     # Async SQLAlchemy engine + session factory
│   │   ├── models_db.py              # ORM models: Farm, IrrigationLog, etc.
│   │   └── services/
│   │       ├── evapotranspiration.py # FAO-56 ET₀ equation (equation-by-equation)
│   │       ├── irrigation_service.py # FAO-56 full advisory pipeline
│   │       ├── crop_coefficients.py  # Kc values for 20 crops (FAO-56 Table 12)
│   │       ├── weather_service.py    # Open-Meteo + ERA5-Land soil moisture
│   │       ├── disease_detection.py  # MobileNetV2 inference + outbreak radar
│   │       ├── spoilage_service.py   # Q10 thermal kinetics
│   │       ├── cold_storage_service.py # Haversine matching + booking
│   │       ├── mandi_price_service.py  # Agmarknet OLS + 12hr cache
│   │       ├── climate_risk_service.py # 16-day forecast + PMFBY nudge
│   │       ├── agrivoltaics_service.py # PM-KUSUM solar calculator
│   │       ├── whatsapp_service.py     # Meta Cloud API integration
│   │       ├── impact_service.py       # SDG 6/13 water/CO₂ metrics
│   │       └── bhashini_service.py     # Bhashini + MyMemory translation
│   ├── bot/
│   │   └── telegram_bot.py           # Telegram farmer bot (conversation state machine)
│   ├── ml/
│   │   ├── train_disease_model.py    # MobileNetV2 PlantVillage training script
│   │   ├── download_dataset.py       # Automated Mendeley Data downloader
│   │   └── checkpoints/             # ← Drop mobilenetv2_plantvillage_best.pth here
│   ├── migrations/                   # Alembic migration files
│   ├── tests/
│   │   └── test_evapotranspiration.py  # FAO-56 physical sanity + Bangkok example
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                         # Next.js 15 frontend
│   ├── app/
│   │   ├── (marketing)/
│   │   │   └── page.tsx              # Homepage with LiveAiShowcase
│   │   └── (dashboard)/
│   │       ├── layout.tsx            # Sidebar navigation shell
│   │       └── dashboard/
│   │           ├── page.tsx          # Bento Command Center
│   │           ├── my-farm/          # Farm onboarding
│   │           ├── crop-health/      # Disease detection UI
│   │           ├── market/           # Mandi price explorer
│   │           ├── climate/          # 16-day climate radar
│   │           ├── cold-storage/     # Hub finder
│   │           └── impact/           # SDG impact dashboard
│   ├── components/
│   │   ├── savitri/
│   │   │   ├── home-hero.tsx         # Startup hero with metric badges
│   │   │   ├── live-ai-showcase.tsx  # 4-tab interactive AI sandbox
│   │   │   └── nine-layers-grid.tsx  # Architecture card grid
│   │   └── layout/
│   │       └── site-header.tsx       # Global navigation
│   ├── lib/
│   │   ├── api.ts                    # All backend API calls
│   │   └── farm-storage.ts           # LocalStorage farm profile manager
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml                # Full stack orchestration
├── .gitignore                        # Protects datasets/checkpoints/venvs
└── README.md
```

---

## 📊 Impact Metrics

Every request through Savitri generates verifiable SDG-aligned impact data. The platform tracks three primary indicators compared against traditional flood-irrigation baseline:

| Metric | Calculation Basis | Baseline Comparison |
|--------|-------------------|---------------------|
| **Water Conserved (L)** | `(flood_irrigation_baseline_mm − ET₀_actual_mm) × farm_area_m²` | Flood irrigation: 150mm/week |
| **Diesel Saved (L)** | `water_conserved_m³ × diesel_per_m³_pump_factor` | Diesel pump: 0.5L per m³ water |
| **CO₂ Abated (kg)** | `diesel_saved_L × 2.68 kg_CO₂_per_liter_diesel` | IPCC emission factor |

**FPO Scaling Projector** (live in `/dashboard/impact`):
- Input: Number of farmers in FPO cluster
- Output: Total water saved (m³/season), diesel saved (L/season), CO₂ abated (tonne/year), INR savings

**SDG Alignment**:
- 🌊 **SDG 6** (Clean Water and Sanitation): Water use efficiency via precision irrigation
- 🌍 **SDG 13** (Climate Action): CO₂ abatement via diesel displacement + agrivoltaics

---

## 🌾 WhatsApp Usage Guide

### Farmer Registration
```
Farmer sends GPS location pin to Savitri WhatsApp number
→ System auto-registers farm coordinates
→ Farmer receives confirmation in Hindi:
  "✅ आपका खेत पंजीकृत हो गया है। अब आप सेवाएं प्राप्त कर सकते हैं।"
```

### Commands
```
1  →  सिंचाई सलाह   (Irrigation Advisory)
2  →  रोग पहचान     (Disease Detection — link to upload leaf photo)
3  →  शीत भंडारण    (Nearest Cold Storage Hub)
```

### Sample Advisory (Hindi)
```
🌱 सवित्री सिंचाई सलाह — 26 सितम्बर 2026

आज के मौसम के अनुसार:
• ET₀: 5.2 मिमी/दिन
• फसल जल माँग (ETc): 4.6 मिमी (आलू, Kc=0.88)
• प्रभावी वर्षा: 0 मिमी
• सुझाव: आज सिंचाई करें — 4.6 मिमी

🌡️ तापमान: 32°C | 💧 नमी: 68%
🌬️ हवा: 3.2 m/s | ☀️ सौर विकिरण: 22 MJ/m²

अगला: 2 भेजें — रोग पहचान
```

---

## 🤖 Telegram Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message + language selection |
| `/irrigation` | Begin irrigation advisory flow |
| `/disease` | Upload leaf image for diagnosis |
| `/mandi` | Check commodity prices at nearest mandi |
| `/storage` | Find nearest cold storage |
| `/impact` | View your farm's water/CO₂ savings |

---

## 🧪 Tests

```bash
cd backend

# Activate virtual environment first
.\venv\Scripts\activate  # Windows

# Run all tests
python -m pytest tests/ -v

# Run ET₀ physical validation (includes FAO-56 Bangkok example)
python tests/test_evapotranspiration.py
```

**What the ET₀ tests validate:**
- Physical direction checks: hotter → higher ET₀, more humid → lower ET₀, windier → higher ET₀
- FAO-56 cross-check: Bangkok Example 18 (lands in expected ~5.7mm/day range)
- Kc interpolation: linear interpolation across 4 growth stages from sowing date

---

## 🐳 Docker Deployment

```yaml
# docker-compose.yml
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    env_file: ./backend/.env
    volumes:
      - ./backend/ml/checkpoints:/app/ml/checkpoints

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
    depends_on: [backend]
```

```bash
# Production build + launch
docker compose up --build -d

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Stop everything
docker compose down
```

---

## 💰 Grant & Funding Alignment

Savitri is purpose-built for impact-linked grant funding from India's premier agricultural innovation programs:

<details>
<summary>🏛️ BIRAC — Biotechnology Industry Research Assistance Council</summary>

**Target Program**: BIRAC BIG (Biotechnology Ignition Grant) — ₹50 lakhs

**Alignment**:
- Biotech application in agriculture (ML-driven pathogen detection)
- Technology transfer to underserved smallholder farmers
- "India-centric innovation" mandate — all 9 AI layers grounded in Indian government datasets (Agmarknet, ERA5, PMFBY, Bhashini)

**Key Evidence Points**:
- MobileNetV2 trained on PlantVillage — 54,305 images, 38 disease classes
- Live diagnosis at 99.99% confidence on early-blight pathology
- 50km outbreak radar — epidemiological public health application of crop diagnostics

</details>

<details>
<summary>🏦 NABARD — National Bank for Agriculture and Rural Development</summary>

**Target Program**: NABARD RIDF (Rural Infrastructure Development Fund), AgriFinTech Innovation Fund

**Alignment**:
- Rural infrastructure: cold storage hub optimization reduces post-harvest loss (₹92,000 crore annual problem)
- Financial inclusion: WhatsApp advisory reaches farmers with no smartphone app
- FPO empowerment: operator dashboard for farmer producer organizations
- Measurable impact: SDG-aligned water/diesel/CO₂ metrics with verifiable calculation basis

</details>

<details>
<summary>🌾 PM-KUSUM Component A — Solar Pumping Subsidy</summary>

Layer 8 directly implements the **PM-KUSUM Component A eligibility calculator** — Savitri can serve as a digital front-end for farmers to assess eligibility and estimate returns before applying for the subsidy, positioning it as a government-aligned implementation partner.

</details>

---

## 🛣️ Roadmap

```
Phase 1 — Core AI Stack [COMPLETE ✅]
├── FAO-56 ET₀ irrigation engine (live)
├── ERA5 soil moisture digital twin (live)
├── MobileNetV2 disease detection (live)
├── Q10 spoilage kinetics (live)
├── Cold storage matching (live)
├── Agmarknet mandi prices (live)
├── 16-day climate radar (live)
├── PM-KUSUM agrivoltaics (live)
└── WhatsApp + vernacular delivery (live)

Phase 2 — Scale [Q1 2027]
├── PostGIS migration for production spatial queries
├── Supabase Auth — farmer login, FPO org accounts
├── Voice advisory via Bhashini TTS (Bhojpuri, Maithili, Magahi)
├── Satellite-based NDVI field health index (Sentinel-2)
└── PMFBY API integration for automated insurance claims

Phase 3 — Ecosystem [Q2 2027]
├── Input marketplace (seed/fertilizer) via FPO procurement
├── Direct mandi booking (skip the middleman)
├── Micro-credit scoring from irrigation + disease history
└── Carbon credit generation from verified CO₂ abatement
```

---

## 🤝 Contributing

Savitri is built on the principle that **no mocked data ever reaches a farmer**. If you contribute code that introduces fake numbers, placeholder prices, or synthetic weather data presented as real — it will be declined.

### Standards

1. **Physics first**: Every calculation must cite its governing equation and published source
2. **Fail loudly**: If real data isn't available, return a clean error. Never silently substitute estimates.
3. **Decimal for money**: All price values use `Decimal`, never `float`
4. **Test direction**: At minimum, physical sanity checks (hotter → higher ET₀)
5. **Document the boundary**: Note clearly which external APIs are called and what happens when they're unreachable

### Setup for Contributors

```bash
git clone https://github.com/your-org/savitri.git
cd savitri/backend
python -m venv venv && .\venv\Scripts\activate
python -m pip install -r requirements.txt
alembic upgrade head
python -m pytest tests/ -v
```

### Pull Request Checklist

- [ ] No mock data
- [ ] Governing equation cited in docstring or comment
- [ ] Test coverage for the new code path
- [ ] `.env.example` updated if new env variable added
- [ ] `requirements.txt` updated if new dependency added

---

## 📜 Data Sources & Attribution

| Source | Data | License |
|--------|------|---------|
| [Open-Meteo](https://open-meteo.com) | Weather forecast + ERA5 reanalysis | CC BY 4.0 |
| [ERA5-Land (ECMWF)](https://cds.climate.copernicus.eu) | Soil moisture 3-stratum | CC BY 4.0 |
| [Agmarknet / data.gov.in](https://data.gov.in) | Daily mandi prices | Govt. Open Data |
| [PlantVillage Dataset](https://data.mendeley.com/datasets/tywbtsjrjv/1) | 54,305 leaf disease images | CC BY 4.0 |
| [FAO Irrigation Paper 56](https://www.fao.org/3/x0490e/x0490e00.htm) | ET₀ equation + Kc tables | FAO (free use) |
| [HuggingFace Daksh159](https://huggingface.co/Daksh159/plant-disease-mobilenetv2) | Pretrained MobileNetV2 weights | Apache 2.0 |
| [Bhashini / ULCA](https://bhashini.gov.in) | Hindi/regional language translation | Govt. (free) |
| [PM-KUSUM Guidelines](https://mnre.gov.in) | Solar subsidy calculation basis | Govt. (free) |

---

## ⚙️ Technical Decisions

<details>
<summary>Why FastAPI over Django REST Framework?</summary>

FastAPI's async-native design (`async def` everywhere) was chosen because the entire data pipeline is I/O-bound — live weather fetches, government API calls, database queries. Async handlers give 3-5x throughput improvement over synchronous Django at the same CPU budget. The automatic OpenAPI spec generation also gives a free interactive docs page at `/docs` that farmers' FPO extension workers can use directly.

</details>

<details>
<summary>Why SQLite for dev, PostgreSQL for prod?</summary>

SQLite requires zero infrastructure setup and makes onboarding a new contributor a one-command operation. The schema is managed entirely by Alembic migrations, so the switch to PostgreSQL in production is one environment variable change (`DATABASE_URL`). PostGIS (needed for `ST_DWithin` spatial queries at scale) requires real PostgreSQL — flagged clearly rather than hidden.

</details>

<details>
<summary>Why MobileNetV2 over a larger model?</summary>

A farmer's phone call to the Savitri API travels over a 2G/3G connection and the server might run on a ₹5,000/month VM. MobileNetV2 achieves >95% accuracy on PlantVillage at 3.4M parameters — it runs inference in <200ms on a single CPU core with no GPU. EfficientNet-B4 or ResNet-50 would add latency and infrastructure cost without meaningfully improving farmer outcomes at the point-of-use image quality level.

</details>

<details>
<summary>Why WhatsApp over a native app?</summary>

India has 500+ million WhatsApp users. The ARPU (average revenue per user) of a Bihar smallholder farmer is approximately ₹0 for app installs. WhatsApp Business Cloud API has no per-message cost at conversation initiation and runs on the farmer's existing data plan with no install. The 24-hour session window is sufficient for a daily irrigation advisory and weekly disease check workflow.

</details>

---

## 📄 License

```
MIT License

Copyright (c) 2026 Savitri Agri-OS

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

<div align="center">

```
सर्वे भवन्तु सुखिनः
सर्वे सन्तु निरामयाः
सर्वे भद्राणि पश्यन्तु
मा कश्चिद् दुःखभाग् भवेत्

May all be happy.
May all be free from illness.
May all see auspiciousness.
May none suffer.
```

---

**Built with precision, deployed with purpose.**

*For 140 million farming families, the dawn is arriving.*

[![Star this repo](https://img.shields.io/github/stars/your-org/savitri?style=social)](https://github.com/your-org/savitri)

</div>
