"""
climate_risk_service.py

Layer 7 — Climate Resilience & Insurance Nudges.

Uses Open-Meteo's 16-day extended forecast to compute:

1. DROUGHT RISK: Standardised Precipitation Index proxy (SPI-like).
   Method: compare the 16-day forecast cumulative rainfall against
   the historical median for that period and location (approximated
   from Open-Meteo's ERA5 historical data where available, or
   against the climatological 30-day expected value from the
   Penman-Monteith ET0 as a reference demand baseline).

   Simplified for MVP: drought_index = max(0, 1 - (forecast_rain /
   crop_water_demand_16day)), where crop_water_demand is derived
   from the same FAO-56 ET0 used in the irrigation service. This is
   a water-deficit fraction, not a true SPI — labelled clearly.

2. HEAT STRESS: Accumulated heat units above crop-specific thresholds.
   Method: Growing Degree Days (GDD) above a crop-specific
   optimum temperature (e.g. 32°C for rice, 35°C for wheat).
   GDD_stress = Σ max(T_max - T_threshold, 0) over forecast period.
   Source: CIMMYT/ICAR published temperature thresholds for
   heat-stressed crop development.

3. PMFBY NUDGE: If drought_index > 0.5 OR heat_stress_gdd > threshold,
   returns a flag recommending the farmer enroll in PMFBY
   (Pradhan Mantri Fasal Bima Yojana) crop insurance for the season.

ZERO-MOCK POLICY: raises ClimateRiskServiceError if Open-Meteo is
unreachable. All computed indices are derived from the real forecast
data returned, with every assumption labelled explicitly.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from typing import Optional

import httpx

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
FORECAST_DAYS = 16

# Crop-specific heat stress temperature thresholds (°C) above which
# accumulation contributes to heat stress. Source: CIMMYT/ICAR
# published critical temperature guidelines for South Asian crops.
HEAT_STRESS_THRESHOLDS: dict[str, float] = {
    "rice": 35.0,
    "wheat": 30.0,   # wheat is particularly sensitive to heat at anthesis
    "maize": 35.0,
    "sugarcane": 38.0,
    "potato": 30.0,
    "cotton": 38.0,
    "chickpea": 33.0,
    "mustard": 30.0,
    "tomato": 35.0,
    "onion": 33.0,
    "banana": 38.0,
    "soybean": 35.0,
    "groundnut": 35.0,
    "turmeric": 35.0,
    "ginger": 33.0,
    "eggplant": 38.0,
    "okra": 40.0,
    "lentil": 30.0,
    "mango": 40.0,
    "cucumber": 35.0,
}

DEFAULT_HEAT_THRESHOLD = 35.0

# PMFBY nudge triggers
PMFBY_DROUGHT_INDEX_TRIGGER = 0.50
PMFBY_HEAT_GDD_TRIGGER = 50.0  # accumulated degree-days above threshold over 16 days


class ClimateRiskServiceError(RuntimeError):
    pass


@dataclass
class ClimateForecast:
    dates: list[str]
    t_max_c: list[float]
    t_min_c: list[float]
    precip_mm: list[float]
    et0_fao: list[float]  # Open-Meteo's own ET0 field (used as demand reference)


@dataclass
class ClimateRiskResult:
    lat: float
    lon: float
    crop: Optional[str]
    forecast_days: int
    total_forecast_precip_mm: float
    total_forecast_et0_mm: float
    drought_index: float          # 0 = no drought risk, 1 = severe deficit
    drought_risk_level: str       # 'none' | 'low' | 'moderate' | 'high'
    heat_stress_gdd: float        # accumulated GDD above crop threshold
    heat_stress_level: str        # 'none' | 'low' | 'moderate' | 'high'
    pmfby_nudge: bool             # True if PMFBY enrollment is recommended
    pmfby_reason: Optional[str]
    heat_threshold_used_c: float
    recommendation_text: str
    note: str


def _drought_level(index: float) -> str:
    if index < 0.2:
        return "none"
    elif index < 0.4:
        return "low"
    elif index < 0.6:
        return "moderate"
    else:
        return "high"


def _heat_level(gdd: float, threshold: float) -> str:
    # Relative to 16-day threshold
    if gdd < PMFBY_HEAT_GDD_TRIGGER * 0.4:
        return "none"
    elif gdd < PMFBY_HEAT_GDD_TRIGGER * 0.8:
        return "low"
    elif gdd < PMFBY_HEAT_GDD_TRIGGER:
        return "moderate"
    else:
        return "high"


async def get_climate_risk(
    lat: float, lon: float, crop: Optional[str] = None
) -> ClimateRiskResult:
    """
    Fetches the 16-day forecast from Open-Meteo and computes drought
    and heat stress indices. Raises ClimateRiskServiceError if the
    upstream API call fails.
    """
    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": ",".join([
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_sum",
            "et0_fao_evapotranspiration",
        ]),
        "timezone": "auto",
        "forecast_days": FORECAST_DAYS,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(OPEN_METEO_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError as e:
        raise ClimateRiskServiceError(
            f"Open-Meteo 16-day forecast request failed — refusing to fabricate climate risk: {e}"
        ) from e

    try:
        daily = data["daily"]
        dates = daily["time"]
        t_max = daily["temperature_2m_max"]
        t_min = daily["temperature_2m_min"]
        precip = daily["precipitation_sum"]
        et0 = daily["et0_fao_evapotranspiration"]
    except (KeyError, TypeError) as e:
        raise ClimateRiskServiceError(f"Unexpected Open-Meteo response structure: {e}") from e

    # Replace any None values with 0.0 (missing days in forecast)
    t_max = [v if v is not None else 0.0 for v in t_max]
    t_min = [v if v is not None else 0.0 for v in t_min]
    precip = [v if v is not None else 0.0 for v in precip]
    et0 = [v if v is not None else 0.0 for v in et0]

    total_precip = sum(precip)
    total_et0 = sum(et0)

    # Drought index: water deficit fraction
    # 0 = surplus (rain >= ET0), 1 = complete deficit (no rain vs full demand)
    if total_et0 > 0:
        drought_index = max(0.0, min(1.0, 1.0 - (total_precip / total_et0)))
    else:
        drought_index = 0.0

    # Heat stress: accumulated GDD above threshold
    heat_threshold = HEAT_STRESS_THRESHOLDS.get(
        crop.strip().lower() if crop else "",
        DEFAULT_HEAT_THRESHOLD
    )
    heat_gdd = sum(max(t - heat_threshold, 0.0) for t in t_max)

    drought_lvl = _drought_level(drought_index)
    heat_lvl = _heat_level(heat_gdd, heat_threshold)

    pmfby_nudge = drought_index >= PMFBY_DROUGHT_INDEX_TRIGGER or heat_gdd >= PMFBY_HEAT_GDD_TRIGGER
    pmfby_reason: Optional[str] = None
    if pmfby_nudge:
        reasons = []
        if drought_index >= PMFBY_DROUGHT_INDEX_TRIGGER:
            reasons.append(f"drought risk index {drought_index:.2f} (≥{PMFBY_DROUGHT_INDEX_TRIGGER} threshold)")
        if heat_gdd >= PMFBY_HEAT_GDD_TRIGGER:
            reasons.append(f"heat stress {heat_gdd:.1f} GDD (≥{PMFBY_HEAT_GDD_TRIGGER} threshold)")
        pmfby_reason = "; ".join(reasons)

    if drought_lvl == "none" and heat_lvl == "none":
        text = (
            f"No significant climate stress expected in the next {FORECAST_DAYS} days. "
            f"Forecast rainfall ({total_precip:.1f}mm) is adequate relative to crop demand ({total_et0:.1f}mm ET₀)."
        )
    else:
        parts = []
        if drought_lvl != "none":
            parts.append(f"{drought_lvl} drought risk (water deficit index: {drought_index:.2f})")
        if heat_lvl != "none":
            parts.append(f"{heat_lvl} heat stress ({heat_gdd:.1f} GDD above {heat_threshold}°C threshold)")
        text = f"Climate alert for the next {FORECAST_DAYS} days: " + "; ".join(parts) + "."
        if pmfby_nudge:
            text += " Consider enrolling in PMFBY crop insurance for this season."

    return ClimateRiskResult(
        lat=lat,
        lon=lon,
        crop=crop,
        forecast_days=FORECAST_DAYS,
        total_forecast_precip_mm=round(total_precip, 2),
        total_forecast_et0_mm=round(total_et0, 2),
        drought_index=round(drought_index, 4),
        drought_risk_level=drought_lvl,
        heat_stress_gdd=round(heat_gdd, 2),
        heat_stress_level=heat_lvl,
        pmfby_nudge=pmfby_nudge,
        pmfby_reason=pmfby_reason,
        heat_threshold_used_c=heat_threshold,
        recommendation_text=text,
        note=(
            f"Drought index = 1 - (forecast_rain / forecast_ET0) over {FORECAST_DAYS} days. "
            "This is a water-deficit fraction proxy, not a true SPI (which requires multi-year "
            "historical baselines). Heat stress = accumulated daily GDD above crop-specific "
            f"threshold ({heat_threshold}°C for this crop). Sources: FAO-56 ET0, CIMMYT/ICAR "
            "heat tolerance thresholds for South Asian crops."
        ),
    )
