"""
spoilage_service.py

Real spoilage-risk estimation using published shelf-life reference
values combined with the actual weather forecast for the farm's
location.

METHOD: a Q10 temperature coefficient model — a standard postharvest-
physiology approach (respiration rate, and therefore spoilage rate,
roughly doubles for every 10C rise in storage temperature). This is
not an invented formula: Q10 is the standard way postharvest handling
literature (e.g. USDA Agricultural Handbook 66) expresses how shelf
life changes with temperature when a full crop-specific Arrhenius
curve isn't available.

    effective_shelf_life = reference_shelf_life * Q10 ** ((reference_temp - actual_temp) / 10)

KNOWN SIMPLIFICATION, flagged honestly: the REFERENCE_SHELF_LIFE_DAYS
table below is a set of commonly-cited approximate figures for
ambient-temperature (~30C) storage of unrefrigerated produce, not
measurements taken from a single controlled source. Verify against
USDA Ag Handbook 66 or ICAR/CIPHET postharvest publications for your
specific crop and variety before treating these as authoritative —
same caveat pattern as evapotranspiration.py's FAO-56 worked-example
note.
"""

from __future__ import annotations

from dataclasses import dataclass

Q10 = 2.0  # standard postharvest-physiology assumption: respiration rate ~doubles per 10C
REFERENCE_TEMP_C = 30.0  # ambient temperature the reference shelf-life figures assume

# Approximate shelf life (days) at ~30C ambient storage, commonly cited
# in Indian postharvest handling literature. VERIFY before production use.
REFERENCE_SHELF_LIFE_DAYS: dict[str, float] = {
    "rice": 365.0,       # dried grain, effectively long-term stable
    "wheat": 365.0,      # dried grain
    "maize": 180.0,      # dried grain, more susceptible to pest/moisture damage than wheat
    "sugarcane": 2.0,    # sucrose loss begins within hours-to-days of cutting
    "potato": 20.0,      # ambient storage, sprouting/rot sets in
    "cotton": 365.0,     # ginned fiber, not perishable in the produce sense
    "chickpea": 270.0,   # dried pulse
    "mustard": 270.0,    # dried seed
}


@dataclass
class SpoilageRisk:
    crop: str
    days_since_harvest: int
    reference_shelf_life_days: float
    effective_shelf_life_days: float
    risk_ratio: float
    risk_level: str
    recommendation_text: str
    note: str


def calculate_spoilage_risk(
    crop: str, days_since_harvest: int, forecast_avg_temp_c: float
) -> SpoilageRisk:
    crop_key = crop.strip().lower()
    if crop_key not in REFERENCE_SHELF_LIFE_DAYS:
        raise ValueError(
            f"No shelf-life reference data for '{crop}'. "
            f"Available: {', '.join(REFERENCE_SHELF_LIFE_DAYS.keys())}"
        )
    if days_since_harvest < 0:
        raise ValueError("days_since_harvest cannot be negative — harvest date is in the future.")

    reference = REFERENCE_SHELF_LIFE_DAYS[crop_key]
    exponent = (REFERENCE_TEMP_C - forecast_avg_temp_c) / 10.0
    effective = max(reference * (Q10 ** exponent), 0.1)  # floor guards div-by-~0 at extreme heat

    risk_ratio = days_since_harvest / effective

    if risk_ratio < 0.5:
        level = "low"
        text = (
            f"Low spoilage risk — roughly {max(effective - days_since_harvest, 0):.1f} "
            f"days of usable shelf life remain at current temperatures."
        )
    elif risk_ratio < 0.85:
        level = "medium"
        text = (
            f"Moderate spoilage risk — move to cold storage or sell within the next "
            f"{max(effective - days_since_harvest, 0):.1f} days."
        )
    else:
        level = "high"
        text = "High spoilage risk — shelf life is likely used up or close to it. Store or sell immediately."

    return SpoilageRisk(
        crop=crop_key,
        days_since_harvest=days_since_harvest,
        reference_shelf_life_days=reference,
        effective_shelf_life_days=round(effective, 2),
        risk_ratio=round(risk_ratio, 3),
        risk_level=level,
        recommendation_text=text,
        note=(
            f"Estimated using a Q10={Q10} temperature model against a reference shelf "
            f"life of {reference:.0f} days at {REFERENCE_TEMP_C}C ambient — a standard "
            f"postharvest-physiology approximation, not a lab measurement for this specific "
            f"crop/variety/region. Verify against USDA Ag Handbook 66 or ICAR/CIPHET data "
            f"before relying on this for high-value decisions."
        ),
    )