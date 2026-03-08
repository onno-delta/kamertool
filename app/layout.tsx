import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "@/components/providers";
import { Nav } from "@/components/nav";
import { BriefingBar } from "@/components/briefing-bar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kamertool — Debatvoorbereiding",
  description: "AI-tool voor Kamerleden om debatten voor te bereiden",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className="antialiased">
        {/* Skip links — Rijkshuisstijl/toegankelijkheid: direct naar inhoud/nav */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-white focus:outline-none"
        >
          Direct naar inhoud
        </a>
        <a
          href="#main-nav"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-14 focus:z-[100] focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-white focus:outline-none"
        >
          Direct naar navigatie
        </a>
        <Providers>
          <div className="flex h-dvh flex-col">
            <Nav />
            <main id="main-content" className="flex min-h-0 flex-1 flex-col" role="main">
              <div className="mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-8 sm:px-6 sm:pt-10">
                {children}
              </div>
            </main>
            <footer className="shrink-0 border-t-[3px] border-primary bg-primary-dark py-5 text-white">
              <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 text-center text-sm">
                <span className="text-white">Kamertool — Debatvoorbereiding</span>
                <a href="https://kamer.deltainstituut.nl" className="text-white/70 hover:text-white">
                  Live site
                </a>
                <a
                  href="https://github.com/onno-delta/kamertool"
                  className="text-white/70 hover:text-white"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Broncode
                </a>
              </div>
            </footer>
            <BriefingBar />
          </div>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
