"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useState, useEffect, useRef, useMemo, type FormEvent } from "react"
import Link from "next/link"
import { PartySelector } from "./party-selector"
import { Message, extractToolSteps } from "./message"
import { ProgressSidebar } from "./progress-sidebar"

type Party = { id: string; name: string; shortName: string }

const FREE_MODELS = [
  { key: "claude-haiku-4-5", label: "Haiku 4.5" },
  { key: "claude-sonnet-4-5", label: "Sonnet 4.5" },
  { key: "claude-opus-4-6", label: "Opus 4.6" },
]

export function Chat() {
  const [party, setParty] = useState<Party | null>(null)
  const [model, setModel] = useState("claude-haiku-4-5")
  const [input, setInput] = useState("")
  const [usage, setUsage] = useState<{ used: number; limit: number; unlimited?: boolean } | null>(null)
  const [activeKey, setActiveKey] = useState<{ provider: string; model: string } | null>(null)
  const [rateLimitError, setRateLimitError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/settings/usage").then(r => r.json()).then(setUsage).catch(() => {})
    fetch("/api/settings/keys").then(r => r.ok ? r.json() : []).then((keys: Array<{ isActive: boolean; provider: string; model: string }>) => {
      const active = keys.find((k: { isActive: boolean }) => k.isActive)
      if (active) setActiveKey({ provider: active.provider, model: active.model })
    }).catch(() => {})
    Promise.all([
      fetch("/api/settings/preferences").then(r => r.ok ? r.json() : null),
      fetch("/api/parties").then(r => r.json()),
    ]).then(([prefs, allParties]) => {
      if (prefs?.defaultPartyId && allParties) {
        const defaultParty = allParties.find((p: Party) => p.id === prefs.defaultPartyId)
        if (defaultParty) setParty(defaultParty)
      }
    }).catch(() => {})
  }, [])

  const partyRef = useRef(party)
  const modelRef = useRef(model)
  const activeKeyRef = useRef(activeKey)
  partyRef.current = party
  modelRef.current = model
  activeKeyRef.current = activeKey

  const [transport] = useState(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({
          partyId: partyRef.current?.id ?? null,
          partyName: partyRef.current?.shortName ?? null,
          model: activeKeyRef.current ? undefined : modelRef.current,
        }),
      }),
  )

  const { messages, sendMessage, status, error: chatError } = useChat({
    transport,
    onError(error) {
      console.error("[chat] error:", error)
      if (error.message?.includes("rate_limit") || error.message?.includes("429")) {
        setRateLimitError(
          "Dagelijkse limiet bereikt. Voeg je eigen API key toe in Instellingen voor onbeperkt gebruik."
        )
      }
    },
  })

  const isLoading = status === "submitted" || status === "streaming"

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, status])

  const firstUserMessage = messages.find((m) => m.role === "user")
  const briefingTopic = firstUserMessage
    ? firstUserMessage.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join(" ")
    : ""

  const toolSteps = useMemo(() => extractToolSteps(messages), [messages])

  // Show thinking indicator when loading and no assistant text visible yet
  const lastMsg = messages[messages.length - 1]
  const hasAssistantText =
    lastMsg?.role === "assistant" &&
    lastMsg.parts.some((p) => p.type === "text" && p.text)
  const showThinking = isLoading && !hasAssistantText

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return
    setInput("")
    sendMessage({ text })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col p-2 sm:p-4">
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 gap-4">
        {/* Main chat card */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-primary-30 bg-white shadow-sm">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 border-b border-primary-15 px-3 py-2 sm:px-5 sm:py-2.5">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <PartySelector value={party} onChange={setParty} />
              {activeKey ? (
                <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200">
                  {activeKey.model} — eigen key
                </span>
              ) : (
                <>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="shrink-0 rounded-lg border border-primary-30 bg-white px-2 py-1.5 text-sm text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:px-3 sm:py-2"
                  >
                    {FREE_MODELS.map((m) => (
                      <option key={m.key} value={m.key}>{m.label}</option>
                    ))}
                  </select>
                  {usage && !usage.unlimited && (
                    <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                      {usage.used}/{usage.limit}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-6 py-4">
              {messages.length === 0 && (
                <div className="flex min-h-[50vh] items-center justify-center">
                  <div className="max-w-md rounded-2xl bg-primary-15 p-8 text-center">
                    <h2 className="text-2xl font-semibold text-primary">
                      Bereid je voor op een debat
                    </h2>
                    <p className="mt-3 text-primary-75 leading-relaxed">
                      Stel een vraag over een onderwerp en ik zoek de relevante
                      Kamerstukken, debatten en toezeggingen voor je op.
                    </p>
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <Message key={m.id} message={m} topic={briefingTopic} />
              ))}
              {showThinking && (
                <div className="flex justify-start mb-4">
                  <div className="rounded-2xl bg-primary-15 px-4 py-3 text-sm text-primary-75">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="flex gap-0.5">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
                      </span>
                      {toolSteps.some((s) => s.status === "running")
                        ? "Bronnen doorzoeken..."
                        : "Aan het nadenken..."}
                    </span>
                  </div>
                </div>
              )}
              {status === "error" && (
                <div className="flex justify-start mb-4">
                  <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    Er ging iets mis. Probeer het opnieuw.
                    {chatError && (
                      <span className="block mt-1 text-xs text-red-500">
                        {chatError.message || String(chatError)}
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Rate limit warning */}
          {rateLimitError && (
            <div className="mx-auto w-full max-w-3xl px-6 pb-2">
              <div className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                <span>{rateLimitError}</span>
                <Link href="/settings" className="ml-3 font-medium text-amber-900 underline">
                  Instellingen
                </Link>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-primary-15 px-3 py-2 sm:px-5 sm:py-3">
            <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
              <div className="flex gap-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Bijv. 'Bereid me voor op het stikstofdebat' of 'Welke toezeggingen staan open over woningbouw?'"
                  className="flex-1 rounded-xl border border-primary-30 bg-primary-15/50 px-4 py-3 text-primary placeholder:text-primary-60 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="rounded-xl bg-primary px-6 py-3 font-medium text-white shadow-sm hover:bg-primary-dark disabled:opacity-40 disabled:shadow-none"
                >
                  {isLoading ? "Bezig..." : "Verstuur"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Progress sidebar - desktop only */}
        {toolSteps.length > 0 && (
          <div className="hidden w-72 shrink-0 lg:block">
            <ProgressSidebar steps={toolSteps} />
          </div>
        )}
      </div>

    </div>
  )
}
