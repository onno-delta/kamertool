"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useState, useEffect, useMemo, useRef, type FormEvent } from "react"
import Link from "next/link"
import { PartySelector } from "./party-selector"
import { Message } from "./message"
import { BriefingDialog } from "./briefing-dialog"

type Party = { id: string; name: string; shortName: string }

const FREE_MODELS = [
  { key: "claude-haiku-4-5", label: "Haiku 4.5" },
  { key: "claude-sonnet-4-5", label: "Sonnet 4.5" },
]

export function Chat() {
  const [party, setParty] = useState<Party | null>(null)
  const [model, setModel] = useState("claude-haiku-4-5")
  const [input, setInput] = useState("")
  const [showBriefing, setShowBriefing] = useState(false)
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null)
  const [activeKey, setActiveKey] = useState<{ provider: string; model: string } | null>(null)
  const [rateLimitError, setRateLimitError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/settings/usage").then(r => r.json()).then(setUsage).catch(() => {})
    fetch("/api/settings/keys").then(r => r.ok ? r.json() : []).then((keys: Array<{ isActive: boolean; provider: string; model: string }>) => {
      const active = keys.find((k: { isActive: boolean }) => k.isActive)
      if (active) setActiveKey({ provider: active.provider, model: active.model })
    }).catch(() => {})
  }, [])

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: {
          partyId: party?.id ?? null,
          partyName: party?.shortName ?? null,
          model: activeKey ? undefined : model,
        },
      }),
    [party, model, activeKey],
  )

  const { messages, sendMessage, status } = useChat({
    transport,
    onError(error) {
      if (error.message.includes("rate_limit") || error.message.includes("429")) {
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

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return
    setInput("")
    sendMessage({ text })
  }

  return (
    <div className="flex flex-1 flex-col p-4">
      {/* Main chat card */}
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-2.5">
          <div className="flex items-center gap-3">
            <PartySelector value={party} onChange={setParty} />
            {activeKey ? (
              <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200">
                {activeKey.model} — eigen key
              </span>
            ) : (
              <>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
                >
                  {FREE_MODELS.map((m) => (
                    <option key={m.key} value={m.key}>{m.label}</option>
                  ))}
                </select>
                {usage && (
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                    {usage.used}/{usage.limit}
                  </span>
                )}
              </>
            )}
          </div>
          <button
            onClick={() => setShowBriefing(true)}
            disabled={!briefingTopic}
            className="rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40"
          >
            Genereer briefing
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-6 py-4">
            {messages.length === 0 && (
              <div className="flex min-h-[50vh] items-center justify-center">
                <div className="max-w-md rounded-2xl bg-gray-50 p-8 text-center">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    Bereid je voor op een debat
                  </h2>
                  <p className="mt-3 text-gray-500 leading-relaxed">
                    Stel een vraag over een onderwerp en ik zoek de relevante
                    Kamerstukken, debatten en toezeggingen voor je op.
                  </p>
                </div>
              </div>
            )}
            {messages.map((m) => (
              <Message key={m.id} message={m} />
            ))}
            {status === "submitted" && (
              <div className="flex justify-start mb-4">
                <div className="rounded-2xl bg-gray-100 px-4 py-3 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="flex gap-0.5">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
                    </span>
                    Aan het nadenken...
                  </span>
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
        <div className="border-t border-gray-100 px-5 py-3">
          <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
            <div className="flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Bijv. 'Bereid me voor op het stikstofdebat' of 'Welke toezeggingen staan open over woningbouw?'"
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-40 disabled:shadow-none"
              >
                {isLoading ? "Bezig..." : "Verstuur"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Briefing dialog */}
      {showBriefing && briefingTopic && (
        <BriefingDialog
          topic={briefingTopic}
          partyId={party?.id ?? null}
          partyName={party?.shortName ?? null}
          onClose={() => setShowBriefing(false)}
        />
      )}
    </div>
  )
}
