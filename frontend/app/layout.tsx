import type { Metadata } from "next";
import localFont from "next/font/local";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

// Fraunces (display) — real OFL-licensed variable font, self-hosted
// from Google's official open-source font repo (fonts.googleapis.com
// isn't reachable from this build environment's network; these are
// the exact same files Google Fonts serves, just vendored locally).
const fraunces = localFont({
  src: "../public/fonts/Fraunces-Variable.ttf",
  variable: "--font-fraunces",
  display: "swap",
});

// Geist (body/UI) — per the master UI plan's spec ("Inter or Geist").
// Uses the official `geist` npm package (Vercel's own font package
// with built-in next/font integration) rather than fetching from
// fonts.googleapis.com.
const geistSans = GeistSans;

// Noto Sans Devanagari — the plan calls this non-negotiable: any
// Hindi/regional-language content (e.g. the For Farmers chat preview)
// must render natively, not fall back to a generic system font.
const notoDevanagari = localFont({
  src: "../public/fonts/NotoSansDevanagari-Variable.ttf",
  variable: "--font-noto-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Savitri — Decision support for Indian farmers",
  description:
    "Irrigation timing, harvest windows, and market prices delivered in your language, before the loss happens.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${geistSans.variable} ${notoDevanagari.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-dawn-cream text-soil">
        {children}
      </body>
    </html>
  );
}
