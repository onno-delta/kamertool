import { XMLParser } from "fast-xml-parser"

const SRU_BASE = "https://zoek.officielebekendmakingen.nl/sru/Search"
const DOC_BASE = "https://zoek.officielebekendmakingen.nl"

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
})

export interface SRURecord {
  identifier: string
  title: string
  date: string
  type: string
  subrubriek: string
  creator: string
  indiener: string
  dossiernummer: string
  url: string
}

export async function querySRU(
  cql: string,
  maxRecords = 15,
  startRecord = 1
): Promise<{ totalResults: number; records: SRURecord[] }> {
  const params = new URLSearchParams({
    version: "1.2",
    operation: "searchRetrieve",
    query: cql,
    maximumRecords: String(maxRecords),
    startRecord: String(startRecord),
    sortKeys: "dt.modified,,0",
  })

  const res = await fetch(`${SRU_BASE}?${params}`, {
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    throw new Error(`SRU request failed: HTTP ${res.status}`)
  }

  const xml = await res.text()
  const parsed = parser.parse(xml)
  const response = parsed.searchRetrieveResponse

  if (!response) {
    throw new Error("Invalid SRU response")
  }

  const totalResults = Number(response.numberOfRecords) || 0

  if (totalResults === 0) {
    return { totalResults: 0, records: [] }
  }

  // Normalize to array
  let rawRecords = response.records?.record
  if (!rawRecords) return { totalResults, records: [] }
  if (!Array.isArray(rawRecords)) rawRecords = [rawRecords]

  const records: SRURecord[] = rawRecords.map((rec: Record<string, unknown>) => {
    const data = rec as { recordData?: { gzd?: { originalData?: { meta?: Record<string, unknown> } } } }
    const meta = data.recordData?.gzd?.originalData?.meta
    const kern = meta?.owmskern as Record<string, unknown> | undefined
    const mantel = meta?.owmsmantel as Record<string, unknown> | undefined
    const opmeta = meta?.opmeta as Record<string, unknown> | undefined

    const identifier = String(kern?.identifier ?? "")
    const dossiernummer = opmeta?.dossiernummer
      ? `${opmeta.dossiernummer}${opmeta.ondernummer ? `-${opmeta.ondernummer}` : ""}`
      : ""

    return {
      identifier,
      title: String(kern?.title ?? ""),
      date: String(kern?.modified ?? mantel?.date ?? ""),
      type: String(opmeta?.publicationname ?? ""),
      subrubriek: String(opmeta?.subrubriekParlementair ?? ""),
      creator: String(kern?.creator ?? ""),
      indiener: String(opmeta?.indiener ?? ""),
      dossiernummer,
      url: `${DOC_BASE}/${identifier}`,
    }
  })

  return { totalResults, records }
}

// Map OpenTK-style document type names to SRU subrubriek values
const SOORT_MAP: Record<string, string> = {
  "brief regering": "Brief regering",
  "motie": "Motie",
  "amendement": "Amendement",
  "verslag": "Verslag",
  "nota": "Nota naar aanleiding van het verslag",
  "schriftelijke vragen": "__kamervragen__",
  "kamervragen": "__kamervragen__",
}

/**
 * Convert user search terms to valid CQL by inserting AND between bare words.
 * Preserves existing AND/OR/NOT operators and quoted phrases.
 */
function normalizeToCQL(input: string): string {
  const tokens: string[] = []
  const operators = new Set(["AND", "OR", "NOT"])
  let i = 0

  while (i < input.length) {
    // Skip whitespace
    if (input[i] === " ") { i++; continue }

    // Quoted phrase
    if (input[i] === '"') {
      const end = input.indexOf('"', i + 1)
      if (end === -1) {
        tokens.push(input.slice(i))
        break
      }
      const phrase = input.slice(i + 1, end)
      // Unquote date-like phrases (e.g. "17 maart 2026") — exact date
      // phrases almost never appear as literal strings in the SRU index
      if (/^\d{1,2}\s+\w+\s+\d{4}$/.test(phrase) || /^\w+\s+\d{4}$/.test(phrase)) {
        tokens.push(...phrase.split(/\s+/))
      } else {
        tokens.push(input.slice(i, end + 1))
      }
      i = end + 1
      continue
    }

    // Word
    let end = i
    while (end < input.length && input[end] !== " " && input[end] !== '"') end++
    tokens.push(input.slice(i, end))
    i = end
  }

  // Insert AND between consecutive non-operator tokens
  const result: string[] = []
  for (let j = 0; j < tokens.length; j++) {
    const token = tokens[j]
    if (j > 0 && !operators.has(token) && !operators.has(tokens[j - 1])) {
      result.push("AND")
    }
    result.push(token)
  }

  return result.join(" ")
}

export function buildSearchCQL(
  terms: string,
  opts?: {
    soorten?: string
    dateFrom?: string
  }
): string {
  const parts: string[] = []

  // Determine publication filter
  const soortKey = opts?.soorten?.toLowerCase()
  if (soortKey && SOORT_MAP[soortKey] === "__kamervragen__") {
    parts.push('overheidop.publicationName="Kamervragen zonder antwoord"')
  } else {
    // Default: search across Kamerstukken + Handelingen + Kamervragen
    parts.push(
      '(overheidop.publicationName="Kamerstuk" OR overheidop.publicationName="Handelingen" OR overheidop.publicationName="Kamervragen zonder antwoord")'
    )

    // Add subrubriek filter if a specific type is requested
    if (soortKey && SOORT_MAP[soortKey] && SOORT_MAP[soortKey] !== "__kamervragen__") {
      parts.push(`overheidop.subrubriekParlementair="${SOORT_MAP[soortKey]}"`)
    }
  }

  // Date filter
  if (opts?.dateFrom) {
    parts.push(`dcterms.modified >= "${opts.dateFrom}"`)
  }

  // Search terms - SRU requires explicit AND between words
  if (terms.trim()) {
    parts.push(normalizeToCQL(terms.trim()))
  }

  return parts.join(" AND ")
}

export async function fetchDocumentText(identifier: string): Promise<string> {
  // Try XML first (structured, clean text)
  const xmlRes = await fetch(`${DOC_BASE}/${identifier}.xml`, {
    signal: AbortSignal.timeout(15000),
  })

  if (xmlRes.ok) {
    const xml = await xmlRes.text()
    // Extract text from <al> (alinea) elements - these contain the actual document text
    const paragraphs = xml.match(/<al>([\s\S]*?)<\/al>/g) ?? []
    if (paragraphs.length > 0) {
      return paragraphs
        .map((p) => p.replace(/<[^>]+>/g, "").trim())
        .filter(Boolean)
        .join("\n\n")
    }
    // Fallback: strip all XML tags
    return xml
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  }

  // Fallback to HTML page
  const htmlRes = await fetch(`${DOC_BASE}/${identifier}`, {
    signal: AbortSignal.timeout(15000),
  })

  if (!htmlRes.ok) {
    throw new Error(`Document niet gevonden: ${identifier} (HTTP ${htmlRes.status})`)
  }

  const html = await htmlRes.text()
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<\/?(p|div|br|h[1-6]|li|tr|blockquote|section|article)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}
