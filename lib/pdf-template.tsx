import { Document, Page, Text, View, Image, Font, StyleSheet, pdf } from "@react-pdf/renderer"
import { DELTA_LOGO_URI } from "./pdf-assets"

// Fonts embedded as base64 data URIs — works on Vercel without file system access
import { RIJKS_SANS_TEXT_REGULAR, RIJKS_SANS_HEADING_BOLD } from "./pdf-fonts-rijks"
import { FIRA_SANS_BOLD, FIRA_SANS_ITALIC } from "./pdf-fonts-fira"

Font.register({
  family: "RijksoverheidSansText",
  fonts: [
    { src: RIJKS_SANS_TEXT_REGULAR, fontWeight: 400 },
    { src: FIRA_SANS_BOLD, fontWeight: 700 },
    { src: FIRA_SANS_ITALIC, fontWeight: 400, fontStyle: "italic" },
  ],
})

Font.register({
  family: "RijksoverheidSansHeading",
  fonts: [
    { src: RIJKS_SANS_HEADING_BOLD, fontWeight: 700 },
  ],
})

// Rijkshuisstijl-gebaseerde kleuren
const C = {
  primary: "#154273",
  primaryDark: "#0f3560",
  body: "#1a1a1a",
  subtitle: "#475569",
  footer: "#64748B",
  footerLine: "#CBD5E1",
} as const

const s = StyleSheet.create({
  page: {
    paddingTop: 80,
    paddingBottom: 60,
    paddingHorizontal: 50,
    fontFamily: "RijksoverheidSansText",
    fontSize: 10.5,
    lineHeight: 1.55,
    color: C.body,
  },
  // Fixed header
  header: {
    position: "absolute",
    top: 20,
    left: 50,
    right: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: C.primary,
  },
  headerCenter: {
    fontSize: 9,
    fontFamily: "RijksoverheidSansHeading",
    fontWeight: 700,
    color: C.primary,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  headerLogo: {
    height: 16,
    width: 119, // 595/80 * 16 ≈ 119 (maintains aspect ratio)
  },
  // Fixed footer — use top instead of bottom (A4 = 842pt)
  footer: {
    position: "absolute",
    top: 810,
    left: 50,
    right: 50,
    borderTopWidth: 0.5,
    borderTopColor: C.footerLine,
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7.5,
    color: C.footer,
    fontFamily: "RijksoverheidSansText",
    fontWeight: 400,
  },
  // Content styles
  title: {
    fontSize: 18,
    fontFamily: "RijksoverheidSansHeading",
    fontWeight: 700,
    marginBottom: 4,
    color: C.primary,
  },
  subtitle: {
    fontSize: 10,
    fontFamily: "RijksoverheidSansText",
    fontWeight: 400,
    color: C.subtitle,
    marginBottom: 20,
  },
  h1: {
    fontSize: 14,
    fontFamily: "RijksoverheidSansHeading",
    fontWeight: 700,
    color: C.primary,
    marginTop: 20,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#d0d0d0",
    paddingBottom: 4,
  },
  h2: {
    fontSize: 13,
    fontFamily: "RijksoverheidSansHeading",
    fontWeight: 700,
    color: C.primary,
    marginTop: 16,
    marginBottom: 7,
  },
  h3: {
    fontSize: 11.5,
    fontFamily: "RijksoverheidSansHeading",
    fontWeight: 700,
    color: "#2a5a8c",
    marginTop: 14,
    marginBottom: 6,
  },
  h4: {
    fontSize: 10.5,
    fontFamily: "RijksoverheidSansHeading",
    fontWeight: 700,
    color: C.primaryDark,
    marginTop: 12,
    marginBottom: 5,
  },
  p: {
    fontSize: 10.5,
    lineHeight: 1.55,
    marginBottom: 6,
  },
  bold: {
    fontFamily: "RijksoverheidSansText",
    fontWeight: 700,
  },
  italic: {
    fontFamily: "RijksoverheidSansText",
    fontStyle: "italic",
  },
  hr: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
    marginTop: 10,
    marginBottom: 10,
  },
})

type PdfStyle = (typeof s)[keyof typeof s]

function renderInline(text: string, baseStyle?: PdfStyle) {
  const parts: React.ReactNode[] = []
  const regex = /(\*\*.*?\*\*|\*.*?\*|[^*]+|\*)/g
  let match
  let i = 0
  while ((match = regex.exec(text)) !== null) {
    const seg = match[1]
    if (seg.startsWith("**") && seg.endsWith("**") && seg.length > 4) {
      parts.push(<Text key={i++} style={s.bold}>{seg.slice(2, -2)}</Text>)
    } else if (seg.startsWith("*") && seg.endsWith("*") && seg.length > 2) {
      parts.push(<Text key={i++} style={s.italic}>{seg.slice(1, -1)}</Text>)
    } else {
      parts.push(<Text key={i++}>{seg}</Text>)
    }
  }
  return <Text style={baseStyle ?? s.p}>{parts}</Text>
}

