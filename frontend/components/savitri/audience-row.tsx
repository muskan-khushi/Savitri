"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";

const AUDIENCES = [
  {
    title: "Farmers",
    line: "See exactly what Savitri sounds like on your phone — before you sign up for anything.",
    href: "/for-farmers",
    bg: "bg-pastel-yellow",
  },
  {
    title: "FPOs & Partners",
    line: "The business case, the benchmarks, and how a licensing or bundled model could work.",
    href: "/for-partners",
    bg: "bg-pastel-blue",
  },
  {
    title: "Investors",
    line: "The real numbers behind the problem, and the receipts behind every claim we make.",
    href: "/impact",
    bg: "bg-pastel-green",
  },
] as const;

/**
 * AudienceRow — each card now gets its own pastel color rather than a
 * uniform neutral tone, and lifts on hover with a real spring instead
 * of a plain color-swap transition.
 */
export function AudienceRow() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <div className="grid gap-6 md:grid-cols-3">
        {AUDIENCES.map((a, i) => (
          <Reveal key={a.title} delay={i * 0.1}>
            <motion.div whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
              <Link
                href={a.href}
                className={`group block rounded-3xl ${a.bg} p-8 shadow-sm transition-shadow duration-200 hover:shadow-lg`}
              >
                <h3 className="font-display text-xl text-ink">{a.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/70">{a.line}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-ink">
                  Learn more
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </Link>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
