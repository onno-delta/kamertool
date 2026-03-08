export type KabinetLid = {
  naam: string
  partij: string
  rol: "Minister" | "Staatssecretaris"
  portefeuille: string
  fotoUrl?: string
}

function rijksoverheidFoto(slug: string): string {
  return `https://www.rijksoverheid.nl/binaries/medium/content/gallery/rijksoverheid/content-afbeeldingen/regering/bewindspersonen/kabinet-jetten/${slug}/fotonavigatie/${slug}-1b.jpg`
}

export const KABINET: KabinetLid[] = [
  // Ministers
  { naam: "Rob Jetten", partij: "D66", rol: "Minister", portefeuille: "Minister-president, Algemene Zaken", fotoUrl: rijksoverheidFoto("rob-jetten") },
  { naam: "Dilan Yeşilgöz", partij: "VVD", rol: "Minister", portefeuille: "Vicepremier, Minister van Defensie", fotoUrl: rijksoverheidFoto("dilan-yesilgoz-zegerius") },
  { naam: "Bart van den Brink", partij: "CDA", rol: "Minister", portefeuille: "Vicepremier, Minister van Asiel en Migratie", fotoUrl: rijksoverheidFoto("bart-van-den-brink") },
  { naam: "Pieter Heerma", partij: "CDA", rol: "Minister", portefeuille: "Minister van Binnenlandse Zaken en Koninkrijksrelaties", fotoUrl: rijksoverheidFoto("pieter-heerma") },
  { naam: "Tom Berendsen", partij: "CDA", rol: "Minister", portefeuille: "Minister van Buitenlandse Zaken", fotoUrl: rijksoverheidFoto("tom-berendsen") },
  { naam: "Sjoerd Sjoerdsma", partij: "D66", rol: "Minister", portefeuille: "Minister van Buitenlandse Handel en Ontwikkelingssamenwerking", fotoUrl: rijksoverheidFoto("sjoerd-sjoerdsma") },
  { naam: "Eelco Heinen", partij: "VVD", rol: "Minister", portefeuille: "Minister van Financiën", fotoUrl: rijksoverheidFoto("eelco-heinen") },
  { naam: "David van Weel", partij: "VVD", rol: "Minister", portefeuille: "Minister van Justitie en Veiligheid", fotoUrl: rijksoverheidFoto("david-van-weel") },
  { naam: "Heleen Herbert", partij: "CDA", rol: "Minister", portefeuille: "Minister van Economische Zaken en Klimaat", fotoUrl: rijksoverheidFoto("heleen-herbert") },
  { naam: "Stientje van Veldhoven", partij: "D66", rol: "Minister", portefeuille: "Minister van Klimaat en Groene Groei", fotoUrl: rijksoverheidFoto("stientje-van-veldhoven") },
  { naam: "Rianne Letschert", partij: "D66", rol: "Minister", portefeuille: "Minister van Onderwijs, Cultuur en Wetenschap", fotoUrl: rijksoverheidFoto("rianne-letschert") },
  { naam: "Sophie Hermans", partij: "VVD", rol: "Minister", portefeuille: "Minister van Volksgezondheid, Welzijn en Sport", fotoUrl: rijksoverheidFoto("sophie-hermans") },
  { naam: "Mirjam Sterk", partij: "CDA", rol: "Minister", portefeuille: "Minister van Langdurige Zorg, Jeugd en Sport", fotoUrl: rijksoverheidFoto("mirjam-sterk") },
  { naam: "Hans Vijlbrief", partij: "D66", rol: "Minister", portefeuille: "Minister van Sociale Zaken en Werkgelegenheid", fotoUrl: rijksoverheidFoto("hans-vijlbrief") },
  { naam: "Thierry Aartsen", partij: "VVD", rol: "Minister", portefeuille: "Minister van Werk en Participatie", fotoUrl: rijksoverheidFoto("thierry-aartsen") },
  { naam: "Vincent Karremans", partij: "VVD", rol: "Minister", portefeuille: "Minister van Infrastructuur en Waterstaat", fotoUrl: rijksoverheidFoto("vincent-karremans") },
  { naam: "Elanor Boekholt-O'Sullivan", partij: "D66", rol: "Minister", portefeuille: "Minister van Volkshuisvesting en Ruimtelijke Ordening", fotoUrl: rijksoverheidFoto("elanor-boekholt-osullivan") },
  { naam: "Jaimi van Essen", partij: "D66", rol: "Minister", portefeuille: "Minister van Landbouw, Visserij, Voedselzekerheid en Natuur", fotoUrl: rijksoverheidFoto("jaimi-van-essen") },

  // Staatssecretarissen
  { naam: "Eric van der Burg", partij: "VVD", rol: "Staatssecretaris", portefeuille: "Staatssecretaris van BZK – Slagvaardige Overheid en Koninkrijksrelaties", fotoUrl: rijksoverheidFoto("eric-van-der-burg") },
  { naam: "Eelco Eerenberg", partij: "D66", rol: "Staatssecretaris", portefeuille: "Staatssecretaris van Financiën – Fiscale Zaken en Belastingdienst", fotoUrl: rijksoverheidFoto("eelco-eerenberg") },
  { naam: "Sandra Palmen", partij: "Partijloos", rol: "Staatssecretaris", portefeuille: "Staatssecretaris van Financiën – Herstel en Toeslagen", fotoUrl: rijksoverheidFoto("sandra-palmen") },
  { naam: "Willemijn Aerdts", partij: "D66", rol: "Staatssecretaris", portefeuille: "Staatssecretaris van EZK – Digitale Zaken en Soevereiniteit", fotoUrl: rijksoverheidFoto("willemijn-aerdts") },
  { naam: "Jo-Annes de Bat", partij: "CDA", rol: "Staatssecretaris", portefeuille: "Staatssecretaris van EZK – Klimaat en Groene Groei", fotoUrl: rijksoverheidFoto("jo-annes-de-bat") },
  { naam: "Derk Boswijk", partij: "CDA", rol: "Staatssecretaris", portefeuille: "Staatssecretaris van Defensie", fotoUrl: rijksoverheidFoto("derk-boswijk") },
  { naam: "Claudia van Bruggen", partij: "D66", rol: "Staatssecretaris", portefeuille: "Staatssecretaris van J&V – Rechtsbescherming en Gevangeniswezen", fotoUrl: rijksoverheidFoto("claudia-van-bruggen") },
  { naam: "Judith Tielen", partij: "VVD", rol: "Staatssecretaris", portefeuille: "Staatssecretaris van Onderwijs, Cultuur en Wetenschap", fotoUrl: rijksoverheidFoto("judith-tielen") },
  { naam: "Annet Bertram", partij: "CDA", rol: "Staatssecretaris", portefeuille: "Staatssecretaris van I&W – Milieuzaken, OV, Spoorwegen en KNMI", fotoUrl: rijksoverheidFoto("annet-bertram") },
  { naam: "Silvio Erkens", partij: "VVD", rol: "Staatssecretaris", portefeuille: "Staatssecretaris van Landbouw, Visserij, Voedselzekerheid en Natuur", fotoUrl: rijksoverheidFoto("silvio-erkens") },
]
