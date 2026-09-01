import fs from "fs";
import path from "path";

/**
 * artExists
 *
 * Real, verifiable check for whether an illustration file has actually
 * been dropped into public/art/ yet — not a manually-maintained flag
 * that could drift out of sync with reality. Server-only (uses `fs`),
 * so this must be called from a Server Component and the result
 * passed down as a plain boolean prop to any Client Component that
 * needs it.
 */
export function artExists(filename: string): boolean {
  try {
    return fs.existsSync(path.join(process.cwd(), "public", "art", filename));
  } catch {
    return false;
  }
}

/**
 * Real filenames as they exist in Muskan's design-source export,
 * confirmed directly from her project's file tree — not guessed or
 * placeholder-named. Drop the real WebP files at these exact paths
 * under public/art/ and every reference in the codebase resolves
 * automatically.
 */
export const ART_FILES = {
  mythBeats: {
    1: "myth-beat-a1.webp",
    2: "myth-beat-a2.webp",
    3: "myth-beat-a3.webp",
    4: "myth-beat-a4.webp",
    5: "myth-beat-a5.webp",
  },
  motifs: {
    dawn: "motif-b1-dawn.webp",
    sprout: "motif-b2-sprout.webp",
    water: "motif-b3-water.webp",
    harvest: "motif-b4-harvest.webp",
    secondIncome: "motif-b5-second-income.webp",
  },
  pageSpecific: {
    agrivoltaics: "agrivoltaics-c1.webp",
    emptyState: "empty-state-c2.webp",
  },
} as const;
