"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api, ApiError, type Farm } from "@/lib/api";
import { getStoredFarmId, setStoredFarmId } from "@/lib/farm-storage";

/**
 * My Farm — one job: the farm profile that every other dashboard page
 * depends on (location, crop, sowing date). Now actually wired to
 * POST /api/v1/farms and GET /api/v1/farms/{id} — previously this was
 * a form that saved nowhere.
 */

const CROPS = ["rice", "wheat", "maize", "sugarcane", "potato", "cotton", "chickpea", "mustard"];

export default function MyFarmPage() {
  const [farm, setFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [lat, setLat] = useState("25.6");
  const [lon, setLon] = useState("85.1");
  const [crop, setCrop] = useState(CROPS[0]);
  const [sowingDate, setSowingDate] = useState("");

  useEffect(() => {
    const id = getStoredFarmId();
    if (!id) {
      setLoading(false);
      return;
    }
    api
      .getFarm(id)
      .then((f) => {
        setFarm(f);
        setName(f.name ?? "");
        setLat(String(f.lat));
        setLon(String(f.lon));
        setCrop(f.crop);
        setSowingDate(f.sowing_date);
      })
      .catch(() => {
        /* stale/invalid id in localStorage — ignore, show empty form */
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const created = await api.createFarm({
        name: name || undefined,
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        crop,
        sowing_date: sowingDate,
      });
      setStoredFarmId(created.id);
      setFarm(created);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not reach the backend — is it running?"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-lg text-soil/60">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-2xl text-soil">My Farm</h1>
      <p className="mt-1 text-soil/60">
        This is what every other page uses to compute real numbers for you.
      </p>

      {farm && (
        <div className="mt-6 rounded-2xl border border-leaf/30 bg-leaf/10 px-4 py-3 text-sm text-soil">
          Saved: farm #{farm.id} — {farm.crop} at ({farm.lat}, {farm.lon})
        </div>
      )}
      {error && (
        <div className="mt-6 rounded-2xl border border-terracotta/40 bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <div>
          <label className="text-sm font-medium text-soil">Farm name (optional)</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-soil/20 bg-wheat/20 px-4 py-2.5 text-soil focus:border-terracotta focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-soil">Latitude</label>
            <input
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-soil/20 bg-wheat/20 px-4 py-2.5 text-soil focus:border-terracotta focus:outline-none"
              placeholder="25.6"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-soil">Longitude</label>
            <input
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-soil/20 bg-wheat/20 px-4 py-2.5 text-soil focus:border-terracotta focus:outline-none"
              placeholder="85.1"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-soil">Crop</label>
          <select
            value={crop}
            onChange={(e) => setCrop(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-soil/20 bg-wheat/20 px-4 py-2.5 text-soil focus:border-terracotta focus:outline-none"
          >
            {CROPS.map((c) => (
              <option key={c} value={c}>
                {c[0].toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-soil">Sowing date</label>
          <input
            type="date"
            value={sowingDate}
            onChange={(e) => setSowingDate(e.target.value)}
            required
            className="mt-1.5 w-full rounded-xl border border-soil/20 bg-wheat/20 px-4 py-2.5 text-soil focus:border-terracotta focus:outline-none"
          />
        </div>
        <Button type="submit" disabled={saving} className="mt-2">
          {saving ? "Saving..." : "Save farm"}
        </Button>
      </form>
    </div>
  );
}