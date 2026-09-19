"use client";

import { useState } from "react";
import { EmptyState } from "@/components/illustration/EmptyState";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { api, ApiError, type MarketAdvice } from "@/lib/api";
import { getStoredFarmId } from "@/lib/farm-storage";

/**
 * Market: Sell or Store — now wired to
 * GET /api/v1/farms/{id}/market-advice, which nets out a real
 * Agmarknet price trend against labelled storage/transport cost
 * assumptions. Still requires DATA_GOV_API_KEY set on the backend —
 * that 503 surfaces here as an explicit error, not a fake number.
 */
export default function MarketPage() {
  const [farmId] = useState<number | null>(() => getStoredFarmId());
  const [state, setState] = useState("Bihar");
  const [market, setMarket] = useState("");
  const [advice, setAdvice] = useState<MarketAdvice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    if (!farmId) return;
    setLoading(true);
    setError(null);
    try {
      setAdvice(await api.getMarketAdvice(farmId, { state, market: market || undefined }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not fetch mandi prices.");
    } finally {
      setLoading(false);
    }
  }

  if (!farmId) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-2xl text-soil">Market: Sell or Store</h1>
        <div className="mt-10">
          <EmptyState
            title="Add your farm first"
            body="Market advice is computed for your farm's crop."
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
      <h1 className="font-display text-2xl text-soil">Market: Sell or Store</h1>
      <p className="mt-1 text-soil/60">Real government mandi prices, dated — never presented as live.</p>

      <form onSubmit={check} className="mt-8 flex items-end gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium text-soil">State</label>
          <input
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-soil/20 bg-wheat/20 px-4 py-2.5 text-soil focus:border-terracotta focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium text-soil">Market (optional)</label>
          <input
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-soil/20 bg-wheat/20 px-4 py-2.5 text-soil focus:border-terracotta focus:outline-none"
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Checking..." : "Check"}
        </Button>
      </form>

      {error && (
        <div className="mt-6 rounded-2xl border border-terracotta/40 bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
          {error}
        </div>
      )}

      {advice && (
        <div className="mt-8 rounded-3xl border border-soil/10 bg-wheat/30 p-8">
          <p className="text-3xl text-soil">
            {advice.projected_gain_per_kg !== null
              ? `₹${advice.projected_gain_per_kg.toFixed(2)}/kg`
              : "Not enough data"}
          </p>
          <p className="mt-2 text-sm text-soil/60">
            projected gain from storing {advice.storage_days} more days vs. selling today
          </p>
          <p className="mt-4 text-sm text-soil/70">{advice.recommendation_text}</p>
          <p className="mt-4 text-xs text-soil/50">
            Assumes ₹{advice.assumed_storage_cost_per_kg}/kg storage cost and ₹
            {advice.assumed_transport_cost_per_kg}/kg transport — both stated assumptions, not
            measured.
          </p>
        </div>
      )}
    </div>
  );
}