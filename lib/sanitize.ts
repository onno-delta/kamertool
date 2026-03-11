/**
 * Strip everything except lowercase alphanumeric and hyphens.
 * Collapses multiple hyphens and trims leading/trailing hyphens.
 */
export function sanitizeFilename(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100) || "document"
}

/**
 * Escape SQL ILIKE wildcards so they are treated as literal characters.
 */
export function escapeILIKE(input: string): string {
  return input.replace(/[%_\\]/g, (ch) => `\\${ch}`)
}
