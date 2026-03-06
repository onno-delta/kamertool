const BASE_URL = "https://gegevensmagazijn.tweedekamer.nl/OData/v4/2.0"

/**
 * Build an OData $filter that matches all words in the query across the given fields.
 * OData `contains()` is an exact substring match, so multi-word queries like
 * "Milieuraad circulaire economie" need to be split into per-word contains() calls.
 *
 * - Escapes single quotes (OData string delimiter)
 * - Strips quotes the LLM might add
 * - Filters out pure numbers under 4 digits (years like "2026" are kept)
 * - Each word must match at least one of the given fields
 */
export function buildContainsFilter(query: string, fields: string[]): string {
  const words = query
    .replace(/["']/g, "")          // strip quotes
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => w.length >= 2)  // drop single chars
    .map((w) => w.replace(/'/g, "''")) // escape OData single quotes

  if (words.length === 0) return ""

  return words
    .map((w) => {
      if (fields.length === 1) return `contains(${fields[0]},'${w}')`
      const clauses = fields.map((f) => `contains(${f},'${w}')`)
      return `(${clauses.join(" or ")})`
    })
    .join(" and ")
}

/**
 * Query the Tweede Kamer OData API for a collection of entities.
 * Returns an array of results from the `value` property.
 */
export async function queryTK(entity: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams({
    $format: "json",
    ...params,
  })
  const url = `${BASE_URL}/${entity}?${searchParams}`
  const res = await fetch(url, { next: { revalidate: 300 } })
  if (!res.ok) throw new Error(`TK API error: ${res.status} ${res.statusText}`)
  const data = await res.json()
  return data.value ?? []
}

/**
 * Fetch a single entity from the Tweede Kamer OData API by its key.
 * Returns the entity object directly (not wrapped in `value`).
 */
export async function queryTKSingle(
  entity: string,
  params: Record<string, string> = {},
) {
  const searchParams = new URLSearchParams({
    $format: "json",
    ...params,
  })
  const url = `${BASE_URL}/${entity}?${searchParams}`
  const res = await fetch(url, { next: { revalidate: 300 } })
  if (!res.ok) throw new Error(`TK API error: ${res.status} ${res.statusText}`)
  return await res.json()
}
