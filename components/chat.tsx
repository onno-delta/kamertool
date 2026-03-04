"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useState, useMemo, type FormEvent } from "react"
import { PartySelector } from "./party-selector"
import { Message } from "./message"

type Party = { id: string; name: string; shortName: string }

export function Chat() {
  const [party, setParty] = useState<Party | null>(null)
  const [input, setInput] = useState("")

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

  const { messages, sendMessage, status } = useChat({ transport })

  const isLoading = status === "submitted" || status === "streaming"

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
        <h1 className="text-xl font-semibold text-gray-900">Kamertool</h1>
        <PartySelector value={party} onChange={setParty} />
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
    </div>
  )
}
