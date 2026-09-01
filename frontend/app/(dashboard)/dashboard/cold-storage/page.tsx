import { EmptyState } from "@/components/illustration/EmptyState";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Cold Storage — one job: nearest real facility with real distance.
 * Maps to GET /api/v1/cold-storage/nearest (real Haversine matching).
 * That endpoint returns an honest 404 when no facility data has been
 * loaded yet — which is the actual current state (no real Bihar
 * cold-storage dataset has been sourced and imported yet, by design:
 * zero fabricated facility coordinates).
 */
export default function ColdStoragePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl text-soil">Cold Storage</h1>
      <p className="mt-1 text-soil/60">Real distance to real facilities — never an invented location.</p>
      <div className="mt-10">
        <EmptyState
          title="No facility data loaded yet"
          body="This isn't a bug to fix in the frontend — the backend genuinely has zero cold-storage facility records until a real Bihar dataset is sourced and imported. See backend/scripts/import_cold_storage_csv.py."
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
