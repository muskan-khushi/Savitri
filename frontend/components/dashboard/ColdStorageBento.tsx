"use client";

import Link from "next/link";
import { type ColdStorageFacility } from "@/lib/api";

interface Props {
  coldStorage: ColdStorageFacility[];
}

export function ColdStorageBento({ coldStorage }: Props) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600">
            Layer 5 · 50 Horticulture Hubs
          </span>
          <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700">
            Haversine Range
          </span>
        </div>
        <h3 className="mt-2 font-display text-lg font-bold text-slate-900">
          Nearby Cold Storage Network
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">Real verified facilities &amp; slot booking</p>

        <div className="mt-4 space-y-2.5">
          {coldStorage.slice(0, 2).map((fac) => (
            <div key={fac.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex justify-between items-start">
                <p className="font-bold text-xs text-slate-900 line-clamp-1">{fac.name}</p>
                <span className="font-mono text-[11px] font-bold text-teal-700 shrink-0 ml-2">
                  {fac.distance_km.toFixed(1)} km
                </span>
              </div>
              <div className="mt-1.5 flex justify-between items-center text-[10px] text-slate-500">
                <span>District: {fac.district}</span>
                <span className="font-mono font-semibold">{(fac.capacity_tons ?? 0).toLocaleString()} MT Capacity</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-xl border border-teal-200 bg-teal-50/70 p-3 text-xs">
          <p className="font-bold text-teal-950">First-Come-First-Served Booking:</p>
          <p className="text-teal-900 text-[11px] mt-0.5">
            Overlapping capacity checks ensure guaranteed slot reservation prior to harvest day.
          </p>
        </div>
      </div>

      <Link href="/allocation" className="mt-4 text-xs font-bold text-slate-700 hover:text-teal-700 flex items-center justify-between">
        <span>Inspect All 50 Hubs</span>
        <span>→</span>
      </Link>
    </div>
  );
}
