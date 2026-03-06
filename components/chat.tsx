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
} from "lucide-react"
import { PartySelector } from "./party-selector"
import { Message, extractToolSteps } from "./message"
import { ProgressSidebar } from "./progress-sidebar"

type Party = { id: string; name: string; shortName: string }

const FREE_MODELS = [
  { key: "claude-sonnet-4-5", label: "Sonnet 4.5" },
  { key: "claude-opus-4-6", label: "Opus 4.6" },
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

  function handleSuggestion(text: string) {
    if (isLoading) return
    sendMessage({ text })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={`min-h-0 w-full ${
        toolSteps.length > 0
          ? "grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]"
          : "mx-auto max-w-[56rem]"
      }`}>
        {/* Main chat card */}
        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-border-light bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
          {/* Toolbar */}
          <header className="flex flex-wrap items-center gap-2 border-b border-border-light bg-surface-muted px-4 py-2.5 sm:px-5">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <PartySelector value={party} onChange={setParty} />
              <div className="h-5 w-px bg-border-light" />
              {activeKey ? (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  {activeKey.model} — eigen key
                </span>
              ) : (
                <>
                  <ModelSelector value={model} onChange={setModel} />
                  {usage && !usage.unlimited && (
                    <span className="shrink-0 rounded-full border border-border-light bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-text-muted">
                      {usage.used}/{usage.limit}
                    </span>
                  )}
                </>
              )}
            </div>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
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
                      {toolSteps.some((s) => s.status === "running")
                        ? "Bronnen doorzoeken..."
                        : "Aan het nadenken..."}
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
              <div ref={messagesEndRef} />
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
                  className="flex-1 border-none bg-transparent py-2 text-sm text-primary placeholder:text-text-muted focus:outline-none"
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

        {/* Progress sidebar */}
        {toolSteps.length > 0 && (
          <aside className="hidden min-h-0 lg:block">
            <ProgressSidebar steps={toolSteps} />
          </aside>
        )}
      </div>
    </div>
  )
}
