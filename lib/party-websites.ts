/**
 * Configuratie voor partijwebsite-profielpagina's.
 * Gebruikt door de party-scraper om profiel-URLs en thema-tags te vinden.
 */

export type PartyWebsiteConfig = {
  baseUrl: string
  memberListUrl: string
  slugPattern: "firstname-lastname" | "lastname-firstname" | "full-name"
  tagKeywords: string[]
  skipScraping?: boolean
}

/**
 * Zoekwoorden die dossier-secties identificeren op partijwebsites.
 */
const DEFAULT_TAG_KEYWORDS = [
  "portefeuille",
  "woordvoerder",
  "focust op",
  "specialisme",
  "dossiers",
  "onderwerpen",
  "thema",
  "beleidsterreinen",
]

export const PARTY_WEBSITE_CONFIG: Record<string, PartyWebsiteConfig> = {
  VVD: {
    baseUrl: "https://www.vvd.nl/personen",
    memberListUrl: "https://www.vvd.nl/personen",
    slugPattern: "full-name",
    tagKeywords: DEFAULT_TAG_KEYWORDS,
  },
  D66: {
    baseUrl: "https://d66.nl/mensen",
    memberListUrl: "https://d66.nl/mensen",
    slugPattern: "full-name",
    tagKeywords: DEFAULT_TAG_KEYWORDS,
  },
  CDA: {
    baseUrl: "https://www.cda.nl/mensen",
    memberListUrl: "https://www.cda.nl/mensen",
    slugPattern: "full-name",
    tagKeywords: DEFAULT_TAG_KEYWORDS,
  },
  "GL-PvdA": {
    baseUrl: "https://groenlinks-pvda.nl/mensen",
    memberListUrl: "https://groenlinks-pvda.nl/mensen",
    slugPattern: "full-name",
    tagKeywords: DEFAULT_TAG_KEYWORDS,
  },
  SP: {
    baseUrl: "https://www.sp.nl/mensen",
    memberListUrl: "https://www.sp.nl/mensen",
    slugPattern: "full-name",
    tagKeywords: DEFAULT_TAG_KEYWORDS,
  },
  CU: {
    baseUrl: "https://www.christenunie.nl/mensen",
    memberListUrl: "https://www.christenunie.nl/mensen",
    slugPattern: "full-name",
    tagKeywords: DEFAULT_TAG_KEYWORDS,
  },
  SGP: {
    baseUrl: "https://www.sgp.nl/mensen",
    memberListUrl: "https://www.sgp.nl/mensen",
    slugPattern: "full-name",
    tagKeywords: DEFAULT_TAG_KEYWORDS,
  },
  Volt: {
    baseUrl: "https://voltnederland.org/mensen",
    memberListUrl: "https://voltnederland.org/mensen",
    slugPattern: "full-name",
    tagKeywords: DEFAULT_TAG_KEYWORDS,
  },
  DENK: {
    baseUrl: "https://www.bewegingdenk.nl/mensen",
    memberListUrl: "https://www.bewegingdenk.nl/mensen",
    slugPattern: "full-name",
    tagKeywords: DEFAULT_TAG_KEYWORDS,
  },
  BBB: {
    baseUrl: "https://www.boerburgerbeweging.nl/mensen",
    memberListUrl: "https://www.boerburgerbeweging.nl/mensen",
    slugPattern: "full-name",
    tagKeywords: DEFAULT_TAG_KEYWORDS,
  },
  PvdD: {
    baseUrl: "https://www.partijvoordedieren.nl/mensen",
    memberListUrl: "https://www.partijvoordedieren.nl/mensen",
    slugPattern: "full-name",
    tagKeywords: DEFAULT_TAG_KEYWORDS,
  },
  PVV: {
    baseUrl: "",
    memberListUrl: "",
    slugPattern: "full-name",
    tagKeywords: [],
    skipScraping: true,
  },
  FVD: {
    baseUrl: "",
    memberListUrl: "",
    slugPattern: "full-name",
    tagKeywords: [],
    skipScraping: true,
  },
  JA21: {
    baseUrl: "",
    memberListUrl: "",
    slugPattern: "full-name",
    tagKeywords: [],
    skipScraping: true,
  },
  "Groep Markuszower": {
    baseUrl: "",
    memberListUrl: "",
    slugPattern: "full-name",
    tagKeywords: [],
    skipScraping: true,
  },
  "50PLUS": {
    baseUrl: "",
    memberListUrl: "",
    slugPattern: "full-name",
    tagKeywords: [],
    skipScraping: true,
  },
  "Lid Keijzer": {
    baseUrl: "",
    memberListUrl: "",
    slugPattern: "full-name",
    tagKeywords: [],
    skipScraping: true,
  },
}

/**
 * Maakt een URL-slug van een naam.
 * "Ulas Kose" → "ulas-kose"
 * "Sjoerd Sjoerdsma" → "sjoerd-sjoerdsma"
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
