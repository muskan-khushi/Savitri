import { StatCounter } from "@/components/motion/StatCounter";
import { Reveal } from "@/components/motion/Reveal";

/**
 * StatStrip — each stat now sits in its own pastel card instead of
 * plain text on a neutral strip, matching the site's more colorful
 * direction while keeping the numbers themselves the actual focus.
 */
export function StatStrip() {
  return (
    <section className="py-16">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 px-6 sm:grid-cols-3">
        <Reveal>
          <div className="rounded-3xl bg-pastel-pink/60 p-8 text-center">
            <StatCounter value={1000000} suffix="+" label="Solar irrigation pumps installed under PM-KUSUM" />
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="rounded-3xl bg-pastel-blue/60 p-8 text-center">
            <StatCounter value={20} suffix="%" label="Typical post-harvest loss without timely intervention" />
          </div>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="rounded-3xl bg-pastel-green/60 p-8 text-center">
            <StatCounter value={3.7} decimals={1} prefix="₹1.5 → ₹" suffix="/kg" label="Distress-sale price vs. price after timely storage" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
