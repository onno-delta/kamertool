/**
 * Batch-script: scrapt partijwebsites voor profiel-URLs en thema-tags.
 *
 * Gebruik:
 *   set -a && source .env.local && set +a && npx tsx scripts/scrape-party-profiles.ts
 *
 * Flags:
 *   --party VVD     Scrape alleen voor één partij
 *   --force         Overschrijf bestaande data
 */

import { db } from "../lib/db"
import { smoelenboekProfiles } from "../lib/db/schema"
import { eq } from "drizzle-orm"
import { findPartyProfileUrl, scrapePartyProfileTags } from "../lib/party-scraper"
import { PARTY_WEBSITE_CONFIG } from "../lib/party-websites"
import { queryTK } from "../lib/tk-api"

type TKRecord = Record<string, unknown>

async function getCurrentMembers(): Promise<{ id: string; naam: string; fractie: string }[]> {
  const records = await queryTK("FractieZetelPersoon", {
    $filter: "TotEnMet eq null",
    $expand:
      "Persoon($select=Id,Roepnaam,Tussenvoegsel,Achternaam),FractieZetel($expand=Fractie($select=NaamNL,Afkorting))",
    $top: "200",
  })

  return records
    .filter((r: TKRecord) => r.Persoon)
    .map((r: TKRecord) => {
      const p = r.Persoon as Record<string, string>
      const fz = r.FractieZetel as TKRecord | undefined
      const f = fz?.Fractie as Record<string, string> | undefined
      const fractie = f?.Afkorting || f?.NaamNL || ""
      const naam = [p.Roepnaam, p.Tussenvoegsel, p.Achternaam]
        .filter(Boolean)
        .join(" ")
      return { id: p.Id as string, naam, fractie }
    })
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  const args = process.argv.slice(2)
  const partyFilter = args.includes("--party")
    ? args[args.indexOf("--party") + 1]
    : null
  const force = args.includes("--force")

  console.log("[party-profiles] Fetching current TK members...")
  const members = await getCurrentMembers()
  console.log(`[party-profiles] Found ${members.length} members`)

  const filtered = partyFilter
    ? members.filter((m) => m.fractie === partyFilter)
    : members

  if (partyFilter) {
    console.log(
      `[party-profiles] Filtering to ${partyFilter}: ${filtered.length} members`
    )
  }

  let scraped = 0
  let skipped = 0
  let urlsFound = 0
  let tagsFound = 0
  let errors = 0

  for (const member of filtered) {
    const config = PARTY_WEBSITE_CONFIG[member.fractie]
    if (!config || config.skipScraping) {
      skipped++
      continue
    }

    // Check existing data unless --force
    if (!force) {
      const [existing] = await db
        .select()
        .from(smoelenboekProfiles)
        .where(eq(smoelenboekProfiles.personId, member.id))
        .limit(1)

      if (existing?.partyWebsiteUrl && existing?.tags) {
        skipped++
        continue
      }
    }

    console.log(`[party-profiles] Scraping: ${member.naam} (${member.fractie})`)

    try {
      // Find profile URL
      const profileUrl = await findPartyProfileUrl(member.naam, member.fractie)
      if (profileUrl) {
        urlsFound++
        console.log(`  URL: ${profileUrl}`)

        // Rate limit
        await sleep(1000)

        // Scrape tags
        const tags = await scrapePartyProfileTags(profileUrl, member.fractie)
        if (tags.length > 0) {
          tagsFound++
          console.log(`  Tags: ${tags.join(", ")}`)
        }

        // Upsert into DB
        await db
          .insert(smoelenboekProfiles)
          .values({
            personId: member.id,
            partyWebsiteUrl: profileUrl,
            tags: tags.length > 0 ? JSON.stringify(tags) : null,
            scrapedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: smoelenboekProfiles.personId,
            set: {
              partyWebsiteUrl: profileUrl,
              tags: tags.length > 0 ? JSON.stringify(tags) : null,
            },
          })

        scraped++
      } else {
        console.log(`  No profile URL found`)
        skipped++
      }

      // Rate limit between requests
      await sleep(1000)
    } catch (e) {
      console.error(`  Error: ${e}`)
      errors++
    }
  }

  console.log("\n[party-profiles] Done!")
  console.log(`  Scraped: ${scraped}`)
  console.log(`  Skipped: ${skipped}`)
  console.log(`  URLs found: ${urlsFound}`)
  console.log(`  With tags: ${tagsFound}`)
  console.log(`  Errors: ${errors}`)

  process.exit(0)
}

main()
