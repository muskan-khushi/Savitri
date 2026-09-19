"""
irrigation_service.py

Ties together:
  1. live weather (weather_service.py)
  2. FAO-56 Penman-Monteith ET0 (evapotranspiration.py)
  3. published crop coefficients (crop_coefficients.py)

into a single actionable irrigation recommendation:
  "irrigate today, apply X mm" / "no irrigation needed, rain covered it" / etc.

Core water-balance logic (FAO-56 section 8, simplified single-day form):

    ETc = ET0 * Kc                      (crop water demand, mm/day)
    effective_rainfall = precipitation minus runoff/losses
    net_irrigation_requirement = max(ETc - effective_rainfall, 0)

We use the widely-cited USDA Soil Conservation Service effective
rainfall approximation for the "effective fraction" of a rain event
rather than assuming 100% of rainfall is usable — another spot where
zero-mock-logic means using a real published method instead of a
convenient guess.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import date

from app.services.weather_service import fetch_daily_weather, WeatherServiceError
from app.services.evapotranspiration import calculate_et0
from app.services.crop_coefficients import get_kc_for_stage


def _effective_rainfall_usda_scs(precip_mm: float) -> float:
    """
    USDA Soil Conservation Service formula for effective rainfall from a
    daily/monthly total, commonly used in FAO irrigation scheduling
    guidance when sub-daily rainfall distribution data isn't available:

        if P <= 250mm/month equivalent: Pe = P * (125 - 0.2*P) / 125
        else: Pe = 125 + 0.1*P

    Applied here at daily resolution as a conservative approximation —
    documented as such rather than presented as an exact monthly method.
    """
    if precip_mm <= 0:
        return 0.0
    if precip_mm <= 62.5:  # scaled threshold for daily use (250mm/4 weeks approx)
        pe = precip_mm * (125 - 0.2 * precip_mm) / 125
    else:
        pe = 31.25 + 0.1 * precip_mm
    return max(pe, 0.0)


@dataclass
class IrrigationRecommendation:
    farm_lat: float
    farm_lon: float
    date: str
    crop: str
    growth_stage: str
    days_after_sowing: int

    # weather inputs (for transparency / audit trail)
    t_max_c: float
    t_min_c: float
    precipitation_mm: float
    wind_2m_ms: float

    # calculation outputs
    et0_mm_day: float
    kc: float
    etc_mm_day: float
    effective_rainfall_mm: float
    net_irrigation_mm: float

    # the actual farmer-facing answer
    should_irrigate: bool
    recommendation_text: str


async def get_irrigation_recommendation(
    lat: float,
    lon: float,
    crop: str,
    days_after_sowing: int,
    target_date: str | None = None,
) -> IrrigationRecommendation:
    """
    Full pipeline: fetch real weather -> compute real ET0 -> apply real
    crop coefficient -> real water balance -> recommendation.

    Raises WeatherServiceError if Open-Meteo is unreachable or returns
    no data — deliberately NOT caught and papered over with a fallback
    guess, per zero-mock-logic: if we don't have real data, we say so.
    """
    if target_date is None:
        target_date = date.today().isoformat()

    weather = await fetch_daily_weather(lat, lon, target_date)

    day_of_year = date.fromisoformat(weather.date).timetuple().tm_yday

    et0_result = calculate_et0(
        t_max_c=weather.t_max_c,
        t_min_c=weather.t_min_c,
        rh_max_pct=weather.rh_max_pct,
        rh_min_pct=weather.rh_min_pct,
        wind_2m_ms=weather.wind_2m_ms,
        solar_rad_mj_m2=weather.solar_rad_mj_m2,
        elevation_m=weather.elevation_m,
        lat_deg=lat,
        day_of_year=day_of_year,
    )

    kc, stage_name = get_kc_for_stage(crop, days_after_sowing)
    etc = round(et0_result.et0_mm_day * kc, 3)

    effective_rain = round(_effective_rainfall_usda_scs(weather.precip_mm), 3)
    net_irrigation = round(max(etc - effective_rain, 0.0), 3)

    should_irrigate = net_irrigation >= 3.0  # mm/day threshold — see README for rationale

    if net_irrigation <= 0:
        text = (
            f"No irrigation needed today. Rain ({weather.precip_mm:.1f}mm) covers "
            f"the crop's water demand ({etc:.1f}mm)."
        )
    elif should_irrigate:
        text = (
            f"Irrigate today: apply approximately {net_irrigation:.1f}mm of water. "
            f"Crop demand is {etc:.1f}mm; rainfall only covered {effective_rain:.1f}mm."
        )
    else:
        text = (
            f"Irrigation not urgent yet — shortfall is only {net_irrigation:.1f}mm. "
            f"Check again tomorrow."
        )

    return IrrigationRecommendation(
        farm_lat=lat,
        farm_lon=lon,
        date=weather.date,
        crop=crop.lower(),
        growth_stage=stage_name,
        days_after_sowing=days_after_sowing,
        t_max_c=weather.t_max_c,
        t_min_c=weather.t_min_c,
        precipitation_mm=weather.precip_mm,
        wind_2m_ms=round(weather.wind_2m_ms, 3),
        et0_mm_day=et0_result.et0_mm_day,
        kc=kc,
        etc_mm_day=etc,
        effective_rainfall_mm=effective_rain,
        net_irrigation_mm=net_irrigation,
        should_irrigate=should_irrigate,
        recommendation_text=text,
    )
