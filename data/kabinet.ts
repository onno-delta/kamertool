export type KabinetLid = {
  naam: string
  partij: string
  rol: "Minister" | "Staatssecretaris"
  portefeuille: string
}

export const KABINET: KabinetLid[] = [
  // Ministers
  { naam: "Rob Jetten", partij: "D66", rol: "Minister", portefeuille: "Minister-president, Algemene Zaken" },
  { naam: "Dilan Yeşilgöz", partij: "VVD", rol: "Minister", portefeuille: "Vicepremier, Minister van Defensie" },
  { naam: "Bart van den Brink", partij: "CDA", rol: "Minister", portefeuille: "Vicepremier, Minister van Asiel en Migratie" },
  { naam: "Pieter Heerma", partij: "CDA", rol: "Minister", portefeuille: "Minister van Binnenlandse Zaken en Koninkrijksrelaties" },
  { naam: "Tom Berendsen", partij: "CDA", rol: "Minister", portefeuille: "Minister van Buitenlandse Zaken" },
  { naam: "Sjoerd Sjoerdsma", partij: "D66", rol: "Minister", portefeuille: "Minister van Buitenlandse Handel en Ontwikkelingssamenwerking" },
  { naam: "Eelco Heinen", partij: "VVD", rol: "Minister", portefeuille: "Minister van Financiën" },
  { naam: "David van Weel", partij: "VVD", rol: "Minister", portefeuille: "Minister van Justitie en Veiligheid" },
  { naam: "Heleen Herbert", partij: "CDA", rol: "Minister", portefeuille: "Minister van Economische Zaken en Klimaat" },
  { naam: "Stientje van Veldhoven", partij: "D66", rol: "Minister", portefeuille: "Minister van Klimaat en Groene Groei" },
  { naam: "Rianne Letschert", partij: "D66", rol: "Minister", portefeuille: "Minister van Onderwijs, Cultuur en Wetenschap" },
  { naam: "Sophie Hermans", partij: "VVD", rol: "Minister", portefeuille: "Minister van Volksgezondheid, Welzijn en Sport" },
  { naam: "Mirjam Sterk", partij: "CDA", rol: "Minister", portefeuille: "Minister van Langdurige Zorg, Jeugd en Sport" },
  { naam: "Hans Vijlbrief", partij: "D66", rol: "Minister", portefeuille: "Minister van Sociale Zaken en Werkgelegenheid" },
  { naam: "Thierry Aartsen", partij: "VVD", rol: "Minister", portefeuille: "Minister van Werk en Participatie" },
  { naam: "Vincent Karremans", partij: "VVD", rol: "Minister", portefeuille: "Minister van Infrastructuur en Waterstaat" },
  { naam: "Elanor Boekholt-O'Sullivan", partij: "D66", rol: "Minister", portefeuille: "Minister van Volkshuisvesting en Ruimtelijke Ordening" },
  { naam: "Jaimi van Essen", partij: "D66", rol: "Minister", portefeuille: "Minister van Landbouw, Visserij, Voedselzekerheid en Natuur" },

  // Staatssecretarissen
  { naam: "Eric van der Burg", partij: "VVD", rol: "Staatssecretaris", portefeuille: "Staatssecretaris van BZK – Slagvaardige Overheid en Koninkrijksrelaties" },
  { naam: "Eelco Eerenberg", partij: "D66", rol: "Staatssecretaris", portefeuille: "Staatssecretaris van Financiën – Fiscale Zaken en Belastingdienst" },
  { naam: "Sandra Palmen", partij: "Partijloos", rol: "Staatssecretaris", portefeuille: "Staatssecretaris van Financiën – Herstel en Toeslagen" },
  { naam: "Willemijn Aerdts", partij: "D66", rol: "Staatssecretaris", portefeuille: "Staatssecretaris van EZK – Digitale Zaken en Soevereiniteit" },
  { naam: "Jo-Annes de Bat", partij: "CDA", rol: "Staatssecretaris", portefeuille: "Staatssecretaris van EZK – Klimaat en Groene Groei" },
  { naam: "Derk Boswijk", partij: "CDA", rol: "Staatssecretaris", portefeuille: "Staatssecretaris van Defensie" },
  { naam: "Claudia van Bruggen", partij: "D66", rol: "Staatssecretaris", portefeuille: "Staatssecretaris van J&V – Rechtsbescherming en Gevangeniswezen" },
  { naam: "Judith Tielen", partij: "VVD", rol: "Staatssecretaris", portefeuille: "Staatssecretaris van Onderwijs, Cultuur en Wetenschap" },
  { naam: "Annet Bertram", partij: "CDA", rol: "Staatssecretaris", portefeuille: "Staatssecretaris van I&W – Milieuzaken, OV, Spoorwegen en KNMI" },
  { naam: "Silvio Erkens", partij: "VVD", rol: "Staatssecretaris", portefeuille: "Staatssecretaris van Landbouw, Visserij, Voedselzekerheid en Natuur" },
]
