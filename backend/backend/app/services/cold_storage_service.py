"""
cold_storage_service.py

Nearest-cold-storage matching using the real Haversine great-circle
distance formula. No fabricated facility data ever appears here — this
module operates purely on whatever real records exist in the
cold_storages table (populated by scripts/import_cold_storage_csv.py
from an actual sourced dataset). An empty table produces an honest
"no data loaded" response, not an empty-looking-but-plausible result.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models_db import ColdStorage

EARTH_RADIUS_KM = 6371.0088  # mean Earth radius (IUGG value), standard for Haversine


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Real great-circle distance between two lat/lon points, in km.

        a = sin²(Δφ/2) + cos(φ1)·cos(φ2)·sin²(Δλ/2)
        c = 2·atan2(√a, √(1−a))
        d = R·c

    This is the standard Haversine formula — accurate to within ~0.5%
    for terrestrial distances, which is more than sufficient for
    "which cold storage is closest to this farm" at village/district
    scale (it doesn't need surveying-grade precision, just correct
    ranking of nearby facilities).
    """
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)

    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return EARTH_RADIUS_KM * c


@dataclass
class NearestFacility:
    id: int
    name: str
    lat: float
    lon: float
    distance_km: float
    capacity_tons: float | None
    district: str | None


class NoColdStorageDataError(RuntimeError):
    """
    Raised when the cold_storages table has no records. Zero-mock-logic
    means we say so plainly rather than silently returning an empty
    list that could be misread as "no facilities nearby" when the real
    situation is "no data has been loaded yet."
    """
    pass


async def find_nearest(
    session: AsyncSession, lat: float, lon: float, limit: int = 5, max_distance_km: float | None = None
) -> list[NearestFacility]:
    """
    Real nearest-N query: pulls all cold storage records, computes real
    Haversine distance from the given point to each, sorts, returns the
    closest `limit`. Fine at the scale of this dataset (India has on
    the order of a few thousand registered cold storages nationally —
    see README); migrate to a PostGIS spatial index (ST_DWithin /
    KNN operator) before this needs to scale to a much larger table or
    tighter latency requirements.
    """
    result = await session.execute(select(ColdStorage))
    facilities = result.scalars().all()

    if not facilities:
        raise NoColdStorageDataError(
            "No cold storage facility data has been loaded yet. Run "
            "scripts/import_cold_storage_csv.py with a real sourced dataset "
            "(see backend/README.md for where to get one) before using this endpoint."
        )

    scored = []
    for f in facilities:
        dist = haversine_distance_km(lat, lon, f.lat, f.lon)
        if max_distance_km is not None and dist > max_distance_km:
            continue
        scored.append(NearestFacility(
            id=f.id, name=f.name, lat=f.lat, lon=f.lon,
            distance_km=round(dist, 2), capacity_tons=f.capacity_tons, district=f.district,
        ))

    scored.sort(key=lambda x: x.distance_km)
    return scored[:limit]