function Header() {
  return (
    <View style={s.header} fixed>
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image style={s.headerLogo} src={DELTA_LOGO_URI} />
      <Text style={s.headerCenter}>DEBATBRIEFING</Text>
    </View>
  )
}

type BriefingPDFProps = {
  topic: string
  content: string
  date?: string
  partyName?: string | null
}

export function BriefingPDF({ topic, content, date, partyName }: BriefingPDFProps) {
  const displayDate = date ?? new Date().toLocaleDateString("nl-NL")
  const lines = content.split("\n")
  const elements: React.ReactNode[] = []
  let i = 0

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li]
    const trimmed = line.trim()

    if (!trimmed) continue

    // Horizontal rule
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      elements.push(<View key={i++} style={s.hr} />)
      continue
    }

    // Headings (with minPresenceAhead to avoid orphan headings)
    if (trimmed.startsWith("#### ")) {
      elements.push(<View key={i++} minPresenceAhead={40}>{renderInline(trimmed.slice(5), s.h4)}</View>)
      continue
    }
    if (trimmed.startsWith("### ")) {
      elements.push(<View key={i++} minPresenceAhead={40}>{renderInline(trimmed.slice(4), s.h3)}</View>)
      continue
    }
    if (trimmed.startsWith("## ")) {
      elements.push(<View key={i++} minPresenceAhead={50}>{renderInline(trimmed.slice(3), s.h2)}</View>)
      continue
    }
    if (trimmed.startsWith("# ")) {
      // Skip top-level headings — the PDF title already covers this
      continue
    }

    // Bullet points
    if (trimmed.startsWith("- ")) {
      elements.push(
        <View key={i++} style={{ flexDirection: "row", marginBottom: 3 }}>
          <Text style={{ width: 16, fontSize: 10.5 }}>•  </Text>
          <View style={{ flex: 1 }}>{renderInline(trimmed.slice(2))}</View>
        </View>
      )
      continue
    }

    // Numbered items
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/)
    if (numMatch) {
      elements.push(
        <View key={i++} style={{ flexDirection: "row", marginBottom: 3 }}>
          <Text style={{ width: 20, fontSize: 10.5 }}>{numMatch[1]}. </Text>
          <View style={{ flex: 1 }}>{renderInline(numMatch[2])}</View>
        </View>
      )
      continue
    }

    // Footnote references [1], [2], etc. — APA 7 hanging indent
    const refMatch = trimmed.match(/^\[(\d+)\]\s+(.*)/)
    if (refMatch) {
      elements.push(
        <View key={i++} style={{ flexDirection: "row", marginBottom: 4, paddingLeft: 24 }}>
          <Text style={{ width: 28, fontSize: 9.5, marginLeft: -24, color: C.primary }}>[{refMatch[1]}]</Text>
          <View style={{ flex: 1 }}>
            {renderInline(refMatch[2], { fontSize: 9.5, lineHeight: 1.45, marginBottom: 0 })}
          </View>
        </View>
      )
      continue
    }

    // Regular paragraph — collect continuation lines
    let para = trimmed
    while (li + 1 < lines.length) {
      const next = lines[li + 1].trim()
      if (!next || next.startsWith("#") || next.startsWith("- ") || next === "---" || next === "***" || /^\d+\.\s+/.test(next) || /^\[\d+\]/.test(next)) break
      para += " " + next
      li++
    }
    elements.push(<View key={i++}>{renderInline(para, s.p)}</View>)
  }

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Header />
        <View style={s.footer} fixed>
          <Text style={s.footerText} fixed>Delta Instituut  ·  Kamertool</Text>
          <Text style={s.footerText} fixed render={({ pageNumber }) => `Pagina ${pageNumber}`} />
        </View>
        <Text style={s.title}>Debatbriefing: {topic}</Text>
        <Text style={s.subtitle}>
          Gegenereerd op {displayDate}{partyName ? `  ·  ${partyName}` : ""}
        </Text>
        {elements}
      </Page>
    </Document>
  )
}

export async function createBriefingBlob(
  content: string,
  topic: string,
  opts?: { date?: string; partyName?: string | null }
) {
  return pdf(
    <BriefingPDF topic={topic} content={content} date={opts?.date} partyName={opts?.partyName} />
  ).toBlob()
}

export async function downloadBriefingPDF(
  content: string,
  topic: string,
  opts?: { date?: string; partyName?: string | null }
) {
  const blob = await createBriefingBlob(content, topic, opts)
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `briefing-${topic.slice(0, 30).replace(/\s+/g, "-")}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
