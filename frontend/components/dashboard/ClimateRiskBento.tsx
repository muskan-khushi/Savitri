"use client";

import Link from "next/link";
import { type ClimateRisk } from "@/lib/api";

interface Props {
  climate: ClimateRisk | null;
}

export function ClimateRiskBento({ climate }: Props) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
            Layer 7 · 16-Day Extended Radar
          </span>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
            Climate Defense
          </span>
        </div>
        <h3 className="mt-2 font-display text-lg font-bold text-slate-900">
          Drought &amp; Thermal Stress Index
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">Extended 16-day water deficit projection</p>

        <div className="mt-4 space-y-3">
          <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100 flex justify-between items-center">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Drought Severity</p>
              <p className="font-display font-bold text-base text-slate-900">
                {climate?.drought_risk_level.toUpperCase() ?? "NONE (MONSOON SATURATED)"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Deficit Index</p>
              <p className="font-mono font-bold text-slate-700">
                {climate ? `${(climate.drought_index * 100).toFixed(0)}%` : "0%"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100 flex justify-between items-center">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Heat Stress Degree Days</p>
              <p className="font-mono font-bold text-base text-slate-900">
                {climate ? `${climate.heat_stress_gdd.toFixed(1)} GDD` : "0.0 GDD"}
              </p>
            </div>
            <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-700">
              {climate?.heat_stress_level.toUpperCase() ?? "NOMINAL"}
            </span>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs">
          <p className="font-bold text-amber-950">🛡️ PMFBY Crop Insurance Status:</p>
          <p className="text-amber-900 text-[11px] mt-0.5">
            {climate?.pmfby_nudge
              ? climate.pmfby_reason
              : "Current rainfall is adequate. No automatic drought insurance claim trigger."}
          </p>
        </div>
      </div>

      <Link href="/dashboard/climate" className="mt-4 text-xs font-bold text-slate-700 hover:text-amber-700 flex items-center justify-between">
        <span>View 16-Day Forecast Grid</span>
        <span>→</span>
      </Link>
    </div>
  );
}
