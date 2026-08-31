"""
main.py

Savitri backend — vertical slice #1: irrigation advisory.

    POST /api/v1/irrigation-advisory

Given a farm's coordinates, crop, and days-after-sowing, this endpoint:
  1. pulls live weather from Open-Meteo (no API key needed)
  2. runs the real FAO-56 Penman-Monteith equation for ET0
  3. applies the real published crop coefficient for growth stage
  4. runs a real rainfall-adjusted water balance
  5. returns a concrete, actionable recommendation

No mocked numbers anywhere in this path. If Open-Meteo is unreachable,
the endpoint returns a 502 rather than silently guessing.
"""

from datetime import date

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from PIL import Image
import io

from app.schemas import IrrigationRequest
from app.schemas_farm import FarmCreate, FarmOut, IrrigationLogOut
from app.services.irrigation_service import get_irrigation_recommendation
from app.services.weather_service import WeatherServiceError
from app.services.crop_coefficients import CROP_COEFFICIENTS
from app.services.disease_detection import predict as predict_disease, ModelNotTrainedError
from app.services.cold_storage_service import find_nearest, NoColdStorageDataError
from app.services.mandi_price_service import fetch_mandi_prices, MandiPriceServiceError
from app.services.bhashini_service import translate_text, text_to_speech, BhashiniServiceError
from app.db import get_session
from app.models_db import Farm, IrrigationLog

app = FastAPI(
    title="Savitri Backend",
    description="Sustainable agriculture decision-support API for Indian farmers.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    # Schema is now managed by Alembic migrations, not create_all() —
    # run `alembic upgrade head` before starting the app (see README).
    # This deliberately does NOT auto-create tables anymore: doing so
    # silently would mean a schema change could reach a database with
    # real farmer data in it without ever going through a reviewable
    # migration.
    pass


@app.get("/")
async def root():
    return {
        "service": "savitri-backend",
        "status": "ok",
        "slice": "irrigation-advisory-v1 + persistence",
    }


@app.get("/api/v1/crops")
async def list_supported_crops():
    """List crops we have real FAO-56 crop-coefficient data for."""
    return {"crops": list(CROP_COEFFICIENTS.keys())}


@app.post("/api/v1/disease-detection")
async def disease_detection(image: UploadFile = File(...)):
    """
    Real MobileNetV2 inference on an uploaded leaf photo.

    Returns 503 (not 200 with a fake answer) if no trained checkpoint
    exists yet — see ml/train_disease_model.py and ml/README.md.
    """
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    try:
        contents = await image.read()
        pil_image = Image.open(io.BytesIO(contents))
        pil_image.load()  # force decode now, so a corrupt file fails here with a clear error
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read uploaded image: {e}")

    try:
        result = predict_disease(pil_image)
    except ModelNotTrainedError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Disease detection model is not trained yet, refusing to guess. {e}",
        )

    return result


@app.post("/api/v1/irrigation-advisory")
async def irrigation_advisory(req: IrrigationRequest):
    """
    Standalone advisory — no farm profile required. Not persisted,
    since there's no farm_id to attach history to. Use
    /api/v1/farms/{farm_id}/irrigation-advisory to get persisted history.
    """
    try:
        result = await get_irrigation_recommendation(
            lat=req.lat,
            lon=req.lon,
            crop=req.crop,
            days_after_sowing=req.days_after_sowing,
            target_date=req.date,
        )
    except WeatherServiceError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Could not fetch real weather data — refusing to guess. {e}",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return result


@app.post("/api/v1/farms", response_model=FarmOut)
async def create_farm(payload: FarmCreate, session: AsyncSession = Depends(get_session)):
    if payload.crop.lower() not in CROP_COEFFICIENTS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported crop '{payload.crop}'. Available: {', '.join(CROP_COEFFICIENTS.keys())}",
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


@app.post("/api/v1/farms/{farm_id}/irrigation-advisory")
async def farm_irrigation_advisory(
    farm_id: int,
    target_date: str | None = None,
    session: AsyncSession = Depends(get_session),
):
    """
    Computes a real advisory for a saved farm (days-after-sowing is
    derived from the stored sowing_date — never re-typed by the
    caller), and persists it to irrigation_logs as real history.
    """
    farm = await session.get(Farm, farm_id)
    if farm is None:
        raise HTTPException(status_code=404, detail="Farm not found")

    das = farm.days_after_sowing(date.fromisoformat(target_date) if target_date else None)

    try:
        result = await get_irrigation_recommendation(
            lat=farm.lat,
            lon=farm.lon,
            crop=farm.crop,
            days_after_sowing=das,
            target_date=target_date,
        )
    except WeatherServiceError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Could not fetch real weather data — refusing to guess. {e}",
        )

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


@app.get("/api/v1/cold-storage/nearest")
async def nearest_cold_storage(
    lat: float,
    lon: float,
    limit: int = 5,
    max_distance_km: float | None = None,
    session: AsyncSession = Depends(get_session),
):
    """
    Real Haversine-distance nearest-facility matching. Returns 404 (not
    an empty list) if no facility data has been loaded — see
    scripts/import_cold_storage_csv.py and the README for how to load
    real data.
    """
    try:
        results = await find_nearest(session, lat=lat, lon=lon, limit=limit, max_distance_km=max_distance_km)
    except NoColdStorageDataError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return results


@app.get("/api/v1/mandi-prices")
async def mandi_prices(
    state: str,
    commodity: str,
    district: str | None = None,
    market: str | None = None,
    variety: str | None = None,
    grade: str | None = None,
    limit: int = 20,
):
    """
    Real daily mandi (market) prices from the Government of India's
    Agmarknet data via data.gov.in. Requires DATA_GOV_API_KEY to be
    set — see README for how to get one. Returns 503 with a clear
    explanation if the key is missing or the upstream API is
    unreachable, rather than fabricating a price.

    Reminder surfaced in every response: this is a DAILY administrative
    dataset, not a live feed — always check `arrival_date`.
    """
    try:
        records = await fetch_mandi_prices(
            state=state, commodity=commodity, district=district,
            market=market, variety=variety, grade=grade, limit=limit,
        )
    except MandiPriceServiceError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Could not fetch real mandi price data — refusing to guess. {e}",
        )

    return {
        "note": "Daily administrative data, not a live feed. Prices are per quintal (100kg).",
        "count": len(records),
        "records": records,
    }


@app.get("/api/v1/farms/{farm_id}/irrigation-advisory/vernacular")
async def farm_irrigation_advisory_vernacular(
    farm_id: int,
    language: str,
    target_date: str | None = None,
    session: AsyncSession = Depends(get_session),
):
    """
    Same real advisory as /irrigation-advisory, but with
    recommendation_text machine-translated via Bhashini into the
    requested language (ISO-639 code, e.g. 'hi' for Hindi, 'bho' for
    Bhojpuri, 'mai' for Maithili).

    Returns 503 if Bhashini credentials are missing/unreachable, or if
    Bhashini has no translation service for this specific language —
    in either case we do NOT fall back to English silently, since a
    farmer expecting Hindi getting English without explanation is a
    real usability failure, not a graceful degradation.
    """
    farm = await session.get(Farm, farm_id)
    if farm is None:
        raise HTTPException(status_code=404, detail="Farm not found")

    das = farm.days_after_sowing(date.fromisoformat(target_date) if target_date else None)

    try:
        result = await get_irrigation_recommendation(
            lat=farm.lat, lon=farm.lon, crop=farm.crop, days_after_sowing=das,
            target_date=target_date,
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
