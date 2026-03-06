/**
 * Fetches briefing PDF blob from the server-side API route.
 * Fonts are loaded server-side only — never shipped to the browser.
 */
async function fetchPdfBlob(
  content: string,
  topic: string,
  partyName?: string | null
): Promise<Blob | null> {
  const res = await fetch("/api/briefings/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, topic, partyName }),
  })

  if (!res.ok) {
    console.error("[pdf] Failed:", res.status, await res.text().catch(() => ""))
    return null
  }

  return res.blob()
}

/**
 * Opens the briefing PDF in a new browser tab.
 */
export async function openBriefingPDF(
  content: string,
  topic: string,
  opts?: { partyName?: string | null }
) {
  const blob = await fetchPdfBlob(content, topic, opts?.partyName)
  if (!blob) {
    alert("PDF openen mislukt. Probeer het opnieuw of gebruik 'Kopieer tekst'.")
    return
  }
  const url = URL.createObjectURL(blob)
  window.open(url, "_blank")
}

/**
 * Downloads the briefing PDF as a file.
 */
export async function downloadBriefingPDF(
  content: string,
  topic: string,
  opts?: { partyName?: string | null }
) {
  const blob = await fetchPdfBlob(content, topic, opts?.partyName)
  if (!blob) {
    alert("PDF downloaden mislukt. Probeer het opnieuw of gebruik 'Kopieer tekst'.")
    return
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `briefing-${topic.slice(0, 30).replace(/\s+/g, "-")}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
