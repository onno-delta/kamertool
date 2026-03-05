"use client"

import { useState } from "react"
import type { UIMessage } from "ai"
import ReactMarkdown from "react-markdown"

const TOOL_LABELS: Record<string, string> = {
  searchKamerstukken: "Kamerstukken",
  searchHandelingen: "Handelingen",
  searchToezeggingen: "Toezeggingen",
  searchStemmingen: "Stemmingen",
  searchNews: "Nieuws",
  fetchWebPage: "Webpagina",
  searchAgenda: "Kameragenda",
  searchDocumenten: "Documenten",
  searchPartyDocs: "Partijdocumenten",
}

function getToolName(part: any): string {
  if (part.toolName) return part.toolName
  if (typeof part.type === "string" && part.type.startsWith("tool-")) {
    return part.type.slice(5)
  }
  return "unknown"
}

function getToolDisplayLabel(part: any): string {
  const toolName = getToolName(part)
  const label = TOOL_LABELS[toolName] ?? toolName

  if (toolName === "fetchWebPage") {
    const url = part.input?.url ?? part.args?.url ?? ""
    if (url) {
      try {
        return new URL(url).hostname.replace(/^www\./, "")
      } catch {
        return "webpagina"
      }
    }
    return "webpagina"
  }

  const query = part.input?.query ?? part.args?.query ?? ""
  return query ? `${label} "${query}"` : label
}

function ToolsStatus({ toolParts }: { toolParts: any[] }) {
  const [expanded, setExpanded] = useState(false)

  const activeParts = toolParts.filter(
    (p: any) =>
      p.state === "input-streaming" ||
      p.state === "input-available" ||
      p.state === "output-available" ||
      p.state === "output-error"
  )

  if (activeParts.length === 0) return null

  const isAnyLoading = activeParts.some(
    (p: any) => p.state === "input-streaming" || p.state === "input-available"
  )
  const completedCount = activeParts.filter(
    (p: any) => p.state === "output-available" || p.state === "output-error"
  ).length

  // Show the latest active/loading tool, or last completed
  const currentTool = activeParts.findLast(
    (p: any) => p.state === "input-streaming" || p.state === "input-available"
  ) ?? activeParts[activeParts.length - 1]

  const currentLabel = getToolDisplayLabel(currentTool)

  // Collect completed tools with results for expanded view
  const completedParts = activeParts.filter(
    (p: any) => p.state === "output-available" && p.output?.results?.length > 0
  )

  return (
    <div className="rounded-2xl bg-gray-100 px-4 py-2.5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2.5 text-left text-xs"
      >
        {isAnyLoading ? (
          <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
        ) : (
          <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-green-500">
            <span className="text-[8px] text-white">&#10003;</span>
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-gray-500">
          {isAnyLoading ? (
            <>
              <span className="text-gray-700">{currentLabel}</span>
              {completedCount > 0 && (
                <span className="ml-1.5 text-gray-400">
                  ({completedCount} bronnen doorzocht)
                </span>
              )}
            </>
          ) : (
            <span className="text-gray-500">
              {completedCount} {completedCount === 1 ? "bron" : "bronnen"} doorzocht
            </span>
          )}
        </span>
        <span className="shrink-0 text-[10px] text-gray-300">
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div className="mt-2 space-y-1 border-t border-gray-200 pt-2">
          {activeParts.map((part: any, i: number) => {
            const toolName = getToolName(part)
            const label = getToolDisplayLabel(part)
            const isDone = part.state === "output-available"
            const isError = part.state === "output-error"
            const resultCount = isDone ? part.output?.count : null

            return (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  isDone ? "bg-green-400" : isError ? "bg-red-400" : "bg-blue-400 animate-pulse"
                }`} />
                <span className="min-w-0 flex-1 truncate text-gray-600">{label}</span>
                {isDone && (
                  <span className="shrink-0 text-gray-400">
                    {toolName === "fetchWebPage" ? "opgehaald" : `${resultCount ?? 0} res.`}
                  </span>
                )}
                {isError && (
                  <span className="shrink-0 text-red-400">mislukt</span>
                )}
              </div>
            )
          })}

          {completedParts.length > 0 && completedParts.map((part: any, i: number) => {
            const results = part.output?.results
            if (!results?.length) return null
            return (
              <div key={`res-${i}`} className="mt-1 rounded-lg bg-white/60 px-2.5 py-1.5">
                <ul className="space-y-0.5">
                  {results.slice(0, 5).map((r: any, j: number) => (
                    <li key={j} className="truncate text-[10px] text-gray-500">
                      {r.titel || r.title || r.onderwerp || r.omschrijving || "—"}
                      {(r.datum || r.date) && (
                        <span className="ml-1 text-gray-300">{r.datum || r.date}</span>
                      )}
                    </li>
                  ))}
                  {results.length > 5 && (
                    <li className="text-[10px] text-gray-300">+{results.length - 5} meer</li>
                  )}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function Message({ message }: { message: UIMessage }) {
  const { role, parts } = message
  const isUser = role === "user"

  const toolParts = parts.filter((p: any) => p.type === "dynamic-tool" || (typeof p.type === "string" && p.type.startsWith("tool-")))
  const textParts = parts.filter((p) => p.type === "text" || p.type === "reasoning")
  const hasTools = toolParts.some(
    (p: any) =>
      p.state === "input-streaming" ||
      p.state === "input-available" ||
      p.state === "output-available" ||
      p.state === "output-error"
  )

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[80%] ${
          isUser
            ? "rounded-2xl bg-blue-600 px-4 py-3 text-white"
            : "space-y-2"
        }`}
      >
        {isUser ? (
          parts.map((part, i) =>
            part.type === "text" ? (
              <div key={i} className="whitespace-pre-wrap leading-relaxed">
                {part.text}
              </div>
            ) : null
          )
        ) : (
          <>
            {hasTools && <ToolsStatus toolParts={toolParts} />}
            {textParts.map((part, i) => {
              if (part.type === "reasoning") {
                if (!part.text) return null
                return (
                  <div key={i} className="rounded-2xl bg-gray-100 px-4 py-2 text-xs italic text-gray-400">
                    {part.text}
                  </div>
                )
              }
              if (part.type === "text") {
                const isStreaming = (part as any).state === "streaming"
                if (!part.text && !isStreaming) return null
                return (
                  <div key={i} className="rounded-2xl bg-gray-100 px-4 py-3 text-gray-900 leading-relaxed prose prose-sm max-w-none prose-headings:mt-4 prose-headings:mb-2 prose-p:my-1.5 prose-li:my-0.5 prose-ul:my-1.5 prose-ol:my-1.5">
                    <ReactMarkdown>{part.text || "\u00A0"}</ReactMarkdown>
                  </div>
                )
              }
              return null
            })}
          </>
        )}
      </div>
    </div>
  )
}
