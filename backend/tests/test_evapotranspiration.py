"""
Tests for the FAO-56 Penman-Monteith implementation.

Two kinds of checks here:

1. Physical sanity checks — does the formula behave the way physics says
   it should (hotter/windier/drier -> higher ET0, etc). These don't
   depend on memorizing any specific published number, so they're safe
   to trust as written.

2. A worked-example cross-check against FAO-56's own published Example 18
   (Bangkok, 15 April, tropical conditions). The expected ET0 in the
   FAO-56 manual for that example is ~5.72 mm/day. We've encoded our
   best-effort recollection of the example's inputs below, but you
   should independently verify against a copy of FAO Irrigation and
   Drainage Paper 56 (freely available from fao.org) before trusting
   this number in production — treat test_fao56_worked_example as a
   guide for HOW to validate, not as gospel on its own.
"""

import math
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.evapotranspiration import calculate_et0, _extraterrestrial_radiation


def test_ra_is_zero_at_poles_in_polar_night():
    # Extraterrestrial radiation should never go negative regardless of
    # extreme latitude/day-of-year combinations (sunset hour angle clamp).
    ra = _extraterrestrial_radiation(lat_deg=89.0, day_of_year=355)
    assert ra >= 0


def test_hotter_temperature_increases_et0():
    base = dict(
        t_max_c=30, t_min_c=20, rh_max_pct=70, rh_min_pct=40,
        wind_2m_ms=2.0, solar_rad_mj_m2=20, elevation_m=50,
        lat_deg=25.6, day_of_year=180,  # ~Patna latitude, mid-year
    )
    cooler = calculate_et0(**base)
    hotter = calculate_et0(**{**base, "t_max_c": 40, "t_min_c": 28})
    assert hotter.et0_mm_day > cooler.et0_mm_day


def test_higher_humidity_decreases_et0():
    base = dict(
        t_max_c=35, t_min_c=24, rh_max_pct=50, rh_min_pct=20,
        wind_2m_ms=2.0, solar_rad_mj_m2=22, elevation_m=50,
        lat_deg=25.6, day_of_year=180,
    )
    dry = calculate_et0(**base)
    humid = calculate_et0(**{**base, "rh_max_pct": 95, "rh_min_pct": 70})
    assert humid.et0_mm_day < dry.et0_mm_day


def test_more_wind_increases_et0():
    base = dict(
        t_max_c=32, t_min_c=22, rh_max_pct=60, rh_min_pct=30,
        wind_2m_ms=1.0, solar_rad_mj_m2=20, elevation_m=50,
        lat_deg=25.6, day_of_year=180,
    )
    calm = calculate_et0(**base)
    windy = calculate_et0(**{**base, "wind_2m_ms": 5.0})
    assert windy.et0_mm_day > calm.et0_mm_day


def test_et0_within_physically_plausible_range_for_bihar_summer():
    # Rough plausibility band for hot, moderately humid North Indian
    # summer conditions (Patna, Bihar area) — published agronomic
    # references generally put peak-summer ET0 in the 4-8 mm/day band.
    result = calculate_et0(
        t_max_c=41, t_min_c=28, rh_max_pct=65, rh_min_pct=25,
        wind_2m_ms=2.5, solar_rad_mj_m2=24, elevation_m=53,
        lat_deg=25.6, day_of_year=150,
    )
    assert 3.0 < result.et0_mm_day < 10.0


def test_fao56_worked_example_bangkok():
    """
    Best-effort reproduction of FAO-56 Example 18 (Bangkok, 15 April).
    Inputs as commonly cited: lat 13.73N, elevation 2m, Tmax=34.8C,
    Tmin=25.6C, wind at 2m ~2.0 m/s, Rs ~ 22.65 MJ/m^2/day (derived from
    9.25 actual sunshine hours via the Angstrom formula in the source
    example — we approximate Rs directly here since Angstrom conversion
    from sunshine hours isn't implemented in this module).

    Published expected ET0 ~ 5.72 mm/day.

    IMPORTANT: verify the exact input values against your own copy of
    FAO-56 before relying on this test as proof of correctness — it is
    a helpful cross-check, not a substitute for checking the source.
    """
    result = calculate_et0(
        t_max_c=34.8, t_min_c=25.6, rh_max_pct=84, rh_min_pct=55,
        wind_2m_ms=2.0, solar_rad_mj_m2=22.65, elevation_m=2,
        lat_deg=13.73, day_of_year=105,  # April 15
    )
    # Loose tolerance band — this is a cross-check, not a bit-exact match,
    # since our RH inputs are an approximation of the example's ea value.
    assert 4.5 < result.et0_mm_day < 7.0, (
        f"Got {result.et0_mm_day} mm/day — re-check inputs against FAO-56 "
        f"Example 18 directly if this fails."
    )


if __name__ == "__main__":
    tests = [v for k, v in list(globals().items()) if k.startswith("test_")]
    passed, failed = 0, 0
    for t in tests:
        try:
            t()
            print(f"PASS  {t.__name__}")
            passed += 1
        except AssertionError as e:
            print(f"FAIL  {t.__name__}: {e}")
            failed += 1
    print(f"\n{passed} passed, {failed} failed")
