import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 bg-pastel-yellow/25">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 md:flex-row md:justify-between">
        <div>
          <div className="font-display text-lg text-ink">Savitri</div>
          <p className="mt-2 max-w-xs text-sm text-ink/60">
            Quiet intelligence for Bihar&apos;s farms — irrigation, disease,
            storage, and price signals, before the loss happens.
          </p>
        </div>
        <div className="flex gap-16 text-sm">
          <div className="flex flex-col gap-2">
            <span className="text-ink/40">Product</span>
            <Link href="/how-it-works" className="text-ink/70 hover:text-ink">How it works</Link>
            <Link href="/for-farmers" className="text-ink/70 hover:text-ink">For Farmers</Link>
            <Link href="/for-partners" className="text-ink/70 hover:text-ink">For FPOs & Partners</Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-ink/40">Company</span>
            <Link href="/story" className="text-ink/70 hover:text-ink">The Story</Link>
            <Link href="/impact" className="text-ink/70 hover:text-ink">Impact & Data</Link>
            <Link href="/contact" className="text-ink/70 hover:text-ink">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
