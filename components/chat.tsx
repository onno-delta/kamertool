"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useState, useEffect, useRef, useMemo, type FormEvent } from "react"
import Link from "next/link"
import {
  Send,
  ChevronDown,
  Layers,
  MessageSquare,
  Search,
  FileText,
  PenLine,
  Cpu,
  Trash2,
} from "lucide-react"
import { PartySelector } from "./party-selector"
import { KamerlidSelector } from "./kamerlid-selector"
import { Message, extractToolSteps } from "./message"
import { ProgressSidebar } from "./progress-sidebar"
import { AgendaSidebar } from "./agenda-sidebar"
import { useDataContext } from "./data-context"

type Party = { id: string; name: string; shortName: string }
type Kamerlid = { id: string; naam: string; fractie?: string }

const FREE_MODELS = [
  { key: "claude-sonnet-4", label: "Claude Sonnet 4" },
  { key: "gpt-4o", label: "GPT-4o" },
  { key: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
]

const SUGGESTIONS = [
  {
    text: "Bereid me voor op het stikstofdebat",
    sub: "Briefing met recente Kamerstukken",
    icon: MessageSquare,
  },
  {
    text: "Welke toezeggingen staan open over woningbouw?",
    sub: "Zoek in toezeggingen en moties",
    icon: Search,
  },
  {
    text: "Wat is de status van de Spreidingswet?",
    sub: "Wetgevingstraject en stemming",
    icon: FileText,
  },
  {
    text: "Vergelijk standpunten over AI-regulering",
    sub: "Partijprogramma's en debatten",
    icon: PenLine,
  },
]

function ModelSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = FREE_MODELS.find((m) => m.key === value)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [])

  return (
    <div ref={ref} className="relative inline-flex shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-[0.8125rem] font-medium text-primary hover:bg-surface-muted focus:border-primary focus:outline-none"
      >
        <Cpu className="h-3.5 w-3.5 text-text-muted" />
        {selected?.label ?? value}
        <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
      </button>
      {open && (
        <div role="listbox" className="absolute left-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-lg border border-border bg-white shadow-lg">
          {FREE_MODELS.map((m) => (
            <button
              key={m.key}
              role="option"
              aria-selected={value === m.key}
              onClick={() => { onChange(m.key); setOpen(false) }}
              className={`flex w-full items-center px-3 py-2 text-left text-sm hover:bg-surface-muted ${value === m.key ? "bg-surface-muted font-medium text-primary" : "text-primary"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function Chat() {
  const { parties, preferences } = useDataContext()
  const [party, setParty] = useState<Party | null>(null)
  const [kamerlid, setKamerlid] = useState<Kamerlid | null>(null)
  const [model, setModel] = useState("claude-sonnet-4")
  const [input, setInput] = useState("")
  const [usage, setUsage] = useState<{ used: number; limit: number; unlimited?: boolean } | null>(null)
  const [rateLimitError, setRateLimitError] = useState<string | null>(null)
  const [userScrolled, setUserScrolled] = useState(false)
  const defaultPartyApplied = useRef(false)
  const defaultKamerlidApplied = useRef(false)

  useEffect(() => {
    fetch("/api/settings/usage").then(r => r.json()).then(setUsage).catch(() => {})
  }, [])

  // Apply default party from cached preferences + parties
  useEffect(() => {
    if (defaultPartyApplied.current || !preferences?.defaultPartyId || parties.length === 0) return
    const match = parties.find((p) => p.id === preferences.defaultPartyId)
    if (match) {
      setParty(match)
      defaultPartyApplied.current = true
    }
  }, [preferences, parties])

  // Apply default kamerlid from preferences (first in list)
  useEffect(() => {
    if (defaultKamerlidApplied.current || !preferences?.kamerleden?.length) return
    const k = preferences.kamerleden[0]
    setKamerlid(k)
    // Also auto-set party to match kamerlid's fractie
    if (k.fractie && parties.length > 0) {
      const match = parties.find((p) => p.shortName === k.fractie)
      if (match) setParty(match)
    }
    defaultKamerlidApplied.current = true
  }, [preferences, parties])

  const partyRef = useRef(party)
  const modelRef = useRef(model)
  const kamerlidRef = useRef(kamerlid)
  useEffect(() => { partyRef.current = party }, [party])
  useEffect(() => { modelRef.current = model }, [model])
  useEffect(() => { kamerlidRef.current = kamerlid }, [kamerlid])

  const [transport] = useState(
    () => // eslint-disable-line react-hooks/refs -- refs read in body() callback at request time, not render
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({
          partyId: partyRef.current?.id ?? null,
          partyName: partyRef.current?.shortName ?? null,
          kamerlidNaam: kamerlidRef.current?.naam ?? null,
          model: modelRef.current,
        }),
      }),
  )

  const { messages, setMessages, sendMessage, status, error: chatError } = useChat({
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

  // Reset scroll tracking when a new streaming session starts
  useEffect(() => {
    if (isLoading) setUserScrolled(false)
  }, [isLoading])

  const firstUserMessage = messages.find((m) => m.role === "user")
  const briefingTopic = firstUserMessage
    ? firstUserMessage.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join(" ")
    : ""

  const toolSteps = useMemo(() => extractToolSteps(messages), [messages])

  // Show thinking indicator only before first tool call or text appears
  const lastMsg = messages[messages.length - 1]
  const hasAssistantText =
    lastMsg?.role === "assistant" &&
    lastMsg.parts.some((p) => p.type === "text" && p.text)
  const hasActiveTools = toolSteps.length > 0
  const showThinking = isLoading && !hasAssistantText && !hasActiveTools

  function handleKamerlidChange(k: Kamerlid | null) {
    setKamerlid(k)
    if (k?.fractie && parties.length > 0) {
      const match = parties.find((p) => p.shortName === k.fractie)
      if (match) setParty(match)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return
    setInput("")
    sendMessage({ text })
  }

  function handleSuggestion(text: string) {
    if (isLoading) return
    sendMessage({ text })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={`grid min-h-0 w-full gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] ${messages.length > 0 ? "flex-1" : ""}`}>
        {/* Main chat card */}
        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-border-light bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
          {/* Toolbar */}
          <header className="flex flex-wrap items-center gap-2 border-b border-border-light bg-surface-muted px-4 py-2.5 sm:px-5">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <PartySelector value={party} onChange={setParty} />
              <div className="h-5 w-px bg-border-light" />
              <KamerlidSelector value={kamerlid} onChange={handleKamerlidChange} />
              <div className="h-5 w-px bg-border-light" />
              <ModelSelector value={model} onChange={setModel} />
              {usage && !usage.unlimited && (
                <span className="shrink-0 rounded-full border border-border-light bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-text-muted">
                  {usage.used}/{usage.limit}
                </span>
              )}
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => setMessages([])}
                className="flex shrink-0 items-center gap-1.5 rounded-md border border-border-light px-2.5 py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-border hover:text-primary"
              >
                <Trash2 className="h-3 w-3" />
                Wissen
              </button>
            )}
          </header>

          {/* Messages */}
          <div
            className={`${messages.length > 0 ? "flex-1" : ""} overflow-y-auto${isLoading && !userScrolled ? " hide-scrollbar" : ""}`}
            onScroll={() => { if (isLoading && !userScrolled) setUserScrolled(true) }}
          >
            <div className="mx-auto max-w-[42rem] px-6 py-5">
              {messages.length === 0 && (
                <div className="py-6">
                  {/* Welcome header */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-primary">
                      <Layers className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-[1.5rem] font-bold leading-tight tracking-tight text-primary">
                        Debatvoorbereiding
                      </h1>
                      <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                        Stel een vraag en ik doorzoek Kamerstukken, debatten, toezeggingen en
                        nieuws. Selecteer je partij voor fractie-specifiek advies.
                      </p>
                    </div>
                  </div>

                  {/* Suggestions grid */}
                  <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s.text}
                        onClick={() => handleSuggestion(s.text)}
                        className="flex items-start gap-3 rounded-lg border border-border-light bg-white p-3.5 text-left transition-colors hover:border-primary-75 hover:bg-surface-muted"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-15">
                          <s.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[0.8125rem] font-medium leading-snug text-primary">
                            {s.text}
                          </div>
                          <div className="mt-0.5 text-xs text-text-muted">
                            {s.sub}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <Message key={m.id} message={m} topic={briefingTopic} />
              ))}
              {showThinking && (
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-15">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex items-center gap-2 rounded-xl rounded-bl bg-surface-muted px-4 py-3">
                    <span className="flex gap-[3px]">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-75 [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-75 [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-75 [animation-delay:300ms]" />
                    </span>
                    <span className="text-xs font-medium text-text-muted">
                      Aan het nadenken...
                    </span>
                  </div>
                </div>
              )}
              {status === "error" && (
                <div className="mb-4 flex justify-start">
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    Er ging iets mis. Probeer het opnieuw.
                    {chatError && (
                      <span className="mt-1 block text-xs text-red-500">
                        {chatError.message || String(chatError)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rate limit warning */}
          {rateLimitError && (
            <div className="mx-auto w-full max-w-[42rem] px-6 pb-3">
              <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <span>{rateLimitError}</span>
                <Link href="/settings" className="ml-3 font-medium underline">
                  Instellingen
                </Link>
              </div>
            </div>
          )}

          {/* Input */}
          <footer className="border-t border-border-light px-4 py-3 sm:px-5 sm:py-3.5">
            <form onSubmit={handleSubmit} className="mx-auto max-w-[42rem]">
              <div className="flex items-center gap-2 rounded-[10px] border border-border bg-surface-muted px-4 py-1 transition-[border-color,box-shadow] focus-within:border-primary focus-within:shadow-[0_0_0_2px_rgba(21,66,115,0.08)]">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Stel een vraag over een debatonderwerp..."
                  className="flex-1 border-none bg-transparent py-2 text-[0.9375rem] text-primary placeholder:text-text-muted focus:outline-none"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-primary-dark active:translate-y-px disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </footer>
        </section>

        {/* Right sidebar: progress when tools active, links otherwise */}
        <aside className="hidden min-h-0 lg:block">
          {toolSteps.length > 0 ? (
            <ProgressSidebar steps={toolSteps} isStreaming={isLoading} hasAssistantText={!!hasAssistantText} />
          ) : (
            <AgendaSidebar onPrepare={handleSuggestion} />
          )}
        </aside>
      </div>
    </div>
  )
}
