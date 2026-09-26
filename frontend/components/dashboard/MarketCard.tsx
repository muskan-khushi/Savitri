import type { MarketAdvice } from "@/lib/api";

interface Props {
  advice: MarketAdvice;
}

export function MarketCard({ advice }: Props) {
  const gain = advice.projected_gain_per_kg;
  const positive = gain !== null && gain > 0;

  return (
    <div className="rounded-2xl border border-soil/10 bg-wheat/20 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-soil/40">
        Market · {advice.commodity}
      </p>
      {advice.latest_modal_price_per_kg !== null ? (
        <p className="mt-2 text-xl font-semibold text-soil">
          ₹{advice.latest_modal_price_per_kg.toFixed(2)}/kg
        </p>
      ) : (
        <p className="mt-2 text-sm text-soil/50">No price data</p>
      )}
      {advice.high_price_volatility && (
        <p className="mt-1 text-xs text-amber-600 font-medium">⚡ High price volatility</p>
      )}
      {gain !== null ? (
        <p className={`mt-2 text-sm font-medium ${positive ? "text-green-700" : "text-red-600"}`}>
          {positive ? `+₹${gain.toFixed(2)}/kg` : `−₹${Math.abs(gain).toFixed(2)}/kg`} storing{" "}
          {advice.storage_days}d
        </p>
      ) : null}
      <p className="mt-3 text-sm text-soil/70">{advice.recommendation_text}</p>
      <p className="mt-2 text-xs text-soil/40">
        {advice.trend_method} · as of {advice.latest_arrival_date ?? "—"}
      </p>
    </div>
  );
}
