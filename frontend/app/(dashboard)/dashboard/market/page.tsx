import { EmptyState } from "@/components/illustration/EmptyState";

/**
 * Market: Sell or Store — one job: today's real mandi price, with a
 * clear sell-now-or-store recommendation. Maps to
 * GET /api/v1/mandi-prices (real Agmarknet/data.gov.in data). That
 * endpoint requires a real personal DATA_GOV_API_KEY that hasn't been
 * provisioned in this environment yet — an infrastructure step, not
 * something fakeable from the frontend.
 */
export default function MarketPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl text-soil">Market: Sell or Store</h1>
      <p className="mt-1 text-soil/60">Real government mandi prices, dated — never presented as live.</p>
      <div className="mt-10">
        <EmptyState
          title="Price feed not connected yet"
          body="This needs a real data.gov.in API key registered and set as DATA_GOV_API_KEY on the backend — a credential only a real account holder can obtain, not something this page can work around."
        />
      </div>
    </div>
  );
}
