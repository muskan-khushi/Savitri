import { EmptyState } from "@/components/illustration/EmptyState";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Dashboard Overview — one job: today's snapshot, routing to the
 * relevant detail page for each signal. No live backend wiring yet
 * in this frontend build (a distinct integration step) — showing an
 * honest empty state rather than fabricated sample numbers.
 */
export default function DashboardHome() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl text-soil">Good morning</h1>
      <p className="mt-1 text-soil/60">Here&apos;s today, across your farm.</p>

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
