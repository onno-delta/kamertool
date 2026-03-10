import { queryTK } from "@/lib/tk-api"
import { querySRU } from "@/lib/sru-api"

/**
 * Get recent documents (moties, amendementen, kamervragen) a person submitted.
 * Queries ZaakActor by Persoon_Id, expands Zaak for details.
 */
export async function getPersonDocuments(personId: string, top = 10) {
  const records = await queryTK("ZaakActor", {
    $filter: `Persoon_Id eq ${personId} and Verwijderd eq false`,
    $expand: "Zaak($select=Id,Nummer,Soort,Onderwerp,Titel,GestartOp;$filter=Verwijderd eq false;$expand=Document($select=DocumentNummer;$top=1))",
    $orderby: "GewijzigdOp desc",
    $top: String(top),
  })

  return records
    .filter((r: Record<string, unknown>) => r.Zaak)
    .map((r: Record<string, unknown>) => {
      const z = r.Zaak as Record<string, unknown>
      const docs = z.Document as Array<Record<string, unknown>> | undefined
      const docNummer = docs?.[0]?.DocumentNummer as string | undefined
      return {
        id: z.Id,
        nummer: z.Nummer,
        soort: z.Soort,
        onderwerp: z.Onderwerp || z.Titel,
        datum: z.GestartOp,
        relatie: r.Relatie,
        url: docNummer
          ? `https://www.tweedekamer.nl/kamerstukken/detail?id=${docNummer}&did=${docNummer}`
          : undefined,
      }
    })
}

/**
 * Get recent stemmingen (votes) for a fractie.
 * Queries Besluit → expands Stemming (filtered by fractie) + Zaak (for subject).
 */
export async function getFractieStemmingen(fractie: string, top = 10) {
  const escapedFractie = fractie.replace(/'/g, "''")
  const besluiten = await queryTK("Besluit", {
    $filter: `StemmingsSoort ne null and Verwijderd eq false`,
    $select: "Id,BesluitSoort,BesluitTekst,StemmingsSoort",
    $expand: `Stemming($filter=ActorFractie eq '${escapedFractie}';$select=Soort,ActorFractie,FractieGrootte),Zaak($select=Onderwerp,Titel,Nummer),Agendapunt($select=Nummer)`,
    $orderby: "GewijzigdOp desc",
    $top: String(top),
  })

  return besluiten
    .filter((b: Record<string, unknown>) => {
      const stemmingen = b.Stemming as Array<Record<string, unknown>> | undefined
      return stemmingen && stemmingen.length > 0
    })
    .map((b: Record<string, unknown>) => {
      const stemmingen = b.Stemming as Array<Record<string, unknown>>
      const zaken = b.Zaak as Array<Record<string, unknown>> | undefined
      const zaak = zaken?.[0]
      const stemming = stemmingen[0]
      const agendapunt = b.Agendapunt as Record<string, unknown> | undefined
      const pNummer = agendapunt?.Nummer as string | undefined
      return {
        fractie: stemming.ActorFractie,
        stem: stemming.Soort,
        zetels: stemming.FractieGrootte,
        besluit: (zaak?.Onderwerp || zaak?.Titel || b.BesluitTekst) as string,
        besluitSoort: b.BesluitSoort,
        url: pNummer
          ? `https://www.tweedekamer.nl/kamerstukken/stemmingsuitslagen/detail?id=${pNummer}&did=${pNummer}`
          : undefined,
      }
    })
}

/**
 * Get toezeggingen (promises) made by a minister.
 * Searches by name in the Naam field.
 */
export async function getPersonToezeggingen(naam: string, top = 10) {
  // Use the last name for matching (more reliable than full name)
  const parts = naam.split(" ")
  const achternaam = parts[parts.length - 1]

  const results = await queryTK("Toezegging", {
    $filter: `contains(Naam,'${achternaam.replace(/'/g, "''")}') and Verwijderd eq false`,
    $select: "Id,Nummer,Tekst,Status,DatumNakoming,Ministerie,Naam,Functie",
    $orderby: "DatumNakoming desc",
    $top: String(top),
  })

  return results.map((t: Record<string, unknown>) => ({
    nummer: t.Nummer,
    tekst: t.Tekst,
    status: t.Status,
    datumNakoming: t.DatumNakoming,
    ministerie: t.Ministerie,
    minister: t.Naam,
    functie: t.Functie,
  }))
}

/**
 * Get recent debate contributions (Handelingen) for a person.
 * Searches the Overheid.nl SRU API for Handelingen mentioning the person's name.
 */
export async function getPersonHandelingen(achternaam: string, maxResults = 10) {
  // Escape single quotes and search by last name in Handelingen
  const escapedName = achternaam.replace(/'/g, "''")
  const cql = `overheidop.publicationName="Handelingen" AND "${escapedName}"`

  const { records } = await querySRU(cql, maxResults)

  return records.map((r) => ({
    nummer: r.docId !== r.identifier ? r.docId : r.identifier,
    onderwerp: r.title,
    datum: r.date,
    type: r.subrubriek || r.type,
    url: r.url,
  }))
}

/**
 * Get upcoming agenda items for a person's commissions.
 */
export async function getPersonAgenda(commissies: string[], daysAhead = 14) {
  if (commissies.length === 0) return []

  const now = new Date()
  const until = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)
  const fromStr = now.toISOString().split("T")[0] + "T00:00:00Z"
  const untilStr = until.toISOString().split("T")[0] + "T23:59:59Z"

  const commissieFilter = commissies
    .map((c) => `Voortouwafkorting eq '${c}'`)
    .join(" or ")

  const results = await queryTK("Activiteit", {
    $filter: `Datum ge ${fromStr} and Datum le ${untilStr} and Verwijderd eq false and Status ne 'Geannuleerd' and (${commissieFilter})`,
    $select: "Id,Soort,Nummer,Onderwerp,Datum,Aanvangstijd,Eindtijd,Status,Voortouwnaam,Voortouwafkorting",
    $orderby: "Datum asc",
    $top: "30",
  })

  return results.map((a: Record<string, unknown>) => ({
    id: a.Id,
    nummer: a.Nummer,
    type: a.Soort,
    onderwerp: a.Onderwerp,
    datum: a.Datum,
    aanvang: a.Aanvangstijd,
    commissie: a.Voortouwnaam,
    afkorting: a.Voortouwafkorting,
  }))
}
