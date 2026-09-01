import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-cream/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-xl tracking-tight text-ink">
          Savitri
        </Link>
        <nav className="hidden items-center gap-8 text-sm md:flex">
          <Link href="/story" className="text-ink/70 transition-colors hover:text-ink">
            The Story
          </Link>
          <Link href="/how-it-works" className="text-ink/70 transition-colors hover:text-ink">
            How it works
          </Link>
          <Link href="/for-farmers" className="text-ink/70 transition-colors hover:text-ink">
            For Farmers
          </Link>
          <Link href="/for-partners" className="text-ink/70 transition-colors hover:text-ink">
            For FPOs & Partners
          </Link>
          <Link href="/impact" className="text-ink/70 transition-colors hover:text-ink">
            Impact & Data
          </Link>
        </nav>
        <Button asChild size="sm">
          <Link href="/contact">Get started</Link>
        </Button>
      </div>
    </header>
  );
}
