import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-soil/15 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-display text-2xl font-bold tracking-tight text-soil">
              Savitri
            </span>
            <span className="rounded-full bg-leaf/15 px-2.5 py-0.5 text-[11px] font-semibold text-leaf">
              AI Agri-OS
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <Link href="/dashboard" className="text-soil/80 transition-colors hover:text-terracotta">
              Platform Overview
            </Link>
            <Link href="/dashboard/irrigation" className="text-soil/80 transition-colors hover:text-terracotta">
              FAO-56 Irrigation
            </Link>
            <Link href="/dashboard/crop-health" className="text-soil/80 transition-colors hover:text-terracotta">
              Crop Health
            </Link>
            <Link href="/dashboard/climate" className="text-soil/80 transition-colors hover:text-terracotta">
              Climate Risk
            </Link>
            <Link href="/allocation" className="text-soil/80 transition-colors hover:text-terracotta">
              Cold Chain (50 Hubs)
            </Link>
            <Link href="/dashboard/impact" className="text-soil/80 transition-colors hover:text-terracotta">
              Impact & ESG
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="https://t.me/SavitriAgriBot"
            target="_blank"
            className="hidden sm:inline-flex text-xs font-semibold text-soil/70 hover:text-soil px-3 py-1.5 rounded-lg border border-soil/20 hover:bg-wheat/30 transition-colors"
          >
            🤖 Telegram Bot
          </Link>
          <Button asChild size="sm" className="bg-terracotta hover:bg-terracotta/90 text-white font-medium shadow-sm">
            <Link href="/dashboard">🚀 Launch Platform</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
