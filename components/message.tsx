"use client"

import { useState } from "react"
import type { UIMessage } from "ai"

const TOOL_LABELS: Record<string, string> = {
  searchKamerstukken: "Kamerstukken",
  searchHandelingen: "Handelingen",
  searchToezeggingen: "Toezeggingen",
  searchStemmingen: "Stemmingen",
  searchNews: "Nieuws",
  fetchWebPage: "Webpagina ophalen",
  searchPartyDocs: "Partijdocumenten",
}

const TOOL_ICONS: Record<string, string> = {
  searchKamerstukken: "📄",
  searchHandelingen: "🗣",
  searchToezeggingen: "🤝",
  searchStemmingen: "🗳",
  searchNews: "📰",
  fetchWebPage: "🌐",
  searchPartyDocs: "📋",
}

function getToolName(part: any): string {
  if (part.toolName) return part.toolName
  if (typeof part.type === "string" && part.type.startsWith("tool-")) {
    return part.type.slice(5) // "tool-searchKamerstukken" → "searchKamerstukken"
  }
  return "unknown"
}

function ToolCard({ part }: { part: any }) {
  const [expanded, setExpanded] = useState(false)
  const toolName = getToolName(part)
  const label = TOOL_LABELS[toolName] ?? toolName
  const icon = TOOL_ICONS[toolName] ?? "🔧"

  const isStreaming =
    part.state === "input-streaming" || part.state === "input-available"
  const isDone = part.state === "output-available"
  const isError = part.state === "output-error"

  if (!isStreaming && !isDone && !isError) return null

  const query = part.input?.query ?? part.args?.query ?? ""
  const resultCount = isDone ? part.output?.count : null

  return (
    <div className="my-1.5">
      <button
        onClick={() => isDone && setExpanded(!expanded)}
        className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs transition-colors ${
          isDone
            ? "bg-white/80 hover:bg-white cursor-pointer"
            : "bg-white/60"
        }`}
      >
        <span className="text-sm">{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700">{label}</span>
            {query && (
              <span className="truncate text-gray-400">
                &ldquo;{query}&rdquo;
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {isStreaming && (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
          )}
          {isDone && (
            <>
              <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                {resultCount ?? 0} resultaten
              </span>
              <span className="text-gray-300">{expanded ? "▲" : "▼"}</span>
            </>
          )}
          {isError && (
            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
              mislukt
            </span>
          )}
        </div>
      </button>

      {expanded && isDone && part.output?.results && (
        <div className="mt-1 max-h-48 overflow-y-auto rounded-xl bg-white/80 px-3 py-2">
          {part.output.results.length === 0 ? (
            <p className="text-xs text-gray-400">Geen resultaten gevonden.</p>
          ) : (
            <ul className="space-y-1.5">
              {part.output.results.slice(0, 8).map((r: any, i: number) => (
                <li key={i} className="text-xs text-gray-600">
                  <span className="font-medium text-gray-800">
                    {r.titel || r.title || r.onderwerp || r.omschrijving || "—"}
                  </span>
                  {(r.datum || r.date) && (
                    <span className="ml-1.5 text-gray-400">
                      {r.datum || r.date}
                    </span>
                  )}
                  {r.source && (
                    <span className="ml-1.5 text-gray-400">{r.source}</span>
                  )}
                </li>
              ))}
              {part.output.results.length > 8 && (
                <li className="text-xs text-gray-400">
                  +{part.output.results.length - 8} meer...
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export function Message({ message }: { message: UIMessage }) {
  const { role, parts } = message
  const isUser = role === "user"

  // Collect tool parts to show as a grouped task list
  // AI SDK v6: static tools have type "tool-{name}", dynamic tools have "dynamic-tool"
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
          // User message — simple bubble
          parts.map((part, i) =>
            part.type === "text" ? (
              <div key={i} className="whitespace-pre-wrap leading-relaxed">
                {part.text}
              </div>
            ) : null
          )
        ) : (
          // Assistant message — tools as task cards, text below
          <>
            {hasTools && (
              <div className="rounded-2xl bg-gray-100 px-3 py-2">
                <div className="mb-1 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                  Bronnen doorzoeken
                </div>
                {toolParts.map((part, i) => (
                  <ToolCard key={i} part={part} />
                ))}
              </div>
            )}
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
                // Don't render empty text parts unless they're currently streaming
                if (!part.text && !isStreaming) return null
                return (
                  <div key={i} className="rounded-2xl bg-gray-100 px-4 py-3 text-gray-900 whitespace-pre-wrap leading-relaxed">
                    {part.text || "\u00A0"}
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
