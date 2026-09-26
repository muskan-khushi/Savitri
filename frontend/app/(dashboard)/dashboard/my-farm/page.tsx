"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api, ApiError, type Farm } from "@/lib/api";
import { loadFarm, saveFarm } from "@/lib/farm-storage";

const DEFAULT_CROPS = [
  "rice", "wheat", "maize", "potato", "tomato", "onion", "banana", "soybean",
  "groundnut", "cotton", "chickpea", "mustard", "sugarcane", "turmeric",
  "ginger", "eggplant", "okra", "lentil", "mango", "cucumber"
];

const PRESETS = [
  { label: "Patna, Bihar", lat: "25.594", lon: "85.138", crop: "rice" },
  { label: "Muzaffarpur, Bihar", lat: "26.121", lon: "85.365", crop: "maize" },
  { label: "Nashik, Maharashtra", lat: "19.998", lon: "73.790", crop: "tomato" },
  { label: "Lucknow, UP", lat: "26.847", lon: "80.946", crop: "wheat" },
];

export default function MyFarmPage() {
  const [farm, setFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [crops, setCrops] = useState<string[]>(DEFAULT_CROPS);
  const [name, setName] = useState("");
  const [lat, setLat] = useState("25.594");
  const [lon, setLon] = useState("85.138");
  const [crop, setCrop] = useState("rice");
  const [sowingDate, setSowingDate] = useState(() => {
    // Default to ~60 days ago so calculations show active growth stage
    const d = new Date();
    d.setDate(d.getDate() - 60);
    return d.toISOString().split("T")[0];
  });

  useEffect(() => {
    // 1. Fetch dynamic crops list from backend
    fetch("http://localhost:8000/api/v1/crops")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.crops && Array.isArray(data.crops)) {
          setCrops(data.crops);
        }
      })
      .catch(() => {});

    // 2. Load stored farm
    const stored = loadFarm();
    if (!stored) {
      setLoading(false);
      return;
    }

    api
      .getFarm(stored.id)
      .then((f) => {
        setFarm(f);
        setName(f.name ?? "");
        setLat(String(f.lat));
        setLon(String(f.lon));
        setCrop(f.crop);
        setSowingDate(f.sowing_date);
      })
      .catch(() => {
        // Fallback to localStorage data if backend getFarm fails
        setFarm({
          id: stored.id,
          name: stored.data.name,
          lat: stored.data.lat,
          lon: stored.data.lon,
          crop: stored.data.crop,
          sowing_date: stored.data.sowing_date,
          telegram_chat_id: stored.data.telegram_chat_id ?? null,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  function handleDetectLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(4));
        setLon(pos.coords.longitude.toFixed(4));
        setLocating(false);
      },
      (err) => {
        setError(`Location access denied or failed: ${err.message}`);
        setLocating(false);
      },
      { timeout: 10000 }
    );
  }

  function handlePreset(p: typeof PRESETS[0]) {
    setLat(p.lat);
    setLon(p.lon);
    setCrop(p.crop);
    setName(`${p.label} Plot`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);

    if (isNaN(latNum) || isNaN(lonNum)) {
      setError("Please enter valid decimal coordinates for latitude and longitude.");
      setSaving(false);
      return;
    }

    try {
      const created = await api.createFarm({
        name: name || undefined,
        lat: latNum,
        lon: lonNum,
        crop,
        sowing_date: sowingDate,
      });

      // Save directly into the format expected by loadFarm()
      saveFarm(created);
      setFarm(created);
      setSuccess(`Farm profile saved! All dashboard modules are now synced with ${created.crop.toUpperCase()} at (${created.lat}, ${created.lon}).`);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not reach the backend — is it running?"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-lg text-soil/60 animate-pulse">Loading farm profile...</div>;
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-2xl text-soil">My Farm Profile</h1>
      <p className="mt-1 text-soil/60">
        The single digital twin for your plot. Powers real FAO-56 irrigation, market economics, disease forecasts, and satellite field telemetry.
      </p>

      {farm && (
        <div className="mt-6 rounded-2xl border border-leaf/30 bg-leaf/10 p-4 text-sm text-soil flex items-center justify-between">
          <div>
            <p className="font-semibold text-leaf">Active Plot Connected</p>
            <p className="mt-0.5 text-soil/70">
              Farm #{farm.id} · <span className="capitalize">{farm.crop}</span> · ({farm.lat}, {farm.lon})
            </p>
          </div>
          <span className="text-2xl">🌱</span>
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-xl border border-leaf/40 bg-leaf/15 px-4 py-3 text-sm text-leaf">
          {success}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-terracotta/40 bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
          {error}
        </div>
      )}

      {/* Preset pills for rapid demo / onboarding */}
      <div className="mt-6">
        <label className="text-xs font-semibold uppercase tracking-wider text-soil/50">
          Quick Demo Presets
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => handlePreset(p)}
              className="rounded-full border border-soil/20 bg-wheat/30 px-3 py-1 text-xs font-medium text-soil hover:border-terracotta hover:bg-wheat/60 transition-colors"
            >
              📍 {p.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-soil">Farm Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. North Plot - Ganga Basin"
            className="mt-1 w-full rounded-xl border border-soil/20 bg-wheat/20 px-4 py-2.5 text-soil focus:border-terracotta focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-soil">Latitude</label>
            <input
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="mt-1 w-full rounded-xl border border-soil/20 bg-wheat/20 px-4 py-2.5 text-soil focus:border-terracotta focus:outline-none"
              placeholder="25.594"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-soil">Longitude</label>
            <input
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              className="mt-1 w-full rounded-xl border border-soil/20 bg-wheat/20 px-4 py-2.5 text-soil focus:border-terracotta focus:outline-none"
              placeholder="85.138"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={locating}
          className="text-xs font-medium text-terracotta hover:underline self-start flex items-center gap-1 -mt-1"
        >
          {locating ? "Detecting GPS..." : "📍 Use my current browser GPS"}
        </button>

        <div>
          <label className="text-sm font-medium text-soil">Crop Type (FAO-56 Calibrated)</label>
          <select
            value={crop}
            onChange={(e) => setCrop(e.target.value)}
            className="mt-1 w-full rounded-xl border border-soil/20 bg-wheat/20 px-4 py-2.5 text-soil focus:border-terracotta focus:outline-none capitalize"
          >
            {crops.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-soil">Sowing / Transplanting Date</label>
          <input
            type="date"
            value={sowingDate}
            onChange={(e) => setSowingDate(e.target.value)}
            required
            className="mt-1 w-full rounded-xl border border-soil/20 bg-wheat/20 px-4 py-2.5 text-soil focus:border-terracotta focus:outline-none"
          />
        </div>

        <Button type="submit" disabled={saving} className="mt-2 w-full">
          {saving ? "Registering Plot..." : "Save Farm Profile"}
        </Button>
      </form>
    </div>
  );
}