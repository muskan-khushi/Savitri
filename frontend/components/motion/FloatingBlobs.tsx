"use client";

import { motion, useReducedMotion } from "framer-motion";

const BLOBS = [
  { color: "var(--pastel-blue)", size: 380, top: "-8%", left: "-6%", duration: 14 },
  { color: "var(--pastel-pink)", size: 320, top: "10%", left: "72%", duration: 17 },
  { color: "var(--pastel-yellow)", size: 300, top: "58%", left: "-4%", duration: 15 },
  { color: "var(--pastel-green)", size: 260, top: "62%", left: "68%", duration: 19 },
] as const;

/**
 * FloatingBlobs
 *
 * A colorful, softly-animated background layer — the main device for
 * making sections feel alive rather than a flat pastel wash. Purely
 * decorative (aria-hidden), sits behind content via negative z-index,
 * and respects prefers-reduced-motion by rendering the blobs static.
 */
export function FloatingBlobs({ className = "" }: { className?: string }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`} aria-hidden>
      {BLOBS.map((blob, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            width: blob.size,
            height: blob.size,
            top: blob.top,
            left: blob.left,
            background: blob.color,
            opacity: 0.55,
          }}
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  y: [0, -24, 0, 18, 0],
                  x: [0, 16, 0, -12, 0],
                }
          }
          transition={{
            duration: blob.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
