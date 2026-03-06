import { db } from "../lib/db"
import { parties } from "../lib/db/schema"
import { readFileSync } from "fs"
import { join } from "path"

async function seed() {
  const md = readFileSync(
    join(__dirname, "../data/partijstandpunten.md"),
    "utf-8"
  )

  // Split on party headers: ## SHORTNAME — Full Name
  const sections = md.split(/^## /m).filter((s) => s.trim())

  let upserted = 0
  for (const section of sections) {
    // Extract shortName and full name from header: "VVD — Volkspartij voor ..."
    const headerMatch = section.match(/^(\S+)\s*[—-]\s*(.+)/)
    if (!headerMatch) continue
    const shortName = headerMatch[1]
    const name = headerMatch[2].trim()

    // The full section content (including header) becomes the programme
    const programme = `## ${section}`.trim()

    await db
      .insert(parties)
      .values({ shortName, name, programme, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: parties.shortName,
        set: { name, programme, updatedAt: new Date() },
      })

    console.log(`Upserted: ${shortName} (${name})`)
    upserted++
  }

  console.log(`\nDone — upserted ${upserted} parties`)
  process.exit(0)
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
