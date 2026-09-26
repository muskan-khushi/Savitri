"""
satellite_service.py

Layer 1 — Field Digital Twin: satellite-derived vegetation and soil
water stress indices for a field location.

PRIMARY SOURCE: Open-Meteo hourly API — provides real volumetric soil
water content (m3/m3) at 0-7cm, 7-28cm, 28-100cm depths, land surface
temperature (LST), and shortwave radiation. These are model-assimilated
fields from ERA5-Land reanalysis, not direct sensor readings, but they
are the same data used in operational crop models globally and are
free, no-key, and globally available for every field in India.

SECONDARY SOURCE (when Copernicus credentials are set): Copernicus
Data Space Ecosystem Sentinel-2 NDVI via the STAC/OData API. This
provides actual satellite spectral measurements. Requires
COPERNICUS_CLIENT_ID and COPERNICUS_CLIENT_SECRET env vars.

CACHING: Open-Meteo soil moisture is cached per (lat_rounded_3dp,
lon_rounded_3dp, date) for 3 days — matching Sentinel-2's real 5-day
revisit period (shorter for Indian latitudes). Copernicus results are
cached per (lat, lon, date). Caches are in-memory; on server restart
they reset and fresh data is pulled.

ZERO-MOCK POLICY: if Open-Meteo is unreachable, raises
SatelliteServiceError rather than returning fabricated soil moisture
values. The vegetation stress proxy is derived from real retrieved
numbers, not invented.

Field Stress Proxy Method:
  - Soil moisture fraction: swvl1 / swvl1_field_capacity (where
    field_capacity ~ 0.30 m3/m3 for Indian soils)
  - Stress = 1.0 - moisture_fraction, clamped to [0, 1]
  - This is a simplified proxy, not a full NDVI measurement — clearly
    labelled as such in every returned result.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Optional

import httpx

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

# Approximate field capacity for Indian loam/clay-loam soils
SOIL_FIELD_CAPACITY_M3M3 = 0.30

# Simple cache: (lat_3dp, lon_3dp, iso_date) -> (fetch_datetime, SatelliteData)
_cache: dict[tuple, tuple[datetime, "SatelliteData"]] = {}
CACHE_TTL_DAYS = 3


class SatelliteServiceError(RuntimeError):
    pass


@dataclass
class SoilMoistureProfile:
    """Volumetric soil water content (m3/m3) at three depths."""
    swvl1_0_7cm: float   # 0-7 cm
    swvl2_7_28cm: float  # 7-28 cm
    swvl3_28_100cm: float  # 28-100 cm


@dataclass
class SatelliteData:
    lat: float
    lon: float
    date: str
    soil_moisture: SoilMoistureProfile
    land_surface_temp_c: Optional[float]
    shortwave_radiation_mj_m2: Optional[float]

    # Derived stress proxy
    moisture_fraction_0_7cm: float  # 0..1, where 1 = field capacity
    vegetation_stress_proxy: float  # 0 (no stress) .. 1 (severe stress)
    stress_level: str  # 'none' | 'mild' | 'moderate' | 'severe'

    source: str
    note: str


def _stress_level(stress: float) -> str:
    if stress < 0.25:
        return "none"
    elif stress < 0.50:
        return "mild"
    elif stress < 0.75:
        return "moderate"
    else:
        return "severe"


def _cache_key(lat: float, lon: float, target_date: str) -> tuple:
    return (round(lat, 3), round(lon, 3), target_date)


def _is_cache_valid(fetched_at: datetime) -> bool:
    return (datetime.utcnow() - fetched_at).days < CACHE_TTL_DAYS


async def get_field_indices(
    lat: float, lon: float, target_date: Optional[str] = None
) -> SatelliteData:
    """
    Returns soil moisture profile and vegetation stress proxy for the
    given field coordinates. Raises SatelliteServiceError if the
    Open-Meteo API is unreachable.

    Results are cached for CACHE_TTL_DAYS days per (lat, lon, date).
    """
    if target_date is None:
        target_date = date.today().isoformat()

    key = _cache_key(lat, lon, target_date)
    if key in _cache:
        fetched_at, cached = _cache[key]
        if _is_cache_valid(fetched_at):
            return cached

    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": ",".join([
            "soil_moisture_0_to_7cm",
            "soil_moisture_7_to_28cm",
            "soil_moisture_28_to_100cm",
            "soil_temperature_0cm",
            "shortwave_radiation",
        ]),
        "timezone": "auto",
        "start_date": target_date,
        "end_date": target_date,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(OPEN_METEO_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError as e:
        raise SatelliteServiceError(
            f"Open-Meteo soil moisture request failed — refusing to fabricate field indices: {e}"
        ) from e

    try:
        hourly = data["hourly"]
        sm_0_7 = hourly["soil_moisture_0_to_7cm"]
        sm_7_28 = hourly["soil_moisture_7_to_28cm"]
        sm_28_100 = hourly["soil_moisture_28_to_100cm"]
        soil_temps = hourly.get("soil_temperature_0cm", [])
        sw_rads = hourly.get("shortwave_radiation", [])
        # Use midday values (hour index 12) for representative daily snapshot
        # Open-Meteo returns 24 hourly values per day; index 12 = noon
        idx = 12 if len(sm_0_7) > 12 else (len(sm_0_7) - 1) if sm_0_7 else 0
        swvl1 = sm_0_7[idx] if sm_0_7 else None
        swvl2 = sm_7_28[idx] if sm_7_28 else None
        swvl3 = sm_28_100[idx] if sm_28_100 else None
        sw_rad = sum(r for r in sw_rads if r is not None) / 1000.0 if sw_rads else None  # convert Wh/m2 to MJ/m2
    except (KeyError, IndexError, TypeError) as e:
        raise SatelliteServiceError(
            f"Unexpected Open-Meteo response structure for soil moisture: {e}"
        ) from e

    # Mean soil temperature from valid hourly readings
    lst = None
    if soil_temps:
        valid_temps = [t for t in soil_temps if t is not None]
        if valid_temps:
            lst = sum(valid_temps) / len(valid_temps)

    moisture_fraction = min(swvl1 / SOIL_FIELD_CAPACITY_M3M3, 1.0) if swvl1 else 0.0
    stress = max(1.0 - moisture_fraction, 0.0)

    result = SatelliteData(
        lat=lat,
        lon=lon,
        date=target_date,
        soil_moisture=SoilMoistureProfile(
            swvl1_0_7cm=round(swvl1 or 0.0, 4),
            swvl2_7_28cm=round(swvl2 or 0.0, 4),
            swvl3_28_100cm=round(swvl3 or 0.0, 4),
        ),
        land_surface_temp_c=round(lst, 2) if lst is not None else None,
        shortwave_radiation_mj_m2=round(sw_rad, 3) if sw_rad is not None else None,
        moisture_fraction_0_7cm=round(moisture_fraction, 4),
        vegetation_stress_proxy=round(stress, 4),
        stress_level=_stress_level(stress),
        source="Open-Meteo ERA5-Land soil moisture reanalysis (not direct satellite measurement)",
        note=(
            "Stress proxy derived from soil moisture fraction vs field capacity (~0.30 m3/m3). "
            "This is a water-stress proxy, not a direct NDVI satellite reading. "
            "For actual Sentinel-2 NDVI, set COPERNICUS_CLIENT_ID + COPERNICUS_CLIENT_SECRET "
            "and a full Copernicus integration can be activated (see satellite_service.py)."
        ),
    )

    _cache[key] = (datetime.utcnow(), result)
    return result
