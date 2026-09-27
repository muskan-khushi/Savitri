# Savitri

Agricultural intelligence for Indian smallholder farmers. Nine AI layers — irrigation scheduling, crop disease detection, post-harvest shelf life, cold chain logistics, mandi price timing, climate risk, solar income, outbreak early warning, and field satellite indices — delivered via web dashboard, WhatsApp, and Telegram.

---

## Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI · Python 3.11 · SQLite (dev) / PostgreSQL (prod) |
| ML | PyTorch MobileNetV2 · FAO-56 ET₀ · Open-Meteo ERA5-Land |
| Frontend | Next.js 16 · Tailwind CSS · TypeScript |
| Messaging | WhatsApp Business Cloud API · Telegram Bot API · Bhashini translation |
| Infra | Docker Compose · Alembic migrations |

---

## Quickstart

```bash
# 1. Clone
git clone https://github.com/your-org/savitri && cd savitri

# 2. Environment variables (copy and fill)
cp .env.example .env

# 3. Start everything
docker compose up
```

- **Landing page** → http://localhost:3000  
- **Dashboard** → http://localhost:3000/dashboard  
- **API docs** → http://localhost:8000/docs  
- **Health** → http://localhost:8000/health

> The frontend auto-detects when the backend is offline and switches to **Demo Mode** with realistic sample data — so the UI works on Vercel even without a backend.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATA_GOV_API_KEY` | For mandi prices | [data.gov.in](https://data.gov.in) API key |
| `TELEGRAM_BOT_TOKEN` | For Telegram bot | From [@BotFather](https://t.me/BotFather) |
| `BHASHINI_USER_ID` | For translation | [bhashini.gov.in](https://bhashini.gov.in) credentials |
| `BHASHINI_API_KEY` | For translation | Bhashini API key |
| `WHATSAPP_TOKEN` | For WhatsApp | Meta Business Cloud API token |
| `WHATSAPP_PHONE_NUMBER_ID` | For WhatsApp | Phone number ID from Meta |
| `WHATSAPP_VERIFY_TOKEN` | For WhatsApp | Your webhook verify token |
| `NEXT_PUBLIC_API_URL` | Frontend | Backend URL (default: `http://localhost:8000`) |

---

## API Reference

All endpoints are documented at `/docs` (Swagger UI) and `/redoc`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/v1/crops` | List supported crops (20 crops, FAO-56) |
| `POST` | `/api/v1/farms` | Create farm profile |
| `POST` | `/api/v1/irrigation-advisory` | Stateless FAO-56 ET₀ irrigation advisory |
| `GET` | `/api/v1/farms/{id}/irrigation-advisory` | Farm-bound irrigation advisory |
| `POST` | `/api/v1/disease-detection` | MobileNetV2 leaf disease diagnosis (image upload) |
| `GET` | `/api/v1/farms/{id}/spoilage-risk` | Q10 post-harvest shelf life |
| `GET` | `/api/v1/cold-storage/nearest` | Nearest cold chain hubs (Haversine) |
| `POST` | `/api/v1/cold-storage/book` | Book a cold storage slot |
| `GET` | `/api/v1/farms/{id}/market-advice` | OLS price trend vs storage cost (Agmarknet) |
| `GET` | `/api/v1/farms/{id}/climate-risk` | 16-day drought + heat stress (PMFBY nudge) |
| `GET` | `/api/v1/farms/{id}/field-indices` | ERA5-Land soil moisture + vegetation stress |
| `POST` | `/api/v1/agrivoltaics-estimate` | PM-KUSUM solar land-lease income estimate |
| `GET` | `/api/v1/outbreak-warnings` | Regional disease outbreak aggregation |

---

## Local Development (without Docker)

```bash
# Backend
cd backend
python -m pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

---

## Deployment

**Frontend (Vercel):**
```
NEXT_PUBLIC_API_URL=https://your-backend.fly.dev
```
The frontend runs in Demo Mode automatically when the backend URL is unreachable.

**Backend (Fly.io / Render):**
```bash
# Fly.io
fly launch --dockerfile backend/Dockerfile
fly secrets set DATA_GOV_API_KEY=... TELEGRAM_BOT_TOKEN=...
```

**ML model checkpoint:**
The disease detection model (`backend/ml/checkpoints/mobilenetv2_plantvillage_best.pth`) must be present. Download pretrained weights or train using:
```bash
cd backend
python ml/train_disease_model.py --data-dir data/plantVillage
```

---

## Project Structure

```
savitri/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI routes
│   │   ├── models_db.py         # SQLAlchemy models
│   │   ├── services/            # All 9 AI layer services
│   │   └── schemas*.py          # Pydantic schemas
│   ├── ml/
│   │   ├── train_disease_model.py
│   │   └── checkpoints/         # Model weights (gitignored)
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── (marketing)/         # Landing, story, for-farmers
│   │   └── (dashboard)/         # All 9 platform pages
│   ├── components/
│   │   ├── dashboard/           # Bento tile components
│   │   ├── layout/              # Nav, footer
│   │   └── savitri/             # Landing page sections
│   └── lib/
│       ├── api.ts               # All backend API calls
│       └── mock-data.ts         # Demo mode fallback data
├── docker-compose.yml
└── README.md
```

---

## Data Sources

| Data | Source | License |
|---|---|---|
| Crop coefficients | FAO-56 (Allen et al., 1998) Tables 11–12 | Public domain |
| Weather / ET₀ | Open-Meteo ERA5-Land reanalysis | CC BY 4.0 |
| Mandi prices | Agmarknet via data.gov.in | Open Government Data |
| Disease training | PlantVillage (Hughes & Salathé, 2016) | CC BY-SA 4.0 |
| Cold storage | NCCD India cold chain database | Public |
| Solar rates | PM-KUSUM state agency tender rates | Public |

---

## License

MIT — see [LICENSE](LICENSE).

Data sources carry their own licenses as noted above.
