import { SiteFooter } from "@/components/layout/site-footer";

/**
 * Impact & Data — one job: the receipts. Per the plan: minimal color,
 * no illustration, data speaks for itself. Deliberately the most
 * restrained page on the site — a contrast to the Story page's
 * illustrated scroll narrative.
 */
const STATS = [
  {
    figure: "10,00,000+",
    label: "Solar irrigation pumps installed under PM-KUSUM nationally",
    note: "Hardware infrastructure already exists — Savitri is the decision layer on top of it, not a competing hardware push.",
  },
  {
    figure: "15–20%",
    label: "Typical post-harvest loss for smallholder farmers without timely intervention",
    note: "The gap this product is built to close — not through new infrastructure, but through timing.",
  },
  {
    figure: "₹1.5 → ₹3.7/kg",
    label: "Price gap between a distress sale and a sale after proper storage",
    note: "The economic case for cold-storage matching and market-timing guidance, in one number.",
  },
];

export default function ImpactPage() {
  return (
    <>
      <main className="font-body">
        <section className="mx-auto max-w-2xl px-6 pb-8 pt-20">
          <h1 className="font-body text-3xl font-semibold text-soil md:text-4xl">
            Impact &amp; Data
          </h1>
          <p className="mt-4 text-soil/70">
            The real numbers behind the problem Savitri is built to solve —
            and where each one comes from.
          </p>
        </section>

        <section className="mx-auto max-w-2xl divide-y divide-soil/10 px-6 py-8">
          {STATS.map((s) => (
            <div key={s.label} className="py-8">
              <div className="text-3xl text-soil">{s.figure}</div>
              <p className="mt-2 font-medium text-soil">{s.label}</p>
              <p className="mt-2 text-sm text-soil/60">{s.note}</p>
            </div>
          ))}
        </section>

        <section className="mx-auto max-w-2xl px-6 pb-24 pt-4">
          <h2 className="font-body text-lg font-semibold text-soil">On the backend, specifically</h2>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-soil/70">
            <li>— Irrigation math: real FAO-56 Penman-Monteith, verified against the standard&apos;s own published worked example</li>
            <li>— Disease detection: refuses to output a prediction without a real trained model checkpoint present</li>
            <li>— Mandi prices: real government data.gov.in Agmarknet feed, dated, never presented as live</li>
            <li>— Cold storage: real Haversine distance matching, never a fabricated facility location</li>
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
