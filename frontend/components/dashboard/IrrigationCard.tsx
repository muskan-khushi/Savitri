import type { IrrigationAdvisory } from "@/lib/api";

interface Props {
  advisory: IrrigationAdvisory;
}

export function IrrigationCard({ advisory }: Props) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        advisory.should_irrigate
          ? "border-terracotta/30 bg-terracotta/5"
          : "border-green-200 bg-green-50"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-soil/40">
        Irrigation — {advisory.growth_stage} stage
      </p>
      <p
        className={`mt-2 text-xl font-semibold ${
          advisory.should_irrigate ? "text-terracotta" : "text-green-700"
        }`}
      >
        {advisory.should_irrigate ? "💧 Irrigate today" : "✅ No irrigation needed"}
      </p>
      <p className="mt-1 text-sm text-soil/70">{advisory.recommendation_text}</p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-soil/40">ET₀</p>
          <p className="text-sm font-semibold text-soil">
            {advisory.et0_mm_day.toFixed(1)} mm
          </p>
        </div>
        <div>
          <p className="text-xs text-soil/40">Kc</p>
          <p className="text-sm font-semibold text-soil">{advisory.kc.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-soil/40">Net need</p>
          <p className="text-sm font-semibold text-soil">
            {advisory.net_irrigation_mm.toFixed(1)} mm
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs text-soil/30">
        {advisory.date} · {advisory.t_min_c}°C – {advisory.t_max_c}°C ·{" "}
        {advisory.precipitation_mm.toFixed(1)}mm rain
      </p>
    </div>
  );
}
