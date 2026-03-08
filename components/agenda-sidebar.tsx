"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Calendar, Search, X, Play } from "lucide-react"
import { useDataContext } from "./data-context"

type Kamerlid = { id: string; naam: string; fractie?: string }

type Activiteit = {
  Id: string
  Soort: string
  Onderwerp: string
  Datum: string
  Aanvangstijd: string
  Voortouwafkorting: string
}

const TYPE_COLORS: Record<string, string> = {
  "Plenair debat": "bg-red-100 text-red-800",
  "Tweeminutendebat": "bg-red-50 text-red-700",
  "Stemmingen": "bg-purple-100 text-purple-800",
  "Commissiedebat": "bg-blue-100 text-blue-800",
  "Wetgevingsoverleg": "bg-blue-50 text-blue-700",
  "Notaoverleg": "bg-cyan-100 text-cyan-800",
  "Begrotingsoverleg": "bg-indigo-100 text-indigo-800",
  "Rondetafelgesprek": "bg-green-100 text-green-800",
  "Procedurevergadering": "bg-gray-100 text-gray-700",
  "Regeling van werkzaamheden": "bg-amber-100 text-amber-800",
  "Technische briefing": "bg-teal-100 text-teal-800",
  "Gesprek": "bg-orange-100 text-orange-800",
  "Werkbezoek": "bg-lime-100 text-lime-800",
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}

function KamerlidPicker({ onSelect }: { onSelect: (k: Kamerlid) => void }) {
  const [allKamerleden, setAllKamerleden] = useState<Kamerlid[]>([])
  const [search, setSearch] = useState("")
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    fetch("/api/kamerleden")
      .then((r) => r.ok ? r.json() : [])
      .then(setAllKamerleden)
      .catch(() => {})
  }, [])

  const filtered = search.trim().length >= 2
    ? allKamerleden.filter((k) => k.naam.toLowerCase().includes(search.toLowerCase())).slice(0, 10)
    : []

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-muted px-2.5 py-1.5 transition-[border-color] focus-within:border-primary">
        <Search className="h-3 w-3 shrink-0 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder="Zoek Kamerlid..."
          className="w-full border-none bg-transparent text-xs text-primary placeholder:text-text-muted focus:outline-none"
        />
      </div>
      {focused && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-36 w-full overflow-y-auto rounded-lg border border-border-light bg-white shadow-lg">
          {filtered.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => { onSelect(k); setSearch("") }}
              className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-xs text-primary transition-colors hover:bg-surface-muted"
            >
              <span className="font-medium">{k.naam}</span>
              {k.fractie && <span className="text-text-muted">{k.fractie}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function AgendaSidebar({ onPrepare }: { onPrepare?: (text: string) => void }) {
  const { preferences, refreshPreferences } = useDataContext()
  const kamerleden = preferences?.kamerleden ?? []

  const [events, setEvents] = useState<Activiteit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const now = new Date()
    const from = now.toISOString().split("T")[0]
    const to = new Date(now.getTime() + 7 * 86400000).toISOString().split("T")[0]
    fetch(`/api/agenda?from=${from}&to=${to}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        setEvents(Array.isArray(data) ? data.slice(0, 3) : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function addKamerlid(k: Kamerlid) {
    const updated = [...kamerleden, k]
    await fetch("/api/settings/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kamerleden: updated }),
    })
    await refreshPreferences()
  }

  async function removeKamerlid(id: string) {
    const updated = kamerleden.filter((k) => k.id !== id)
    await fetch("/api/settings/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kamerleden: updated }),
    })
    await refreshPreferences()
  }

  return (
    <div className="sticky top-4">
      <div className="rounded-xl border border-border-light bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <h3 className="mb-3 flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.075em] text-text-muted">
          <Calendar className="h-[13px] w-[13px]" />
          Komende vergaderingen
        </h3>

        {/* Kamerleden chips + picker */}
        {kamerleden.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {kamerleden.map((k) => (
              <span
                key={k.id}
                className="inline-flex items-center gap-1 rounded-full border border-border-light bg-surface-muted py-0.5 pl-2 pr-1 text-[11px] text-primary"
              >
                {k.naam}
                {k.fractie && <span className="text-text-muted">({k.fractie})</span>}
                <button
                  type="button"
                  onClick={() => removeKamerlid(k.id)}
                  className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-text-muted hover:bg-border-light hover:text-primary"
                >
                  <X className="h-2 w-2" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="mb-3">
          <KamerlidPicker onSelect={addKamerlid} />
        </div>

        {loading && (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-border-light/60" />
            ))}
          </div>
        )}

        {!loading && events.length === 0 && (
          <p className="text-xs text-text-muted">Geen vergaderingen deze week.</p>
        )}

        {!loading && events.length > 0 && (
          <div className="space-y-1.5">
            {events.map((item) => (
              <div
                key={item.Id}
                className="group rounded-lg border border-border-light p-2.5 transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-sm"
              >
                <div className="mb-1 flex items-center gap-1.5">
                  <span
                    className={`inline-block rounded-full px-1.5 py-px text-[9px] font-medium leading-tight ${
                      TYPE_COLORS[item.Soort] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {item.Soort}
                  </span>
                  {item.Voortouwafkorting && (
                    <span className="rounded-full bg-gray-100 px-1.5 py-px text-[9px] font-medium leading-tight text-gray-500">
                      {item.Voortouwafkorting}
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium leading-snug text-primary line-clamp-2">
                  {item.Onderwerp}
                </p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[10px] text-text-muted">
                    {formatDateShort(item.Datum)} {formatTime(item.Aanvangstijd)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onPrepare?.(`Bereid me voor op het ${item.Soort.toLowerCase()}: ${item.Onderwerp}`)}
                    className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-[10px] font-medium text-white transition-colors hover:bg-primary-dark"
                  >
                    <Play className="h-2.5 w-2.5" />
                    Bereid voor
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Link
          href="/agenda"
          className="mt-3 block text-center text-xs font-medium text-primary hover:underline"
        >
          Volledige agenda bekijken
        </Link>
      </div>
    </div>
  )
}
