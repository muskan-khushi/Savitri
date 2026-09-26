import Link from "next/link";

const LAYERS = [
  {
    num: "Layer 1",
    title: "Field Digital Twin",
    tech: "Open-Meteo ERA5-Land",
    desc: "Hourly soil moisture telemetry across 3 depth strata (0–7cm, 7–28cm, 28–100cm) and vegetation stress index.",
    href: "/dashboard",
    badge: "Telemetry Live",
  },
  {
    num: "Layer 2",
    title: "Precision FAO-56 Irrigation",
    tech: "Penman-Monteith Physics",
    desc: "Live daily atmospheric demand (ET₀) and crop development stage factors (Kc) for 20 calibrated Indian crops.",
    href: "/dashboard/irrigation",
    badge: "42.5% Water Saved",
  },
  {
    num: "Layer 3",
    title: "Disease Vision & Outbreaks",
    tech: "MobileNetV2 (38 Classes)",
    desc: "Diagnostic leaf pathology classification fine-tuned on 54k images with automatic 50km regional outbreak alerts.",
    href: "/dashboard/crop-health",
    badge: "AI Deep Learning",
  },
  {
    num: "Layer 4",
    title: "Q10 Spoilage Kinetics",
    tech: "Thermal Shelf-Life Modeling",
    desc: "Biochemical Arrhenius reaction rates calculating real-time post-harvest shelf life under ambient temperature grids.",
    href: "/dashboard/harvest-timing",
    badge: "Loss Prevention",
  },
  {
    num: "Layer 5",
    title: "50 Cold Chain Hubs & Booking",
    tech: "Haversine Distance & Slot Allocation",
    desc: "Overlapping capacity checking and FPO slot reservations across 50 verified Indian horticulture facilities.",
    href: "/allocation",
    badge: "50 Hubs Live",
  },
  {
    num: "Layer 6",
    title: "Agmarknet OLS Market Economics",
    tech: "Ordinary Least Squares + CV",
    desc: "Linear regression price trajectory and coefficient of variation volatility check for smart sell-vs-store timing.",
    href: "/dashboard/market",
    badge: "Government Data",
  },
  {
    num: "Layer 7",
    title: "16-Day Climate & PMFBY Nudge",
    tech: "Extended Weather Forecast",
    desc: "16-day drought index and accumulated heat stress degree days (GDD) automatically triggering insurance alerts.",
    href: "/dashboard/climate",
    badge: "Climate Defense",
  },
  {
    num: "Layer 8",
    title: "PM-KUSUM Agrivoltaics Calculator",
    tech: "17 State Tariff Economics",
    desc: "Dual-income modeling for smallholders hosting solar arrays above high-value crops with state-specific lease rates.",
    href: "/dashboard/second-income",
    badge: "17 States Covered",
  },
  {
    num: "Layer 9",
    title: "WhatsApp & Telegram Bot",
    tech: "Meta Cloud API & Bhashini NMT",
    desc: "Conversational voice-friendly delivery in Hindi, Bhojpuri, and English directly where smallholder farmers live.",
    href: "https://t.me/SavitriAgriBot",
    badge: "WhatsApp Ready",
  },
];

export function NineLayersGrid() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="text-center max-w-3xl mx-auto">
        <span className="rounded-full bg-leaf/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-leaf">
          Full-Stack Agri-OS
        </span>
        <h2 className="mt-3 font-display text-3xl sm:text-4xl text-soil font-bold">
          The 9-Layer Agricultural Decision Architecture
        </h2>
        <p className="mt-2 text-sm text-soil/70">
          Savitri is not a simple form or static dashboard. It is an end-to-end agronomic operating system connecting field physics to cold-chain logistics.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {LAYERS.map((l) => (
          <Link
            key={l.num}
            href={l.href}
            className="group rounded-3xl border border-soil/15 bg-wheat/20 p-6 transition-all duration-200 hover:border-terracotta/40 hover:bg-wheat/40 hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-terracotta">
                  {l.num}
                </span>
                <span className="rounded-full bg-soil/10 px-2.5 py-0.5 text-[10px] font-semibold text-soil/80">
                  {l.badge}
                </span>
              </div>
              <h3 className="mt-3 font-display text-xl font-bold text-soil group-hover:text-terracotta transition-colors">
                {l.title}
              </h3>
              <p className="mt-1 text-xs font-semibold text-leaf">
                Engine: {l.tech}
              </p>
              <p className="mt-3 text-xs text-soil/70 leading-relaxed">
                {l.desc}
              </p>
            </div>
            <p className="mt-6 text-xs font-bold text-soil/50 group-hover:text-terracotta transition-colors flex items-center gap-1">
              Explore Live Module →
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
