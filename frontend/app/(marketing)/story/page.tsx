import { MythSequence } from "@/components/savitri/myth-sequence";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { artExists, ART_FILES } from "@/lib/art";

export default function StoryPage() {
  const mythBeatFiles = [
    ART_FILES.mythBeats[1],
    ART_FILES.mythBeats[2],
    ART_FILES.mythBeats[3],
    ART_FILES.mythBeats[4],
    ART_FILES.mythBeats[5],
  ];
  const artStatus = mythBeatFiles.map((filename) => ({
    filename,
    exists: artExists(filename),
  }));

  return (
    <>
      <SiteHeader />

      <main>
        <MythSequence artStatus={artStatus} />

        {/* Per the plan: "Ends with a simple text section: what Savitri
            means as a word, why the name was chosen, one paragraph, no
            images — let it land quietly." Deliberately unstyled beyond
            typography — no card, no illustration, no motion. */}
        <section className="mx-auto max-w-2xl px-6 py-28 text-center">
          <h2 className="font-display text-2xl text-soil">On the name</h2>
          <p className="mt-6 text-lg leading-relaxed text-soil/80">
            Savitri carries a double meaning. In Sanskrit, it traces back to
            the sun — a life-giving, unhurried kind of light. And in the
            Mahabharata, Savitri is the name of the woman who walked beside
            Death itself, patiently, until a different outcome became
            possible. Both meanings point at the same thing this product is
            trying to be: not a warning system that arrives after the loss,
            and not a miracle that undoes it — just quiet attention, present
            early enough and long enough to matter.
          </p>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
