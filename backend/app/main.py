"""
main.py

Savitri backend — FastAPI application with all 9-layer endpoints.

Architecture: thin route handlers only. All logic lives in services/.

Endpoints:
  GET  /                                    — health check
  GET  /api/v1/crops                        — list supported crops
  POST /api/v1/farms                        — create farm
  GET  /api/v1/farms/{id}                   — get farm
  POST /api/v1/farms/{id}/irrigation-advisory         — compute + persist advisory
  GET  /api/v1/farms/{id}/irrigation-advisory/vernacular — advisory translated via Bhashini
  GET  /api/v1/farms/{id}/history           — irrigation log history
  GET  /api/v1/farms/{id}/spoilage-risk     — Q10 spoilage risk
  GET  /api/v1/farms/{id}/market-advice     — Agmarknet sell-vs-store economics
  GET  /api/v1/farms/{id}/bookings          — all cold storage bookings for this farm
  GET  /api/v1/farms/{id}/field-indices     — satellite/soil moisture indices
  GET  /api/v1/farms/{id}/climate-risk      — 16-day climate risk + PMFBY nudge
  POST /api/v1/irrigation-advisory          — stateless advisory (no farm profile)
  POST /api/v1/disease-detection            — MobileNetV2 leaf disease diagnosis
  GET  /api/v1/cold-storage/nearest         — Haversine nearest facilities
  POST /api/v1/cold-storage/book            — book a cold storage slot
  GET  /api/v1/cold-storage/{id}/availability — check remaining capacity
  POST /api/v1/agrivoltaics-estimate        — second-income calculator
  GET  /api/v1/mandi-prices                 — raw Agmarknet price records
  GET  /api/v1/climate-risk                 — stateless climate risk (no farm profile)
  GET  /api/v1/field-indices                — stateless field indices
  GET  /api/v1/outbreak-warnings            — regional disease outbreak alerts

CORS: controlled by ALLOWED_ORIGINS env var (comma-separated).
      Defaults to localhost:3000 for dev. Set in production.
"""

from __future__ import annotations

import os
from datetime import date

# Load .env before any service modules read os.environ
from dotenv import load_dotenv
load_dotenv()  # reads backend/.env if it exists

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from PIL import Image
import io
from typing import Optional

from app.schemas import IrrigationRequest
from app.schemas_farm import FarmCreate, FarmOut, IrrigationLogOut
from app.services.irrigation_service import get_irrigation_recommendation
from app.services.weather_service import fetch_daily_weather, WeatherServiceError
from app.services.crop_coefficients import CROP_COEFFICIENTS
from app.services.disease_detection import predict as predict_disease, ModelNotTrainedError
from app.services.cold_storage_service import find_nearest, NoColdStorageDataError
from app.services.cold_storage_booking_service import (
    create_booking, cancel_booking, check_availability,
    get_farm_bookings, CapacityExceededError, FacilityNotFoundError, BookingNotFoundError
)
from app.services.mandi_price_service import fetch_mandi_prices, MandiPriceServiceError
from app.services.bhashini_service import translate_text, BhashiniServiceError
from app.services.spoilage_service import calculate_spoilage_risk
from app.services.market_service import get_market_advice
from app.services.agrivoltaics_service import calculate_agrivoltaics_income
from app.services.satellite_service import get_field_indices, SatelliteServiceError
from app.services.climate_risk_service import get_climate_risk, ClimateRiskServiceError
from app.services.outbreak_warning_service import (
    get_outbreak_warnings, log_detection
)
from app.db import get_session, init_db
from app.models_db import Farm, IrrigationLog

# ── CORS ────────────────────────────────────────────────────────────────────
# In production: set ALLOWED_ORIGINS=https://your-frontend.vercel.app
# Multiple origins: comma-separated list.
# Defaults to localhost:3000 for local development.
_raw_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app = FastAPI(
    title="Savitri Backend",
    description="Sustainable agriculture AI decision-support API for Indian smallholder farmers.",
    version="0.5.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
    allow_credentials=True,
)


# ── Request/Response schemas ─────────────────────────────────────────────────

