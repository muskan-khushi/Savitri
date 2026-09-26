"use client";

/**
 * Cold Storage — wired to GET /api/v1/cold-storage/nearest.
 * Shows real Haversine-distance nearest facilities.
 * 404 = no data loaded (import_cold_storage_csv.py not run) is
 * surfaced as a distinct card, not a generic error.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/illustration/EmptyState";
import {
  getNearestColdStorage,
  ApiError,
  type ColdStorageFacility,
} from "@/lib/api";
import { loadFarm } from "@/lib/farm-storage";

type State =
  | { status: "no-farm" }
  | { status: "loading" }
  | {
      status: "success";
      facilities: ColdStorageFacility[];
      farmName: string | null;
    }
  | { status: "no-data" }
  | { status: "error"; detail: string };

export default function ColdStoragePage() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const stored = loadFarm();
    if (!stored) {
      setState({ status: "no-farm" });
      return;
    }

    getNearestColdStorage(stored.data.lat, stored.data.lon, 5)
      .then((facilities) =>
        setState({ status: "success", facilities, farmName: stored.data.name }),
      )
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setState({ status: "no-data" });
        } else {
          setState({
            status: "error",
            detail:
              err instanceof ApiError
                ? (err.detail ?? err.message)
                : String(err),
          });
        }
      });
  }, []);

  if (state.status === "no-farm") {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-2xl text-soil">Cold Storage</h1>
        <p className="mt-1 text-soil/60">
          Real distance to real facilities — never an invented location.
        </p>
        <div className="mt-10">
          <EmptyState
            title="Add your farm first"
            body="Cold storage search uses your farm's coordinates. Add your farm to find nearby facilities."
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

  if (state.status === "loading") {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-2xl text-soil">Cold Storage</h1>
        <p className="mt-1 text-soil/60">
          Real distance to real facilities — never an invented location.
        </p>
        <div className="mt-10 animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-soil/5" />
          ))}
        </div>
      </div>
    );
  }

  if (state.status === "no-data") {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-2xl text-soil">Cold Storage</h1>
        <p className="mt-1 text-soil/60">
          Real distance to real facilities — never an invented location.
        </p>
        <div className="mt-10 rounded-2xl border border-soil/15 bg-wheat/30 p-6">
          <p className="font-semibold text-soil">
            No facility data in the system yet (404)
          </p>
          <p className="mt-2 text-sm text-soil/70">
            This isn&apos;t a frontend bug — the backend genuinely has zero
            cold-storage records. A real Bihar/India dataset needs to be sourced
            and imported:
          </p>
          <code className="mt-3 block text-xs bg-soil/5 rounded-lg p-3 text-soil/60">
            python scripts/import_cold_storage_csv.py --file your_data.csv
          </code>
          <p className="mt-3 text-xs text-soil/40">
            See backend/scripts/import_cold_storage_csv.py for the expected CSV
            format.
          </p>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-2xl text-soil">Cold Storage</h1>
        <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-800">
            Could not load facilities
          </p>
          <p className="mt-2 text-sm text-red-700">{state.detail}</p>
        </div>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────────────
  const { facilities, farmName } = state;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl text-soil">Cold Storage</h1>
      <p className="mt-1 text-soil/60">
        Nearest facilities to {farmName ?? "your farm"} · Haversine distance
      </p>

      <div className="mt-8 space-y-3">
        {facilities.map((f, i) => (
          <div
            key={f.id}
            className="flex items-center justify-between rounded-2xl border border-soil/10 bg-wheat/20 px-5 py-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-soil/40">
                  #{i + 1}
                </span>
                <p className="font-medium text-soil">{f.name}</p>
              </div>
              {f.district && (
                <p className="text-xs text-soil/50 mt-0.5">{f.district}</p>
              )}
              <p className="text-xs text-soil/50 mt-0.5">
                Capacity: {f.capacity_tons ?? "N/A"} MT
              </p>
            </div>
            <div className="text-right shrink-0 ml-4">
              <p className="text-lg font-semibold text-soil">
                {f.distance_km.toFixed(1)} km
              </p>
              <p className="text-xs text-soil/40">away</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-soil/40">
        Distances computed by real Haversine great-circle formula from your farm
        coordinates.
      </p>
    </div>
  );
}
