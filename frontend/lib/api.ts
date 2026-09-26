/**
 * api.ts
 *
 * The single source of truth for all frontend→backend communication.
 * Set NEXT_PUBLIC_API_URL in .env.local (e.g. Render/Fly.io URL);
 * defaults to localhost:8000 for local dev.
 *
 * Every function here corresponds exactly to a real FastAPI endpoint.
 * Named exports are provided in addition to the `api` object for
 * convenience (pages can import either way).
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Error class ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  detail?: string;
  constructor(status: number, message: string, detail?: string) {
    super(message);
    this.status = status;
    this.detail = detail;
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let detail: string | undefined;
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body.detail) {
        detail = String(body.detail);
        message = detail;
      }
    } catch {
      // response wasn't JSON
    }
    throw new ApiError(res.status, message, detail);
  }
  return res.json() as Promise<T>;
}

async function multipartRequest<T>(
  path: string,
  formData: FormData
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    body: formData,
    // Do NOT set Content-Type — browser sets multipart boundary automatically
  });
  if (!res.ok) {
    let detail: string | undefined;
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body.detail) {
        detail = String(body.detail);
        message = detail;
      }
    } catch {
      // response wasn't JSON
    }
    throw new ApiError(res.status, message, detail);
  }
  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Farm {
  id: number;
  name: string | null;
  telegram_chat_id: string | null;
  lat: number;
  lon: number;
  crop: string;
  sowing_date: string;
}

export interface IrrigationAdvisory {
  farm_lat: number;
  farm_lon: number;
  date: string;
  crop: string;
  growth_stage: string;
  days_after_sowing: number;
  t_max_c: number;
  t_min_c: number;
  precipitation_mm: number;
  wind_2m_ms: number;
  et0_mm_day: number;
  kc: number;
  etc_mm_day: number;
  effective_rainfall_mm: number;
  net_irrigation_mm: number;
  should_irrigate: boolean;
  recommendation_text: string;
}

export interface DiseasePrediction {
  predicted_class: string;
  crop: string;
  condition: string;
  is_healthy: boolean;
  confidence: number;
  top5: [string, number][];
}

export interface SpoilageRisk {
  crop: string;
  days_since_harvest: number;
  reference_shelf_life_days: number;
  effective_shelf_life_days: number;
  risk_ratio: number;
  risk_level: "low" | "medium" | "high";
  recommendation_text: string;
  note: string;
}

export interface MarketAdvice {
  commodity: string;
  state: string;
  latest_modal_price_per_kg: number | null;
  latest_arrival_date: string | null;
  trend_per_day_per_kg: number | null;
  trend_method: string;
  storage_days: number;
  high_price_volatility: boolean;
  coefficient_of_variation: number | null;
  assumed_storage_cost_per_kg: number;
  assumed_transport_cost_per_kg: number;
  projected_gain_per_kg: number | null;
  recommendation_text: string;
}

export interface AgrivoltaicsEstimate {
  state: string;
  land_acres: number;
  annual_income_estimate: number;
  rate_basis: string;
  source: string;
}

export interface ColdStorageFacility {
  id: number;
  name: string;
  lat: number;
  lon: number;
  distance_km: number;
  capacity_tons: number | null;
  district: string | null;
}

export interface ColdStorageBooking {
  booking_id: number;
  facility_id: number;
  facility_name: string;
  farm_id: number;
  quantity_tons: number;
  start_date: string;
  end_date: string;
  status: string;
  available_capacity_tons: number;
}

export interface SatelliteData {
  lat: number;
  lon: number;
  date: string;
  soil_moisture: {
    swvl1_0_7cm: number;
    swvl2_7_28cm: number;
    swvl3_28_100cm: number;
  };
  land_surface_temp_c: number | null;
  shortwave_radiation_mj_m2: number | null;
  moisture_fraction_0_7cm: number;
  vegetation_stress_proxy: number;
  stress_level: "none" | "mild" | "moderate" | "severe";
  source: string;
  note: string;
}

export interface ClimateRisk {
  lat: number;
  lon: number;
  crop: string | null;
  forecast_days: number;
  total_forecast_precip_mm: number;
  total_forecast_et0_mm: number;
  drought_index: number;
  drought_risk_level: "none" | "low" | "moderate" | "high";
  heat_stress_gdd: number;
  heat_stress_level: "none" | "low" | "moderate" | "high";
  pmfby_nudge: boolean;
  pmfby_reason: string | null;
  heat_threshold_used_c: number;
  recommendation_text: string;
  note: string;
}

export interface OutbreakWarning {
  crop: string;
  condition: string;
  case_count: number;
  radius_km: number;
  lookback_days: number;
  earliest_detection: string;
  latest_detection: string;
  warning_text: string;
}

// ─── Named convenience exports (backward compat + direct imports) ─────────────

export async function getIrrigationAdvisory(
  farmId: number
): Promise<IrrigationAdvisory> {
  return request<IrrigationAdvisory>(
    `/api/v1/farms/${farmId}/irrigation-advisory`,
    { method: "POST" }
  );
}

export async function detectDisease(
  imageFile: File,
  params?: { lat?: number; lon?: number; farmId?: number }
): Promise<DiseasePrediction> {
  const formData = new FormData();
  formData.append("image", imageFile);
  const search = new URLSearchParams();
  if (params?.lat !== undefined) search.set("lat", String(params.lat));
  if (params?.lon !== undefined) search.set("lon", String(params.lon));
  if (params?.farmId !== undefined) search.set("farm_id", String(params.farmId));
  const qs = search.toString();
  return multipartRequest<DiseasePrediction>(
    `/api/v1/disease-detection${qs ? `?${qs}` : ""}`,
    formData
  );
}

export async function getNearestColdStorage(
  lat: number,
  lon: number,
  limit = 5
): Promise<ColdStorageFacility[]> {
  return request<ColdStorageFacility[]>(
    `/api/v1/cold-storage/nearest?lat=${lat}&lon=${lon}&limit=${limit}`
  );
}

export async function getClimateRisk(
  lat: number,
  lon: number,
  crop?: string
): Promise<ClimateRisk> {
  const q = new URLSearchParams({ lat: String(lat), lon: String(lon) });
  if (crop) q.set("crop", crop);
  return request<ClimateRisk>(`/api/v1/climate-risk?${q}`);
}

export async function getFieldIndices(
  lat: number,
  lon: number
): Promise<SatelliteData> {
  return request<SatelliteData>(
    `/api/v1/field-indices?lat=${lat}&lon=${lon}`
  );
}

export async function getOutbreakWarnings(
  lat: number,
  lon: number
): Promise<OutbreakWarning[]> {
  return request<OutbreakWarning[]>(
    `/api/v1/outbreak-warnings?lat=${lat}&lon=${lon}`
  );
}

// ─── api object (original interface preserved) ────────────────────────────────

export const api = {
  createFarm: (payload: {
    name?: string;
    telegram_chat_id?: string;
    lat: number;
    lon: number;
    crop: string;
    sowing_date: string;
  }) =>
    request<Farm>("/api/v1/farms", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getFarm: (farmId: number) => request<Farm>(`/api/v1/farms/${farmId}`),

  listCrops: () =>
    request<{ crops: string[] }>("/api/v1/crops"),

  getIrrigationAdvisory,

  getHistory: (farmId: number) =>
    request<IrrigationAdvisory[]>(`/api/v1/farms/${farmId}/history`),

  getSpoilageRisk: (farmId: number, harvestDate: string) =>
    request<SpoilageRisk>(
      `/api/v1/farms/${farmId}/spoilage-risk?harvest_date=${harvestDate}`
    ),

  getMarketAdvice: (
    farmId: number,
    params: { state: string; market?: string; storage_days?: number }
  ) => {
    const q = new URLSearchParams({ state: params.state });
    if (params.market) q.set("market", params.market);
    if (params.storage_days)
      q.set("storage_days", String(params.storage_days));
    return request<MarketAdvice>(
      `/api/v1/farms/${farmId}/market-advice?${q}`
    );
  },

  getAgrivoltaicsEstimate: (payload: { state: string; land_acres: number }) =>
    request<AgrivoltaicsEstimate>("/api/v1/agrivoltaics-estimate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getNearestColdStorage,

  bookColdStorage: (payload: {
    facility_id: number;
    farm_id: number;
    quantity_tons: number;
    start_date: string;
    end_date: string;
  }) =>
    request<ColdStorageBooking>("/api/v1/cold-storage/book", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getFarmBookings: (farmId: number) =>
    request<ColdStorageBooking[]>(`/api/v1/farms/${farmId}/bookings`),

  detectDisease,

  getClimateRisk,

  getFieldIndices,

  getOutbreakWarnings,
};