class AgrivoltaicsRequest(BaseModel):
    state: str
    land_acres: float


class BookingRequest(BaseModel):
    facility_id: int
    farm_id: int
    quantity_tons: float
    start_date: str  # ISO date YYYY-MM-DD
    end_date: str    # ISO date YYYY-MM-DD


# ── Startup ──────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def on_startup():
    # Creates all tables that don't already exist.
    # Once you have real farmer data in prod, use `alembic upgrade head` instead
    # of init_db to avoid dropping/recreating tables.
    await init_db()


# ── Health ───────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "service": "savitri-backend",
        "status": "ok",
        "version": "0.5.0",
        "cors_origins": ALLOWED_ORIGINS,
    }


# ── Crops ────────────────────────────────────────────────────────────────────

@app.get("/api/v1/crops")
async def list_supported_crops():
    """List all crops with real FAO-56 crop-coefficient data."""
    return {"crops": sorted(CROP_COEFFICIENTS.keys())}


# ── Farm CRUD ─────────────────────────────────────────────────────────────────

@app.post("/api/v1/farms", response_model=FarmOut)
async def create_farm(payload: FarmCreate, session: AsyncSession = Depends(get_session)):
    if payload.crop.lower() not in CROP_COEFFICIENTS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported crop '{payload.crop}'. Available: {', '.join(sorted(CROP_COEFFICIENTS.keys()))}",
        )
    farm = Farm(
        name=payload.name,
        telegram_chat_id=payload.telegram_chat_id,
        lat=payload.lat,
        lon=payload.lon,
        crop=payload.crop.lower(),
        sowing_date=payload.sowing_date,
    )
    session.add(farm)
    await session.commit()
    await session.refresh(farm)
    return farm


@app.get("/api/v1/farms/{farm_id}", response_model=FarmOut)
async def get_farm(farm_id: int, session: AsyncSession = Depends(get_session)):
    farm = await session.get(Farm, farm_id)
    if farm is None:
        raise HTTPException(status_code=404, detail="Farm not found")
    return farm


# ── Irrigation ───────────────────────────────────────────────────────────────

@app.post("/api/v1/irrigation-advisory")
async def irrigation_advisory(req: IrrigationRequest):
    """Stateless advisory — no farm profile required, not persisted."""
    try:
        result = await get_irrigation_recommendation(
            lat=req.lat, lon=req.lon, crop=req.crop,
            days_after_sowing=req.days_after_sowing, target_date=req.date,
        )
    except WeatherServiceError as e:
        raise HTTPException(status_code=502, detail=f"Could not fetch real weather data — refusing to guess. {e}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return result


@app.post("/api/v1/farms/{farm_id}/irrigation-advisory")
async def farm_irrigation_advisory(
    farm_id: int,
    target_date: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
):
    """Computes and persists a real advisory for a saved farm."""
    farm = await session.get(Farm, farm_id)
    if farm is None:
        raise HTTPException(status_code=404, detail="Farm not found")

    das = farm.days_after_sowing(date.fromisoformat(target_date) if target_date else None)

    try:
        result = await get_irrigation_recommendation(
            lat=farm.lat, lon=farm.lon, crop=farm.crop,
            days_after_sowing=das, target_date=target_date,
        )
    except WeatherServiceError as e:
        raise HTTPException(status_code=502, detail=f"Could not fetch real weather data — refusing to guess. {e}")

    log = IrrigationLog(
        farm_id=farm.id,
        advisory_date=result.date,
        t_max_c=result.t_max_c,
        t_min_c=result.t_min_c,
        precipitation_mm=result.precipitation_mm,
        et0_mm_day=result.et0_mm_day,
        kc=result.kc,
        etc_mm_day=result.etc_mm_day,
        effective_rainfall_mm=result.effective_rainfall_mm,
        net_irrigation_mm=result.net_irrigation_mm,
        should_irrigate=result.should_irrigate,
        recommendation_text=result.recommendation_text,
    )
    session.add(log)
    await session.commit()
    return result


@app.get("/api/v1/farms/{farm_id}/irrigation-advisory/vernacular")
async def farm_irrigation_advisory_vernacular(
    farm_id: int,
    language: str,
    target_date: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
):
    """Same real advisory, recommendation translated via Bhashini NMT."""
    farm = await session.get(Farm, farm_id)
    if farm is None:
        raise HTTPException(status_code=404, detail="Farm not found")

    das = farm.days_after_sowing(date.fromisoformat(target_date) if target_date else None)

    try:
        result = await get_irrigation_recommendation(
            lat=farm.lat, lon=farm.lon, crop=farm.crop,
            days_after_sowing=das, target_date=target_date,
        )
    except WeatherServiceError as e:
        raise HTTPException(status_code=502, detail=f"Could not fetch real weather data. {e}")

    try:
        translated_text = await translate_text(result.recommendation_text, "en", language)
    except BhashiniServiceError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Could not translate into '{language}' — refusing to silently fall back to English. {e}",
        )

    return {**result.__dict__, "recommendation_text_translated": translated_text, "language": language}


