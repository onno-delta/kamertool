/**
 * Converts markdown to HTML and copies as rich text to clipboard.
 * When pasted into Word/Google Docs, formatting is preserved.
 */
export async function copyAsRichText(markdown: string) {
  const html = markdownToHtml(markdown)

  const blob = new Blob([html], { type: "text/html" })
  const plainBlob = new Blob([markdown], { type: "text/plain" })

  await navigator.clipboard.write([
    new ClipboardItem({
      "text/html": blob,
      "text/plain": plainBlob,
    }),
  ])
}

function markdownToHtml(md: string): string {
  const lines = md.split("\n")
  const output: string[] = []
  let inList: "ul" | "ol" | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      if (inList) {
        output.push(inList === "ul" ? "</ul>" : "</ol>")
        inList = null
      }
      continue
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)/)
    if (headingMatch) {
      if (inList) { output.push(inList === "ul" ? "</ul>" : "</ol>"); inList = null }
      const level = headingMatch[1].length
      output.push(`<h${level}>${inline(headingMatch[2])}</h${level}>`)
      continue
    }

    // Bullet list
    if (trimmed.startsWith("- ")) {
      if (inList === "ol") { output.push("</ol>"); inList = null }
      if (!inList) { output.push("<ul>"); inList = "ul" }
      output.push(`<li>${inline(trimmed.slice(2))}</li>`)
      continue
    }

    // Numbered list
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/)
    if (numMatch) {
      if (inList === "ul") { output.push("</ul>"); inList = null }
      if (!inList) { output.push("<ol>"); inList = "ol" }
      output.push(`<li>${inline(numMatch[2])}</li>`)
      continue
    }

    // Horizontal rule
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      if (inList) { output.push(inList === "ul" ? "</ul>" : "</ol>"); inList = null }
      output.push("<hr>")
      continue
    }

    // Paragraph
    if (inList) { output.push(inList === "ul" ? "</ul>" : "</ol>"); inList = null }
    output.push(`<p>${inline(trimmed)}</p>`)
  }

  if (inList) output.push(inList === "ul" ? "</ul>" : "</ol>")

  return output.join("\n")
}

function inline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
}
