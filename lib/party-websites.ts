/**
 * Configuratie voor partijwebsite-profielpagina's.
 * Gebruikt door de party-scraper om profiel-URLs en thema-tags te vinden.
 */

export type PartyWebsiteConfig = {
  /** Generates candidate profile URLs to try in order */
  candidateUrls: (slug: string) => string[]
  /** URL of the member list page for fallback scraping */
  memberListUrl: string
  /** Skip scraping entirely (party has no member pages) */
  skipScraping?: boolean
}

function simpleConfig(baseUrl: string): PartyWebsiteConfig {
  return {
    candidateUrls: (slug) => [`${baseUrl}/${slug}`],
    memberListUrl: baseUrl,
  }
}

const SKIP: PartyWebsiteConfig = {
  candidateUrls: () => [],
  memberListUrl: "",
  skipScraping: true,
}

export const PARTY_WEBSITE_CONFIG: Record<string, PartyWebsiteConfig> = {
  // VVD: /profielen/{slug}/ is canonical, /personen/{slug} redirects
  VVD: {
    candidateUrls: (slug) => [
      `https://www.vvd.nl/profielen/${slug}/`,
      `https://www.vvd.nl/personen/${slug}`,
    ],
    memberListUrl: "https://www.vvd.nl/profielen/",
  },
  D66: simpleConfig("https://d66.nl/mensen"),
  CDA: simpleConfig("https://www.cda.nl/mensen"),
  "GL-PvdA": simpleConfig("https://groenlinks-pvda.nl/mensen"),
  SP: simpleConfig("https://www.sp.nl/mensen"),
  CU: simpleConfig("https://www.christenunie.nl/mensen"),
  SGP: simpleConfig("https://www.sgp.nl/mensen"),
  Volt: simpleConfig("https://voltnederland.org/mensen"),
  DENK: simpleConfig("https://www.bewegingdenk.nl/mensen"),
  BBB: simpleConfig("https://www.boerburgerbeweging.nl/mensen"),
  PvdD: simpleConfig("https://www.partijvoordedieren.nl/mensen"),
  PVV: SKIP,
  FVD: SKIP,
  JA21: SKIP,
  "Groep Markuszower": SKIP,
  "50PLUS": SKIP,
  "Lid Keijzer": SKIP,
}

/**
 * Maakt een URL-slug van een naam.
 * "Ulas Kose" → "ulas-kose"
 */
export function slugifyName(naam: string): string {
  return naam
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}