@app.get("/api/v1/farms/{farm_id}/history", response_model=list[IrrigationLogOut])
async def farm_history(farm_id: int, session: AsyncSession = Depends(get_session)):
    farm = await session.get(Farm, farm_id)
    if farm is None:
        raise HTTPException(status_code=404, detail="Farm not found")
    result = await session.execute(
        select(IrrigationLog)
        .where(IrrigationLog.farm_id == farm_id)
        .order_by(IrrigationLog.created_at.desc())
    )
    return result.scalars().all()


# ── Disease Detection ─────────────────────────────────────────────────────────

@app.post("/api/v1/disease-detection")
async def disease_detection(
    image: UploadFile = File(...),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    farm_id: Optional[int] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    """
    Real MobileNetV2 inference on an uploaded leaf photo.
    Optionally accepts lat/lon/farm_id to log the detection for
    regional outbreak aggregation (outbreak_warning_service.py).
    Returns 503 if no trained checkpoint exists.
    """
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    try:
        contents = await image.read()
        pil_image = Image.open(io.BytesIO(contents))
        pil_image.load()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read uploaded image: {e}")

    try:
        result = predict_disease(pil_image)
    except ModelNotTrainedError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Disease detection model is not trained yet, refusing to guess. {e}",
        )

    # Log the detection for regional outbreak aggregation (if coordinates provided)
    if lat is not None and lon is not None:
        try:
            await log_detection(
                session=session,
                farm_id=farm_id,
                lat=lat,
                lon=lon,
                crop=result.crop,
                condition=result.condition,
                is_healthy=result.is_healthy,
                confidence=result.confidence,
            )
        except Exception:
            # Non-fatal: log failure should not block the response
            pass

    return result


# ── Spoilage Risk ─────────────────────────────────────────────────────────────

@app.get("/api/v1/farms/{farm_id}/spoilage-risk")
async def farm_spoilage_risk(
    farm_id: int,
    harvest_date: str,
    session: AsyncSession = Depends(get_session),
):
    """Q10 temperature model spoilage risk based on real weather forecast."""
    farm = await session.get(Farm, farm_id)
    if farm is None:
        raise HTTPException(status_code=404, detail="Farm not found")

    try:
        harvest = date.fromisoformat(harvest_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="harvest_date must be YYYY-MM-DD")

    days_since_harvest = (date.today() - harvest).days

    try:
        weather = await fetch_daily_weather(farm.lat, farm.lon)
    except WeatherServiceError as e:
        raise HTTPException(status_code=502, detail=f"Could not fetch real weather data. {e}")

    forecast_avg_temp = (weather.t_max_c + weather.t_min_c) / 2

    try:
        result = calculate_spoilage_risk(farm.crop, days_since_harvest, forecast_avg_temp)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return result


# ── Market Advice ─────────────────────────────────────────────────────────────

