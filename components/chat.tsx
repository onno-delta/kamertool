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
  { key: "claude-sonnet-4-5", label: "Sonnet 4.5" },
  { key: "claude-opus-4-6", label: "Opus 4.6" },
]

export function Chat() {
  const [party, setParty] = useState<Party | null>(null)
  const [model, setModel] = useState("claude-sonnet-4-5")
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
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid min-h-0 w-full gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Main chat card */}
        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-primary-30 bg-white/95 shadow-sm">
          {/* Toolbar */}
          <header className="flex flex-wrap items-center gap-2 border-b border-primary-15 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
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
                    className="shrink-0 rounded-md border border-primary-30 bg-white px-2.5 py-1.5 text-sm text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:px-3"
                  >
                    {FREE_MODELS.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  {usage && !usage.unlimited && (
                    <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                      {usage.used}/{usage.limit}
                    </span>
                  )}
                </>
              )}
            </div>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-6 py-5">
              {messages.length === 0 && (
                <div className="rounded-xl bg-primary-15 px-6 py-8 text-center sm:px-10">
                  <h1 className="text-2xl font-semibold text-primary">
                    Bereid je voor op een debat
                  </h1>
                  <p className="mt-3 text-sm leading-relaxed text-primary-75">
                    Stel een vraag over een onderwerp en ik zoek de relevante Kamerstukken,
                    debatten en toezeggingen voor je op. Gebruik de partijselector bovenaan
                    om de antwoorden te richten op jouw fractie.
                  </p>
                </div>
              )}
              {messages.map((m) => (
                <Message key={m.id} message={m} topic={briefingTopic} />
              ))}
              {showThinking && (
                <div className="mb-4 flex justify-start">
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
                <div className="mb-4 flex justify-start">
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    Er ging iets mis. Probeer het opnieuw.
                    {chatError && (
                      <span className="mt-1 block text-xs text-red-500">
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
            <div className="mx-auto w-full max-w-3xl px-6 pb-3">
              <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <span>{rateLimitError}</span>
                <Link href="/settings" className="ml-3 font-medium underline">
                  Instellingen
                </Link>
              </div>
            </div>
          )}

          {/* Input */}
          <footer className="border-t border-primary-15 px-4 py-3 sm:px-6 sm:py-4">
            <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Bijv. 'Bereid me voor op het stikstofdebat' of 'Welke toezeggingen staan open over woningbouw?'"
                  className="flex-1 rounded-md border border-primary-30 bg-primary-15/40 px-4 py-3 text-sm text-primary placeholder:text-primary-60 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-primary-dark disabled:opacity-40 disabled:shadow-none"
                >
                  {isLoading ? "Bezig..." : "Verstuur"}
                </button>
              </div>
            </form>
          </footer>
        </section>

        {/* Progress sidebar */}
        <aside className="hidden min-h-0 lg:block">
          {toolSteps.length > 0 && <ProgressSidebar steps={toolSteps} />}
        </aside>
      </div>
    </div>
  )
}
