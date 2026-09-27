"use client";

export function DemoBanner() {
  return (
    <div className="w-full border-b border-soil/10 bg-wheat/60 px-4 py-2.5">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2.5">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-terracotta/60" />
        <p className="text-center text-[12px] text-soil/60">
          <span className="font-semibold text-soil/80">Prototype demo.</span>
          {" "}The backend is fully built and runs locally — just couldn&apos;t afford cloud deployment yet.
          {" "}Sample data shown for a rice farm in Patna, Bihar.
        </p>
      </div>
    </div>
  );
}
