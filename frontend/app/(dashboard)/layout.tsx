import Link from "next/link";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/irrigation", label: "Irrigation" },
  { href: "/dashboard/crop-health", label: "Crop Health" },
  { href: "/dashboard/harvest-timing", label: "Harvest Timing" },
  { href: "/dashboard/cold-storage", label: "Cold Storage" },
  { href: "/dashboard/market", label: "Market" },
  { href: "/dashboard/second-income", label: "Second Income" },
  { href: "/dashboard/climate", label: "Climate & Insurance" },
  { href: "/dashboard/my-farm", label: "My Farm" },
];

/**
 * Dashboard shell — a real technical decision worth flagging: the
 * plan's directory spec puts marketing and dashboard route groups
 * both at "/", which Next.js can't resolve (two page.tsx files both
 * mapping to the same URL). Nesting the dashboard group's real pages
 * under a literal /dashboard segment is the practical resolution.
 *
 * "One job per page" — this sidebar is real navigation between real
 * jobs, not a mega-dashboard trying to do all nine at once.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r border-soil/10 bg-wheat/20 px-4 py-8 md:block">
        <Link href="/" className="px-2 font-display text-lg text-soil">
          Savitri
        </Link>
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-soil/70 transition-colors hover:bg-wheat/60 hover:text-soil"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 bg-dawn-cream px-6 py-8 md:px-10 md:py-10">
        {children}
      </main>
    </div>
  );
}
