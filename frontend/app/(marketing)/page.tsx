import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { HomeHero } from "@/components/savitri/home-hero";
import { LiveAiShowcase } from "@/components/savitri/live-ai-showcase";
import { NineLayersGrid } from "@/components/savitri/nine-layers-grid";
import { AudienceRow } from "@/components/savitri/audience-row";
import { artExists, ART_FILES } from "@/lib/art";

export default function Home() {
  const a5Filename = ART_FILES.mythBeats[5];
  const a5Exists = artExists(a5Filename);

  return (
    <>
      <SiteHeader />
      <main className="bg-cream">
        <HomeHero a5Exists={a5Exists} a5Filename={a5Filename} />
        <LiveAiShowcase />
        <NineLayersGrid />
        <AudienceRow />
      </main>
      <SiteFooter />
    </>
  );
}
