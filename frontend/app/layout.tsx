import type { Metadata } from "next";
import localFont from "next/font/local";
import { GeistSans } from "geist/font/sans";
import { SiteNav } from "@/components/layout/site-nav";
import "./globals.css";

const fraunces = localFont({
  src: "../public/fonts/Fraunces-Variable.ttf",
  variable: "--font-fraunces",
  display: "swap",
});

const geistSans = GeistSans;

const notoDevanagari = localFont({
  src: "../public/fonts/NotoSansDevanagari-Variable.ttf",
  variable: "--font-noto-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Savitri — Agricultural Intelligence",
  description:
    "Irrigation, crop health, cold chain, and market signals — before the loss happens.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${geistSans.variable} ${notoDevanagari.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-soil">
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
