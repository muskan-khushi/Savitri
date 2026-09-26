"""
cold_storage_booking_service.py

Slot booking and capacity management for the cold-storage marketplace
(Layer 5). A farmer books a specific cold-storage facility for a date
range; the system checks available capacity against existing bookings
and confirms or rejects.

Allocation logic: first-come, first-served for MVP. The technical
plan mentions a bipartite-matching upgrade path — that would be the
next iteration for multi-facility, multi-date optimization.

Every booking deducts from the facility's rated capacity (capacity_tons)
against the sum of overlapping confirmed bookings. An honest
CapacityExceededError is raised rather than silently overbooking.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Optional

from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models_db import ColdStorage, ColdStorageBooking


class CapacityExceededError(RuntimeError):
    pass


class FacilityNotFoundError(RuntimeError):
    pass


class BookingNotFoundError(RuntimeError):
    pass


@dataclass
class BookingResult:
    booking_id: int
    facility_id: int
    facility_name: str
    farm_id: int
    quantity_tons: float
    start_date: str
    end_date: str
    status: str
    available_capacity_tons: float


async def check_availability(
    session: AsyncSession, facility_id: int,
    start: date, end: date, requested_tons: float
) -> float:
    """
    Returns available capacity (tons) at the facility over the requested
    date range. Raises FacilityNotFoundError if the facility doesn't exist.
    """
    facility = await session.get(ColdStorage, facility_id)
    if facility is None:
        raise FacilityNotFoundError(f"Cold storage facility #{facility_id} not found.")

    rated_capacity = facility.capacity_tons or 0.0

    # Sum of ALL confirmed bookings that overlap with [start, end]
    # Overlap condition: booking.start_date < end AND booking.end_date > start
    result = await session.execute(
        select(func.coalesce(func.sum(ColdStorageBooking.quantity_tons), 0.0))
        .where(
            and_(
                ColdStorageBooking.facility_id == facility_id,
                ColdStorageBooking.status == "confirmed",
                ColdStorageBooking.start_date < end,
                ColdStorageBooking.end_date > start,
            )
        )
    )
    booked_tons = float(result.scalar())
    return max(rated_capacity - booked_tons, 0.0)


async def create_booking(
    session: AsyncSession,
    facility_id: int,
    farm_id: int,
    quantity_tons: float,
    start_date: date,
    end_date: date,
) -> BookingResult:
    """
    Creates a booking if capacity is available. Raises CapacityExceededError
    if the facility cannot accommodate the requested quantity over the
    requested dates. Raises FacilityNotFoundError if the facility is unknown.
    """
    if quantity_tons <= 0:
        raise ValueError("quantity_tons must be positive.")
    if end_date <= start_date:
        raise ValueError("end_date must be after start_date.")

    available = await check_availability(session, facility_id, start_date, end_date, quantity_tons)

    if quantity_tons > available:
        raise CapacityExceededError(
            f"Requested {quantity_tons:.1f} tons exceeds available capacity "
            f"({available:.1f} tons) at facility #{facility_id} from {start_date} to {end_date}."
        )

    facility = await session.get(ColdStorage, facility_id)

    booking = ColdStorageBooking(
        facility_id=facility_id,
        farm_id=farm_id,
        quantity_tons=quantity_tons,
        start_date=start_date,
        end_date=end_date,
        status="confirmed",
    )
    session.add(booking)
    await session.commit()
    await session.refresh(booking)

    return BookingResult(
        booking_id=booking.id,
        facility_id=facility_id,
        facility_name=facility.name,
        farm_id=farm_id,
        quantity_tons=quantity_tons,
        start_date=start_date.isoformat(),
        end_date=end_date.isoformat(),
        status="confirmed",
        available_capacity_tons=available - quantity_tons,
    )


async def cancel_booking(
    session: AsyncSession, booking_id: int, farm_id: int
) -> dict:
    """
    Cancels a booking. Only the farm that made the booking can cancel it.
    Raises BookingNotFoundError if not found or not owned by this farm.
    """
    booking = await session.get(ColdStorageBooking, booking_id)
    if booking is None or booking.farm_id != farm_id:
        raise BookingNotFoundError(
            f"Booking #{booking_id} not found or does not belong to farm #{farm_id}."
        )
    if booking.status == "cancelled":
        raise ValueError(f"Booking #{booking_id} is already cancelled.")

    booking.status = "cancelled"
    await session.commit()
    return {"booking_id": booking_id, "status": "cancelled"}


async def get_farm_bookings(
    session: AsyncSession, farm_id: int
) -> list[ColdStorageBooking]:
    """Returns all bookings for a farm, newest first."""
    result = await session.execute(
        select(ColdStorageBooking)
        .where(ColdStorageBooking.farm_id == farm_id)
        .order_by(ColdStorageBooking.created_at.desc())
    )
    return list(result.scalars().all())
