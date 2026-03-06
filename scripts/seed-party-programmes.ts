import { db } from "../lib/db"
import { parties } from "../lib/db/schema"
import { eq } from "drizzle-orm"
import { readFileSync } from "fs"
import { join } from "path"

async function seed() {
  const md = readFileSync(
    join(__dirname, "../data/partijstandpunten.md"),
    "utf-8"
  )

  // Split on party headers: ## SHORTNAME — Full Name
  const sections = md.split(/^## /m).filter((s) => s.trim())

  let updated = 0
  for (const section of sections) {
    // Extract shortName from header line: "VVD — Volkspartij voor ..."
    const headerMatch = section.match(/^(\S+)\s*[—-]/)
    if (!headerMatch) continue
    const shortName = headerMatch[1]

    // The full section content (including header) becomes the programme
    const programme = `## ${section}`.trim()

    const result = await db
      .update(parties)
      .set({ programme, updatedAt: new Date() })
      .where(eq(parties.shortName, shortName))

    if (result.length !== undefined || result) {
      console.log(`Updated: ${shortName}`)
      updated++
    }
  }

  console.log(`\nDone — updated ${updated} parties`)
  process.exit(0)
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
