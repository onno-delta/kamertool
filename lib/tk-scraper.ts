/**
 * Scrapes tweedekamer.nl for Kamerlid email addresses and bio text.
 * Uses regex-based HTML extraction (same approach as lib/tools/fetch-webpage.ts).
 * Results are cached in the smoelenboek_profile DB table.
 */

const USER_AGENT =
  "Mozilla/5.0 (compatible; Kamertool/1.0; +https://kamer.deltainstituut.nl)"

// In-memory cache for the index page (name → profile URL)
let indexCache: Map<string, string> | null = null
let indexCacheTime = 0
const INDEX_TTL = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Fetches the Kamerleden listing page and returns a Map of lowercase name → profile URL.
 */
export async function scrapeKamerledenIndex(): Promise<Map<string, string>> {
  if (indexCache && Date.now() - indexCacheTime < INDEX_TTL) {
    return indexCache
  }

  const url = "https://www.tweedekamer.nl/kamerleden_en_commissies/alle_kamerleden"
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    console.error(`[tk-scraper] Index fetch failed: ${res.status}`)
    return indexCache ?? new Map()
  }

  const html = await res.text()
  const map = new Map<string, string>()

  // Match profile links like: <a href="/kamerleden_en_commissies/alle_kamerleden/kisteman-a-am-annabel">
  const linkRegex =
    /<a\s[^>]*href="(\/kamerleden_en_commissies\/alle_kamerleden\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
  let match
  while ((match = linkRegex.exec(html)) !== null) {
    const path = match[1]
    // Extract name text from the link content (strip tags)
    const nameHtml = match[2]
    const name = nameHtml.replace(/<[^>]+>/g, "").trim()
    if (name && path && !path.includes("?")) {
      map.set(name.toLowerCase(), `https://www.tweedekamer.nl${path}`)
    }
  }

  indexCache = map
  indexCacheTime = Date.now()
  console.log(`[tk-scraper] Indexed ${map.size} Kamerleden profiles`)
  return map
}

/**
 * Scrapes an individual Kamerlid profile page for email and bio.
 */
export async function scrapeKamerlidProfile(
  profileUrl: string
): Promise<{ email: string | null; bio: string | null }> {
  try {
    const res = await fetch(profileUrl, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      return { email: null, bio: null }
    }

    const html = await res.text()

    // Extract email — look for @tweedekamer.nl addresses
    const emailMatch = html.match(
      /[a-zA-Z0-9._%+-]+@tweedekamer\.nl/i
    )
    const email = emailMatch ? emailMatch[0].toLowerCase() : null

    // Extract bio — look for the main content area / personal description
    let bio: string | null = null
    // Try multiple patterns for the bio content area
    const bioPatterns = [
      /<div[^>]*class="[^"]*field--name-field-person-quote[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*field--name-body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*member-intro[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    ]
    for (const pattern of bioPatterns) {
      const bioMatch = html.match(pattern)
      if (bioMatch) {
        const rawBio = bioMatch[1]
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
          .replace(/\s+/g, " ")
          .trim()
        if (rawBio.length > 10) {
          bio = rawBio
          break
        }
      }
    }

    return { email, bio }
  } catch (e) {
    console.error(`[tk-scraper] Profile scrape failed for ${profileUrl}:`, e)
    return { email: null, bio: null }
  }
}

/**
 * Finds the profile URL for a Kamerlid by name (fuzzy matching).
 */
export async function findProfileUrl(naam: string): Promise<string | null> {
  const index = await scrapeKamerledenIndex()
  const lower = naam.toLowerCase()

  // Exact match
  if (index.has(lower)) return index.get(lower)!

  // Partial match — check if any key contains the last name
  const parts = lower.split(" ")
  const lastName = parts[parts.length - 1]
  for (const [key, url] of index) {
    if (key.includes(lastName) && key.includes(parts[0])) {
      return url
    }
  }

  return null
}
