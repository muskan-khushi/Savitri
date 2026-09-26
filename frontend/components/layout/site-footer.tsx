import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-soil/10 bg-cream">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">

          {/* Brand */}
          <div className="max-w-xs">
            <p className="font-display text-lg font-bold text-soil">Savitri</p>
            <p className="mt-2.5 text-[13px] leading-relaxed text-soil/50">
              Quiet intelligence for India&apos;s farms. Irrigation, pathology,
              cold chain, and price signals — before the loss happens.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-16">
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-soil/35">Platform</p>
              {[
                ["Dashboard", "/dashboard"],
                ["Crop Health", "/dashboard/crop-health"],
                ["Cold Chain", "/allocation"],
                ["Impact", "/dashboard/impact"],
              ].map(([label, href]) => (
                <Link key={href} href={href} className="text-[13px] text-soil/55 hover:text-soil">
                  {label}
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-soil/35">Company</p>
              {[
                ["The story", "/story"],
                ["For farmers", "/for-farmers"],
                ["For FPOs", "/for-partners"],
                ["Telegram bot", "https://t.me/SavitriAgriBot"],
              ].map(([label, href]) => (
                <Link key={href} href={href} className="text-[13px] text-soil/55 hover:text-soil">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-2 border-t border-soil/8 pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-[11px] text-soil/35">
            © {new Date().getFullYear()} Savitri Agri Intelligence. All rights reserved.
          </p>
          <p className="text-[11px] text-soil/30">
            Physics: FAO-56 (Allen et al., 1998) · Data: Open-Meteo, ERA5-Land, Agmarknet
          </p>
        </div>
      </div>
    </footer>
  );
}
