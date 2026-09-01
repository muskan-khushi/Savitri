"use client";

import { useEffect, useRef, useState } from "react";

/**
 * StatCounter
 *
 * The plan specifies Magic UI's animated-counter component; that
 * registry isn't reachable from this build environment's network
 * (same boundary as ui.shadcn.com). This is a small hand-built
 * equivalent — counts up once when scrolled into view, respects
 * prefers-reduced-motion by jumping straight to the final value.
 */
export function StatCounter({
  value,
  suffix = "",
  prefix = "",
  decimals = 0,
  label,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          if (prefersReducedMotion) {
            setDisplay(value);
            return;
          }
          const duration = 1200;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setDisplay(value * eased);
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.4 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="text-center">
      <div className="font-display text-3xl text-ink md:text-4xl">
        {prefix}
        {display.toLocaleString("en-IN", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}
        {suffix}
      </div>
      <p className="mt-2 text-sm text-soil/60">{label}</p>
    </div>
  );
}
