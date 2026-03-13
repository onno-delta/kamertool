/**
 * Scrapt partijwebsites voor profiel-URLs en thema-tags per Kamerlid.
 * Gebruikt site-specifieke extractors per partij.
 */

import { PARTY_WEBSITE_CONFIG, slugifyName } from "./party-websites"

const USER_AGENT =
  "Mozilla/5.0 (compatible; Kamertool/1.0; +https://kamer.deltainstituut.nl)"

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

/**
 * Probeert de profiel-URL op de partijwebsite te vinden voor een Kamerlid.
 */
export async function findPartyProfileUrl(
  naam: string,
  fractie: string
): Promise<string | null> {
  const config = PARTY_WEBSITE_CONFIG[fractie]
  if (!config || config.skipScraping) return null

  const slug = slugifyName(naam)

  // Try candidate URLs in order
  for (const candidateUrl of config.candidateUrls(slug)) {
    try {
      const res = await fetch(candidateUrl, {
        method: "HEAD",
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(10000),
        redirect: "follow",
      })
      if (res.ok) return candidateUrl
    } catch {
      // Try GET as fallback (some servers don't support HEAD)
      const html = await fetchPage(candidateUrl)
      if (html) return candidateUrl
    }
  }

  // Fallback: scrape member list and fuzzy-match
  if (config.memberListUrl) {
    try {
      const html = await fetchPage(config.memberListUrl)
      if (!html) return null

      const lowerName = naam.toLowerCase()
      const parts = lowerName.split(" ")
      const lastName = parts[parts.length - 1]

      const linkRegex = /<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi
      let match
      while ((match = linkRegex.exec(html)) !== null) {
        const href = match[1]
        const linkText = match[2].replace(/<[^>]+>/g, "").trim().toLowerCase()

        if (linkText.includes(lastName) && parts.some((p) => linkText.includes(p))) {
          if (href.startsWith("http")) return href
          if (href.startsWith("/")) {
            const baseOrigin = new URL(config.memberListUrl).origin
            return `${baseOrigin}${href}`
          }
        }
      }
    } catch {
      // Fallback failed
    }
  }

  return null
}

// ── Site-specific tag extractors ──────────────────────────────────────

/**
 * D66: Accordion with aria-label="Expertises (portefeuilles)"
 * Content in .content-accordion__description, items separated by <br>
 * Also parses "focust op X, Y, Z" from intro paragraph.
 */
function extractTagsD66(html: string): string[] {
  const tags: string[] = []

  // Strategy 1: Expertises accordion
  // Match: aria-label containing "Expertises" or "portefeuilles",
  // then find the .content-accordion__description content
  const accordionMatch = html.match(
    /aria-label="[^"]*(?:Expertises|portefeuilles)[^"]*"[\s\S]*?content-accordion__description">([\s\S]*?)<\/div>/i
  )
  if (accordionMatch) {
    const items = accordionMatch[1]
      .split(/<br\s*\/?>/)
      .map((s) => s.replace(/<[^>]+>/g, "").trim())
      .filter((s) => s.length >= 2 && s.length <= 80)
    for (const item of items) {
      if (!tags.includes(item)) tags.push(item)
    }
  }

  // Strategy 2: "focust op X, Y en Z" from intro paragraph
  const focusMatch = html.match(
    /(?:focust op|richt zich op|specialiseert zich in)\s+([^.<]{5,200})/i
  )
  if (focusMatch) {
    const items = focusMatch[1].split(/,\s*|\s+en\s+/)
    for (const item of items) {
      const cleaned = item.trim().replace(/\.$/, "")
      if (cleaned.length >= 2 && cleaned.length <= 60 && !tags.includes(cleaned)) {
        tags.push(cleaned.charAt(0).toUpperCase() + cleaned.slice(1))
      }
    }
  }

  return tags
}

/**
 * CDA: <details> accordion with <summary> containing "Portefeuilles"
 * Items in <ul><li> inside the details.
 */
function extractTagsCDA(html: string): string[] {
  const tags: string[] = []

  // Find <details> block containing "Portefeuilles" in its <summary>
  const detailsMatch = html.match(
    /<details[^>]*>[\s\S]*?<summary[^>]*>[\s\S]*?Portefeuilles[\s\S]*?<\/summary>([\s\S]*?)<\/details>/i
  )
  if (!detailsMatch) return tags

  // Extract <li> items from inside
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi
  let match
  while ((match = liRegex.exec(detailsMatch[1])) !== null) {
    const text = match[1].replace(/<[^>]+>/g, "").trim()
    if (text.length >= 2 && text.length <= 80 && !tags.includes(text)) {
      tags.push(text)
    }
  }

  return tags
}

/**
 * VVD: <strong>Portefeuille:</strong> followed by <ul><li> items.
 * Portfolio items may have ministry prefix like "FIN Staatsdeelnemingen, ..."
 */
function extractTagsVVD(html: string): string[] {
  const tags: string[] = []

  // Find <strong>Portefeuille</strong> then the next <ul>...</ul>
  const portefeuilleMatch = html.match(
    /<strong>Portefeuille[^<]*<\/strong>[\s\S]*?<ul>([\s\S]*?)<\/ul>/i
  )
  if (!portefeuilleMatch) return tags

  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi
  let match
  while ((match = liRegex.exec(portefeuilleMatch[1])) !== null) {
    const text = match[1]
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .trim()
    if (text.length >= 2 && text.length <= 120 && !tags.includes(text)) {
      tags.push(text)
    }
  }

  return tags
}

/**
 * GL-PvdA: Try common patterns — accordion, list items, or "woordvoerder" text
 */
function extractTagsGeneric(html: string): string[] {
  const tags: string[] = []

  // Try: <details> with "Portefeuille" (CDA pattern)
  const detailsTags = extractTagsCDA(html)
  if (detailsTags.length > 0) return detailsTags

  // Try: accordion with "Expertises" (D66 pattern)
  const d66Tags = extractTagsD66(html)
  if (d66Tags.length > 0) return d66Tags

  // Try: <strong>Portefeuille:</strong> (VVD pattern)
  const vvdTags = extractTagsVVD(html)
  if (vvdTags.length > 0) return vvdTags

  // Try: "Woordvoerder X, Y en Z" pattern
  const woordvoerderMatch = html.match(
    /[Ww]oordvoerder(?:schappen)?[:\s]+([^<]{5,200})/
  )
  if (woordvoerderMatch) {
    const items = woordvoerderMatch[1].split(/,\s*|\s+en\s+/)
    for (const item of items) {
      const cleaned = item.trim().replace(/\.$/, "")
      if (cleaned.length >= 2 && cleaned.length <= 60 && !tags.includes(cleaned)) {
        tags.push(cleaned.charAt(0).toUpperCase() + cleaned.slice(1))
      }
    }
  }

  return tags
}

// Map fractie → extractor
const EXTRACTORS: Record<string, (html: string) => string[]> = {
  D66: extractTagsD66,
  CDA: extractTagsCDA,
  VVD: extractTagsVVD,
}

/**
 * Scrapt thema-tags van een partijwebsite-profielpagina.
 */
export async function scrapePartyProfileTags(
  url: string,
  fractie: string
): Promise<string[]> {
  const config = PARTY_WEBSITE_CONFIG[fractie]
  if (!config) return []

  const html = await fetchPage(url)
  if (!html) return []

  const extractor = EXTRACTORS[fractie] ?? extractTagsGeneric
  return extractor(html)
}
