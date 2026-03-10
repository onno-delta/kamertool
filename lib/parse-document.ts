/**
 * Server-side document parsing: extracts plain text from uploaded files.
 * Supports PDF, DOCX, XLSX, and plain text.
 */

const SUPPORTED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
  "text/plain",
  "text/markdown",
  "text/csv",
])

const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4MB (Vercel payload limit)

export function isSupportedType(mimeType: string): boolean {
  return SUPPORTED_TYPES.has(mimeType)
}

export function getSupportedExtensions(): string {
  return ".pdf, .docx, .xlsx, .txt, .md, .csv"
}

export async function parseDocument(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<{ text: string; error?: string }> {
  if (buffer.length > MAX_FILE_SIZE) {
    return { text: "", error: `Bestand te groot (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` }
  }

  if (!isSupportedType(mimeType)) {
    return { text: "", error: `Bestandstype niet ondersteund. Ondersteund: ${getSupportedExtensions()}` }
  }

  try {
    if (mimeType === "application/pdf") {
      return await parsePDF(buffer)
    }
    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      return await parseDOCX(buffer)
    }
    if (
      mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      mimeType === "application/vnd.ms-excel"
    ) {
      return await parseXLSX(buffer)
    }
    // Plain text / markdown / CSV
    return { text: buffer.toString("utf-8") }
  } catch (err) {
    console.error(`[parse-document] Failed to parse ${fileName}:`, err)
    return { text: "", error: `Kon bestand niet verwerken: ${fileName}` }
  }
}

async function parsePDF(buffer: Buffer): Promise<{ text: string }> {
  // pdf-parse uses CJS default export
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>
  const result = await pdfParse(buffer)
  return { text: result.text }
}

async function parseDOCX(buffer: Buffer): Promise<{ text: string }> {
  const mammoth = await import("mammoth")
  const result = await mammoth.extractRawText({ buffer })
  return { text: result.value }
}

async function parseXLSX(buffer: Buffer): Promise<{ text: string }> {
  const XLSX = await import("xlsx")
  const workbook = XLSX.read(buffer, { type: "buffer" })
  const lines: string[] = []
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    if (workbook.SheetNames.length > 1) {
      lines.push(`--- ${sheetName} ---`)
    }
    const csv = XLSX.utils.sheet_to_csv(sheet)
    lines.push(csv)
  }
  return { text: lines.join("\n\n") }
}
