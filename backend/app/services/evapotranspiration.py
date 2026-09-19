"""
evapotranspiration.py

Full implementation of the FAO-56 Penman-Monteith equation for daily
reference evapotranspiration (ET0), per:

  Allen, R.G., Pereira, L.S., Raes, D., Smith, M. (1998).
  "Crop evapotranspiration - Guidelines for computing crop water
  requirements." FAO Irrigation and Drainage Paper 56.

Every intermediate quantity (saturation vapor pressure, psychrometric
constant, net radiation, extraterrestrial radiation, etc.) is computed
from the governing equations in that paper — nothing here is looked up
from a table or approximated. This is Savitri's zero-mock-logic policy
applied to the single most important number in the irrigation pipeline.

Equation numbers referenced in comments correspond to FAO-56 chapter 3/4.
"""

from __future__ import annotations

import math
from dataclasses import dataclass


GSC = 0.0820          # solar constant, MJ / m^2 / min (FAO-56 Eq. 28)
SIGMA = 4.903e-9       # Stefan-Boltzmann constant, MJ / K^4 / m^2 / day (Eq. 39)
ALBEDO = 0.23          # reference crop albedo (Eq. 38)


def _saturation_vapor_pressure(t_celsius: float) -> float:
    """FAO-56 Eq. 11: saturation vapor pressure at temperature T, in kPa."""
    return 0.6108 * math.exp((17.27 * t_celsius) / (t_celsius + 237.3))


def _slope_svp_curve(t_celsius: float) -> float:
    """FAO-56 Eq. 13: slope of the saturation vapor pressure curve, kPa/°C."""
    es = _saturation_vapor_pressure(t_celsius)
    return (4098 * es) / ((t_celsius + 237.3) ** 2)


def _atmospheric_pressure(elevation_m: float) -> float:
    """FAO-56 Eq. 7: atmospheric pressure as a function of elevation, kPa."""
    return 101.3 * (((293 - 0.0065 * elevation_m) / 293) ** 5.26)


def _psychrometric_constant(pressure_kpa: float) -> float:
    """FAO-56 Eq. 8: psychrometric constant, kPa/°C."""
    return 0.000665 * pressure_kpa


def _extraterrestrial_radiation(lat_deg: float, day_of_year: int) -> float:
    """
    FAO-56 Eq. 21: extraterrestrial radiation Ra, MJ / m^2 / day.
    Depends only on latitude and day of year (astronomical, not measured).
    """
    lat_rad = math.radians(lat_deg)
    dr = 1 + 0.033 * math.cos(2 * math.pi * day_of_year / 365)          # Eq. 23
    delta = 0.409 * math.sin((2 * math.pi * day_of_year / 365) - 1.39)  # Eq. 24

    # sunset hour angle, Eq. 25 — clamp for numerical safety at extreme latitudes
    x = -math.tan(lat_rad) * math.tan(delta)
    x = max(-1.0, min(1.0, x))
    omega_s = math.acos(x)

    ra = (24 * 60 / math.pi) * GSC * dr * (
        omega_s * math.sin(lat_rad) * math.sin(delta)
        + math.cos(lat_rad) * math.cos(delta) * math.sin(omega_s)
    )
    return ra


def _clear_sky_radiation(ra: float, elevation_m: float) -> float:
    """FAO-56 Eq. 37: clear-sky solar radiation Rso, MJ / m^2 / day."""
    return (0.75 + 2e-5 * elevation_m) * ra


def _net_shortwave_radiation(rs: float) -> float:
    """FAO-56 Eq. 38: net shortwave radiation Rns, MJ / m^2 / day."""
    return (1 - ALBEDO) * rs


def _net_longwave_radiation(
    t_max_c: float, t_min_c: float, ea_kpa: float, rs: float, rso: float
) -> float:
    """FAO-56 Eq. 39: net longwave radiation Rnl, MJ / m^2 / day."""
    t_max_k = t_max_c + 273.16
    t_min_k = t_min_c + 273.16
    rs_rso = min(rs / rso, 1.0) if rso > 0 else 1.0  # cloudiness ratio, capped at 1

    return (
        SIGMA
        * ((t_max_k ** 4 + t_min_k ** 4) / 2)
        * (0.34 - 0.14 * math.sqrt(max(ea_kpa, 0)))
        * (1.35 * rs_rso - 0.35)
    )


@dataclass
class ET0Result:
    et0_mm_day: float
    # intermediate values, exposed for transparency / debugging / audit trail
    delta_slope_svp: float
    psychrometric_constant: float
    es_mean_kpa: float
    ea_kpa: float
    vpd_kpa: float
    net_radiation_mj_m2: float
    ra_extraterrestrial_mj_m2: float
    rso_clear_sky_mj_m2: float


def calculate_et0(
    t_max_c: float,
    t_min_c: float,
    rh_max_pct: float,
    rh_min_pct: float,
    wind_2m_ms: float,
    solar_rad_mj_m2: float,
    elevation_m: float,
    lat_deg: float,
    day_of_year: int,
) -> ET0Result:
    """
    FAO-56 Eq. 6: full Penman-Monteith daily reference evapotranspiration.

        ET0 = [0.408*Δ*(Rn - G) + γ*(900/(T+273))*u2*(es - ea)]
              -----------------------------------------------------
                        Δ + γ*(1 + 0.34*u2)

    G (soil heat flux) is taken as 0 for daily time-step calculations,
    per FAO-56 section 3.5 — this is a formula simplification explicitly
    sanctioned by the standard, not a shortcut we invented.
    """
    t_mean = (t_max_c + t_min_c) / 2

    delta = _slope_svp_curve(t_mean)
    pressure = _atmospheric_pressure(elevation_m)
    gamma = _psychrometric_constant(pressure)

    es_max = _saturation_vapor_pressure(t_max_c)
    es_min = _saturation_vapor_pressure(t_min_c)
    es_mean = (es_max + es_min) / 2

    # FAO-56 Eq. 17: actual vapor pressure from RH max/min (preferred method
    # when both are available, more accurate than using RH mean alone)
    ea = (es_min * (rh_max_pct / 100) + es_max * (rh_min_pct / 100)) / 2

    vpd = max(es_mean - ea, 0)

    ra = _extraterrestrial_radiation(lat_deg, day_of_year)
    rso = _clear_sky_radiation(ra, elevation_m)
    rns = _net_shortwave_radiation(solar_rad_mj_m2)
    rnl = _net_longwave_radiation(t_max_c, t_min_c, ea, solar_rad_mj_m2, rso)
    rn = rns - rnl

    g = 0.0  # soil heat flux, daily timestep assumption per FAO-56 sec 3.5

    numerator = 0.408 * delta * (rn - g) + gamma * (900 / (t_mean + 273)) * wind_2m_ms * vpd
    denominator = delta + gamma * (1 + 0.34 * wind_2m_ms)
    et0 = numerator / denominator

    return ET0Result(
        et0_mm_day=round(et0, 3),
        delta_slope_svp=round(delta, 5),
        psychrometric_constant=round(gamma, 5),
        es_mean_kpa=round(es_mean, 4),
        ea_kpa=round(ea, 4),
        vpd_kpa=round(vpd, 4),
        net_radiation_mj_m2=round(rn, 4),
        ra_extraterrestrial_mj_m2=round(ra, 4),
        rso_clear_sky_mj_m2=round(rso, 4),
    )
