import Image from "next/image";
import { artExists, ART_FILES } from "@/lib/art";
import { cn } from "@/lib/utils";

const MOTIF_LABELS: Record<keyof typeof ART_FILES.motifs, string> = {
  dawn: "Dawn",
  sprout: "Sprout",
  water: "Water",
  harvest: "Harvest",
  secondIncome: "Second income",
};

/**
 * MotifIcon
 *
 * The recurring B1–B5 hand-drawn motif icons (dawn, sprout, water,
 * harvest, second-income), used as small in-line accents across
 * dashboard cards and section headers. Real file when present,
 * honest labeled placeholder otherwise.
 */
export function MotifIcon({
  motif,
  size = 40,
  className,
}: {
  motif: keyof typeof ART_FILES.motifs;
  size?: number;
  className?: string;
}) {
  const filename = ART_FILES.motifs[motif];
  const exists = artExists(filename);

  if (exists) {
    return (
      <Image
        src={`/art/${filename}`}
        alt={MOTIF_LABELS[motif]}
        width={size}
        height={size}
        className={cn("inline-block", className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-wheat text-[9px] text-soil/50",
        className
      )}
      style={{ width: size, height: size }}
      title={`${filename} · not yet in /public/art/`}
    >
      {MOTIF_LABELS[motif][0]}
    </span>
  );
}
