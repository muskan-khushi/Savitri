"use client";

/**
 * Climate Risk — Layer 7.
 * Wired to GET /api/v1/climate-risk.
 * Shows drought index, heat stress GDD, and PMFBY insurance nudge.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/illustration/EmptyState";
import {
  getClimateRisk,
  getOutbreakWarnings,
  ApiError,
  type ClimateRisk,
  type OutbreakWarning,
} from "@/lib/api";
import { loadFarm } from "@/lib/farm-storage";

type State =
  | { status: "no-farm" }
  | { status: "loading" }
  | {
      status: "ready";
      risk: ClimateRisk;
      warnings: OutbreakWarning[];
      farmName: string | null;
      farmCrop: string;
    }
  | { status: "error"; detail: string };

const RISK_COLOURS: Record<string, string> = {
  none: "text-green-700",
  low: "text-yellow-700",
  moderate: "text-orange-600",
  high: "text-red-700",
};

const RISK_BG: Record<string, string> = {
  none: "bg-green-50 border-green-200",
  low: "bg-yellow-50 border-yellow-200",
  moderate: "bg-orange-50 border-orange-200",
  high: "bg-red-50 border-red-200",
};

export default function ClimateRiskPage() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const stored = loadFarm();
    if (!stored) {
      setState({ status: "no-farm" });
      return;
    }

    const { lat, lon, crop, name } = stored.data;

    Promise.all([
      getClimateRisk(lat, lon, crop),
      getOutbreakWarnings(lat, lon),
    ])
      .then(([risk, warnings]) =>
        setState({ status: "ready", risk, warnings, farmName: name, farmCrop: crop })
      )
      .catch((err) =>
        setState({
          status: "error",
          detail:
            err instanceof ApiError
              ? (err.detail ?? err.message)
              : String(err),
        })
      );
  }, []);

  if (state.status === "no-farm") {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-2xl text-soil">Climate Risk</h1>
        <div className="mt-10">
          <EmptyState
            title="Add your farm first"
            body="Climate risk is computed for your farm's exact coordinates."
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
        <h1 className="font-display text-2xl text-soil">Climate Risk</h1>
        <div className="mt-10 animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-soil/5" />
          ))}
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-2xl text-soil">Climate Risk</h1>
        <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-800">Could not load climate data</p>
          <p className="mt-2 text-sm text-red-700">{state.detail}</p>
        </div>
      </div>
    );
  }

  const { risk, warnings, farmName, farmCrop } = state;
  const overallRisk =
    risk.drought_risk_level === "high" || risk.heat_stress_level === "high"
      ? "high"
      : risk.drought_risk_level === "moderate" || risk.heat_stress_level === "moderate"
      ? "moderate"
      : risk.drought_risk_level === "low" || risk.heat_stress_level === "low"
      ? "low"
      : "none";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl text-soil">Climate Risk</h1>
      <p className="mt-1 text-soil/60">
        {farmName ?? "Your farm"} · {farmCrop} · next {risk.forecast_days} days
      </p>

      {/* PMFBY nudge */}
      {risk.pmfby_nudge && (
        <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <p className="font-semibold text-amber-800">🛡️ Consider PMFBY crop insurance</p>
          <p className="mt-1 text-sm text-amber-700">
            Climate signals suggest elevated risk this season. Enrolling in{" "}
            <strong>Pradhan Mantri Fasal Bima Yojana (PMFBY)</strong> protects
            your income if drought or heat damage occurs.
          </p>
          {risk.pmfby_reason && (
            <p className="mt-2 text-xs text-amber-600">Trigger: {risk.pmfby_reason}</p>
          )}
        </div>
      )}

      {/* Summary card */}
      <div
        className={`mt-6 rounded-2xl border p-6 ${
          RISK_BG[overallRisk] ?? "bg-wheat/20 border-soil/10"
        }`}
      >
        <p className="text-sm font-medium text-soil/60">Overall assessment</p>
        <p className={`mt-1 text-xl font-semibold capitalize ${RISK_COLOURS[overallRisk]}`}>
          {overallRisk === "none" ? "✅ No significant stress" : `⚠️ ${overallRisk} stress`}
        </p>
        <p className="mt-3 text-sm text-soil/70">{risk.recommendation_text}</p>
      </div>

      {/* Two metric cards */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        {/* Drought */}
        <div className="rounded-2xl border border-soil/10 bg-wheat/20 p-5">
          <p className="text-xs font-semibold text-soil/40 uppercase tracking-wide">Drought Risk</p>
          <p className={`mt-2 text-2xl font-bold ${RISK_COLOURS[risk.drought_risk_level]}`}>
            {(risk.drought_index * 100).toFixed(0)}%
          </p>
          <p className="mt-1 text-xs text-soil/60 capitalize">{risk.drought_risk_level} risk</p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-soil/10">
            <div
              className="h-full rounded-full bg-amber-400"
              style={{ width: `${Math.min(risk.drought_index * 100, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-soil/50">
            Rain: {risk.total_forecast_precip_mm.toFixed(1)}mm vs ET₀:{" "}
            {risk.total_forecast_et0_mm.toFixed(1)}mm
          </p>
        </div>

        {/* Heat */}
        <div className="rounded-2xl border border-soil/10 bg-wheat/20 p-5">
          <p className="text-xs font-semibold text-soil/40 uppercase tracking-wide">Heat Stress</p>
          <p className={`mt-2 text-2xl font-bold ${RISK_COLOURS[risk.heat_stress_level]}`}>
            {risk.heat_stress_gdd.toFixed(0)}
          </p>
          <p className="mt-1 text-xs text-soil/60">GDD above {risk.heat_threshold_used_c}°C</p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-soil/10">
            <div
              className="h-full rounded-full bg-red-400"
              style={{ width: `${Math.min((risk.heat_stress_gdd / 100) * 100, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-soil/50 capitalize">
            {risk.heat_stress_level} heat stress
          </p>
        </div>
      </div>

      {/* Outbreak warnings */}
      {warnings.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-semibold text-soil">Regional Disease Alerts</p>
          <div className="mt-3 space-y-3">
            {warnings.map((w, i) => (
              <div
                key={i}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3"
              >
                <p className="text-sm font-semibold text-red-800">
                  🔴 {w.condition} in {w.crop}
                </p>
                <p className="mt-1 text-xs text-red-700">{w.warning_text}</p>
                <p className="mt-1 text-xs text-red-500">
                  {w.case_count} cases · last detected {w.latest_detection}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-6 text-xs text-soil/30">
        {risk.note}
      </p>
    </div>
  );
}
