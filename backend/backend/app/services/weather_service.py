"""
weather_service.py

Thin client around the Open-Meteo API (https://open-meteo.com).
No API key required. We pull exactly the raw variables the FAO-56
Penman-Monteith equation needs — we do NOT use Open-Meteo's own
pre-computed `et0_fao_evapotranspiration` field, because Savitri's
zero-mock-logic policy means we own the calculation, not borrow
someone else's black box.

Variables fetched (all real, live, daily):
  - temperature_2m_max / temperature_2m_min   (°C)
  - relative_humidity_2m_max / _min           (%)
  - wind_speed_10m_max                        (km/h -> converted to m/s @ 2m)
  - shortwave_radiation_sum                   (MJ/m^2/day)
  - precipitation_sum                         (mm/day)
  - elevation (from API metadata, meters)
"""

from __future__ import annotations

import httpx
from dataclasses import dataclass
from datetime import date


OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


def _wind_height_correction(u_z: float, z: float = 10.0) -> float:
    """
    FAO-56 Equation 47: convert wind speed measured at height z (meters)
    to the standard 2m height used in the Penman-Monteith equation.

        u2 = u_z * 4.87 / ln(67.8*z - 5.42)

    Args:
        u_z: wind speed at height z, in m/s
        z: measurement height in meters (Open-Meteo reports at 10m)

    Returns:
        wind speed at 2m, in m/s
    """
    import math
    return u_z * 4.87 / math.log(67.8 * z - 5.42)


@dataclass
class DailyWeather:
    date: str
    lat: float
    lon: float
    elevation_m: float
    t_max_c: float
    t_min_c: float
    rh_max_pct: float
    rh_min_pct: float
    wind_2m_ms: float
    solar_rad_mj_m2: float
    precip_mm: float


class WeatherServiceError(RuntimeError):
    pass


async def fetch_daily_weather(lat: float, lon: float, target_date: str | None = None) -> DailyWeather:
    """
    Fetch one day of weather for the given coordinates from Open-Meteo.

    Args:
        lat, lon: farm location
        target_date: ISO date string (YYYY-MM-DD). Defaults to today.
                     Open-Meteo's forecast endpoint serves a window of
                     recent past + forecast days without needing an API key.

    Raises:
        WeatherServiceError if the API call fails or returns no data.
    """
    if target_date is None:
        target_date = date.today().isoformat()

    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": ",".join([
            "temperature_2m_max",
            "temperature_2m_min",
            "relative_humidity_2m_max",
            "relative_humidity_2m_min",
            "wind_speed_10m_max",
            "shortwave_radiation_sum",
            "precipitation_sum",
        ]),
        "wind_speed_unit": "ms",
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
        raise WeatherServiceError(f"Open-Meteo request failed: {e}") from e

    try:
        daily = data["daily"]
        elevation = data["elevation"]
        wind_10m = daily["wind_speed_10m_max"][0]
        weather = DailyWeather(
            date=daily["time"][0],
            lat=lat,
            lon=lon,
            elevation_m=elevation,
            t_max_c=daily["temperature_2m_max"][0],
            t_min_c=daily["temperature_2m_min"][0],
            rh_max_pct=daily["relative_humidity_2m_max"][0],
            rh_min_pct=daily["relative_humidity_2m_min"][0],
            wind_2m_ms=_wind_height_correction(wind_10m, z=10.0),
            solar_rad_mj_m2=daily["shortwave_radiation_sum"][0],
            precip_mm=daily["precipitation_sum"][0],
        )
    except (KeyError, IndexError, TypeError) as e:
        raise WeatherServiceError(
            f"Unexpected Open-Meteo response shape, or no data for {target_date}: {e}"
        ) from e

    return weather
