"use client";

import { useState } from "react";
import { EmptyState } from "@/components/illustration/EmptyState";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { api, ApiError, type SpoilageRisk } from "@/lib/api";
import { getStoredFarmId } from "@/lib/farm-storage";

/**
 * Harvest Timing (Spoilage-Risk) — now wired to the new
 * GET /api/v1/farms/{id}/spoilage-risk endpoint (Q10 temperature
 * model, see backend/app/services/spoilage_service.py). Harvest date
 * isn't stored on the Farm model yet, so it's entered per check here.
 */

const RISK_COLOR: Record<string, string> = {
  low: "bg-leaf/70",
  medium: "bg-soft-gold",
  high: "bg-terracotta",
};

export default function HarvestTimingPage() {
  const [farmId] = useState<number | null>(() => getStoredFarmId());
  const [harvestDate, setHarvestDate] = useState("");
  const [risk, setRisk] = useState<SpoilageRisk | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkRisk(e: React.FormEvent) {
    e.preventDefault();
    if (!farmId || !harvestDate) return;
    setLoading(true);
    setError(null);
    try {
      setRisk(await api.getSpoilageRisk(farmId, harvestDate));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not compute spoilage risk.");
    } finally {
      setLoading(false);
    }
  }

  if (!farmId) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-2xl text-soil">Harvest Timing</h1>
        <div className="mt-10">
          <EmptyState
            title="Add your farm first"
            body="Spoilage risk is computed against your farm's crop and today's weather."
            action={
              <Button asChild>
                <Link href="/dashboard/my-farm">Add your farm</Link>
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl text-soil">Harvest Timing</h1>
      <p className="mt-1 text-soil/60">When to harvest, weighed against real spoilage risk.</p>

      <form onSubmit={checkRisk} className="mt-8 flex items-end gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium text-soil">Harvest date</label>
          <input
            type="date"
            value={harvestDate}
            onChange={(e) => setHarvestDate(e.target.value)}
            required
            className="mt-1.5 w-full rounded-xl border border-soil/20 bg-wheat/20 px-4 py-2.5 text-soil focus:border-terracotta focus:outline-none"
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Checking..." : "Check risk"}
        </Button>
      </form>

      {error && <p className="mt-6 text-sm text-terracotta">{error}</p>}

      {risk && (
        <div className="mt-8 rounded-3xl border border-soil/10 bg-wheat/30 p-8">
          <div className="h-3 w-full overflow-hidden rounded-full bg-soil/10">
            <div
              className={`h-full ${RISK_COLOR[risk.risk_level]}`}
              style={{ width: `${Math.min(risk.risk_ratio * 100, 100)}%` }}
            />
          </div>
          <p className="mt-4 text-lg font-medium capitalize text-soil">{risk.risk_level} risk</p>
          <p className="mt-2 text-sm text-soil/70">{risk.recommendation_text}</p>
          <p className="mt-4 text-xs text-soil/50">{risk.note}</p>
        </div>
      )}
    </div>
  );
}