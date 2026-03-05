"use client"

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

export function Message({ message }: { message: UIMessage }) {
  const { role, parts } = message
  const isUser = role === "user"

  const textParts = parts.filter(
    (p) => p.type === "text" || p.type === "reasoning"
  )

  // Don't render empty assistant messages (tool-only, no text yet)
  if (!isUser && textParts.every((p) => p.type === "text" && !p.text)) {
    return null
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[85%] ${
          isUser
            ? "rounded-2xl bg-blue-600 px-4 py-3 text-white"
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
                    className="rounded-2xl bg-gray-100 px-4 py-2 text-xs italic text-gray-400"
                  >
                    {part.text}
                  </div>
                )
              }
              if (part.type === "text" && part.text) {
                return (
                  <div
                    key={i}
                    className="prose prose-sm max-w-none leading-relaxed text-gray-900 prose-headings:mt-4 prose-headings:mb-2 prose-p:my-1.5 prose-li:my-0.5 prose-ul:my-1.5 prose-ol:my-1.5"
                  >
                    <ReactMarkdown>{part.text}</ReactMarkdown>
                  </div>
                )
              }
              return null
            })}
      </div>
    </div>
  )
}
