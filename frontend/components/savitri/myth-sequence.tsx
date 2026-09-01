"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MythBeat } from "@/components/illustration/MythBeat";

gsap.registerPlugin(ScrollTrigger);

/**
 * MythSequence
 *
 * Belongs on The Story page (per SAVITRI_MASTER_UI_PLAN.md Section
 * "The Story (About)") — NOT the homepage. Five real story beats,
 * each paired with its product-mapping line per the plan's described
 * format: "the myth beat on one side ... how it maps to the product
 * on the other."
 *
 * The background genuinely shifts through the plan's actual named
 * dawn-gradient stops (Indigo Night → Dusky Rose → Amber Dawn → Soft
 * Gold) as the reader scrolls — real colors from Section 2, not
 * invented ones. Every background/foreground pairing below was
 * checked against real computed WCAG contrast ratios (see project
 * notes) rather than eyeballed — Indigo Night and Dusky Rose need
 * light text, Amber Dawn and Soft Gold need dark (soil) text; this
 * flips partway through the sequence and both are verified ≥4.5:1.
 */
const BEATS = [
  {
    n: 1 as const,
    myth: "She set out from her father's house, having chosen her own path.",
    mapping:
      "Savitri chooses which farm to walk beside before there's any sign of trouble — not after.",
    bg: "#1a1b3a", // Indigo Night
    fg: "#f5f3ef", // soft-white — 15.02:1
  },
  {
    n: 2 as const,
    myth: "She kept vigil, refusing to look away from what was coming.",
    mapping:
      "Real weather, real soil moisture, watched continuously — not a report that arrives after the damage is done.",
    bg: "#4d3153", // interpolated toward Dusky Rose
    fg: "#f5f3ef", // soft-white
  },
  {
    n: 3 as const,
    myth: "She did not fight Death. She walked beside him.",
    mapping:
      "Savitri doesn't stop a crop from being at risk — it walks the last mile with the farmer until it's safe.",
    bg: "#8b4a6b", // Dusky Rose
    fg: "#f5f3ef", // soft-white — 5.76:1
  },
  {
    n: 4 as const,
    myth: "Through patient questions, she was granted the one boon that mattered.",
    mapping:
      "The right irrigation window. The right day to harvest. The right price to sell at. Timing is the entire intervention.",
    bg: "#e8925a", // Amber Dawn
    fg: "#4a3728", // soil — 4.65:1
  },
  {
    n: 5 as const,
    myth: "She returned home with Satyavan, and light came back with them.",
    mapping:
      "This is what Savitri does, every day, for a season that would otherwise turn without warning.",
    bg: "#f5c56e", // Soft Gold
    fg: "#4a3728", // soil — 7.01:1
  },
];

export function MythSequence({
  artStatus,
}: {
  artStatus: { filename: string; exists: boolean }[];
}) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray<HTMLElement>(".myth-panel");
      const root = document.documentElement;

      const setVars = (bg: string, fg: string) => {
        if (prefersReducedMotion) {
          root.style.setProperty("--scroll-bg", bg);
          root.style.setProperty("--scroll-fg", fg);
        } else {
          gsap.to(root, {
            "--scroll-bg": bg,
            "--scroll-fg": fg,
            duration: 0.8,
            ease: "power1.inOut",
          });
        }
      };

      panels.forEach((panel, i) => {
        const { bg, fg } = BEATS[i];
        const apply = () => setVars(bg, fg);
        ScrollTrigger.create({
          trigger: panel,
          start: "top 60%",
          end: "bottom 40%",
          onEnter: apply,
          onEnterBack: apply,
        });
      });

      // Return to Dawn Mode's static cream/soil, anchored to the last
      // panel itself (a container-bottom trigger needs enough page
      // content below it for that scroll position to be reachable —
      // confirmed this the hard way during the homepage build, so
      // applying the same fix here from the start).
      const lastPanel = panels[panels.length - 1];
      ScrollTrigger.create({
        trigger: lastPanel,
        start: "bottom 50%",
        onEnter: () => setVars("#fffaf0", "#3a2e4a"), // new site-wide cream/ink base
        onLeaveBack: () => setVars(BEATS[4].bg, BEATS[4].fg),
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionRef} className="relative">
      {BEATS.map((beat, i) => (
        <section
          key={beat.n}
          className="myth-panel mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-10 px-6 py-24 md:flex-row md:gap-16"
        >
          <div className={`order-2 flex-1 ${i % 2 === 0 ? "md:order-1" : "md:order-2"}`}>
            <MythBeat
              beat={beat.n}
              label={beat.myth}
              filename={artStatus[i].filename}
              exists={artStatus[i].exists}
            />
          </div>
          <div className={`order-1 flex-1 ${i % 2 === 0 ? "md:order-2" : "md:order-1"}`}>
            <span className="text-sm tracking-[0.3em] text-current/50">
              {String(beat.n).padStart(2, "0")} / 05
            </span>
            <p className="mt-4 font-display text-2xl italic leading-snug text-current md:text-3xl">
              &ldquo;{beat.myth}&rdquo;
            </p>
            <div className="mt-6 h-px w-12 bg-current/30" />
            <p className="mt-6 max-w-md text-lg leading-relaxed text-current/85">
              {beat.mapping}
            </p>
          </div>
        </section>
      ))}
    </div>
  );
}
