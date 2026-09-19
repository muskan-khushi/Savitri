/**
 * api.ts
 *
 * The one place the frontend talks to the real FastAPI backend.
 * Set NEXT_PUBLIC_API_URL in .env.local once the backend is deployed
 * (e.g. Render/Fly.io URL); defaults to localhost for local dev.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      // response wasn't JSON — keep statusText
    }
    throw new ApiError(res.status, detail);
  }
  return res.json();
}

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
  storage_days: number;
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

export const api = {
  createFarm: (payload: {
    name?: string;
    telegram_chat_id?: string;
    lat: number;
    lon: number;
    crop: string;
    sowing_date: string;
  }) => request<Farm>("/api/v1/farms", { method: "POST", body: JSON.stringify(payload) }),

  getFarm: (farmId: number) => request<Farm>(`/api/v1/farms/${farmId}`),

  getIrrigationAdvisory: (farmId: number) =>
    request<IrrigationAdvisory>(`/api/v1/farms/${farmId}/irrigation-advisory`, { method: "POST" }),

  getHistory: (farmId: number) => request<IrrigationAdvisory[]>(`/api/v1/farms/${farmId}/history`),

  getSpoilageRisk: (farmId: number, harvestDate: string) =>
    request<SpoilageRisk>(`/api/v1/farms/${farmId}/spoilage-risk?harvest_date=${harvestDate}`),

  getMarketAdvice: (
    farmId: number,
    params: { state: string; market?: string; storage_days?: number }
  ) => {
    const q = new URLSearchParams({
      state: params.state,
      ...(params.market ? { market: params.market } : {}),
      ...(params.storage_days ? { storage_days: String(params.storage_days) } : {}),
    });
    return request<MarketAdvice>(`/api/v1/farms/${farmId}/market-advice?${q}`);
  },

  getAgrivoltaicsEstimate: (payload: { state: string; land_acres: number }) =>
    request<AgrivoltaicsEstimate>("/api/v1/agrivoltaics-estimate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getNearestColdStorage: (lat: number, lon: number) =>
    request<unknown[]>(`/api/v1/cold-storage/nearest?lat=${lat}&lon=${lon}`),
};