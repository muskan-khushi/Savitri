import Image from "next/image";
import { artExists, ART_FILES } from "@/lib/art";

/**
 * Second Income (Agrivoltaics) — one job: introduce agrivoltaics
 * (solar + crops on the same land) as a real second-income option.
 * Uses the real agrivoltaics-c1.webp illustration when present. No
 * backend model backs this yet (it's an informational page, not a
 * calculator) — that's the actual current scope, not an oversight.
 */
export default function SecondIncomePage() {
  const filename = ART_FILES.pageSpecific.agrivoltaics;
  const exists = artExists(filename);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl text-soil">Second Income</h1>
      <p className="mt-1 text-soil/60">Agrivoltaics: solar and crops sharing the same land.</p>

      <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-2xl bg-wheat/40">
        {exists ? (
          <Image src={`/art/${filename}`} alt="Agrivoltaics illustration" fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-soil/40">
            {filename} · not yet in /public/art/
          </div>
        )}
      </div>

      <p className="mt-6 text-soil/70">
        Elevated solar panels over part of a field can generate power income
        while still allowing shade-tolerant crops underneath — PM-KUSUM
        infrastructure already exists for the solar side. This page is
        informational for now; a real cost/return calculator is not yet
        built.
      </p>
    </div>
  );
}
