import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MotifIcon } from "@/components/illustration/MotifIcon";

/**
 * How It Works — one job: make the real decision pipeline legible.
 * Mirrors the actual backend pipeline (weather -> FAO-56 ET0 -> crop
 * coefficient -> water balance -> recommendation), not a simplified
 * marketing fiction of it.
 */
const STEPS = [
  {
    motif: "water" as const,
    title: "Real weather, pulled fresh",
    body: "Live temperature, humidity, wind, and solar radiation for your farm's exact coordinates — not a district-level average from yesterday.",
  },
  {
    motif: "sprout" as const,
    title: "The actual FAO-56 calculation",
    body: "The same Penman-Monteith reference evapotranspiration equation agronomists use — computed fresh every time, not looked up from a table.",
  },
  {
    motif: "harvest" as const,
    title: "Adjusted for your crop's real growth stage",
    body: "A crop coefficient specific to what you planted and how many days since sowing — wheat at flowering needs different water than wheat at planting.",
  },
  {
    motif: "dawn" as const,
    title: "One clear answer, in your language",
    body: "Irrigate today, or don't — with the actual numbers behind the call, delivered over WhatsApp or Telegram before the decision window closes.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-3xl px-6 pb-8 pt-20 text-center">
          <h1 className="font-display text-4xl text-soil md:text-5xl">
            How Savitri actually decides
          </h1>
          <p className="mt-5 text-lg text-soil/70">
            No black box. Here is the real pipeline, the same one running
            behind every message a farmer gets.
          </p>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-16">
          <ol className="flex flex-col gap-10">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <MotifIcon motif={step.motif} size={48} />
                  {i < STEPS.length - 1 && (
                    <div className="mt-2 h-full w-px flex-1 bg-soil/15" />
                  )}
                </div>
                <div className="pb-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-terracotta">
                    Step {i + 1}
                  </span>
                  <h2 className="mt-1 font-display text-xl text-soil">{step.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-soil/70">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t border-soil/10 bg-wheat/30 py-16">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <h2 className="font-display text-2xl text-soil">
              What Savitri won&apos;t do
            </h2>
            <p className="mt-4 text-soil/70">
              If the weather service is unreachable, or a disease model has no
              trained checkpoint, or a language pair genuinely isn&apos;t
              supported — Savitri says so plainly. It does not fill the gap
              with a plausible-looking guess.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
