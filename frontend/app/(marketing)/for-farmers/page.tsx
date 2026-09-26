import { SiteFooter } from "@/components/layout/site-footer";
import { ChatMockup } from "@/components/phone-preview/ChatMockup";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * For Farmers — one job: show, don't tell, what a farmer actually
 * receives. The phone mockup is the centerpiece per the plan.
 */
export default function ForFarmersPage() {
  return (
    <>
      <main>
        <section className="mx-auto grid max-w-5xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center">
          <div>
            <h1 className="font-display text-4xl leading-tight text-soil md:text-5xl">
              This is what lands on your phone.
            </h1>
            <p className="mt-6 text-lg text-soil/70">
              No app to download. No dashboard to check. You ask a question
              over WhatsApp or Telegram, in your own language, and get back a
              real answer — computed from your farm&apos;s actual weather and
              your crop&apos;s actual growth stage.
            </p>
            <ul className="mt-8 flex flex-col gap-3 text-soil/80">
              <li>— Irrigation timing, with the real numbers behind it</li>
              <li>— A photo of a sick leaf, and an honest diagnosis</li>
              <li>— The nearest cold storage with real space available</li>
              <li>— Today&apos;s actual mandi price, not last week&apos;s</li>
            </ul>
            <div className="mt-8">
              <Button size="lg" asChild>
                <Link href="/contact">Get Savitri on your phone</Link>
              </Button>
            </div>
          </div>
          <ChatMockup />
        </section>

        <section className="border-t border-soil/10 bg-wheat/30 py-16 text-center">
          <div className="mx-auto max-w-xl px-6">
            <h2 className="font-display text-2xl text-soil">
              If Savitri doesn&apos;t know, it says so
            </h2>
            <p className="mt-4 text-soil/70">
              You will never get a made-up answer dressed up as a real one —
              not on irrigation, not on a disease diagnosis, not on a price.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
