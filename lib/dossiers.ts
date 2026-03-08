export const DOSSIERS = [
  { id: "binnenlandse-zaken", label: "Binnenlandse Zaken" },
  { id: "buitenlandse-zaken", label: "Buitenlandse Zaken" },
  { id: "defensie", label: "Defensie" },
  { id: "economische-zaken", label: "Economische Zaken" },
  { id: "eu-zaken", label: "Europese Zaken" },
  { id: "financien", label: "Financien" },
  { id: "infrastructuur-waterstaat", label: "Infrastructuur en Waterstaat" },
  { id: "justitie-veiligheid", label: "Justitie en Veiligheid" },
  { id: "klimaat-energie", label: "Klimaat en Groene Groei" },
  { id: "landbouw-visserij", label: "Landbouw, Visserij en Voedselzekerheid" },
  { id: "media-cultuur", label: "Media en Cultuur" },
  { id: "migratie-asiel", label: "Asiel en Migratie" },
  { id: "onderwijs", label: "Onderwijs, Cultuur en Wetenschap" },
  { id: "sociale-zaken", label: "Sociale Zaken en Werkgelegenheid" },
  { id: "volkshuisvesting", label: "Volkshuisvesting en Ruimtelijke Ordening" },
  { id: "vws", label: "Volksgezondheid, Welzijn en Sport" },
  { id: "koninkrijksrelaties", label: "Koninkrijksrelaties" },
  { id: "digitale-zaken", label: "Digitale Zaken" },
  { id: "buitenlandse-handel", label: "Buitenlandse Handel en Ontwikkelingshulp" },
] as const

export type DossierId = (typeof DOSSIERS)[number]["id"]

// Maps TK committee abbreviations (from /api/kamerleden/commissies) to dossier IDs
export const COMMISSIE_DOSSIER_MAP: Record<string, string> = {
  "BZK": "binnenlandse-zaken",
  "BUZA": "buitenlandse-zaken",
  "DEF": "defensie",
  "EZK": "economische-zaken",
  "EU": "eu-zaken",
  "FIN": "financien",
  "I&W": "infrastructuur-waterstaat",
  "J&V": "justitie-veiligheid",
  "KGG": "klimaat-energie",
  "LVV": "landbouw-visserij",
  "OCW": "onderwijs",
  "SZW": "sociale-zaken",
  "VRO": "volkshuisvesting",
  "VWS": "vws",
  "KR": "koninkrijksrelaties",
  "DiZa": "digitale-zaken",
  "BHOS": "buitenlandse-handel",
}
