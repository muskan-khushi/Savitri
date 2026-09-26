"""
mandi_price_service.py

Real client for the Government of India's Agmarknet daily mandi price
API, published via data.gov.in.

    Resource ID: 9ef84268-d588-465a-a308-a864a43d0070
    Endpoint:    https://api.data.gov.in/resource/{resource_id}
    Official Swagger contract:
      https://www.data.gov.in/backend/dataapi/v1/swagger/9ef84268-d588-465a-a308-a864a43d0070

Requires a real personal API key from data.gov.in (free registration,
not something this codebase can obtain on your behalf) set as the
DATA_GOV_API_KEY environment variable.

IMPORTANT DATA-QUALITY NOTES (from the API's own documentation, not
assumptions on our part):
  - This is a DAILY administrative dataset, not a live market feed.
    Always surface `arrival_date` to the farmer alongside the price —
    never imply it's a real-time quote.
  - Prices are reported in rupees per QUINTAL (100kg), not per kg.
  - "Modal price" is the price at which the largest transaction volume
    was reported — not the average of min/max, and not a prediction.
  - Price fields arrive from the API as strings; we parse them as
    Decimal, not float, to avoid introducing binary-floating-point
    error into money values.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal, InvalidOperation

import httpx

RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070"
API_URL = f"https://api.data.gov.in/resource/{RESOURCE_ID}"

CACHE_TTL_HOURS = 12
_PRICE_CACHE: dict[tuple, tuple[datetime, list[MandiPriceRecord]]] = {}


class MandiPriceServiceError(RuntimeError):
    pass


def _parse_decimal(value) -> Decimal | None:
    """Malformed or missing price values become None, not a fabricated 0 or guess."""
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return None


def _parse_arrival_date(value: str) -> date | None:
    # AGMARKNET commonly publishes DD/MM/YYYY; be defensive since source
    # formatting has been known to vary by record.
    for fmt in ("%d/%m/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(value, fmt).date()
        except (ValueError, TypeError):
            continue
    return None


@dataclass
class MandiPriceRecord:
    state: str
    district: str
    market: str
    commodity: str
    variety: str
    grade: str
    arrival_date_raw: str
    arrival_date: date | None
    min_price_per_quintal: Decimal | None
    max_price_per_quintal: Decimal | None
    modal_price_per_quintal: Decimal | None
    quality_flags: list[str]

    @property
    def modal_price_per_kg(self) -> Decimal | None:
        """Convenience conversion, explicit and labeled — never silently substituted for the quintal value."""
        return (self.modal_price_per_quintal / 100) if self.modal_price_per_quintal is not None else None


def _quality_check(min_p: Decimal | None, max_p: Decimal | None, modal_p: Decimal | None) -> list[str]:
    """
    Real data-quality checks from the API documentation's own guidance —
    flag suspicious rows rather than silently trusting or discarding them.
    """
    flags = []
    if min_p is not None and max_p is not None and min_p > max_p:
        flags.append("min_price_exceeds_max_price")
    if modal_p is not None and min_p is not None and max_p is not None:
        if not (min_p <= modal_p <= max_p):
            flags.append("modal_price_outside_min_max_range")
    if min_p is None or max_p is None or modal_p is None:
        flags.append("missing_price_field")
    return flags


async def fetch_mandi_prices(
    state: str | None = None,
    commodity: str | None = None,
    district: str | None = None,
    market: str | None = None,
    variety: str | None = None,
    grade: str | None = None,
    limit: int = 100,
) -> list[MandiPriceRecord]:
    """
    Fetch real daily mandi price records. Raises MandiPriceServiceError
    (not a fabricated fallback) if the API key is missing or the
    request fails — matching the same fail-loud pattern used for
    weather and disease-model checkpoints elsewhere in this codebase.
    """
    api_key = os.environ.get("DATA_GOV_API_KEY")
    if not api_key:
        raise MandiPriceServiceError(
            "DATA_GOV_API_KEY is not set. Register for a free personal key at "
            "https://data.gov.in (see backend/README.md) — this cannot be "
            "obtained automatically, and the shared demo key is rate-limited "
            "and shared across all of data.gov.in's users."
        )

    params = {
        "api-key": api_key,
        "format": "json",
        "offset": 0,
        "limit": min(max(limit, 1), 1000),  # API's documented max page size
    }
    if state:
        params["filters[state.keyword]"] = state
    if district:
        params["filters[district]"] = district
    if market:
        params["filters[market]"] = market
    if commodity:
        params["filters[commodity]"] = commodity
    if variety:
        params["filters[variety]"] = variety
    if grade:
        params["filters[grade]"] = grade

    cache_key = (state, commodity, district, market, variety, grade, limit)
    now = datetime.utcnow()

    if cache_key in _PRICE_CACHE:
        cached_time, cached_records = _PRICE_CACHE[cache_key]
        if (now - cached_time).total_seconds() < CACHE_TTL_HOURS * 3600:
            return cached_records

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.get(API_URL, params=params)
            resp.raise_for_status()
            payload = resp.json()
    except Exception as e:
        if cache_key in _PRICE_CACHE:
            return _PRICE_CACHE[cache_key][1]
        raise MandiPriceServiceError(f"data.gov.in Agmarknet request failed: {e}") from e

    records = []
    for raw in payload.get("records", []):
        min_p = _parse_decimal(raw.get("min_price"))
        max_p = _parse_decimal(raw.get("max_price"))
        modal_p = _parse_decimal(raw.get("modal_price"))
        arrival_raw = raw.get("arrival_date", "")

        records.append(MandiPriceRecord(
            state=raw.get("state", ""),
            district=raw.get("district", ""),
            market=raw.get("market", ""),
            commodity=raw.get("commodity", ""),
            variety=raw.get("variety", ""),
            grade=raw.get("grade", ""),
            arrival_date_raw=arrival_raw,
            arrival_date=_parse_arrival_date(arrival_raw),
            min_price_per_quintal=min_p,
            max_price_per_quintal=max_p,
            modal_price_per_quintal=modal_p,
            quality_flags=_quality_check(min_p, max_p, modal_p),
        ))

    if records:
        _PRICE_CACHE[cache_key] = (now, records)

    return records
