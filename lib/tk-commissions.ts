import { queryTK } from "@/lib/tk-api"

type CommissionRecord = { Persoon_Id: string; afkorting: string }

let cachedVast: CommissionRecord[] | null = null
let cachedVervanger: CommissionRecord[] | null = null
let cacheTime = 0
const CACHE_TTL = 3600_000
const PAGE_SIZE = "250" // TK API silently returns 0 for $top > ~300

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

async function fetchAll(entity: string): Promise<Record<string, unknown>[]> {
  const all: Record<string, unknown>[] = []
  let skip = 0
  while (true) {
    const page = await queryTK(entity, {
      $filter: "TotEnMet eq null",
      $expand: "CommissieZetel($expand=Commissie($select=Afkorting))",
      $select: "Persoon_Id",
      $top: PAGE_SIZE,
      $skip: String(skip),
    })
    if (page.length === 0) break
    all.push(...page)
    skip += page.length
    if (page.length < Number(PAGE_SIZE)) break
  }
  return all
}

async function ensureCache() {
  if (cachedVast && cachedVervanger && Date.now() - cacheTime < CACHE_TTL) return

  const [vast, vervanger] = await Promise.all([
    fetchAll("CommissieZetelVastPersoon"),
    fetchAll("CommissieZetelVervangerPersoon"),
  ])

  cachedVast = extract(vast)
  cachedVervanger = extract(vervanger)
  cacheTime = Date.now()
}

function buildMap(records: CommissionRecord[]): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const { Persoon_Id, afkorting } of records) {
    const existing = map.get(Persoon_Id) ?? []
    if (!existing.includes(afkorting)) existing.push(afkorting)
    map.set(Persoon_Id, existing)
  }
  return map
}

export async function getCommissionMap(options?: { vastOnly?: boolean }): Promise<Map<string, string[]>> {
  await ensureCache()

  if (options?.vastOnly) {
    return buildMap(cachedVast!)
  }
  return buildMap([...cachedVast!, ...cachedVervanger!])
}
