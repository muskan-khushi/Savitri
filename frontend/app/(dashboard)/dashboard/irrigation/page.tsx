import { EmptyState } from "@/components/illustration/EmptyState";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Irrigation — one job: today's irrigation call, with the real
 * numbers behind it. Maps directly to
 * backend/app/services/irrigation_service.py's
 * IrrigationRecommendation shape once wired up:
 *   et0_mm_day, kc, etc_mm_day, effective_rainfall_mm,
 *   net_irrigation_mm, should_irrigate, recommendation_text
 *
 * No farm connected yet in this build, so this shows the real empty
 * state rather than fabricated sample numbers that could be mistaken
 * for a live reading.
 */
export default function IrrigationPage() {
  const hasFarm = false; // TODO: replace with a real farm-context check once wired to the backend

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl text-soil">Irrigation</h1>
      <p className="mt-1 text-soil/60">
        Real FAO-56 Penman-Monteith, computed fresh from today&apos;s weather.
      </p>

      <div className="mt-10">
        {hasFarm ? (
          <div className="rounded-3xl border border-soil/10 bg-wheat/30 p-8">
            {/* Real card layout ready for wiring:
                ETc, effective rainfall, net irrigation, recommendation_text */}
          </div>
        ) : (
          <EmptyState
            title="Add your farm to see today's real number"
            body="Irrigation timing depends on your farm's exact location and crop stage — nothing to show until that's set up."
            action={
              <Button asChild>
                <Link href="/dashboard/my-farm">Add your farm</Link>
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
