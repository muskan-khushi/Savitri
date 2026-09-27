"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { artExists, ART_FILES } from "@/lib/art";
import { Button } from "@/components/ui/button";
import { api, ApiError, BackendUnavailableError, type AgrivoltaicsEstimate } from "@/lib/api";
import { DEMO_AGRIVOLTAICS } from "@/lib/mock-data";
import { DemoBanner } from "@/components/layout/demo-banner";

/**
 * Second Income (Agrivoltaics) — now wired to
 * POST /api/v1/agrivoltaics-estimate. Only states with a real cited
 * rate are offered (see backend/app/services/agrivoltaics_service.py)
 * — add more states there once you source another real rate, never
 * guess one here.
 */

const STATES = ["Odisha", "Delhi"];

export default function SecondIncomePage() {
  const filename = ART_FILES.pageSpecific.agrivoltaics;
  const exists = artExists(filename);

  const [state, setState] = useState(STATES[0]);
  const [acres, setAcres] = useState("1");
  const [estimate, setEstimate] = useState<AgrivoltaicsEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    api.getAgrivoltaicsEstimate({ state: STATES[0], land_acres: 1 })
      .then(setEstimate)
      .catch((err) => {
        if (err instanceof BackendUnavailableError) {
          setEstimate(DEMO_AGRIVOLTAICS);
          setIsDemo(true);
        }
      });
  }, []);

  async function calculate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      setEstimate(await api.getAgrivoltaicsEstimate({ state, land_acres: parseFloat(acres) }));
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        setEstimate(DEMO_AGRIVOLTAICS);
        setIsDemo(true);
      } else {
        setError(err instanceof ApiError ? err.message : "Could not compute estimate.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {isDemo && <DemoBanner />}
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-2xl text-soil">Second Income</h1>
        <p className="mt-1 text-soil/60">Agrivoltaics: solar and crops sharing the same land.</p>

        <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-2xl bg-wheat/40">
          {exists ? (
            <Image src={`/art/${filename}`} alt="Agrivoltaics illustration" fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-soil/40">
              {filename} · not yet in /public/art/
            </div>
          )}
        </div>

        <p className="mt-6 text-soil/70">
          Elevated solar panels over part of a field can generate power income while still allowing
          shade-tolerant crops underneath — PM-KUSUM infrastructure already exists for the solar
          side. This estimate covers the solar-hosting rate only; crop income underneath is not
          included since no crop-specific yield data exists for this yet.
        </p>

        <form onSubmit={calculate} className="mt-8 flex items-end gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-soil">State</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-soil/20 bg-wheat/20 px-4 py-2.5 text-soil focus:border-terracotta focus:outline-none"
            >
              {STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium text-soil">Land (acres)</label>
            <input
              value={acres}
              onChange={(e) => setAcres(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-soil/20 bg-wheat/20 px-4 py-2.5 text-soil focus:border-terracotta focus:outline-none"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Calculating..." : "Calculate"}
          </Button>
        </form>

        {error && <p className="mt-4 text-sm text-terracotta">{error}</p>}

        {estimate && (
          <div className="mt-6 rounded-3xl border border-soil/10 bg-wheat/30 p-8">
            <p className="text-3xl text-soil">
              ₹{estimate.annual_income_estimate.toLocaleString("en-IN")}/year
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-soil/10 pt-4">
              <div>
                <p className="text-xs font-medium text-soil/50">Monthly Income</p>
                <p className="text-lg font-semibold text-soil">
                  ₹{Math.round(estimate.annual_income_estimate / 12).toLocaleString("en-IN")}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-soil/50">Per Acre Rate</p>
                <p className="text-lg font-semibold text-soil">
                  ₹{Math.round(estimate.annual_income_estimate / estimate.land_acres).toLocaleString("en-IN")}/acre
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-soil/60">{estimate.rate_basis}</p>
            <p className="mt-4 text-xs text-soil/50">Source: {estimate.source}</p>
          </div>
        )}
      </div>
    </>
  );
}