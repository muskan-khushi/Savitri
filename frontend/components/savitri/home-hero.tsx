"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FloatingBlobs } from "@/components/motion/FloatingBlobs";

/**
 * HomeHero
 *
 * Rebuilt bright and colorful per direct feedback: the earlier
 * moody dusk-to-dawn gradient (appropriate for the Story page's myth
 * narrative) read as dull and heavy for the homepage's actual job —
 * a cheerful, confident first impression. Floating pastel blobs plus
 * real Framer Motion entrance animation replace the flat gradient.
 *
 * A5 art still slots in on top when present; the pastel blob field
 * works as a genuinely finished-looking background either way, not
 * just a placeholder standing in for "the real thing."
 */
export function HomeHero({ a5Exists, a5Filename }: { a5Exists: boolean; a5Filename: string }) {
  return (
    <section className="relative isolate flex min-h-[85vh] items-center overflow-hidden bg-cream">
      <FloatingBlobs />

      {a5Exists && (
        <div className="absolute inset-0 -z-10">
          <Image
            src={`/art/${a5Filename}`}
            alt="A figure standing on a hill at sunrise, having brought light back after a long night"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-90"
          />
        </div>
      )}

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-block rounded-full bg-pastel-pink px-4 py-1.5 text-sm font-medium text-ink"
        >
          Built for Bihar&apos;s farms
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 font-display text-4xl leading-[1.15] text-ink md:text-6xl"
        >
          Savitri walks beside every harvest,
          <br />
          and brings it back.
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-10"
        >
          <Button size="lg" asChild>
            <Link href="/how-it-works">See how it works</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
