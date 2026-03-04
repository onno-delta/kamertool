"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useState, useEffect, useMemo, type FormEvent } from "react"
import Link from "next/link"
import { PartySelector } from "./party-selector"
import { Message } from "./message"
import { BriefingDialog } from "./briefing-dialog"

type Party = { id: string; name: string; shortName: string }

export function Chat() {
  const [party, setParty] = useState<Party | null>(null)
  const [input, setInput] = useState("")
  const [showBriefing, setShowBriefing] = useState(false)
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null)
  const [activeKey, setActiveKey] = useState<{ provider: string; model: string } | null>(null)
  const [rateLimitError, setRateLimitError] = useState<string | null>(null)

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
        },
      }),
    [party],
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
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-gray-900">Kamertool</h1>
          {activeKey ? (
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
              {activeKey.model} (je eigen key)
            </span>
          ) : usage ? (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              gratis — {usage.used}/{usage.limit} berichten
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <PartySelector value={party} onChange={setParty} />
          <button
            onClick={() => setShowBriefing(true)}
            disabled={!briefingTopic}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Genereer briefing
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-700">
                Bereid je voor op een debat
              </h2>
              <p className="mt-2 text-gray-500">
                Stel een vraag over een onderwerp en ik zoek de relevante
                Kamerstukken, debatten en toezeggingen voor je op.
              </p>
            </div>
          </div>
        )}
        {messages.map((m) => (
          <Message key={m.id} message={m} />
        ))}
      </div>

      {/* Rate limit warning */}
      {rateLimitError && (
        <div className="mx-6 mb-2 flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <span>{rateLimitError}</span>
          <Link href="/settings" className="ml-3 font-medium text-amber-900 underline">
            Instellingen →
          </Link>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t px-6 py-4">
        <div className="flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Bijv. 'Bereid me voor op het stikstofdebat' of 'Welke toezeggingen staan nog open over woningbouw?'"
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Bezig..." : "Verstuur"}
          </button>
        </div>
      </form>

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
