"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Calendar, Search, ArrowRight, CalendarX2, X } from "lucide-react"
import { MultiSelect } from "@/components/multi-select"
import { useDataContext } from "@/components/data-context"

type Kamerlid = { id: string; naam: string; fractie?: string }

type Activiteit = {
  Id: string
  Soort: string
  Nummer: string
  Onderwerp: string
  Datum: string
  Aanvangstijd: string
  Eindtijd: string
  Status: string
  Voortouwnaam: string
  Voortouwafkorting: string
}

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0]
}

const today = new Date()
const defaultFrom = toDateStr(today)
const defaultTo = toDateStr(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000))

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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

function groupByDate(items: Activiteit[]): Record<string, Activiteit[]> {
  const groups: Record<string, Activiteit[]> = {}
  for (const item of items) {
    const date = item.Datum.split("T")[0]
    if (!groups[date]) groups[date] = []
    groups[date].push(item)
  }
  return groups
}

export default function AgendaPage() {
  const { sessionKamerleden, addSessionKamerlid, removeSessionKamerlid } = useDataContext()

  const [allItems, setAllItems] = useState<Activiteit[]>([])
  const [loading, setLoading] = useState(true)
  const [fromDate, setFromDate] = useState(defaultFrom)
  const [toDate, setToDate] = useState(defaultTo)
  const [maxDate, setMaxDate] = useState<string | null>(null)
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set())
  const [selectedCommissies, setSelectedCommissies] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")
  const [kamerleidSearch, setKamerleidSearch] = useState("")
  const [kamerleidFocused, setKamerleidFocused] = useState(false)
  const [allKamerleden, setAllKamerleden] = useState<Kamerlid[]>([])

  useEffect(() => {
    fetch("/api/kamerleden")
      .then((r) => r.ok ? r.json() : [])
      .then(setAllKamerleden)
      .catch(() => {})
  }, [])

  const kamerleidResults = kamerleidSearch.trim().length >= 2
    ? allKamerleden
        .filter((k) => !sessionKamerleden.some((s) => s.id === k.id))
        .filter((k) => k.naam.toLowerCase().includes(kamerleidSearch.toLowerCase()))
        .slice(0, 10)
    : []

  // Fetch the last available date from the TK API
  useEffect(() => {
    fetch("/api/agenda?maxDate=1")
      .then((r) => r.json())
      .then((data) => {
        if (data.maxDate) setMaxDate(data.maxDate)
      })
      .catch(() => {})
  }, [])

  // Load agenda data
  useEffect(() => {
    let cancelled = false
    setLoading(true) // eslint-disable-line react-hooks/set-state-in-effect -- sync before async fetch is intentional
    fetch(`/api/agenda?from=${fromDate}&to=${toDate}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setAllItems(Array.isArray(data) ? data : [])
          setLoading(false)
        }
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [fromDate, toDate])

  // Available types from data
  const availableTypes = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const item of allItems) {
      counts[item.Soort] = (counts[item.Soort] ?? 0) + 1
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ value: type, label: type, count }))
  }, [allItems])

  // Available commissies from (type-filtered) data
  const availableCommissies = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const item of allItems) {
      if (!item.Voortouwnaam) continue
      if (selectedTypes.size > 0 && !selectedTypes.has(item.Soort)) continue
      counts[item.Voortouwnaam] = (counts[item.Voortouwnaam] ?? 0) + 1
    }
    return Object.entries(counts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({
        value: name,
        label: name
          .replace(/^vaste commissie voor /, "")
          .replace(/^tijdelijke commissie /, ""),
        count,
      }))
  }, [allItems, selectedTypes])

  // Filter items
  const filtered = useMemo(() => {
    let items = allItems
    if (selectedTypes.size > 0) {
      items = items.filter((i) => selectedTypes.has(i.Soort))
    }
    if (selectedCommissies.size > 0) {
      items = items.filter((i) => selectedCommissies.has(i.Voortouwnaam))
    }
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(
        (i) =>
          i.Onderwerp.toLowerCase().includes(q) ||
          i.Voortouwnaam?.toLowerCase().includes(q)
      )
    }
    return items
  }, [allItems, selectedTypes, selectedCommissies, search])

  const grouped = groupByDate(filtered)
  const dates = Object.keys(grouped).sort()

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header */}
      <section className="mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-primary">Kameragenda</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Bekijk de komende vergaderingen van de Tweede Kamer en ga direct door naar
              de voorbereiding van jouw debatbriefing.
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="shrink-0 rounded-xl border border-border-light bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2">
          <MultiSelect
            label="Type"
            options={availableTypes}
            selected={selectedTypes}
            onChange={setSelectedTypes}
          />

          <MultiSelect
            label="Commissie"
            options={availableCommissies}
            selected={selectedCommissies}
            onChange={setSelectedCommissies}
          />

          {/* Kamerleden picker */}
          <div className="relative">
            <div className="flex items-center gap-1.5 rounded border border-border bg-white px-2.5 py-1.5 transition-[border-color] focus-within:border-primary">
              {sessionKamerleden.map((k) => (
                <span
                  key={k.id}
                  className="inline-flex items-center gap-1 rounded-full border border-border-light bg-surface-muted py-0.5 pl-2 pr-1 text-[11px] text-primary"
                >
                  {k.naam}
                  {k.fractie && <span className="text-text-muted">({k.fractie})</span>}
                  <button
                    type="button"
                    onClick={() => removeSessionKamerlid(k.id)}
                    className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-text-muted hover:bg-border-light hover:text-primary"
                  >
                    <X className="h-2 w-2" />
                  </button>
                </span>
              ))}
              <Search className="h-3 w-3 shrink-0 text-text-muted" />
              <input
                type="text"
                value={kamerleidSearch}
                onChange={(e) => setKamerleidSearch(e.target.value)}
                onFocus={() => setKamerleidFocused(true)}
                onBlur={() => setTimeout(() => setKamerleidFocused(false), 200)}
                placeholder="Zoek Kamerlid..."
                className="w-28 border-none bg-transparent text-sm text-primary placeholder:text-text-muted focus:outline-none"
              />
            </div>
            {kamerleidFocused && kamerleidResults.length > 0 && (
              <div className="absolute z-10 mt-1 max-h-40 w-56 overflow-y-auto rounded-lg border border-border-light bg-white shadow-lg">
                {kamerleidResults.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => { addSessionKamerlid(k); setKamerleidSearch("") }}
                    className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-xs text-primary transition-colors hover:bg-surface-muted"
                  >
                    <span className="font-medium">{k.naam}</span>
                    {k.fractie && <span className="text-text-muted">{k.fractie}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 rounded border border-border bg-white px-2.5 py-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-text-muted">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              max={maxDate ?? undefined}
              className="border-none bg-transparent py-0.5 text-sm text-primary outline-none"
            />
            <span className="text-xs font-medium text-text-muted">t/m</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              min={fromDate}
              max={maxDate ?? undefined}
              className="border-none bg-transparent py-0.5 text-sm text-primary outline-none"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Zoeken"
                className="w-52 rounded border border-border bg-white py-1.5 pl-8 pr-3 text-sm text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Agenda list */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          {loading && (
            <div className="space-y-6 py-4">
              {[0, 1, 2].map((g) => (
                <div key={g} className="space-y-2">
                  <div className="h-4 w-40 animate-pulse rounded bg-border-light" />
                  {[0, 1].map((c) => (
                    <div key={c} className="h-20 animate-pulse rounded-xl bg-border-light/60" />
                  ))}
                </div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="mx-auto max-w-md py-16">
              <div className="rounded-xl border border-border-light bg-white px-6 py-10 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
                <CalendarX2 className="mx-auto h-10 w-10 text-text-muted" />
                <p className="mt-3 font-medium text-primary">Geen vergaderingen gevonden</p>
                <p className="mt-1 text-sm text-text-secondary">
                  Pas de filters of datumbereik aan om resultaten te zien.
                </p>
              </div>
            </div>
          )}

          {!loading &&
            dates.map((date) => (
              <div key={date} className="mb-6">
                <div className="mb-2 flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-primary capitalize">
                    {formatDate(grouped[date][0].Datum)}
                  </h2>
                  <span className="h-px flex-1 bg-border-light" />
                </div>
                <div className="space-y-1.5">
                  {grouped[date].map((item) => (
                    <div
                      key={item.Id}
                      className="flex items-start gap-3 rounded-xl border border-border-light border-l-3 border-l-primary bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]"
                    >
                      <div
                        className="shrink-0 pt-0.5 text-xs text-text-muted"
                        style={{ minWidth: "5rem" }}
                      >
                        {formatTime(item.Aanvangstijd)}
                        {item.Eindtijd && <> – {formatTime(item.Eindtijd)}</>}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              TYPE_COLORS[item.Soort] ?? "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {item.Soort}
                          </span>
                          {item.Voortouwafkorting && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                              {item.Voortouwafkorting}
                            </span>
                          )}
                        </div>
                        <a
                          href={`https://www.tweedekamer.nl/vergaderingen/commissievergaderingen/details?id=${item.Nummer}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-primary hover:text-primary-dark hover:underline"
                        >
                          {item.Onderwerp}
                        </a>
                        {item.Voortouwnaam && (
                          <p className="mt-0.5 text-xs text-text-muted">
                            {item.Voortouwnaam}
                          </p>
                        )}
                      </div>

                      <Link
                        href={`/voorbereiden?topic=${encodeURIComponent(item.Onderwerp)}&soort=${encodeURIComponent(item.Soort)}&nummer=${encodeURIComponent(item.Nummer)}`}
                        className="flex shrink-0 items-center gap-1 rounded bg-primary px-2.5 py-1.5 text-xs font-medium text-white hover:bg-primary-dark active:translate-y-px"
                      >
                        Voorbereiden
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
