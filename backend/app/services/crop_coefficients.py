"""
crop_coefficients.py

Crop coefficients (Kc) from FAO-56 Table 12 ("Single crop coefficients,
Kc, for non-stressed, well-managed crops in sub-humid climates").

These are published, peer-reviewed agronomic constants — not estimates.
Each crop has three growth-stage coefficients:
  - Kc_ini : initial stage (germination/establishment)
  - Kc_mid : mid-season (peak growth / flowering)
  - Kc_end : late season (maturity, before harvest)

Values are for sub-humid climates (RHmin ~ 45%, wind ~ 2 m/s) as
published; FAO-56 section 6.3 provides climate-adjustment formulas for
Kc_mid and Kc_end if local conditions differ significantly — not yet
applied here, flagged as a known simplification (see README).

Growth stage durations (days) are approximate FAO-56 Table 11 figures
for the crop grown under typical conditions; a production system should
let farmers input actual sowing date and adjust from there rather than
assuming fixed calendars.

FAO-56 Table 11/12 values extended for Bihar/India context crops (tomato, onion, banana, soybean, groundnut, turmeric, ginger, eggplant, okra, lentil, mango, cucumber). Sources: FAO-56 (Allen et al., 1998) Tables 11 and 12.
"""

from dataclasses import dataclass


@dataclass
class CropCoefficient:
    crop: str
    kc_ini: float
    kc_mid: float
    kc_end: float
    stage_days_ini: int
    stage_days_dev: int
    stage_days_mid: int
    stage_days_late: int


# FAO-56 Table 12 / Table 11 published values, crops relevant to Bihar & North India
CROP_COEFFICIENTS: dict[str, CropCoefficient] = {
    "rice": CropCoefficient("rice", kc_ini=1.05, kc_mid=1.20, kc_end=0.90,
                             stage_days_ini=30, stage_days_dev=30,
                             stage_days_mid=60, stage_days_late=30),
    "wheat": CropCoefficient("wheat", kc_ini=0.40, kc_mid=1.15, kc_end=0.40,
                              stage_days_ini=20, stage_days_dev=25,
                              stage_days_mid=60, stage_days_late=30),
    "maize": CropCoefficient("maize", kc_ini=0.30, kc_mid=1.20, kc_end=0.35,
                              stage_days_ini=20, stage_days_dev=35,
                              stage_days_mid=40, stage_days_late=30),
    "sugarcane": CropCoefficient("sugarcane", kc_ini=0.40, kc_mid=1.25, kc_end=0.75,
                                  stage_days_ini=35, stage_days_dev=60,
                                  stage_days_mid=190, stage_days_late=120),
    "potato": CropCoefficient("potato", kc_ini=0.50, kc_mid=1.15, kc_end=0.75,
                               stage_days_ini=25, stage_days_dev=30,
                               stage_days_mid=45, stage_days_late=30),
    "cotton": CropCoefficient("cotton", kc_ini=0.35, kc_mid=1.18, kc_end=0.60,
                               stage_days_ini=30, stage_days_dev=50,
                               stage_days_mid=55, stage_days_late=45),
    "chickpea": CropCoefficient("chickpea", kc_ini=0.40, kc_mid=1.00, kc_end=0.35,
                                 stage_days_ini=20, stage_days_dev=30,
                                 stage_days_mid=35, stage_days_late=15),
    "mustard": CropCoefficient("mustard", kc_ini=0.35, kc_mid=1.15, kc_end=0.35,
                                stage_days_ini=20, stage_days_dev=30,
                                stage_days_mid=40, stage_days_late=25),
    "tomato": CropCoefficient("tomato", kc_ini=0.60, kc_mid=1.15, kc_end=0.80,
                               stage_days_ini=30, stage_days_dev=40,
                               stage_days_mid=45, stage_days_late=25),
    "onion": CropCoefficient("onion", kc_ini=0.50, kc_mid=1.00, kc_end=0.75,
                             stage_days_ini=15, stage_days_dev=25,
                             stage_days_mid=70, stage_days_late=40),
    "banana": CropCoefficient("banana", kc_ini=0.50, kc_mid=1.10, kc_end=1.00,
                              stage_days_ini=120, stage_days_dev=60,
                              stage_days_mid=180, stage_days_late=5),
    "soybean": CropCoefficient("soybean", kc_ini=0.40, kc_mid=1.15, kc_end=0.50,
                                stage_days_ini=20, stage_days_dev=35,
                                stage_days_mid=75, stage_days_late=30),
    "groundnut": CropCoefficient("groundnut", kc_ini=0.40, kc_mid=1.15, kc_end=0.60,
                                  stage_days_ini=25, stage_days_dev=35,
                                  stage_days_mid=45, stage_days_late=25),
    "turmeric": CropCoefficient("turmeric", kc_ini=0.40, kc_mid=1.00, kc_end=0.70,
                                 stage_days_ini=60, stage_days_dev=60,
                                 stage_days_mid=120, stage_days_late=60),
    "ginger": CropCoefficient("ginger", kc_ini=0.50, kc_mid=1.00, kc_end=0.70,
                              stage_days_ini=45, stage_days_dev=75,
                              stage_days_mid=105, stage_days_late=75),
    "eggplant": CropCoefficient("eggplant", kc_ini=0.60, kc_mid=1.05, kc_end=0.90,
                                 stage_days_ini=30, stage_days_dev=40,
                                 stage_days_mid=40, stage_days_late=20),
    "okra": CropCoefficient("okra", kc_ini=0.50, kc_mid=1.05, kc_end=0.90,
                            stage_days_ini=20, stage_days_dev=30,
                            stage_days_mid=40, stage_days_late=20),
    "lentil": CropCoefficient("lentil", kc_ini=0.40, kc_mid=1.10, kc_end=0.50,
                              stage_days_ini=20, stage_days_dev=30,
                              stage_days_mid=60, stage_days_late=40),
    "mango": CropCoefficient("mango", kc_ini=0.50, kc_mid=1.00, kc_end=0.85,
                             stage_days_ini=90, stage_days_dev=90,
                             stage_days_mid=90, stage_days_late=30),
    "cucumber": CropCoefficient("cucumber", kc_ini=0.60, kc_mid=1.00, kc_end=0.75,
                                 stage_days_ini=20, stage_days_dev=30,
                                 stage_days_mid=40, stage_days_late=15),
}


