import { queryTK } from "@/lib/tk-api"

type CommissionRecord = { Persoon_Id: string; afkorting: string }

let cached: Map<string, string[]> | null = null
let cacheTime = 0
const CACHE_TTL = 3600_000

export async function getCommissionMap(): Promise<Map<string, string[]>> {
  if (cached && Date.now() - cacheTime < CACHE_TTL) return cached

  // Fetch both vast (fixed) and vervanger (substitute) in parallel
  const [vast, vervanger] = await Promise.all([
    queryTK("CommissieZetelVastPersoon", {
      $filter: "TotEnMet eq null",
      $expand: "CommissieZetel($expand=Commissie($select=Afkorting))",
      $select: "Persoon_Id",
      $top: "1000",
    }),
    queryTK("CommissieZetelVervangerPersoon", {
      $filter: "TotEnMet eq null",
      $expand: "CommissieZetel($expand=Commissie($select=Afkorting))",
      $select: "Persoon_Id",
      $top: "1000",
    }),
  ])

  // Extract persoonId → afkorting pairs
  const extract = (records: Record<string, unknown>[]): CommissionRecord[] =>
    records
      .map((r) => {
        const zetel = r.CommissieZetel as Record<string, unknown> | undefined
        const commissie = zetel?.Commissie as Record<string, string> | undefined
        return commissie?.Afkorting
          ? { Persoon_Id: r.Persoon_Id as string, afkorting: commissie.Afkorting }
          : null
      })
      .filter(Boolean) as CommissionRecord[]

  // Build deduplicated map
  const map = new Map<string, string[]>()
  for (const { Persoon_Id, afkorting } of [...extract(vast), ...extract(vervanger)]) {
    const existing = map.get(Persoon_Id) ?? []
    if (!existing.includes(afkorting)) existing.push(afkorting)
    map.set(Persoon_Id, existing)
  }

  cached = map
  cacheTime = Date.now()
  return map
}
