import type { SpoilageRisk } from "@/lib/api";

const COLOURS: Record<string, string> = {
  low: "text-green-700",
  medium: "text-amber-700",
  high: "text-red-700",
};

const BAR_COLOURS: Record<string, string> = {
  low: "bg-green-400",
  medium: "bg-amber-400",
  high: "bg-red-500",
};

interface Props {
  risk: SpoilageRisk;
}

export function SpoilageCard({ risk }: Props) {
  return (
    <div className="rounded-2xl border border-soil/10 bg-wheat/20 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-soil/40">Spoilage Risk</p>
      <p className={`mt-2 text-xl font-semibold capitalize ${COLOURS[risk.risk_level]}`}>
        {risk.risk_level === "high"
          ? "🔴"
          : risk.risk_level === "medium"
          ? "🟡"
          : "🟢"}{" "}
        {risk.risk_level} risk
      </p>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-soil/10">
        <div
          className={`h-full rounded-full ${BAR_COLOURS[risk.risk_level]}`}
          style={{ width: `${Math.min(risk.risk_ratio * 100, 100)}%` }}
        />
      </div>
      <p className="mt-3 text-sm text-soil/70">{risk.recommendation_text}</p>
      <p className="mt-2 text-xs text-soil/40">
        Day {risk.days_since_harvest} of {risk.effective_shelf_life_days.toFixed(1)}-day effective
        shelf life
      </p>
    </div>
  );
}
