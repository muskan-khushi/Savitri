"""
outbreak_warning_service.py

Layer 3 proactive upgrade — regional disease outbreak early warning.

When a disease detection is logged (via the /disease-detection endpoint),
the result is stored in DiseaseDetectionLog with coordinates. This service
aggregates those logs by disease condition within a geographic radius and
triggers a warning when a threshold is exceeded.

Method:
  - Spatial aggregation: Haversine distance from a query point to all
    disease detection log entries within the last N days.
  - If >= MIN_CASE_THRESHOLD cases of the same (crop, condition) are
    detected within OUTBREAK_RADIUS_KM of the query point in the last
    LOOKBACK_DAYS, an OutbreakWarning is generated.
  - 'Healthy' detections are excluded — only disease-positive detections
    count toward outbreak thresholds.

This replaces "I see symptoms now" (reactive) with "your district has seen
3+ cases of late blight this week" (proactive) — the key L3 differentiator
mentioned in brainstorming.MD.

ZERO-MOCK: no fabricated warning counts. If the log table has zero records,
this returns an empty list, not a simulated outbreak.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models_db import DiseaseDetectionLog

OUTBREAK_RADIUS_KM = 50.0
MIN_CASE_THRESHOLD = 3
LOOKBACK_DAYS = 7
EARTH_RADIUS_KM = 6371.0088


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return EARTH_RADIUS_KM * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@dataclass
class OutbreakWarning:
    crop: str
    condition: str
    case_count: int
    radius_km: float
    lookback_days: int
    earliest_detection: str
    latest_detection: str
    warning_text: str


async def log_detection(
    session: AsyncSession,
    farm_id: Optional[int],
    lat: float,
    lon: float,
    crop: str,
    condition: str,
    is_healthy: bool,
    confidence: float,
) -> None:
    """
    Persists a disease detection result to the log table.
    Call this from the /disease-detection endpoint after a successful inference.
    """
    log = DiseaseDetectionLog(
        farm_id=farm_id,
        lat=lat,
        lon=lon,
        crop=crop,
        condition=condition,
        is_healthy=is_healthy,
        confidence=confidence,
        detection_date=date.today(),
    )
    session.add(log)
    await session.commit()


async def get_outbreak_warnings(
    session: AsyncSession, lat: float, lon: float
) -> list[OutbreakWarning]:
    """
    Returns a list of active outbreak warnings within OUTBREAK_RADIUS_KM
    of the given coordinates, based on detections in the last LOOKBACK_DAYS.
    """
    cutoff = date.today() - timedelta(days=LOOKBACK_DAYS)

    result = await session.execute(
        select(DiseaseDetectionLog).where(
            DiseaseDetectionLog.detection_date >= cutoff,
            DiseaseDetectionLog.is_healthy == False,  # noqa: E712
        )
    )
    recent_logs = list(result.scalars().all())

    # Filter to within OUTBREAK_RADIUS_KM
    nearby = [
        log for log in recent_logs
        if _haversine(lat, lon, log.lat, log.lon) <= OUTBREAK_RADIUS_KM
    ]

    # Group by (crop, condition)
    groups: dict[tuple[str, str], list[DiseaseDetectionLog]] = {}
    for log in nearby:
        key = (log.crop, log.condition)
        groups.setdefault(key, []).append(log)

    warnings = []
    for (crop, condition), logs in groups.items():
        if len(logs) < MIN_CASE_THRESHOLD:
            continue

        dates = sorted(log.detection_date.isoformat() for log in logs)
        warnings.append(OutbreakWarning(
            crop=crop,
            condition=condition,
            case_count=len(logs),
            radius_km=OUTBREAK_RADIUS_KM,
            lookback_days=LOOKBACK_DAYS,
            earliest_detection=dates[0],
            latest_detection=dates[-1],
            warning_text=(
                f"Regional outbreak alert: {len(logs)} confirmed cases of {condition} "
                f"in {crop} detected within {OUTBREAK_RADIUS_KM:.0f}km of your farm "
                f"in the last {LOOKBACK_DAYS} days. Inspect your crop proactively — "
                f"do not wait for visible symptoms."
            ),
        ))

    # Most recent outbreak first
    warnings.sort(key=lambda w: w.latest_detection, reverse=True)
    return warnings
