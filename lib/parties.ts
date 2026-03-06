// Sorted by current seat count in the Tweede Kamer (maart 2026)
export const PARTIES = [
  { shortName: "D66", name: "Democraten 66" },                        // 26
  { shortName: "VVD", name: "Volkspartij voor Vrijheid en Democratie" }, // 22
  { shortName: "GL-PvdA", name: "GroenLinks-PvdA" },                  // 20
  { shortName: "PVV", name: "Partij voor de Vrijheid" },              // 19
  { shortName: "CDA", name: "Christen-Democratisch Appèl" },          // 18
  { shortName: "JA21", name: "JA21" },                                // 9
  { shortName: "FVD", name: "Forum voor Democratie" },                // 7
  { shortName: "Groep Markuszower", name: "Groep Markuszower" },       // 7
  { shortName: "BBB", name: "BoerBurgerBeweging" },                   // 3
  { shortName: "DENK", name: "DENK" },                                // 3
  { shortName: "SGP", name: "Staatkundig Gereformeerde Partij" },     // 3
  { shortName: "PvdD", name: "Partij voor de Dieren" },               // 3
  { shortName: "CU", name: "ChristenUnie" },                          // 3
  { shortName: "SP", name: "Socialistische Partij" },                 // 3
  { shortName: "50PLUS", name: "50PLUS" },                            // 2
  { shortName: "Volt", name: "Volt Nederland" },                      // 1
  { shortName: "Lid Keijzer", name: "Lid Keijzer" },                  // 1
] as const

// Canonical sort order for party selectors (index in PARTIES array)
export const PARTY_SORT_ORDER: Record<string, number> = Object.fromEntries(
  PARTIES.map((p, i) => [p.shortName, i])
)

export const PARTY_COLORS: Record<string, string> = {
  "D66":               "#01AF36",
  "VVD":               "#FF7F00",
  "GL-PvdA":           "#BB0036",
  "PVV":               "#153168",
  "CDA":               "#007B5F",
  "JA21":              "#1D2B53",
  "FVD":               "#7B1E24",
  "Groep Markuszower": "#888888",
  "BBB":               "#95C11F",
  "DENK":              "#37B8AF",
  "SGP":               "#EF6E20",
  "PvdD":              "#006B2D",
  "CU":                "#00A7EB",
  "SP":                "#EE2A24",
  "50PLUS":            "#93117E",
  "Volt":              "#502379",
  "Lid Keijzer":       "#888888",
}
