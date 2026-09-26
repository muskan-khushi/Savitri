"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { label: "Platform", href: "/dashboard" },
  { label: "Crop Health", href: "/dashboard/crop-health" },
  { label: "Cold Chain", href: "/allocation" },
  { label: "Impact", href: "/dashboard/impact" },
];

export function SiteNav() {
  const path = usePathname();

  // On all dashboard/platform pages, hide the global nav completely —
  // the dashboard sidebar is the sole navigation there.
  const hiddenOnDashboard =
    path.startsWith("/dashboard") ||
    path.startsWith("/allocation") ||
    path.startsWith("/onboarding");

  if (hiddenOnDashboard) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-soil/10 bg-cream/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* Wordmark — only place Fraunces is used */}
        <Link href="/" className="group">
          <span className="font-display text-[1.35rem] font-bold tracking-tight text-soil transition-opacity group-hover:opacity-60">
            Savitri
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`text-[13px] font-medium transition-colors ${
                path === n.href ? "text-soil" : "text-soil/45 hover:text-soil"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="rounded-full bg-soil px-5 py-2.5 text-[13px] font-semibold text-cream transition-all hover:bg-terracotta"
        >
          Open Dashboard
        </Link>
      </div>
    </header>
  );
}
