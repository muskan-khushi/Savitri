"use client";

import Link from "next/link";

export function MarketBento() {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
            Layer 6 · Agmarknet Mandi OLS
          </span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            Live Government Feed
          </span>
        </div>
        <h3 className="mt-2 font-display text-lg font-bold text-slate-900">
          Market Economics &amp; Sell Timing
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">Commodity: Rice (Common) · State: Bihar</p>

        <div className="mt-4 rounded-2xl bg-slate-50 p-4 border border-slate-100">
          <div className="flex justify-between items-baseline">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Latest Modal Price</p>
              <p className="font-mono text-2xl font-black text-slate-900">₹2,180</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Unit Rate</p>
              <p className="font-mono text-base font-bold text-slate-700">₹21.80 / kg</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200/60 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">OLS Linear Slope:</span>
            <span className="font-mono font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-lg">
              ↗ +₹18.4 / day
            </span>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs">
          <p className="font-bold text-emerald-900">Strategic Recommendation:</p>
          <p className="text-emerald-800 text-[11px] mt-0.5">
            Upward price velocity indicates holding produce in cold storage yields +₹240/qtl after 14 days net of storage fee.
          </p>
        </div>
      </div>

      <Link href="/dashboard/market" className="mt-4 text-xs font-bold text-slate-700 hover:text-emerald-700 flex items-center justify-between">
        <span>Open Full Mandi Terminal</span>
        <span>→</span>
      </Link>
    </div>
  );
}
