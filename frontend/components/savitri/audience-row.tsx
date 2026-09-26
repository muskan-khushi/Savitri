"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Reveal } from "@/components/motion/Reveal";

const CARDS = [
  {
    audience: "Farmers",
    headline: "Your field. Your language. Your phone.",
    body: "Savitri tells you when to irrigate, whether your crop is sick, and where the nearest cold store has space. On WhatsApp. In Hindi.",
    href: "/for-farmers",
    accent: "bg-pastel-yellow",
  },
  {
    audience: "FPOs & Cooperatives",
    headline: "Manage a thousand farms like one.",
    body: "Aggregate advisory, cold chain allocation, outbreak mapping, and SDG-aligned impact reporting — all in a single operator dashboard.",
    href: "/for-partners",
    accent: "bg-pastel-green",
  },
  {
    audience: "Investors",
    headline: "Every claim has a receipt.",
    body: "Water saved, diesel displaced, CO₂ abated. Computed from live FAO-56 irrigation logs, not estimated from averages.",
    href: "/dashboard/impact",
    accent: "bg-pastel-blue",
  },
] as const;

export function AudienceRow() {
  return (
    <section className="border-t border-soil/8 py-24">
      <div className="mx-auto max-w-6xl px-6">

        <div className="mb-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-terracotta">
            Who it&apos;s for
          </p>
          <h2 className="mt-3 text-[2.2rem] font-bold leading-tight text-soil">
            Built for the whole chain.
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {CARDS.map((c, i) => (
            <Reveal key={c.audience} delay={i * 0.08}>
              <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 280, damping: 22 }}>
                <Link
                  href={c.href}
                  className={`group block rounded-3xl ${c.accent} p-8 transition-shadow hover:shadow-lg`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink/40">
                    {c.audience}
                  </p>
                  <h3 className="mt-4 text-[1.25rem] font-bold leading-snug text-ink">
                    {c.headline}
                  </h3>
                  <p className="mt-3 text-[13px] leading-relaxed text-ink/60">
                    {c.body}
                  </p>
                  <span className="mt-7 inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink/50 transition-colors group-hover:text-ink">
                    Learn more
                    <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </Link>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
