import { EmptyState } from "@/components/illustration/EmptyState";

/**
 * Climate & Insurance — one job: connect real weather risk to
 * available crop insurance schemes (e.g. PMFBY). No backend model
 * for this exists yet — genuinely unbuilt, not a frontend gap.
 */
export default function ClimatePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl text-soil">Climate & Insurance</h1>
      <p className="mt-1 text-soil/60">Weather risk, connected to real insurance options.</p>
      <div className="mt-10">
        <EmptyState
          title="Not built yet"
          body="This page needs a real mapping between weather-risk signals and actual insurance scheme eligibility (e.g. PMFBY) — genuinely unbuilt on the backend, tracked on the roadmap rather than implied to work."
        />
      </div>
    </div>
  );
}