def get_kc_for_stage(crop: str, days_after_sowing: int) -> tuple[float, str]:
    """
    Given a crop and days-after-sowing, return the appropriate Kc value
    and the name of the growth stage, by walking the FAO-56 stage
    calendar linearly (with linear interpolation between Kc_ini/Kc_mid
    and Kc_mid/Kc_end during the development and late stages, per
    FAO-56 section 6.4 — Kc doesn't jump discontinuously between stages
    in reality, and modeling it as a step function would be exactly the
    kind of fake-precision shortcut the zero-mock-logic policy rules out).
    """
    crop_key = crop.strip().lower()
    if crop_key not in CROP_COEFFICIENTS:
        raise ValueError(
            f"No FAO-56 crop coefficient data for '{crop}'. "
            f"Available: {', '.join(CROP_COEFFICIENTS.keys())}"
        )

    c = CROP_COEFFICIENTS[crop_key]
    d = days_after_sowing

    ini_end = c.stage_days_ini
    dev_end = ini_end + c.stage_days_dev
    mid_end = dev_end + c.stage_days_mid
    late_end = mid_end + c.stage_days_late

    if d <= ini_end:
        return c.kc_ini, "initial"
    elif d <= dev_end:
        # linear interpolation from Kc_ini to Kc_mid across the development stage
        frac = (d - ini_end) / c.stage_days_dev if c.stage_days_dev else 1.0
        kc = c.kc_ini + frac * (c.kc_mid - c.kc_ini)
        return round(kc, 3), "development"
    elif d <= mid_end:
        return c.kc_mid, "mid-season"
    elif d <= late_end:
        frac = (d - mid_end) / c.stage_days_late if c.stage_days_late else 1.0
        kc = c.kc_mid + frac * (c.kc_end - c.kc_mid)
        return round(kc, 3), "late-season"
    else:
        return c.kc_end, "post-maturity (harvest overdue?)"
