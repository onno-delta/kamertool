import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
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
          <div className="flex min-h-dvh flex-col bg-primary-15">
            <Nav />
            <main id="main-content" className="flex min-h-0 flex-1 flex-col" role="main">
              {children}
            </main>
            <footer className="shrink-0 border-t border-primary-30 bg-white py-6">
              <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 text-center text-sm text-primary-75">
                <span>Kamertool — Debatvoorbereiding</span>
                <a href="https://kamer.deltainstituut.nl" className="hover:text-primary underline">
                  Live site
                </a>
                <a href="https://github.com/onno-delta/kamertool" className="hover:text-primary underline" target="_blank" rel="noopener noreferrer">
                  Broncode
                </a>
              </div>
            </footer>
            <BriefingBar />
          </div>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
