import { EmptyState } from "@/components/illustration/EmptyState";

/**
 * Harvest Timing (Spoilage-Risk) — one job: when to harvest, weighed
 * against spoilage risk if storage isn't lined up yet. Not directly
 * backed by an existing backend endpoint yet — a real gap, not a
 * frontend oversight: this needs a spoilage-risk model (shelf-life
 * curves × current storage availability) that doesn't exist in the
 * backend yet. Flagged for the backend roadmap, not silently implied
 * to already work.
 */
export default function HarvestTimingPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl text-soil">Harvest Timing</h1>
      <p className="mt-1 text-soil/60">
        When to harvest, weighed against real spoilage risk.
      </p>
      <div className="mt-10">
        <EmptyState
          title="Backend model not built yet"
          body="This page needs a spoilage-risk calculation (shelf-life curves against real storage availability) that doesn't exist in the backend yet — a real gap, tracked on the build roadmap, not a UI placeholder standing in for something already working."
        />
      </div>
    </div>
  );
}
