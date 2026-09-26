"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FloatingBlobs } from "@/components/motion/FloatingBlobs";

export function HomeHero({ a5Exists, a5Filename }: { a5Exists: boolean; a5Filename: string }) {
  return (
    <section className="relative isolate flex min-h-[82vh] items-center overflow-hidden bg-cream py-16">
      <FloatingBlobs />

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-soil/20 bg-wheat/30 px-4 py-1.5 text-xs font-semibold text-soil shadow-sm"
        >
          <span className="flex h-2 w-2 rounded-full bg-leaf animate-pulse" />
          <span>Full-Stack Agricultural AI · 9 Verified Layers</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 font-display text-4xl leading-[1.12] text-soil sm:text-6xl font-bold tracking-tight"
        >
          Precision Irrigation, Disease Vision &amp; Cold-Chain Intelligence for Smallholders
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-soil/75"
        >
          Powered by real <strong>FAO-56 Penman-Monteith physics</strong>, deep-learning leaf diagnosis across 38 crop pathologies, 16-day climate risk, and <strong>50 verified Indian cold storage hubs</strong>. Delivered in Hindi, Bhojpuri, and English on Web and WhatsApp.
        </motion.p>

        {/* Action CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button size="lg" asChild className="w-full sm:w-auto bg-terracotta hover:bg-terracotta/90 text-white font-semibold px-8 py-6 text-base shadow-md">
            <Link href="/dashboard">🚀 Launch Live Dashboard</Link>
          </Button>

          <Button size="lg" variant="outline" asChild className="w-full sm:w-auto border-soil/20 text-soil hover:bg-wheat/40 font-semibold px-6 py-6 text-base">
            <Link href="https://t.me/SavitriAgriBot" target="_blank">
              📱 Test Telegram / WhatsApp AI
            </Link>
          </Button>
        </motion.div>

        {/* Feature Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left"
        >
          {[
            { metric: "42.5%", label: "Water Conserved", detail: "FAO-56 Penman-Monteith" },
            { metric: "50 Hubs", label: "Cold Storage Network", detail: "Real capacity & bookings" },
            { metric: "38 Classes", label: "MobileNetV2 Vision", detail: "54k leaf dataset" },
            { metric: "20 Crops", label: "Calibrated Telemetry", detail: "Rice, Wheat, Tomato, etc." },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-soil/15 bg-white/70 p-3.5 shadow-sm">
              <p className="font-mono text-xl font-bold text-soil">{item.metric}</p>
              <p className="text-xs font-semibold text-terracotta mt-0.5">{item.label}</p>
              <p className="text-[10px] text-soil/50 mt-0.5">{item.detail}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