@app.get("/api/v1/farms/{farm_id}/market-advice")
async def farm_market_advice(
    farm_id: int,
    state: str,
    district: Optional[str] = None,
    market: Optional[str] = None,
    storage_days: int = 3,
    session: AsyncSession = Depends(get_session),
):
    """OLS price trend + sell-vs-store economics using live Agmarknet data."""
    farm = await session.get(Farm, farm_id)
    if farm is None:
        raise HTTPException(status_code=404, detail="Farm not found")

    try:
        result = await get_market_advice(
            state=state, commodity=farm.crop, storage_days=storage_days,
            district=district, market=market,
        )
    except MandiPriceServiceError as e:
        raise HTTPException(status_code=503, detail=f"Could not fetch real mandi price data. {e}")

    return result


@app.get("/api/v1/mandi-prices")
async def mandi_prices(
    state: str,
    commodity: str,
    district: Optional[str] = None,
    market: Optional[str] = None,
    variety: Optional[str] = None,
    grade: Optional[str] = None,
    limit: int = 20,
):
    """Raw daily mandi price records from data.gov.in Agmarknet. Requires DATA_GOV_API_KEY."""
    try:
        records = await fetch_mandi_prices(
            state=state, commodity=commodity, district=district,
            market=market, variety=variety, grade=grade, limit=limit,
        )
    except MandiPriceServiceError as e:
        raise HTTPException(status_code=503, detail=f"Could not fetch real mandi price data — refusing to guess. {e}")

    return {
        "note": "Daily administrative data, not a live feed. Prices are per quintal (100kg).",
        "count": len(records),
        "records": records,
    }


# ── Cold Storage ──────────────────────────────────────────────────────────────

@app.get("/api/v1/cold-storage/nearest")
async def nearest_cold_storage(
    lat: float,
    lon: float,
    limit: int = 5,
    max_distance_km: Optional[float] = None,
    session: AsyncSession = Depends(get_session),
):
    """Real Haversine nearest-facility matching. Returns 404 if no data loaded."""
    try:
        results = await find_nearest(session, lat=lat, lon=lon, limit=limit, max_distance_km=max_distance_km)
    except NoColdStorageDataError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return results


@app.post("/api/v1/cold-storage/book")
async def book_cold_storage(
    payload: BookingRequest,
    session: AsyncSession = Depends(get_session),
):
    """
    Book a cold-storage slot. Checks real capacity against existing
    confirmed bookings. Raises 409 if capacity is exceeded, 404 if
    facility doesn't exist. First-come-first-served for MVP.
    """
    try:
        start = date.fromisoformat(payload.start_date)
        end = date.fromisoformat(payload.end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="start_date and end_date must be YYYY-MM-DD")

    try:
        result = await create_booking(
            session=session,
            facility_id=payload.facility_id,
            farm_id=payload.farm_id,
            quantity_tons=payload.quantity_tons,
            start_date=start,
            end_date=end,
        )
    except FacilityNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except CapacityExceededError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return result


@app.get("/api/v1/cold-storage/{facility_id}/availability")
async def cold_storage_availability(
    facility_id: int,
    start_date: str,
    end_date: str,
    session: AsyncSession = Depends(get_session),
):
    """Returns available capacity (tons) for a facility over a date range."""
    try:
        start = date.fromisoformat(start_date)
        end = date.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="start_date and end_date must be YYYY-MM-DD")

    try:
        available = await check_availability(session, facility_id, start, end, 0.0)
    except FacilityNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return {
        "facility_id": facility_id,
        "start_date": start_date,
        "end_date": end_date,
        "available_capacity_tons": available,
    }


@app.get("/api/v1/farms/{farm_id}/bookings")
async def farm_bookings(farm_id: int, session: AsyncSession = Depends(get_session)):
    """Returns all cold storage bookings for a farm."""
    farm = await session.get(Farm, farm_id)
    if farm is None:
        raise HTTPException(status_code=404, detail="Farm not found")
    bookings = await get_farm_bookings(session, farm_id)
    return bookings


# ── Satellite / Field Digital Twin ───────────────────────────────────────────

@app.get("/api/v1/field-indices")
async def field_indices(lat: float, lon: float, target_date: Optional[str] = None):
    """
    Layer 1 — Field Digital Twin: soil moisture profile and vegetation
    stress proxy from Open-Meteo ERA5-Land reanalysis. Cached for 3 days.
    """
    try:
        result = await get_field_indices(lat, lon, target_date)
    except SatelliteServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))
    return result


