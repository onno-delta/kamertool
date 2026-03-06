import { db } from "../lib/db"
import { parties } from "../lib/db/schema"
import { PARTIES } from "../lib/parties"
import { eq } from "drizzle-orm"
import { readFileSync } from "fs"
import { join } from "path"

async function seed() {
  const md = readFileSync(
    join(__dirname, "../data/partijstandpunten.md"),
    "utf-8"
  )

  // Split on party headers: ## ...
  const sections = md.split(/^## /m).filter((s) => s.trim())

  let upserted = 0
  for (const section of sections) {
    const headerLine = section.split("\n")[0]

    // Match against known PARTIES by shortName prefix
    const party = PARTIES.find((p) => headerLine.startsWith(p.shortName))
    if (!party) continue

    const { shortName, name } = party
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

  // Clean up defunct parties
  await db.delete(parties).where(eq(parties.shortName, "NSC"))
  console.log("Deleted: NSC (if present)")

  if (upserted !== PARTIES.length) {
    console.warn(`\n⚠ Warning: upserted ${upserted} but expected ${PARTIES.length}`)
  }

  console.log(`\nDone — upserted ${upserted} parties`)
  process.exit(0)
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
