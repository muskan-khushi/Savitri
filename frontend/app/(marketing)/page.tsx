import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { HomeHero } from "@/components/savitri/home-hero";
import { AudienceRow } from "@/components/savitri/audience-row";
import { StatStrip } from "@/components/savitri/stat-strip";
import { artExists, ART_FILES } from "@/lib/art";

/**
 * Home — per SAVITRI_MASTER_UI_PLAN.md, page 1.
 * Job: first impression, clear in 10 seconds. Routes to the deeper
 * pages rather than explaining everything itself — no myth sequence
 * here (that's the Story page), no dashboard previews (that's How It
 * Works), no stat wall (that's Impact & Data).
 */
export default function Home() {
  const a5Filename = ART_FILES.mythBeats[5];
  const a5Exists = artExists(a5Filename);

  return (
    <>
      <SiteHeader />
      <main>
        <HomeHero a5Exists={a5Exists} a5Filename={a5Filename} />
        <AudienceRow />
        <StatStrip />
      </main>
      <SiteFooter />
    </>
  );
}
