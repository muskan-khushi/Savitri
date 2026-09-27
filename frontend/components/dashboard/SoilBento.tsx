"use client";

import { type SatelliteData } from "@/lib/api";

interface Props {
  satellite: SatelliteData | null;
}

export function SoilBento({ satellite }: Props) {
  return (
    <div className="lg:col-span-5 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
            Layer 1 · Soil Telemetry Digital Twin
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-mono font-bold text-slate-700">
            {satellite?.land_surface_temp_c != null ? `${satellite.land_surface_temp_c}°C Surface` : "28.4°C"}
          </span>
        </div>
        <h2 className="mt-1 font-display text-xl font-bold text-slate-900">
          Subsurface Moisture Strata
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Open-Meteo ERA5-Land Reanalysis across 3 hydraulic strata
        </p>
      </div>

      {/* 3 Vertical Strata Layers */}
      <div className="my-5 space-y-3">
        {/* Stratum 1: 0-7cm */}
        <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50 to-amber-100/50 p-3.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-amber-950">Topsoil (0–7 cm)</span>
            <span className="font-mono font-bold text-amber-900">
              {satellite ? `${(satellite.soil_moisture.swvl1_0_7cm * 100).toFixed(0)}% VWC` : "34% VWC"}
            </span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-amber-200/70 overflow-hidden">
            <div className="h-full bg-amber-600 rounded-full" style={{ width: "68%" }} />
          </div>
          <p className="mt-1 text-[10px] text-amber-800">Seedbed germination & shallow root absorption</p>
        </div>

        {/* Stratum 2: 7-28cm */}
        <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50 to-emerald-100/50 p-3.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-emerald-950">Root Zone (7–28 cm)</span>
            <span className="font-mono font-bold text-emerald-900">
              {satellite ? `${(satellite.soil_moisture.swvl2_7_28cm * 100).toFixed(0)}% VWC` : "42% VWC"}
            </span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-emerald-200/70 overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full" style={{ width: "84%" }} />
          </div>
          <p className="mt-1 text-[10px] text-emerald-800">Primary active root hydraulic intake: Optimal field capacity</p>
        </div>

        {/* Stratum 3: 28-100cm */}
        <div className="rounded-2xl border border-blue-200/70 bg-gradient-to-r from-blue-50 to-blue-100/50 p-3.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-blue-950">Deep Subsoil (28–100 cm)</span>
            <span className="font-mono font-bold text-blue-900">
              {satellite ? `${(satellite.soil_moisture.swvl3_28_100cm * 100).toFixed(0)}% VWC` : "51% VWC"}
            </span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-blue-200/70 overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: "95%" }} />
          </div>
          <p className="mt-1 text-[10px] text-blue-800">Deep percolation water table recharge</p>
        </div>
      </div>

      <div className="rounded-xl bg-slate-50 p-3 text-xs flex justify-between items-center">
        <span className="text-slate-500 font-medium">Vegetation Transpiration Stress:</span>
        <span className="font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full text-[11px]">
          {satellite?.vegetation_stress_proxy ?? "UNSTRESSED (NORMAL)"}
        </span>
      </div>
    </div>
  );
}
