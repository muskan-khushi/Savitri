from datetime import date
from pydantic import BaseModel, Field
from typing import Optional


class FarmCreate(BaseModel):
    name: Optional[str] = None
    telegram_chat_id: Optional[str] = None
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    crop: str
    sowing_date: date


class FarmOut(BaseModel):
    id: int
    name: Optional[str]
    telegram_chat_id: Optional[str]
    lat: float
    lon: float
    crop: str
    sowing_date: date

    class Config:
        from_attributes = True


class IrrigationLogOut(BaseModel):
    id: int
    advisory_date: str
    t_max_c: float
    t_min_c: float
    precipitation_mm: float
    et0_mm_day: float
    kc: float
    etc_mm_day: float
    effective_rainfall_mm: float
    net_irrigation_mm: float
    should_irrigate: bool
    recommendation_text: str

    class Config:
        from_attributes = True