@app.get("/api/v1/farms/{farm_id}/field-indices")
async def farm_field_indices(farm_id: int, session: AsyncSession = Depends(get_session)):
    """Field indices for a saved farm (uses stored coordinates)."""
    farm = await session.get(Farm, farm_id)
    if farm is None:
        raise HTTPException(status_code=404, detail="Farm not found")
    try:
        result = await get_field_indices(farm.lat, farm.lon)
    except SatelliteServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))
    return result


# ── Climate Risk (Layer 7) ────────────────────────────────────────────────────

@app.get("/api/v1/climate-risk")
async def climate_risk(
    lat: float,
    lon: float,
    crop: Optional[str] = None,
):
    """
    Layer 7 — Climate Risk: 16-day drought index, heat stress GDD,
    and PMFBY insurance nudge from Open-Meteo extended forecast.
    """
    try:
        result = await get_climate_risk(lat, lon, crop)
    except ClimateRiskServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))
    return result


@app.get("/api/v1/farms/{farm_id}/climate-risk")
async def farm_climate_risk(farm_id: int, session: AsyncSession = Depends(get_session)):
    """Climate risk for a saved farm."""
    farm = await session.get(Farm, farm_id)
    if farm is None:
        raise HTTPException(status_code=404, detail="Farm not found")
    try:
        result = await get_climate_risk(farm.lat, farm.lon, farm.crop)
    except ClimateRiskServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))
    return result


# ── Outbreak Warnings (Layer 3 proactive) ────────────────────────────────────

@app.get("/api/v1/outbreak-warnings")
async def outbreak_warnings(
    lat: float,
    lon: float,
    session: AsyncSession = Depends(get_session),
):
    """
    Regional disease outbreak warnings within 50km of the given point,
    based on aggregated disease detection logs from the past 7 days.
    Returns empty list if no cases meet the threshold.
    """
    warnings = await get_outbreak_warnings(session, lat, lon)
    return warnings


@app.post("/api/v1/agrivoltaics-estimate")
async def agrivoltaics_estimate(payload: AgrivoltaicsRequest):
    """Layer 8 — real cited state-tariff arithmetic for solar hosting income."""
    try:
        result = calculate_agrivoltaics_income(payload.state, payload.land_acres)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return result


# ── WhatsApp Business Cloud API ───────────────────────────────────────────────
from app.services.whatsapp_service import verify_token, handle_whatsapp_webhook
from fastapi import Request, Response
from app.services.impact_service import compute_platform_impact, compute_farm_impact


@app.get("/api/v1/webhook/whatsapp")
async def whatsapp_verify(
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge"),
):
    """Meta WhatsApp Webhook verification handshake."""
    challenge = verify_token(hub_mode, hub_verify_token, hub_challenge)
    if challenge:
        return Response(content=challenge, media_type="text/plain")
    raise HTTPException(status_code=403, detail="Verification token mismatch")


@app.post("/api/v1/webhook/whatsapp")
async def whatsapp_inbound(
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    """Receives inbound messages and location pins from farmers on WhatsApp."""
    payload = await request.json()
    await handle_whatsapp_webhook(payload, session)
    return {"status": "received"}


# ── FPO Impact Metrics (Point D) ─────────────────────────────────────────────

@app.get("/api/v1/impact/summary")
async def platform_impact_summary(session: AsyncSession = Depends(get_session)):
    """
    Returns aggregate platform/FPO impact metrics:
    water saved (Liters), diesel saved (Liters/INR), CO2 abated, cold chain volume.
    """
    summary = await compute_platform_impact(session)
    return summary


@app.get("/api/v1/farms/{farm_id}/impact")
async def farm_impact(farm_id: int, session: AsyncSession = Depends(get_session)):
    """Returns farm-specific water and diesel savings vs traditional flood irrigation."""
    try:
        return await compute_farm_impact(session, farm_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))