"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FloatingBlobs } from "@/components/motion/FloatingBlobs";

export function HomeHero({ a5Exists, a5Filename }: { a5Exists: boolean; a5Filename: string }) {
  return (
    <section className="relative isolate flex min-h-[90vh] flex-col items-center justify-center overflow-hidden bg-cream px-6 py-24">
      <FloatingBlobs />

      <div className="relative mx-auto max-w-4xl text-center">

        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-[11px] font-semibold uppercase tracking-[0.2em] text-soil/40"
        >
          Agricultural Intelligence · India
        </motion.p>

        {/* Primary headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="mt-6 text-[3rem] font-bold leading-[1.1] tracking-[-0.03em] text-soil sm:text-[4.5rem]"
        >
          The farm knows.
          <br />
          <span className="text-terracotta">Now you do too.</span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.18 }}
          className="mx-auto mt-7 max-w-lg text-[1rem] leading-[1.8] text-soil/55"
        >
          Savitri reads your soil, reads the sky, and tells you exactly what
          to do — when to irrigate, when a pathogen is spreading, where the
          cold chain has space. In your language. On WhatsApp.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28 }}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
        >
          <Link
            href="/dashboard"
            className="rounded-full bg-soil px-8 py-3 text-[14px] font-semibold text-cream shadow-sm transition-all hover:bg-terracotta"
          >
            See it live
          </Link>
          <Link
            href="https://t.me/SavitriAgriBot"
            target="_blank"
            className="rounded-full border border-soil/20 px-8 py-3 text-[14px] font-medium text-soil/70 transition-all hover:border-soil/35 hover:text-soil"
          >
            Try on Telegram
          </Link>
        </motion.div>

        {/* Stat strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-20 grid grid-cols-4 gap-8 border-t border-soil/8 pt-10"
        >
          {[
            { n: "9", label: "AI layers" },
            { n: "20", label: "Crops covered" },
            { n: "50", label: "Cold chain hubs" },
            { n: "7", label: "Languages" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-bold tracking-tight text-soil">{s.n}</p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-widest text-soil/40">
                {s.label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
