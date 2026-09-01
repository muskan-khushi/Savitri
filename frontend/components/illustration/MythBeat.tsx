import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * MythBeat
 *
 * Renders the real hand-drawn illustration when it exists at
 * /public/art/{filename} (checked server-side via lib/art.ts's
 * artExists() — a real fs check, not a manually-flipped flag), and an
 * honest placeholder scene otherwise. Never disguises the placeholder
 * as finished art.
 *
 * As of this build, the real WebP files aren't present in this
 * environment yet (confirmed directly, not assumed) — but the exact
 * real filenames from Muskan's project (myth-beat-a1.webp, etc.) are
 * already wired in via lib/art.ts, so dropping the actual files into
 * public/art/ activates them with zero code changes.
 */
export function MythBeat({
  beat,
  label,
  filename,
  exists,
  className,
}: {
  beat: 1 | 2 | 3 | 4 | 5;
  label: string;
  filename: string;
  exists: boolean;
  className?: string;
}) {
  if (exists) {
    return (
      <div
        className={cn(
          "relative aspect-[4/5] w-full overflow-hidden rounded-3xl",
          className
        )}
      >
        <Image
          src={`/art/${filename}`}
          alt={label}
          fill
          sizes="(min-width: 768px) 40vw, 90vw"
          className="object-cover"
          priority={beat === 1}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-3xl border border-soil/15 bg-gradient-to-br from-wheat to-soil/10",
        className
      )}
      role="img"
      aria-label={`Placeholder for illustration ${filename}: ${label}`}
    >
      <div className="absolute inset-0 opacity-40" aria-hidden>
        <svg width="100%" height="100%" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
          <circle cx="320" cy="90" r="46" fill="var(--soft-gold)" opacity="0.6" />
          <path
            d="M0 380 C 90 320, 160 420, 260 350 S 400 320, 400 320 L 400 500 L 0 500 Z"
            fill="var(--leaf)"
            opacity="0.25"
          />
        </svg>
      </div>
      <div className="relative flex flex-col items-center gap-2 px-6 text-center">
        <span className="text-xs uppercase tracking-[0.2em] text-soil/50">
          {filename} · not yet in /public/art/
        </span>
        <span className="font-display text-lg text-soil/70">{label}</span>
      </div>
    </div>
  );
}
