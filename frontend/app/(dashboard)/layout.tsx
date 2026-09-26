"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    section: "Platform",
    items: [
      { href: "/dashboard", label: "Overview" },
      { href: "/dashboard/my-farm", label: "My Farm" },
    ],
  },
  {
    section: "AI Layers",
    items: [
      { href: "/dashboard/irrigation", label: "Irrigation" },
      { href: "/dashboard/crop-health", label: "Crop Health" },
      { href: "/dashboard/harvest-timing", label: "Harvest Timing" },
      { href: "/dashboard/cold-storage", label: "Cold Storage" },
      { href: "/dashboard/market", label: "Mandi Prices" },
      { href: "/dashboard/climate", label: "Climate Risk" },
      { href: "/dashboard/second-income", label: "Solar Income" },
    ],
  },
  {
    section: "Reports",
    items: [
      { href: "/dashboard/impact", label: "Impact" },
      { href: "/allocation", label: "FPO Allocation" },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-[#f8f6f2] text-soil antialiased">

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className="hidden w-52 shrink-0 flex-col border-r border-soil/10 bg-[#faf8f5] md:flex">

        {/* Top: wordmark + home escape */}
        <div className="border-b border-soil/8 px-5 py-5">
          <Link href="/" className="group block">
            <span className="font-display text-xl font-bold tracking-tight text-soil transition-opacity group-hover:opacity-60">
              Savitri
            </span>
            <p className="mt-0.5 text-[10px] font-medium text-soil/35 group-hover:text-soil/60 transition-colors">
              ← Back to home
            </p>
          </Link>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV.map((section) => (
            <div key={section.section} className="mb-6">
              <p className="mb-1 px-2 text-[9px] font-bold uppercase tracking-[0.15em] text-soil/30">
                {section.section}
              </p>
              {section.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center rounded-lg px-2 py-2 text-[13px] transition-all ${
                      active
                        ? "bg-soil text-cream font-semibold"
                        : "text-soil/55 hover:bg-soil/5 hover:text-soil font-medium"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom: Telegram */}
        <div className="border-t border-soil/8 px-5 py-4">
          <Link
            href="https://t.me/SavitriAgriBot"
            target="_blank"
            className="text-[11px] font-medium text-soil/35 transition-colors hover:text-soil"
          >
            Telegram Bot ↗
          </Link>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Mobile top bar (only visible on small screens) */}
        <div className="flex items-center justify-between border-b border-soil/10 bg-[#faf8f5] px-4 py-3 md:hidden">
          <Link href="/" className="font-display text-lg font-bold text-soil">
            Savitri
          </Link>
          <Link href="/" className="text-[12px] font-medium text-soil/50">
            ← Home
          </Link>
        </div>

        <main className="flex-1 overflow-y-auto px-5 py-7 sm:px-8 sm:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
