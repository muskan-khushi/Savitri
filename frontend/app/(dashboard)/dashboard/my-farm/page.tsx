import { Button } from "@/components/ui/button";

/**
 * My Farm — one job: the farm profile that every other dashboard page
 * depends on (location, crop, sowing date). Deliberately boring —
 * per the plan, this page's job is to be simple and get out of the
 * way, not to be a feature showcase.
 *
 * Fields mirror the real backend schema exactly
 * (backend/app/schemas_farm.py: FarmCreate) so wiring this to
 * POST /api/v1/farms later is a straight mapping, not a redesign.
 */
export default function MyFarmPage() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-2xl text-soil">My Farm</h1>
      <p className="mt-1 text-soil/60">
        This is what every other page uses to compute real numbers for you.
      </p>

      {/* TODO: wire to POST /api/v1/farms (create) and
          POST /api/v1/farms/{id} (update) — this form doesn't
          currently persist anywhere. Flagged, not silently shipped
          as if it saves. */}
      <form className="mt-8 flex flex-col gap-5">
        <div>
          <label className="text-sm font-medium text-soil">Farm name (optional)</label>
          <input className="mt-1.5 w-full rounded-xl border border-soil/20 bg-wheat/20 px-4 py-2.5 text-soil focus:border-terracotta focus:outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-soil">Latitude</label>
            <input className="mt-1.5 w-full rounded-xl border border-soil/20 bg-wheat/20 px-4 py-2.5 text-soil focus:border-terracotta focus:outline-none" placeholder="25.6" />
          </div>
          <div>
            <label className="text-sm font-medium text-soil">Longitude</label>
            <input className="mt-1.5 w-full rounded-xl border border-soil/20 bg-wheat/20 px-4 py-2.5 text-soil focus:border-terracotta focus:outline-none" placeholder="85.1" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-soil">Crop</label>
          <select className="mt-1.5 w-full rounded-xl border border-soil/20 bg-wheat/20 px-4 py-2.5 text-soil focus:border-terracotta focus:outline-none">
            <option>Rice</option>
            <option>Wheat</option>
            <option>Maize</option>
            <option>Sugarcane</option>
            <option>Potato</option>
            <option>Cotton</option>
            <option>Chickpea</option>
            <option>Mustard</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-soil">Sowing date</label>
          <input type="date" className="mt-1.5 w-full rounded-xl border border-soil/20 bg-wheat/20 px-4 py-2.5 text-soil focus:border-terracotta focus:outline-none" />
        </div>
        <Button type="submit" className="mt-2">Save farm</Button>
      </form>
    </div>
  );
}
