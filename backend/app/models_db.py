"""
models_db.py

Two tables for this slice:

  Farm           - a farmer's plot: location, crop, sowing date.
                   Location stored as plain lat/lon floats for now.
                   NOTE: when the cold-storage matching slice is built
                   (Haversine distance queries), migrate this to a
                   PostGIS `geography(Point)` column for proper spatial
                   indexing — plain floats are fine for point storage
                   and single-farm lookups but not for "nearest N"
                   queries at scale. Flagged here rather than
                   over-building spatial infra before it's needed.

  IrrigationLog  - one row per advisory actually computed and shown to
                   a farmer. This is real history: every stored value
                   is a number that came out of the real FAO-56
                   calculation, not a placeholder.
"""

from datetime import date, datetime
from typing import Optional

from sqlalchemy import String, Float, Integer, Boolean, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Farm(Base):
    __tablename__ = "farms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=True)
    telegram_chat_id: Mapped[str] = mapped_column(String, nullable=True, index=True, unique=True)

    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)

    crop: Mapped[str] = mapped_column(String)
    sowing_date: Mapped[date] = mapped_column(Date)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    logs: Mapped[list["IrrigationLog"]] = relationship(back_populates="farm")

    def days_after_sowing(self, as_of: date | None = None) -> int:
        """Real calculation from the stored sowing date — never re-typed by the user."""
        as_of = as_of or date.today()
        return (as_of - self.sowing_date).days


class IrrigationLog(Base):
    __tablename__ = "irrigation_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    farm_id: Mapped[int] = mapped_column(ForeignKey("farms.id"), index=True)

    advisory_date: Mapped[str] = mapped_column(String)  # ISO date from the weather response
    t_max_c: Mapped[float] = mapped_column(Float)
    t_min_c: Mapped[float] = mapped_column(Float)
    precipitation_mm: Mapped[float] = mapped_column(Float)

    et0_mm_day: Mapped[float] = mapped_column(Float)
    kc: Mapped[float] = mapped_column(Float)
    etc_mm_day: Mapped[float] = mapped_column(Float)
    effective_rainfall_mm: Mapped[float] = mapped_column(Float)
    net_irrigation_mm: Mapped[float] = mapped_column(Float)
    should_irrigate: Mapped[bool] = mapped_column(Boolean)
    recommendation_text: Mapped[str] = mapped_column(String)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    farm: Mapped["Farm"] = relationship(back_populates="logs")


class ColdStorage(Base):
    """
    Real cold-storage facility records only — imported from an actual
    government/industry dataset via scripts/import_cold_storage_csv.py,
    never fabricated. If this table is empty, the nearest-facility
    endpoint says so honestly rather than returning nothing silently
    or inventing a plausible-looking result.

    lat/lon as plain floats, same tradeoff noted for Farm: fine for the
    dataset sizes involved here (low thousands of facilities
    nationally), computed in Python via the real Haversine formula
    rather than a spatial index. Migrate to PostGIS geography + ST_DWithin
    if/when this needs to scale to a much larger facility count or
    tighter query latency.
    """
    __tablename__ = "cold_storages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String)
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
    capacity_tons: Mapped[float] = mapped_column(Float, nullable=True)
    district: Mapped[str] = mapped_column(String, nullable=True)
    state: Mapped[str] = mapped_column(String, nullable=True)
    source: Mapped[str] = mapped_column(String, nullable=True)  # where this record came from

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class ColdStorageBooking(Base):
    """
    Records a confirmed cold-storage slot booking. capacity is checked
    against the sum of overlapping confirmed bookings (see
    cold_storage_booking_service.py). Cancelled bookings are kept for
    audit history — never deleted.
    """
    __tablename__ = "cold_storage_bookings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    facility_id: Mapped[int] = mapped_column(ForeignKey("cold_storages.id"), index=True)
    farm_id: Mapped[int] = mapped_column(ForeignKey("farms.id"), index=True)

    quantity_tons: Mapped[float] = mapped_column(Float)
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String, default="confirmed")  # 'confirmed' | 'cancelled'

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class DiseaseDetectionLog(Base):
    """
    Persists every real disease detection inference result. Used by
    outbreak_warning_service.py to aggregate regional disease signals.
    Only non-fabricated predictions (from a real trained checkpoint) are
    logged — the ModelNotTrainedError path never reaches this table.
    """
    __tablename__ = "disease_detection_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    farm_id: Mapped[Optional[int]] = mapped_column(ForeignKey("farms.id"), nullable=True, index=True)

    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
    crop: Mapped[str] = mapped_column(String)
    condition: Mapped[str] = mapped_column(String)
    is_healthy: Mapped[bool] = mapped_column(Boolean)
    confidence: Mapped[float] = mapped_column(Float)
    detection_date: Mapped[date] = mapped_column(Date, index=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
