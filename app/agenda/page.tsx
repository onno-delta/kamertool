"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { MultiSelect } from "@/components/multi-select"

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
  const [allItems, setAllItems] = useState<Activiteit[]>([])
  const [loading, setLoading] = useState(true)
  const [fromDate, setFromDate] = useState(defaultFrom)
  const [toDate, setToDate] = useState(defaultTo)
  const [maxDate, setMaxDate] = useState<string | null>(null)
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set())
  const [selectedCommissies, setSelectedCommissies] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")

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
    setLoading(true)
    fetch(`/api/agenda?from=${fromDate}&to=${toDate}`)
      .then((r) => r.json())
      .then((data) => {
        setAllItems(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
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
      {/* Header card */}
      <section className="mb-4 rounded-xl border border-primary-30 bg-white/95 px-6 py-5 shadow-sm sm:mb-6">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs text-primary-75">Agenda</p>
          <h1 className="mt-1 text-2xl font-semibold text-primary">Kameragenda</h1>
          <p className="mt-2 text-sm text-primary-75">
            Bekijk de komende vergaderingen van de Tweede Kamer en ga direct door naar
            de voorbereiding van jouw debatbriefing.
          </p>
        </div>
      </section>

      {/* Filters */}
      <div className="shrink-0 rounded-xl border border-primary-30 bg-white/95 px-4 py-3 shadow-sm sm:px-6">
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

          <div className="flex items-center gap-1.5 rounded-md border border-primary-30 bg-white px-2.5 py-1.5 shadow-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-primary-75">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              max={maxDate ?? undefined}
              className="border-none bg-transparent py-0.5 text-sm text-primary outline-none"
            />
            <span className="text-xs font-medium text-primary-45">t/m</span>
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
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoek op onderwerp of commissie..."
              className="w-52 rounded-md border border-primary-30 bg-white px-3 py-1.5 text-sm text-primary placeholder:text-primary-60"
            />
          </div>
        </div>
      </div>

      {/* Agenda list */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-30 border-t-primary" />
              <span className="ml-3 text-sm text-primary-75">Agenda laden...</span>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="py-20 text-center text-sm text-primary-75">
              Geen vergaderingen gevonden.
            </div>
          )}

          {!loading &&
            dates.map((date) => (
              <div key={date} className="mb-6">
                <h2 className="mb-2 text-sm font-semibold text-primary capitalize">
                  {formatDate(grouped[date][0].Datum)}
                </h2>
                <div className="space-y-1.5">
                  {grouped[date].map((item) => (
                    <div
                      key={item.Id}
                      className="flex items-start gap-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-primary-15"
                    >
                      <div
                        className="shrink-0 pt-0.5 text-xs text-primary-75"
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
                          <p className="mt-0.5 text-xs text-primary-75">
                            {item.Voortouwnaam}
                          </p>
                        )}
                      </div>

                      <Link
                        href={`/voorbereiden?topic=${encodeURIComponent(item.Onderwerp)}&soort=${encodeURIComponent(item.Soort)}`}
                        className="shrink-0 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-white hover:bg-primary-dark"
                      >
                        Voorbereiden
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
