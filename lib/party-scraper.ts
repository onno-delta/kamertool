/**
 * Scrapt partijwebsites voor profiel-URLs en thema-tags per Kamerlid.
 * Volgt het patroon van lib/tk-scraper.ts.
 */

import { PARTY_WEBSITE_CONFIG, slugifyName } from "./party-websites"

const USER_AGENT =
  "Mozilla/5.0 (compatible; Kamertool/1.0; +https://kamer.deltainstituut.nl)"

/**
 * Probeert de profiel-URL op de partijwebsite te vinden voor een Kamerlid.
 * 1. Slug-constructie + verifiëren met HEAD/GET
 * 2. Fallback: scrape memberListUrl en fuzzy-match op naam
 */
export async function findPartyProfileUrl(
  naam: string,
  fractie: string
): Promise<string | null> {
  const config = PARTY_WEBSITE_CONFIG[fractie]
  if (!config || config.skipScraping) return null

  const slug = slugifyName(naam)
  const candidateUrl = `${config.baseUrl}/${slug}`

  // Try direct slug URL
  try {
    const res = await fetch(candidateUrl, {
      method: "HEAD",
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    })
    if (res.ok) return candidateUrl
  } catch {
    // HEAD might not be supported, try GET
    try {
      const res = await fetch(candidateUrl, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(10000),
        redirect: "follow",
      })
      if (res.ok) return candidateUrl
    } catch {
      // Continue to fallback
    }
  }

  // Fallback: scrape the member list page and fuzzy-match
  try {
    const res = await fetch(config.memberListUrl, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null

    const html = await res.text()
    const lowerName = naam.toLowerCase()
    const parts = lowerName.split(" ")
    const lastName = parts[parts.length - 1]

    // Look for links containing the person's name
    const linkRegex = /<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi
    let match
    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1]
      const linkText = match[2].replace(/<[^>]+>/g, "").trim().toLowerCase()

      if (linkText.includes(lastName) && parts.some((p) => linkText.includes(p))) {
        // Build absolute URL
        if (href.startsWith("http")) return href
        if (href.startsWith("/")) {
          const baseOrigin = new URL(config.baseUrl).origin
          return `${baseOrigin}${href}`
        }
        return `${config.baseUrl}/${href}`
      }
    }
  } catch {
    // Fallback failed
  }

  return null
}

/**
 * Scrapt thema-tags van een partijwebsite-profielpagina.
 * Zoekt naar secties met tagKeywords en extraheert individuele dossiers.
 * Retourneert alleen expliciet benoemde dossiers, geen algemene bio-tekst.
 */
export async function scrapePartyProfileTags(
  url: string,
  fractie: string
): Promise<string[]> {
  const config = PARTY_WEBSITE_CONFIG[fractie]
  if (!config) return []

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return []

    const html = await res.text()
    const tags: string[] = []

    // Strategy 1: Look for keyword-labeled sections in the HTML
    for (const keyword of config.tagKeywords) {
      // Match patterns like "Woordvoerder: klimaat, energie, wonen"
      // or "Portefeuille: ..." or sections near these keywords
      const patterns = [
        // "keyword: value, value, value" or "keyword value, value"
        new RegExp(
          `${keyword}[:\\s]*([^<]{3,200})`,
          "gi"
        ),
        // Sections labeled with the keyword
        new RegExp(
          `<[^>]*>${keyword}<\\/[^>]*>\\s*(?:<[^>]*>)*([^<]{3,300})`,
          "gi"
        ),
      ]

      for (const pattern of patterns) {
        let m
        while ((m = pattern.exec(html)) !== null) {
          const rawText = m[1]
            .replace(/<[^>]+>/g, "")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/\s+/g, " ")
            .trim()

          if (rawText.length < 3 || rawText.length > 300) continue

          // Split on common delimiters
          const items = rawText.split(/[,;•·|\/]|\sen\s/)
          for (const item of items) {
            const cleaned = item
              .trim()
              .replace(/^[-–—]\s*/, "")
              .replace(/\.$/, "")
              .trim()
            if (
              cleaned.length >= 2 &&
              cleaned.length <= 80 &&
              !cleaned.includes("@") &&
              !cleaned.match(/^\d+$/)
            ) {
              // Capitalize first letter
              const tag = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
              if (!tags.includes(tag)) {
                tags.push(tag)
              }
            }
          }
        }
      }
    }

    // Strategy 2: Look for structured tag/pill elements
    const pillRegex =
      /<(?:span|a|li)[^>]*class="[^"]*(?:tag|pill|chip|label|badge|topic|dossier|thema)[^"]*"[^>]*>([^<]{2,60})<\/(?:span|a|li)>/gi
    let pillMatch
    while ((pillMatch = pillRegex.exec(html)) !== null) {
      const tag = pillMatch[1].trim()
      if (tag.length >= 2 && tag.length <= 60 && !tags.includes(tag)) {
        tags.push(tag.charAt(0).toUpperCase() + tag.slice(1))
      }
    }

    return tags
  } catch (e) {
    console.error(`[party-scraper] Tag scrape failed for ${url}:`, e)
    return []
  }
}
