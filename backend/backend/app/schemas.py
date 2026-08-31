from pydantic import BaseModel, Field
from typing import Optional


class IrrigationRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90, description="Farm latitude")
    lon: float = Field(..., ge=-180, le=180, description="Farm longitude")
    crop: str = Field(..., description="Crop name, e.g. 'rice', 'wheat', 'maize'")
    days_after_sowing: int = Field(..., ge=0, description="Days since sowing/transplanting")
    date: Optional[str] = Field(
        None, description="ISO date (YYYY-MM-DD). Defaults to today if omitted."
    )


class ErrorResponse(BaseModel):
    error: str
    detail: str
