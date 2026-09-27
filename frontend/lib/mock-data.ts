/**
 * mock-data.ts
 *
 * Realistic demo data for every dashboard page.
 * Used ONLY when the backend is unreachable (Demo Mode).
 * All values are agronomically plausible for a rice farm in Patna, Bihar.
 */

import type {
  IrrigationAdvisory,
  SatelliteData,
  ClimateRisk,
  ColdStorageFacility,
  MarketAdvice,
  DiseasePrediction,
  SpoilageRisk,
  AgrivoltaicsEstimate,
} from "./api";

const TODAY = new Date().toISOString().split("T")[0];

export const DEMO_FARM = {
  id: 1,
  name: "Demo Farm — Patna, Bihar",
  lat: 25.594,
  lon: 85.138,
  crop: "rice",
  sowing_date: (() => {
    const d = new Date();
    d.setDate(d.getDate() - 60);
    return d.toISOString().split("T")[0];
  })(),
};

export const DEMO_IRRIGATION: IrrigationAdvisory = {
  farm_lat: 25.594,
  farm_lon: 85.138,
  date: TODAY,
  crop: "rice",
  growth_stage: "mid-season",
  days_after_sowing: 60,
  t_max_c: 31.4,
  t_min_c: 24.8,
  precipitation_mm: 0,
  wind_2m_ms: 2.1,
  et0_mm_day: 4.35,
  kc: 1.15,
  etc_mm_day: 5.0,
  effective_rainfall_mm: 0,
  net_irrigation_mm: 5.0,
  should_irrigate: true,
  recommendation_text:
    "Irrigate today — apply 5.0 mm. Crop ET demand (5.0 mm) exceeds available rainfall (0 mm). Atmospheric demand is high at 31°C.",
};

export const DEMO_SATELLITE: SatelliteData = {
  lat: 25.594,
  lon: 85.138,
  date: TODAY,
  soil_moisture: {
    swvl1_0_7cm: 0.28,
    swvl2_7_28cm: 0.24,
    swvl3_28_100cm: 0.19,
  },
  land_surface_temp_c: 30.2,
  shortwave_radiation_mj_m2: 18.4,
  moisture_fraction_0_7cm: 0.93,
  vegetation_stress_proxy: 0.07,
  stress_level: "none",
  source: "Demo Mode — ERA5-Land sample values for Patna, Bihar",
  note: "This is demo data. Connect your backend to see real satellite-derived field indices.",
};

export const DEMO_CLIMATE: ClimateRisk = {
  lat: 25.594,
  lon: 85.138,
  crop: "rice",
  forecast_days: 16,
  total_forecast_precip_mm: 42.5,
  total_forecast_et0_mm: 68.2,
  drought_index: 0.38,
  drought_risk_level: "low",
  heat_stress_gdd: 12.4,
  heat_stress_level: "none",
  pmfby_nudge: false,
  pmfby_reason: null,
  heat_threshold_used_c: 35.0,
  recommendation_text:
    "Low drought risk over the next 16 days. Forecast rainfall (42.5 mm) partially covers crop demand (68.2 mm ET₀). Monitor soil moisture closely in the second week.",
  note: "Demo Mode — sample 16-day forecast for Patna, Bihar.",
};

export const DEMO_COLD_STORAGE: ColdStorageFacility[] = [
  {
    id: 1,
    name: "Patna Cold Storage Ltd.",
    lat: 25.612,
    lon: 85.154,
    distance_km: 2.4,
    capacity_tons: 2500,
    district: "Patna",
  },
  {
    id: 2,
    name: "Bihar State Warehousing Corp.",
    lat: 25.571,
    lon: 85.101,
    distance_km: 5.8,
    capacity_tons: 5000,
    district: "Patna",
  },
  {
    id: 3,
    name: "Danapur Agri Cold Chain",
    lat: 25.637,
    lon: 85.047,
    distance_km: 9.2,
    capacity_tons: 1200,
    district: "Patna",
  },
];

export const DEMO_MARKET: MarketAdvice = {
  commodity: "rice",
  state: "Bihar",
  latest_modal_price_per_kg: 21.5,
  latest_arrival_date: TODAY,
  trend_per_day_per_kg: 0.12,
  trend_method: "ols_linear_regression",
  storage_days: 3,
  high_price_volatility: false,
  coefficient_of_variation: 0.08,
  assumed_storage_cost_per_kg: 1.5,
  assumed_transport_cost_per_kg: 0.5,
  projected_gain_per_kg: 0.36,
  recommendation_text:
    "OLS price trend suggests storing 3 more day(s) nets roughly Rs 0.36/kg after storage and transport costs.",
};

export const DEMO_DISEASE: DiseasePrediction = {
  predicted_class: "rice___healthy",
  crop: "rice",
  condition: "Healthy",
  confidence: 0.94,
  is_healthy: true,
  top5: [
    ["rice___healthy", 0.94],
    ["rice___brown_spot", 0.04],
    ["rice___leaf_blast", 0.02],
    ["rice___bacterial_blight", 0.00],
    ["rice___tungro", 0.00],
  ],
};

export const DEMO_SPOILAGE: SpoilageRisk = {
  crop: "rice",
  days_since_harvest: 5,
  reference_shelf_life_days: 270,
  effective_shelf_life_days: 265,
  risk_ratio: 0.02,
  risk_level: "low",
  recommendation_text:
    "Rice is shelf-stable at ambient temperature. Current spoilage risk is very low. Consider cold storage only for extended storage beyond 6 months.",
  note: "Demo Mode — Q10-based spoilage model for rice at 30°C ambient storage.",
};

export const DEMO_AGRIVOLTAICS: AgrivoltaicsEstimate = {
  state: "Bihar",
  land_acres: 2.0,
  annual_income_estimate: 20000,
  rate_basis: "Rs 10,000/acre/year",
  source:
    "Bihar Renewable Energy Development Agency (BREDA): PM-KUSUM Component A land lease ~Rs 10,000/acre/year",
};
