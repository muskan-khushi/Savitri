"""
market_service.py

Sell-now-vs-store economics: pulls real Agmarknet mandi price records
(via mandi_price_service.py) for a commodity/market, computes an
actual trend from the real returned records using Ordinary Least
Squares (OLS) linear regression across all available price points —
not a naive first-vs-last difference — and nets out explicitly
labelled cost assumptions.

Trend method: OLS minimises sum of squared residuals across all N
price/date observations. This is more robust than a simple first-vs-
last difference for volatile agricultural commodities (tomato, onion)
where any individual day's price may be an outlier.

Volatility flag: coefficient of variation (std / mean) > 0.15 triggers
a 'high_price_volatility' flag. When CV > 0.15, the OLS trend is still
computed and returned but the recommendation text explicitly notes that
price swings make projections unreliable — not suppressed, not ignored.

Every assumption used (storage cost/kg, transport cost/kg) is a
labelled constant sourced from published case studies, always returned
alongside the number so it can be audited.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from decimal import Decimal
from typing import Optional

from app.services.mandi_price_service import fetch_mandi_prices, MandiPriceServiceError  # noqa: F401

# Real cited benchmark from Ecozen solar pre-cooling case studies — an assumption, not a
# live-measured cost for this specific farmer/facility.
ASSUMED_STORAGE_COST_PER_KG = Decimal("1.5")
# Flat transport placeholder — no real distance input exists yet (flagged).
ASSUMED_TRANSPORT_COST_PER_KG = Decimal("0.5")

# Coefficient of variation threshold above which price swings are flagged as unreliable
HIGH_VOLATILITY_CV_THRESHOLD = 0.15


def _ols_trend_per_day(
    prices: list[Decimal], day_offsets: list[int]
) -> Optional[Decimal]:
    """
    Ordinary Least Squares slope (Rs/kg/day) across all (day, price) observations.

    OLS formula for slope:
        b1 = [Σ(xi - x̄)(yi - ȳ)] / Σ(xi - x̄)²

    Returns None if there is insufficient data or zero variance in x
    (all observations on the same day — degenerate case).
    """
    n = len(prices)
    if n < 2:
        return None

    x_mean = sum(day_offsets) / n
    y_mean = float(sum(prices)) / n

    numerator = sum(
        (day_offsets[i] - x_mean) * (float(prices[i]) - y_mean)
        for i in range(n)
    )
    denominator = sum((xi - x_mean) ** 2 for xi in day_offsets)

    if denominator == 0:
        return None

    return Decimal(str(numerator / denominator))


def _coefficient_of_variation(prices: list[Decimal]) -> float:
    """
    Coefficient of variation = std / mean, dimensionless.
    Returns 0.0 if mean is zero (degenerate case).
    """
    if len(prices) < 2:
        return 0.0
    float_prices = [float(p) for p in prices]
    mean = sum(float_prices) / len(float_prices)
    if mean == 0:
        return 0.0
    variance = sum((p - mean) ** 2 for p in float_prices) / (len(float_prices) - 1)
    return math.sqrt(variance) / mean


@dataclass
class MarketAdvice:
    commodity: str
    state: str
    latest_modal_price_per_kg: Optional[float]
    latest_arrival_date: Optional[str]
    trend_per_day_per_kg: Optional[float]
    trend_method: str
    storage_days: int
    high_price_volatility: bool
    coefficient_of_variation: Optional[float]
    assumed_storage_cost_per_kg: float
    assumed_transport_cost_per_kg: float
    projected_gain_per_kg: Optional[float]
    recommendation_text: str


async def get_market_advice(
    state: str,
    commodity: str,
    storage_days: int = 3,
    district: Optional[str] = None,
    market: Optional[str] = None,
) -> MarketAdvice:
    """
    Raises MandiPriceServiceError (propagated, not swallowed) if the
    API key is missing or the upstream call fails.
    """
    records = await fetch_mandi_prices(
        state=state, commodity=commodity, district=district, market=market, limit=30,
    )

    dated = [
        r for r in records
        if r.arrival_date is not None and r.modal_price_per_kg is not None
    ]
    dated.sort(key=lambda r: r.arrival_date)

    if not dated:
        return MarketAdvice(
            commodity=commodity, state=state,
            latest_modal_price_per_kg=None, latest_arrival_date=None,
            trend_per_day_per_kg=None, trend_method="ols_linear_regression",
            storage_days=storage_days,
            high_price_volatility=False, coefficient_of_variation=None,
            assumed_storage_cost_per_kg=float(ASSUMED_STORAGE_COST_PER_KG),
            assumed_transport_cost_per_kg=float(ASSUMED_TRANSPORT_COST_PER_KG),
            projected_gain_per_kg=None,
            recommendation_text="No dated, priced records returned for this commodity/market — can't compute a trend.",
        )

    latest = dated[-1]
    base_date = dated[0].arrival_date

    prices = [r.modal_price_per_kg for r in dated]
    day_offsets = [(r.arrival_date - base_date).days for r in dated]

    trend_per_day = _ols_trend_per_day(prices, day_offsets)
    cv = _coefficient_of_variation(prices)
    is_high_volatility = cv > HIGH_VOLATILITY_CV_THRESHOLD

    projected_gain: Optional[Decimal] = None
    recommendation = "Not enough historical price data to project a trend — check today's price directly."

    if trend_per_day is not None:
        projected_price_change = trend_per_day * storage_days
        projected_gain = projected_price_change - (ASSUMED_STORAGE_COST_PER_KG + ASSUMED_TRANSPORT_COST_PER_KG)

        volatility_note = (
            " Note: this commodity shows high price volatility (CV={:.0f}%) — treat this projection with caution.".format(cv * 100)
            if is_high_volatility else ""
        )

        if projected_gain > 0:
            recommendation = (
                f"OLS price trend suggests storing {storage_days} more day(s) nets roughly "
                f"Rs {float(projected_gain):.2f}/kg after storage and transport costs."
                f"{volatility_note}"
            )
        else:
            recommendation = (
                f"OLS price trend does not cover storage and transport costs over {storage_days} "
                f"day(s) — selling now looks better on this data."
                f"{volatility_note}"
            )

    return MarketAdvice(
        commodity=commodity, state=state,
        latest_modal_price_per_kg=float(latest.modal_price_per_kg),
        latest_arrival_date=latest.arrival_date.isoformat(),
        trend_per_day_per_kg=float(trend_per_day) if trend_per_day is not None else None,
        trend_method="ols_linear_regression",
        storage_days=storage_days,
        high_price_volatility=is_high_volatility,
        coefficient_of_variation=round(cv, 4) if cv else None,
        assumed_storage_cost_per_kg=float(ASSUMED_STORAGE_COST_PER_KG),
        assumed_transport_cost_per_kg=float(ASSUMED_TRANSPORT_COST_PER_KG),
        projected_gain_per_kg=float(projected_gain) if projected_gain is not None else None,
        recommendation_text=recommendation,
    )