import { EmptyState } from "@/components/illustration/EmptyState";

/**
 * Facility Allocation View — one job: let a cold-storage operator see
 * real incoming demand against their real capacity. Depends on both
 * the cold-storage dataset (not yet sourced) and a demand-forecast
 * signal that doesn't exist yet — a genuinely unbuilt backend
 * capability, flagged rather than mocked with sample allocations.
 */
export default function AllocationPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-2xl text-soil">Facility Allocation</h1>
      <p className="mt-1 text-soil/60">Real incoming demand against your real capacity.</p>
      <div className="mt-10">
        <EmptyState
          title="Operator tooling not built yet"
          body="This view needs real facility capacity data and a demand-forecast signal, neither of which exist in the backend yet. No sample allocations are shown here in the meantime."
        />
      </div>
    </div>
  );
}
