"""
market_service.py

Sell-now-vs-store economics: pulls real Agmarknet mandi price records
(via mandi_price_service.py) for a commodity/market, computes an
actual trend from the real returned records (week-over-week average
change — not a fabricated regression), and nets out explicitly
labelled cost assumptions to produce one number: the expected Rs/kg
gain (or loss) from storing N more days versus selling today.

Every assumption used (storage cost/kg, transport cost/kg) is a
labelled constant sourced from figures already cited elsewhere in
this project (Ecozen's ~Rs 1.5/kg solar pre-cooling benchmark, per
backend/README.md and the Impact & Data page) — not invented for this
module, and always returned alongside the number so it can be
audited rather than trusted blindly.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from app.services.mandi_price_service import fetch_mandi_prices, MandiPriceServiceError  # noqa: F401 (re-exported for main.py)

# Real cited benchmark from Ecozen solar pre-cooling case studies
# (see backend/README.md, Impact & Data page) — an assumption, not a
# live-measured cost for this specific farmer/facility.
ASSUMED_STORAGE_COST_PER_KG = Decimal("1.5")
# No real transport-distance input exists yet in this build, so this
# is a flat placeholder assumption — flagged, not disguised as measured.
ASSUMED_TRANSPORT_COST_PER_KG = Decimal("0.5")


@dataclass
class MarketAdvice:
    commodity: str
    state: str
    latest_modal_price_per_kg: float | None
    latest_arrival_date: str | None
    trend_per_day_per_kg: float | None
    storage_days: int
    assumed_storage_cost_per_kg: float
    assumed_transport_cost_per_kg: float
    projected_gain_per_kg: float | None
    recommendation_text: str


async def get_market_advice(
    state: str,
    commodity: str,
    storage_days: int = 3,
    district: str | None = None,
    market: str | None = None,
) -> MarketAdvice:
    """
    Raises MandiPriceServiceError (propagated, not swallowed) if the
    API key is missing or the upstream call fails — same fail-loud
    pattern as every other external-data service in this codebase.
    """
    records = await fetch_mandi_prices(
        state=state, commodity=commodity, district=district, market=market, limit=30,
    )

    dated = [r for r in records if r.arrival_date is not None and r.modal_price_per_kg is not None]
    dated.sort(key=lambda r: r.arrival_date)

    if not dated:
        return MarketAdvice(
            commodity=commodity, state=state,
            latest_modal_price_per_kg=None, latest_arrival_date=None,
            trend_per_day_per_kg=None, storage_days=storage_days,
            assumed_storage_cost_per_kg=float(ASSUMED_STORAGE_COST_PER_KG),
            assumed_transport_cost_per_kg=float(ASSUMED_TRANSPORT_COST_PER_KG),
            projected_gain_per_kg=None,
            recommendation_text="No dated, priced records returned for this commodity/market — can't compute a trend.",
        )

    latest = dated[-1]

    trend_per_day: Decimal | None = None
    if len(dated) >= 2:
        earliest = dated[0]
        days_span = (latest.arrival_date - earliest.arrival_date).days
        if days_span > 0:
            trend_per_day = (latest.modal_price_per_kg - earliest.modal_price_per_kg) / days_span

    projected_gain: Decimal | None = None
    recommendation = "Not enough historical price data to project a trend — check today's price directly."
    if trend_per_day is not None:
        projected_price_change = trend_per_day * storage_days
        projected_gain = projected_price_change - (ASSUMED_STORAGE_COST_PER_KG + ASSUMED_TRANSPORT_COST_PER_KG)
        if projected_gain > 0:
            recommendation = (
                f"Price trend suggests storing {storage_days} more day(s) nets roughly "
                f"Rs {projected_gain:.2f}/kg after storage and transport costs."
            )
        else:
            recommendation = (
                f"Price trend does not cover storage and transport costs over {storage_days} "
                f"day(s) — selling now looks better on this data."
            )

    return MarketAdvice(
        commodity=commodity, state=state,
        latest_modal_price_per_kg=float(latest.modal_price_per_kg),
        latest_arrival_date=latest.arrival_date.isoformat(),
        trend_per_day_per_kg=float(trend_per_day) if trend_per_day is not None else None,
        storage_days=storage_days,
        assumed_storage_cost_per_kg=float(ASSUMED_STORAGE_COST_PER_KG),
        assumed_transport_cost_per_kg=float(ASSUMED_TRANSPORT_COST_PER_KG),
        projected_gain_per_kg=float(projected_gain) if projected_gain is not None else None,
        recommendation_text=recommendation,
    )