import Link from "next/link";

const LAYERS = [
  {
    index: "01",
    title: "Field Digital Twin",
    body: "3-stratum soil moisture telemetry via ERA5-Land reanalysis. Vegetation stress indexed hourly.",
    href: "/dashboard",
  },
  {
    index: "02",
    title: "Precision Irrigation",
    body: "FAO-56 Penman-Monteith ET₀ computed from live weather. Crop-stage Kc for 20 Indian crops.",
    href: "/dashboard/irrigation",
  },
  {
    index: "03",
    title: "Leaf Pathology Vision",
    body: "MobileNetV2 classifying 38 disease types across 14 crops. Automatic 50 km outbreak radar.",
    href: "/dashboard/crop-health",
  },
  {
    index: "04",
    title: "Spoilage Kinetics",
    body: "Arrhenius Q10 thermal model computes real-time post-harvest shelf life from ambient temperature.",
    href: "/dashboard",
  },
  {
    index: "05",
    title: "Cold Chain Network",
    body: "50 verified horticulture hubs. Haversine matching, capacity checking, FPO slot booking.",
    href: "/allocation",
  },
  {
    index: "06",
    title: "Market Intelligence",
    body: "Agmarknet OLS price regression with volatility coefficient — know when to sell, when to hold.",
    href: "/dashboard/market",
  },
  {
    index: "07",
    title: "Climate & Insurance",
    body: "16-day drought and heat stress index. Automatic PMFBY enrollment nudge before cutoff.",
    href: "/dashboard/climate",
  },
  {
    index: "08",
    title: "Solar Income Layer",
    body: "PM-KUSUM Component A calculator. Dual-income modelling across 17 state tariff regimes.",
    href: "/dashboard",
  },
  {
    index: "09",
    title: "Vernacular Delivery",
    body: "Full advisory stack delivered on WhatsApp and Telegram in Hindi, Bengali, Tamil, and four more.",
    href: "https://t.me/SavitriAgriBot",
  },
];

export function NineLayersGrid() {
  return (
    <section className="border-t border-soil/8 py-24">
      <div className="mx-auto max-w-6xl px-6">

        {/* Header */}
        <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-2 md:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-terracotta">
              Architecture
            </p>
            <h2 className="mt-3 text-[2.2rem] font-bold leading-tight text-soil">
              Nine layers.
              <br />One operating system.
            </h2>
          </div>
          <p className="text-[15px] leading-relaxed text-soil/55 md:text-right">
            Each layer runs independently and feeds into the next. From satellite
            soil telemetry to vernacular WhatsApp delivery — no gaps, no black
            boxes.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-px bg-soil/8 sm:grid-cols-2 lg:grid-cols-3 rounded-2xl overflow-hidden border border-soil/8">
          {LAYERS.map((l) => (
            <Link
              key={l.index}
              href={l.href}
              className="group flex flex-col justify-between bg-cream/80 p-7 transition-colors hover:bg-wheat/40"
            >
              <div>
                <span className="font-mono text-[11px] font-bold tracking-widest text-soil/25">
                  {l.index}
                </span>
                <h3 className="mt-3 text-[1.15rem] font-bold text-soil transition-colors group-hover:text-terracotta">
                  {l.title}
                </h3>
                <p className="mt-2.5 text-[13px] leading-relaxed text-soil/55">
                  {l.body}
                </p>
              </div>
              <span className="mt-6 text-[11px] font-semibold text-soil/25 transition-colors group-hover:text-terracotta">
                Explore →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
