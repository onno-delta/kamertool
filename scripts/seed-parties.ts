import { db } from "../lib/db"
import { parties } from "../lib/db/schema"
import { PARTIES } from "../lib/parties"

async function seed() {
  for (const party of PARTIES) {
    await db
      .insert(parties)
      .values({
        name: party.name,
        shortName: party.shortName,
        programme: `[Verkiezingsprogramma ${party.shortName} - wordt aangevuld]`,
      })
      .onConflictDoNothing()
  }
  console.log(`Seeded ${PARTIES.length} parties`)
  process.exit(0)
}

seed()
