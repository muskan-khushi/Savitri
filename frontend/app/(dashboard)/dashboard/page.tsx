"use client";

/**
 * Dashboard Overview — wired to show a real farm summary + latest
 * irrigation advisory when a farm exists. Falls back to the existing
 * EmptyState if no farm is saved.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/illustration/EmptyState";
import {
  getIrrigationAdvisory,
  ApiError,
  type IrrigationAdvisory,
} from "@/lib/api";
import { loadFarm, type StoredFarm } from "@/lib/farm-storage";

type State =
  | { status: "loading" }
  | { status: "no-farm" }
  | {
      status: "ready";
      farm: StoredFarm;
      advisory: IrrigationAdvisory | null;
      advisoryError: string | null;
    };

export default function DashboardHome() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const stored = loadFarm();
    if (!stored) {
      setState({ status: "no-farm" });
      return;
    }

    getIrrigationAdvisory(stored.id)
      .then((advisory) =>
        setState({
          status: "ready",
          farm: stored,
          advisory,
          advisoryError: null,
        }),
      )
      .catch((err) => {
        const detail =
          err instanceof ApiError
            ? (err.detail ?? `HTTP ${err.status}`)
            : String(err);
        setState({
          status: "ready",
          farm: stored,
          advisory: null,
          advisoryError: detail,
        });
      });
  }, []);

  if (state.status === "loading") {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-lg bg-soil/5" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-soil/5" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (state.status === "no-farm") {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl text-soil">Good morning</h1>
        <p className="mt-1 text-soil/60">
          Here&apos;s today, across your farm.
        </p>
        <div className="mt-10">
          <EmptyState
            title="No farm connected yet"
            body="Add your farm's location and crop to start seeing real irrigation, disease, and price signals — computed from live data, not a demo."
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

  // ── Ready ──────────────────────────────────────────────────────────
  const { farm, advisory, advisoryError } = state;
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Days after sowing
  const sowing = new Date(farm.data.sowing_date);
  const das = Math.max(
    0,
    Math.floor((now.getTime() - sowing.getTime()) / (1000 * 60 * 60 * 24)),
  );

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl text-soil">{greeting}</h1>
      <p className="mt-1 text-soil/60">
        {farm.data.name ?? "Your farm"} · {farm.data.crop} · Day {das} after
        sowing
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Irrigation card */}
        <Link
          href="/dashboard/irrigation"
          className="group rounded-2xl border border-soil/10 bg-wheat/20 p-5 hover:border-terracotta/30 hover:bg-wheat/40 transition-colors"
        >
          <p className="text-xs font-semibold text-soil/40 uppercase tracking-wide">
            Irrigation
          </p>
          {advisory ? (
            <>
              <p
                className={`mt-2 text-xl font-semibold ${
                  advisory.should_irrigate
                    ? "text-terracotta"
                    : "text-green-700"
                }`}
              >
                {advisory.should_irrigate ? "💧 Irrigate" : "✅ No irrigation"}
              </p>
              <p className="mt-1 text-sm text-soil/60">
                {advisory.net_irrigation_mm.toFixed(1)} mm net need · ET₀{" "}
                {advisory.et0_mm_day.toFixed(1)} mm/day
              </p>
            </>
          ) : advisoryError ? (
            <p className="mt-2 text-sm text-amber-700">
              {advisoryError.includes("502")
                ? "Weather data unavailable"
                : advisoryError}
            </p>
          ) : (
            <p className="mt-2 text-sm text-soil/40">Loading…</p>
          )}
          <p className="mt-3 text-xs text-soil/30 group-hover:text-terracotta transition-colors">
            View details →
          </p>
        </Link>

        {/* Crop health card */}
        <Link
          href="/dashboard/crop-health"
          className="group rounded-2xl border border-soil/10 bg-wheat/20 p-5 hover:border-terracotta/30 hover:bg-wheat/40 transition-colors"
        >
          <p className="text-xs font-semibold text-soil/40 uppercase tracking-wide">
            Crop Health
          </p>
          <p className="mt-2 text-xl font-semibold text-soil">🌿 Diagnose</p>
          <p className="mt-1 text-sm text-soil/60">
            Upload a leaf photo for real MobileNetV2 diagnosis
          </p>
          <p className="mt-3 text-xs text-soil/30 group-hover:text-terracotta transition-colors">
            Upload photo →
          </p>
        </Link>

        {/* Market card */}
        <Link
          href="/dashboard/market"
          className="group rounded-2xl border border-soil/10 bg-wheat/20 p-5 hover:border-terracotta/30 hover:bg-wheat/40 transition-colors"
        >
          <p className="text-xs font-semibold text-soil/40 uppercase tracking-wide">
            Mandi Prices
          </p>
          <p className="mt-2 text-xl font-semibold text-soil capitalize">
            {farm.data.crop}
          </p>
          <p className="mt-1 text-sm text-soil/60">
            Check today&apos;s real Agmarknet prices for your crop
          </p>
          <p className="mt-3 text-xs text-soil/30 group-hover:text-terracotta transition-colors">
            Check prices →
          </p>
        </Link>
      </div>

      {/* Secondary links */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          {
            href: "/dashboard/cold-storage",
            label: "Cold Storage",
            icon: "🏭",
          },
          {
            href: "/dashboard/harvest-timing",
            label: "Harvest Timing",
            icon: "⏱",
          },
          {
            href: "/dashboard/second-income",
            label: "Second Income",
            icon: "☀️",
          },
          { href: "/dashboard/climate", label: "Climate", icon: "🌤" },
          { href: "/dashboard/impact", label: "Water & Impact", icon: "💧" },
          { href: "/allocation", label: "FPO Allocation", icon: "🏢" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl border border-soil/10 bg-wheat/10 px-4 py-3 text-sm text-soil/70 hover:bg-wheat/30 hover:text-soil transition-colors"
          >
            <span className="mr-1.5">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>

      <p className="mt-6 text-xs text-soil/30">
        Farm ID #{farm.id} · {farm.data.sowing_date}
      </p>
    </div>
  );
}
