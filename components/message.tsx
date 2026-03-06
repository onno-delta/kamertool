"use client"

import { useState } from "react"
import type { UIMessage } from "ai"
import ReactMarkdown from "react-markdown"
import type { ToolStep } from "./progress-sidebar"
import { getStepLabel, getStepDetail } from "./progress-sidebar"

function getToolName(part: any): string {
  if (part.toolName) return part.toolName
  if (typeof part.type === "string" && part.type.startsWith("tool-")) {
    return part.type.slice(5)
  }
  return "unknown"
}

/** Extract ToolStep[] from UIMessage[] for the progress sidebar */
export function extractToolSteps(messages: UIMessage[]): ToolStep[] {
  const steps: ToolStep[] = []

  for (const msg of messages) {
    if (msg.role !== "assistant") continue

    for (const part of msg.parts) {
      const isToolPart =
        (part as any).type === "dynamic-tool" ||
        (typeof (part as any).type === "string" &&
          (part as any).type.startsWith("tool-"))
      if (!isToolPart) continue

      const p = part as any
      const state = p.state
      if (
        state !== "input-streaming" &&
        state !== "input-available" &&
        state !== "output-available" &&
        state !== "output-error"
      )
        continue

      const toolName = getToolName(p)
      const args = p.input ?? p.args ?? {}
      const isDone = state === "output-available"
      const isError = state === "output-error"

      steps.push({
        id: p.toolCallId ?? `${msg.id}-${steps.length}`,
        tool: toolName,
        label: getStepLabel(toolName, args),
        status: isDone ? "done" : isError ? "error" : "running",
        detail: getStepDetail(toolName, state, p.output),
      })
    }
  }

  return steps
}

export function Message({ message, topic }: { message: UIMessage; topic?: string }) {
  const { role, parts } = message
  const isUser = role === "user"
  const [pdfBusy, setPdfBusy] = useState(false)

  const textParts = parts.filter(
    (p) => p.type === "text" || p.type === "reasoning"
  )

  // Don't render empty assistant messages (tool-only, no text yet)
  if (!isUser && textParts.every((p) => p.type === "text" && !p.text)) {
    return null
  }

  const fullText = !isUser
    ? textParts
        .filter((p): p is { type: "text"; text: string } => p.type === "text" && !!p.text)
        .map((p) => p.text)
        .join("\n\n")
    : ""
  const isBriefing = fullText.length > 500 && fullText.includes("##")

  async function handleDownloadPDF() {
    setPdfBusy(true)
    try {
      const { downloadBriefingPDF } = await import("./briefing-context")
      await downloadBriefingPDF(fullText, topic || "Debatbriefing")
    } finally {
      setPdfBusy(false)
    }
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[85%] ${
          isUser
            ? "rounded-xl bg-primary px-4 py-3 text-white"
            : "space-y-2"
        }`}
      >
        {isUser
          ? parts.map((part, i) =>
              part.type === "text" ? (
                <div key={i} className="whitespace-pre-wrap leading-relaxed">
                  {part.text}
                </div>
              ) : null
            )
          : textParts.map((part, i) => {
              if (part.type === "reasoning") {
                if (!part.text) return null
                return (
                  <div
                    key={i}
                    className="rounded bg-surface-muted px-4 py-2 text-xs italic text-text-muted"
                  >
                    {part.text}
                  </div>
                )
              }
              if (part.type === "text" && part.text) {
                return (
                  <div
                    key={i}
                    className="prose prose-sm max-w-none leading-relaxed text-primary prose-headings:mt-4 prose-headings:mb-2 prose-headings:text-primary prose-p:my-1.5 prose-li:my-0.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-a:text-primary prose-a:underline"
                  >
                    <ReactMarkdown>{part.text}</ReactMarkdown>
                  </div>
                )
              }
              return null
            })}
        {isBriefing && (
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-surface-muted px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-primary">Debatbriefing</p>
              <p className="truncate text-xs text-text-muted">Download als PDF</p>
            </div>
            <button
              onClick={handleDownloadPDF}
              disabled={pdfBusy}
              className="shrink-0 rounded border border-border bg-white px-3 py-1.5 text-xs font-medium text-primary hover:bg-surface-muted disabled:opacity-50"
            >
              {pdfBusy ? "Bezig..." : "Download PDF"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
