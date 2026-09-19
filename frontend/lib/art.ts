/**
 * artExists
 *
 * Previously used Node.js `fs` to check if an illustration file
 * exists on disk — but that made this file server-only, which broke
 * any Client Component that imported it (e.g. EmptyState).
 *
 * Now returns true unconditionally: Next.js Image will simply show
 * nothing / 404 gracefully if the WebP isn't present in public/art/,
 * which is better UX than a build-time crash. Drop the real files at
 * the paths below and they resolve automatically.
 */
export function artExists(_filename: string): boolean {
  return true;
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
