"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Executive Command", icon: "⚡" },
  { href: "/dashboard/irrigation", label: "FAO-56 Irrigation", icon: "💧" },
  { href: "/dashboard/crop-health", label: "Leaf Pathology AI", icon: "🌿" },
  { href: "/dashboard/harvest-timing", label: "Post-Harvest Shelf Life", icon: "⏱" },
  { href: "/dashboard/cold-storage", label: "Cold Chain Hubs", icon: "🏭" },
  { href: "/dashboard/market", label: "Mandi Economics", icon: "💰" },
  { href: "/dashboard/climate", label: "16-Day Climate Risk", icon: "🌤" },
  { href: "/dashboard/second-income", label: "Solar Agrivoltaics", icon: "☀️" },
  { href: "/dashboard/impact", label: "Verifiable Impact", icon: "📈" },
  { href: "/allocation", label: "FPO Capacity Grid", icon: "🏢" },
  { href: "/dashboard/my-farm", label: "Digital Twin Setup", icon: "📍" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#FBF9F5] text-slate-800 antialiased selection:bg-emerald-500/20">
      {/* Executive Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-slate-200/80 bg-white/70 backdrop-blur-xl px-4 py-6 md:flex">
        <div>
          {/* Brand header */}
          <Link href="/" className="flex items-center gap-2.5 px-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-900/10">
              <span className="font-display font-bold text-lg">S</span>
            </div>
            <div>
              <p className="font-display text-lg font-bold tracking-tight text-slate-900 leading-none">
                Savitri
              </p>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                Agri-OS v0.5
              </span>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="mt-8 flex flex-col gap-1">
            {NAV.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm shadow-slate-900/10"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Plot Status Card */}
        <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/60 p-3.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-800 text-[11px]">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Sensor Mesh Online
            </span>
            <span className="rounded-full bg-emerald-200/70 px-2 py-0.5 text-[9px] font-bold text-emerald-900">
              ERA5 Live
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-600 font-medium">
            Active Plot: <span className="font-bold text-slate-800">Patna, Bihar</span>
          </p>
          <div className="mt-2 pt-2 border-t border-emerald-200/60 flex justify-between items-center text-[10px]">
            <Link href="https://t.me/SavitriAgriBot" target="_blank" className="text-emerald-700 hover:underline font-bold">
              Open Telegram Bot ↗
            </Link>
            <Link href="/dashboard/my-farm" className="text-slate-500 hover:underline">
              Switch Plot
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
        {children}
      </main>
    </div>
  );
}
