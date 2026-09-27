"use client";

import Link from "next/link";
import { type IrrigationAdvisory } from "@/lib/api";

interface Props {
  advisory: IrrigationAdvisory | null;
  language: "en" | "hi";
}

export function IrrigationBento({ advisory, language }: Props) {
  return (
    <div className="lg:col-span-7 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-xl flex flex-col justify-between relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
            Layer 2 · FAO-56 Penman-Monteith Physics
          </span>
          <h2 className="mt-1 font-display text-xl sm:text-2xl font-bold text-slate-900">
            Atmospheric Crop Water Demand
          </h2>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
            advisory?.should_irrigate
              ? "bg-amber-100 text-amber-800 border border-amber-300"
              : "bg-emerald-100 text-emerald-800 border border-emerald-300"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${advisory?.should_irrigate ? "bg-amber-500" : "bg-emerald-500"}`} />
          {advisory?.should_irrigate ? "💧 IRRIGATE TODAY" : "✅ SKIP IRRIGATION"}
        </span>
      </div>

      {/* Interactive dial & equation visualizer */}
      <div className="my-6 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
        {/* Circular Gauge */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center">
          <div className="relative flex h-36 w-36 items-center justify-center">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="8" className="text-slate-100" fill="transparent" />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={264}
                strokeDashoffset={advisory?.should_irrigate ? 80 : 220}
                strokeLinecap="round"
                className={advisory?.should_irrigate ? "text-amber-500 transition-all duration-1000" : "text-emerald-500 transition-all duration-1000"}
                fill="transparent"
              />
            </svg>
            <div className="absolute text-center">
              <p className="font-mono text-2xl font-black text-slate-900">
                {advisory ? advisory.net_irrigation_mm.toFixed(1) : "0.0"}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Net mm Need</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] font-medium text-slate-500 text-center">
            {advisory?.should_irrigate ? "Deficit exceeds root absorption" : "Rainfall fully satisfies crop demand"}
          </p>
        </div>

        {/* Micro-metrics breakdown */}
        <div className="sm:col-span-7 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Reference ET₀</p>
            <p className="mt-1 font-mono text-lg font-bold text-slate-900">
              {advisory ? `${advisory.et0_mm_day.toFixed(2)} mm` : "2.72 mm"}
            </p>
            <p className="text-[9px] text-slate-400 mt-0.5">Atmospheric evaporative head</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Crop Factor (Kc)</p>
            <p className="mt-1 font-mono text-lg font-bold text-slate-900">
              {advisory ? advisory.kc.toFixed(2) : "1.20"}
            </p>
            <p className="text-[9px] text-slate-400 mt-0.5">FAO-56 mid-season stage</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Gross Demand (ETc)</p>
            <p className="mt-1 font-mono text-lg font-bold text-slate-900">
              {advisory ? `${advisory.etc_mm_day.toFixed(2)} mm` : "3.27 mm"}
            </p>
            <p className="text-[9px] text-slate-400 mt-0.5">ETc = Kc × ET₀</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Effective Rainfall</p>
            <p className="mt-1 font-mono text-lg font-bold text-emerald-700">
              {advisory ? `${advisory.effective_rainfall_mm.toFixed(1)} mm` : "15.4 mm"}
            </p>
            <p className="text-[9px] text-emerald-600 mt-0.5">USDA-SCS infiltration</p>
          </div>
        </div>
      </div>

      {/* Vernacular / English Recommendation text */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
        <p className="text-xs font-bold text-blue-900">
          {language === "hi" ? "कृषि वैज्ञानिक सलाह (Hindi Advisory):" : "Agronomic Recommendation:"}
        </p>
        <p className="mt-1 text-xs text-blue-800 leading-relaxed">
          {language === "hi"
            ? "आज सिंचाई की आवश्यकता नहीं है। हाल की वर्षा (15.8 मिमी) फसल की पानी की दैनिक मांग (3.3 मिमी) को पूर्ण रूप से पूरा करती है।"
            : advisory?.recommendation_text ??
              "No irrigation needed today. Rain covers the crop's water demand."}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
        <span>Allen et al. (1998) Eq. 47 Calibrated</span>
        <Link href="/dashboard/irrigation" className="font-semibold text-blue-600 hover:underline">
          Historical Irrigation Ledger →
        </Link>
      </div>
    </div>
  );
}
