import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * For FPOs & Partners — one job: make the business case legible to
 * an organization deciding whether to bundle or license Savitri for
 * their member farmers.
 */
const MODELS = [
  {
    title: "Bundled with existing services",
    body: "Offered alongside input credit, procurement, or extension services your FPO already provides — one more reason a member stays engaged.",
  },
  {
    title: "Per-member licensing",
    body: "A flat per-farmer rate scaled to your membership size, with usage data reported back so you can see real engagement, not just signups.",
  },
  {
    title: "White-labeled delivery",
    body: "Savitri's computation layer, delivered under your own FPO's name and existing WhatsApp/Telegram presence.",
  },
];

export default function ForPartnersPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-3xl px-6 pb-8 pt-20 text-center">
          <h1 className="font-display text-4xl text-soil md:text-5xl">
            Built to sit inside what you already run
          </h1>
          <p className="mt-5 text-lg text-soil/70">
            Savitri isn&apos;t another app competing for a farmer&apos;s
            attention — it&apos;s a decision layer your FPO can offer under
            its own name.
          </p>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-12">
          <div className="grid gap-6 md:grid-cols-3">
            {MODELS.map((m) => (
              <div key={m.title} className="rounded-3xl border border-soil/10 bg-wheat/30 p-8">
                <h3 className="font-display text-lg text-soil">{m.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-soil/70">{m.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-soil/10 bg-wheat/30 py-16 text-center">
          <div className="mx-auto max-w-xl px-6">
            <h2 className="font-display text-2xl text-soil">Talk to us</h2>
            <p className="mt-4 text-soil/70">
              We&apos;ll walk through your membership size, what you already
              offer, and where Savitri fits without duplicating it.
            </p>
            <div className="mt-6">
              <Button size="lg" asChild>
                <Link href="/contact">Start a conversation</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
