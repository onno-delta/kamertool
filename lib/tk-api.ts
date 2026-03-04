const BASE_URL = "https://gegevensmagazijn.tweedekamer.nl/OData/v4/2.0"

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
