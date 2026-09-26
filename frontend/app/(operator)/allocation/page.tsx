"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getNearestColdStorage, type ColdStorageFacility } from "@/lib/api";

export default function AllocationPage() {
  const [facilities, setFacilities] = useState<ColdStorageFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [selectedFacility, setSelectedFacility] = useState<ColdStorageFacility | null>(null);
  const [startDate, setStartDate] = useState("2026-10-01");
  const [endDate, setEndDate] = useState("2026-10-15");
  const [availability, setAvailability] = useState<number | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    // Default search centered around Patna (Bihar)
    getNearestColdStorage(25.594, 85.138, 20)
      .then((data) => {
        setFacilities(data);
        if (data.length > 0) setSelectedFacility(data[0]);
      })
      .catch((err) => {
        setError(err.message || "Failed to load facilities");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleCheckAvailability(facId: number) {
    setCheckingAvailability(true);
    try {
      const res = await fetch(
        `http://localhost:8000/api/v1/cold-storage/${facId}/availability?start_date=${startDate}&end_date=${endDate}`
      );
      if (res.ok) {
        const data = await res.json();
        setAvailability(data.available_capacity_tons);
      } else {
        setAvailability(null);
      }
    } catch {
      setAvailability(null);
    } finally {
      setCheckingAvailability(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-soil">FPO Cold Storage Allocation</h1>
          <p className="mt-1 text-soil/70">
            Real-time warehousing capacity across 50 verified Indian horticulture facilities.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-leaf/20 px-3 py-1 text-xs font-semibold text-leaf">
            🟢 Network Live (50 Hubs)
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-terracotta/40 bg-terracotta/10 p-4 text-sm text-terracotta">
          {error}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Facilities list */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-soil/60">
            Regional Facilities ({facilities.length} in range)
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-soil/5" />
              ))}
            </div>
          ) : (
            facilities.map((f) => {
              const isSelected = selectedFacility?.id === f.id;
              return (
                <div
                  key={f.id}
                  onClick={() => {
                    setSelectedFacility(f);
                    setAvailability(null);
                  }}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                    isSelected
                      ? "border-terracotta bg-wheat/50 shadow-sm"
                      : "border-soil/15 bg-wheat/20 hover:border-soil/30 hover:bg-wheat/30"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-soil">{f.name}</h3>
                      <p className="text-xs text-soil/60 mt-0.5">
                        District: {f.district ?? "Central"} · {f.distance_km.toFixed(1)} km away
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-sm font-bold text-soil">
                        {f.capacity_tons ? `${f.capacity_tons.toLocaleString()} MT` : "Standard"}
                      </span>
                      <p className="text-[10px] text-soil/40 uppercase">Total Cap</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected facility detail & availability check */}
        <div className="rounded-2xl border border-soil/20 bg-wheat/20 p-5 h-fit space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-soil/60">
            Capacity Inspection
          </h2>

          {selectedFacility ? (
            <>
              <div>
                <p className="text-lg font-bold text-soil">{selectedFacility.name}</p>
                <p className="text-xs text-soil/60 mt-0.5">
                  District: {selectedFacility.district} · Lat: {selectedFacility.lat}, Lon: {selectedFacility.lon}
                </p>
              </div>

              <div className="rounded-xl bg-wheat/40 p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-soil/70">Nameplate Capacity:</span>
                  <span className="font-semibold text-soil">{selectedFacility.capacity_tons ?? 1000} MT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-soil/70">Allocation Policy:</span>
                  <span className="font-semibold text-soil">First-Come-First-Served</span>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-soil/10">
                <label className="text-xs font-semibold text-soil/70 block">
                  Check Booking Window
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-soil/50">Start Date</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full text-xs rounded-lg border border-soil/20 bg-white/70 px-2 py-1.5"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-soil/50">End Date</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full text-xs rounded-lg border border-soil/20 bg-white/70 px-2 py-1.5"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => handleCheckAvailability(selectedFacility.id)}
                  disabled={checkingAvailability}
                  className="w-full text-xs"
                >
                  {checkingAvailability ? "Checking Window..." : "Inspect Available MT"}
                </Button>

                {availability !== null && (
                  <div className="rounded-xl border border-leaf/30 bg-leaf/15 p-3 text-center">
                    <p className="text-xs text-leaf font-medium">Available Unallocated Slot</p>
                    <p className="text-2xl font-bold font-mono text-leaf mt-0.5">
                      {availability.toLocaleString()} MT
                    </p>
                    <p className="text-[10px] text-soil/60 mt-1">
                      Ready for immediate smallholder reservation
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-soil/50">Select a facility to inspect allocation.</p>
          )}
        </div>
      </div>
    </div>
  );
}
