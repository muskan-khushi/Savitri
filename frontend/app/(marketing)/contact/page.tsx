import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";

/**
 * Contact — one job: capture who's asking and why, route accordingly.
 * Real form fields, no backend wiring yet (flagged, not faked) — a
 * submit handler needs a real destination (email service, CRM, or a
 * simple backend endpoint) before this can actually send anything.
 */
export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-lg px-6 py-20">
          <h1 className="font-display text-3xl text-soil md:text-4xl">
            Get in touch
          </h1>
          <p className="mt-4 text-soil/70">
            Farmer, FPO, or investor — tell us which, and what you&apos;re
            looking for.
          </p>

          {/* TODO: wire this to a real destination (email service, CRM,
              or a lightweight backend endpoint) before launch — this
              form does not currently send anywhere. Flagged here rather
              than silently shipping a submit button that does nothing. */}
          <form className="mt-10 flex flex-col gap-5">
            <div>
              <label className="text-sm font-medium text-soil">I am a...</label>
              <select className="mt-1.5 w-full rounded-xl border border-soil/20 bg-dawn-cream px-4 py-2.5 text-soil focus:border-terracotta focus:outline-none">
                <option>Farmer</option>
                <option>FPO or partner organization</option>
                <option>Investor</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-soil">Name</label>
              <input
                type="text"
                className="mt-1.5 w-full rounded-xl border border-soil/20 bg-dawn-cream px-4 py-2.5 text-soil focus:border-terracotta focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-soil">Email or phone</label>
              <input
                type="text"
                className="mt-1.5 w-full rounded-xl border border-soil/20 bg-dawn-cream px-4 py-2.5 text-soil focus:border-terracotta focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-soil">Message</label>
              <textarea
                rows={4}
                className="mt-1.5 w-full rounded-xl border border-soil/20 bg-dawn-cream px-4 py-2.5 text-soil focus:border-terracotta focus:outline-none"
              />
            </div>
            <Button size="lg" type="submit" className="mt-2">
              Send
            </Button>
          </form>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
