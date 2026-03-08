import type { TKMember } from "@/lib/tk-members"

/**
 * Match a @tweedekamer.nl email to a current TK member.
 * Returns the member if exactly one match is found, null otherwise.
 *
 * TK email format: {initial}.{surname}@tweedekamer.nl
 * where surname may include tussenvoegsel without spaces, e.g. "vanlanschot"
 */
export function matchKamerlid(
  email: string,
  members: TKMember[]
): TKMember | null {
  if (!email.endsWith("@tweedekamer.nl")) return null

  const localPart = email.split("@")[0]
  const dotIndex = localPart.indexOf(".")
  if (dotIndex < 0) return null

  const surnameRaw = localPart.slice(dotIndex + 1)
  if (!surnameRaw) return null

  const normalizedEmail = normalize(surnameRaw)

  const matches = members.filter((m) => {
    // Match against achternaam only
    if (normalizedEmail === normalize(m.achternaam)) return true

    // Match against tussenvoegsel + achternaam combined
    if (m.tussenvoegsel) {
      const combined = normalize(m.tussenvoegsel + m.achternaam)
      if (normalizedEmail === combined) return true
    }

    return false
  })

  // Only accept unambiguous matches
  return matches.length === 1 ? matches[0] : null
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s\-'']/g, "")
}
