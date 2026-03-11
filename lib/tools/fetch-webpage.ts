import { tool } from "ai"
import { z } from "zod"
import dns from "node:dns/promises"

export const fetchWebPage = tool({
  description:
    "Haal de inhoud op van een webpagina. Gebruik dit wanneer de gebruiker een URL deelt of als je meer informatie nodig hebt van een specifieke webpagina, bijvoorbeeld van tweedekamer.nl.",
  inputSchema: z.object({
    url: z.string().url().describe("De URL van de webpagina om op te halen"),
  }),
  execute: async ({ url }) => {
    try {
      if (!isAllowedUrl(url)) {
        return { error: "URL geblokkeerd: interne of private adressen zijn niet toegestaan", content: null }
      }

      const parsedUrl = new URL(url)
      if (!(await resolveAndCheck(parsedUrl.hostname))) {
        return { error: "URL geblokkeerd: het adres verwijst naar een intern netwerk", content: null }
      }

      let currentUrl = url
      let res: Response | undefined
      const maxRedirects = 3

      for (let i = 0; i <= maxRedirects; i++) {
        res = await fetch(currentUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; Kamertool/1.0; +https://kamer.deltainstituut.nl)",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          signal: AbortSignal.timeout(15000),
          redirect: "manual",
        })

        if (res.status === 301 || res.status === 302 || res.status === 307 || res.status === 308) {
          const location = res.headers.get("location")
          if (!location) {
            return { error: "Redirect zonder Location header", content: null }
          }

          // Resolve relative redirects against current URL
          const redirectUrl = new URL(location, currentUrl).toString()

          if (!isAllowedUrl(redirectUrl)) {
            return { error: "URL geblokkeerd: redirect naar intern of privaat adres", content: null }
          }

          const redirectParsed = new URL(redirectUrl)
          if (!(await resolveAndCheck(redirectParsed.hostname))) {
            return { error: "URL geblokkeerd: redirect verwijst naar een intern netwerk", content: null }
          }

          currentUrl = redirectUrl
          continue
        }

        break
      }

      if (!res) {
        return { error: "Geen response ontvangen", content: null }
      }

      // Check if we exhausted redirects
      if (res.status === 301 || res.status === 302 || res.status === 307 || res.status === 308) {
        return { error: "Te veel redirects (maximum 3)", content: null }
      }

      if (!res.ok) {
        return { error: `HTTP ${res.status}: ${res.statusText}`, content: null }
      }

      const contentType = res.headers.get("content-type") ?? ""
      if (!contentType.includes("text/html") && !contentType.includes("text/plain") && !contentType.includes("application/xhtml")) {
        return { error: `Unsupported content type: ${contentType}`, content: null }
      }

      const html = await res.text()

      // Extract text content by stripping HTML tags
      const text = extractText(html)

      // Truncate to avoid blowing up context
      const maxLen = 8000
      const truncated = text.length > maxLen
      const content = truncated ? text.slice(0, maxLen) + "\n\n[... inhoud afgekapt]" : text

      return {
        url,
        title: extractTitle(html),
        content,
        truncated,
        length: text.length,
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      return { error: `Ophalen mislukt: ${message}`, content: null }
    }
  },
})

function isBlockedIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number)
  if (parts.length !== 4 || parts.some((p) => isNaN(p))) return false

  if (parts[0] === 0) return true
  if (parts[0] === 10) return true
  if (parts[0] === 127) return true
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true
  if (parts[0] === 192 && parts[1] === 168) return true
  if (parts[0] === 169 && parts[1] === 254) return true

  // Cloud metadata endpoints
  if (ip === "169.254.169.254") return true
  if (ip === "100.100.100.200") return true

  return false
}

function isBlockedIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase()

  if (normalized === "::1") return true

  // fc00::/7 — starts with fc or fd
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true

  // fe80::/10 — link-local
  if (normalized.startsWith("fe80")) return true

  // ::ffff:127.x.x.x — IPv4-mapped loopback
  if (normalized.startsWith("::ffff:127.")) return true

  return false
}

async function resolveAndCheck(hostname: string): Promise<boolean> {
  const ips: string[] = []

  try {
    const ipv4 = await dns.resolve4(hostname)
    ips.push(...ipv4)
  } catch (e: unknown) {
    const code = (e as NodeJS.ErrnoException).code
    if (code !== "ENODATA" && code !== "ENOTFOUND") throw e
  }

  try {
    const ipv6 = await dns.resolve6(hostname)
    ips.push(...ipv6)
  } catch (e: unknown) {
    const code = (e as NodeJS.ErrnoException).code
    if (code !== "ENODATA" && code !== "ENOTFOUND") throw e
  }

  // If no records resolved at all, let the fetch itself fail naturally
  if (ips.length === 0) return true

  for (const ip of ips) {
    if (ip.includes(":")) {
      if (isBlockedIPv6(ip)) return false
    } else {
      if (isBlockedIPv4(ip)) return false
    }
  }

  return true
}

function isAllowedUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString)
    const hostname = url.hostname.toLowerCase()

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false
    }

    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "0.0.0.0"
    ) {
      return false
    }

    if (
      hostname === "169.254.169.254" ||
      hostname === "metadata.google.internal"
    ) {
      return false
    }

    const parts = hostname.split(".").map(Number)
    if (parts.length === 4 && parts.every((p) => !isNaN(p))) {
      if (parts[0] === 10) return false
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return false
      if (parts[0] === 192 && parts[1] === 168) return false
      if (parts[0] === 169 && parts[1] === 254) return false
    }

    return true
  } catch {
    return false
  }
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return match ? decodeEntities(match[1].trim()) : null
}

function extractText(html: string): string {
  const text = html
    // Remove script and style blocks
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    // Remove nav, header, footer elements (common boilerplate)
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    // Convert block elements to newlines
    .replace(/<\/?(p|div|br|h[1-6]|li|tr|blockquote|section|article)[^>]*>/gi, "\n")
    // Remove remaining HTML tags
    .replace(/<[^>]+>/g, " ")
    // Decode HTML entities
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    // Clean up whitespace
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  return text
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}
