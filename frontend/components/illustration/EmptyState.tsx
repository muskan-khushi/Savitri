import Image from "next/image";
import { artExists } from "@/lib/art";

/**
 * EmptyState
 *
 * Used across dashboard pages wherever a farmer hasn't set up the
 * data a page needs yet (no farm profile, no photo uploaded, etc.).
 * Uses the real empty-state-c2.webp illustration when present, an
 * honest placeholder otherwise — same fs-checked pattern as MythBeat.
 */
export function EmptyState({
  title,
  body,
  action,
  filename = "empty-state-c2.webp",
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
  filename?: string;
}) {
  const exists = artExists(filename);

  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-soil/20 bg-wheat/20 px-8 py-16 text-center">
      <div className="relative h-40 w-40">
        {exists ? (
          <Image src={`/art/${filename}`} alt="" fill className="object-contain" />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-wheat/60">
            <span className="text-xs text-soil/40">{filename}</span>
          </div>
        )}
      </div>
      <h3 className="mt-6 font-display text-xl text-soil">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-soil/70">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
