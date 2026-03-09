"use client"

import type { UIMessage } from "ai"
import ReactMarkdown from "react-markdown"
import { Layers } from "lucide-react"
import type { ToolStep } from "./progress-sidebar"
import { getStepLabel, getStepDetail } from "./progress-sidebar"
import { InlineToolStep } from "./inline-tool-step"

type ToolPart = {
  type: string
  toolName?: string
  toolCallId?: string
  state?: string
  input?: Record<string, unknown>
  args?: Record<string, unknown>
  output?: unknown
}

function getToolName(part: ToolPart): string {
  if (part.toolName) return part.toolName
  if (typeof part.type === "string" && part.type.startsWith("tool-")) {
    return part.type.slice(5)
  }
  return "unknown"
}

function isToolPart(p: ToolPart): boolean {
  return (
    p.type === "dynamic-tool" ||
    (typeof p.type === "string" && p.type.startsWith("tool-"))
  )
}

function isVisibleToolState(state?: string): boolean {
  return (
    state === "input-streaming" ||
    state === "input-available" ||
    state === "output-available" ||
    state === "output-error"
  )
}

/** Extract ToolStep[] from UIMessage[] for the progress sidebar */
export function extractToolSteps(messages: UIMessage[]): ToolStep[] {
  const steps: ToolStep[] = []

  for (const msg of messages) {
    if (msg.role !== "assistant") continue

    for (const part of msg.parts) {
      const p = part as unknown as ToolPart
      if (!isToolPart(p)) continue

      const state = p.state
      if (!isVisibleToolState(state)) continue

      const toolName = getToolName(p)
      const args = p.input ?? p.args ?? {}
      const isDone = state === "output-available"
      const isError = state === "output-error"

      steps.push({
        id: p.toolCallId ?? `${msg.id}-${steps.length}`,
        tool: toolName,
        label: getStepLabel(toolName, args),
        status: isDone ? "done" : isError ? "error" : "running",
        detail: getStepDetail(toolName, state!, p.output as Record<string, unknown> | undefined),
      })
    }
  }

  return steps
}

export function Message({ message }: { message: UIMessage }) {
  const { role, parts } = message
  const isUser = role === "user"

  // Check if there's any visible content (text, reasoning, or tools)
  const hasVisibleContent = parts.some((p) => {
    if (p.type === "text" && p.text) return true
    if (p.type === "reasoning" && p.text) return true
    const tp = p as unknown as ToolPart
    if (isToolPart(tp) && isVisibleToolState(tp.state)) return true
    return false
  })

  // Don't render empty assistant messages
  if (!isUser && !hasVisibleContent) {
    return null
  }

  if (isUser) {
    return (
      <div className="mb-5 flex justify-end">
        <div className="max-w-[80%] rounded-xl rounded-br bg-primary px-4 py-3 text-white">
          {parts.map((part, i) =>
            part.type === "text" ? (
              <div key={i} className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed">
                {part.text}
              </div>
            ) : null
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mb-5 flex items-start gap-2.5">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-15">
        <Layers className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="min-w-0 max-w-[85%] space-y-2">
        {parts.map((part, i) => {
          if (part.type === "reasoning") {
            if (!part.text) return null
            return (
              <div
                key={i}
                className="rounded-lg bg-surface-muted px-4 py-2 text-xs italic text-text-muted"
              >
                {part.text}
              </div>
            )
          }
          if (part.type === "text" && part.text) {
            return (
              <div
                key={i}
                className="prose max-w-none leading-relaxed text-primary prose-headings:mt-4 prose-headings:mb-2 prose-headings:font-semibold prose-headings:text-primary prose-p:my-1.5 prose-li:my-0.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-a:text-primary prose-a:underline"
              >
                <ReactMarkdown>{part.text}</ReactMarkdown>
              </div>
            )
          }
          // Render running tools inline, plus the last completed tool
          // (so it shows a checkmark until the next tool starts or text appears)
          const tp = part as unknown as ToolPart
          if (isToolPart(tp) && isVisibleToolState(tp.state)) {
            const isRunning = tp.state === "input-streaming" || tp.state === "input-available"
            const isDone = tp.state === "output-available" || tp.state === "output-error"
            // For completed tools, only show if no later running tool or text exists
            if (isDone) {
              const laterParts = parts.slice(i + 1)
              const hasLaterActivity = laterParts.some((lp) => {
                if (lp.type === "text" && (lp as { text?: string }).text) return true
                const ltp = lp as unknown as ToolPart
                return isToolPart(ltp) && (ltp.state === "input-streaming" || ltp.state === "input-available")
              })
              if (hasLaterActivity) return null
            }
            if (isRunning || isDone) {
              return (
                <InlineToolStep
                  key={tp.toolCallId ?? i}
                  toolName={getToolName(tp)}
                  state={tp.state!}
                  input={tp.input ?? tp.args ?? {}}
                  output={tp.output}
                />
              )
            }
          }
          return null
        })}
      </div>
    </div>
  )
}
