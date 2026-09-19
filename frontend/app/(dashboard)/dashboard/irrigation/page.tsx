"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/illustration/EmptyState";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { api, ApiError, type IrrigationAdvisory } from "@/lib/api";
import { getStoredFarmId } from "@/lib/farm-storage";

/**
 * Irrigation — now wired to POST /api/v1/farms/{id}/irrigation-advisory.
 * Shows the real ET0/Kc/ETc breakdown so the "why" is transparent,
 * matching how-it-works' "no black box" claim.
 */
export default function IrrigationPage() {
  const [farmId, setFarmId] = useState<number | null>(null);
  const [advisory, setAdvisory] = useState<IrrigationAdvisory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = getStoredFarmId();
    setFarmId(id);
    if (!id) {
      setLoading(false);
      return;
    }
    api
      .getIrrigationAdvisory(id)
      .then(setAdvisory)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Could not reach the backend.")
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl text-soil">Irrigation</h1>
      <p className="mt-1 text-soil/60">
        Real FAO-56 Penman-Monteith, computed fresh from today&apos;s weather.
      </p>

      <div className="mt-10">
        {loading ? (
          <div className="text-soil/60">Computing today&apos;s number...</div>
        ) : !farmId ? (
          <EmptyState
            title="Add your farm to see today's real number"
            body="Irrigation timing depends on your farm's exact location and crop stage — nothing to show until that's set up."
            action={
              <Button asChild>
                <Link href="/dashboard/my-farm">Add your farm</Link>
              </Button>
            }
          />
        ) : error ? (
          <EmptyState title="Couldn't fetch today's advisory" body={error} />
        ) : advisory ? (
          <div className="rounded-3xl border border-soil/10 bg-wheat/30 p-8">
            <div className="text-sm uppercase tracking-wide text-terracotta">
              {advisory.date} · {advisory.crop} · {advisory.growth_stage}
            </div>
            <p
              className={`mt-3 text-lg font-medium ${
                advisory.should_irrigate ? "text-terracotta" : "text-leaf"
              }`}
            >
              {advisory.recommendation_text}
            </p>
            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm text-soil/80 sm:grid-cols-3">
              <div>
                <dt className="text-soil/50">ET0</dt>
                <dd>{advisory.et0_mm_day} mm/day</dd>
              </div>
              <div>
                <dt className="text-soil/50">Kc</dt>
                <dd>{advisory.kc}</dd>
              </div>
              <div>
                <dt className="text-soil/50">ETc</dt>
                <dd>{advisory.etc_mm_day} mm/day</dd>
              </div>
              <div>
                <dt className="text-soil/50">Effective rainfall</dt>
                <dd>{advisory.effective_rainfall_mm} mm</dd>
              </div>
              <div>
                <dt className="text-soil/50">Net irrigation</dt>
                <dd>{advisory.net_irrigation_mm} mm</dd>
              </div>
              <div>
                <dt className="text-soil/50">Temp</dt>
                <dd>
                  {advisory.t_min_c}–{advisory.t_max_c}°C
                </dd>
              </div>
            </dl>
          </div>
        ) : null}
      </div>
    </div>
  );
}