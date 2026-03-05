"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"

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

// Types that have commissies
const TYPES_WITH_COMMISSIE = new Set([
  "Commissiedebat",
  "Wetgevingsoverleg",
  "Notaoverleg",
  "Begrotingsoverleg",
  "Rondetafelgesprek",
  "Procedurevergadering",
  "Gesprek",
  "Technische briefing",
])

const DAYS_OPTIONS = [
  { value: 7, label: "7 dagen" },
  { value: 14, label: "14 dagen" },
  { value: 30, label: "30 dagen" },
  { value: 60, label: "60 dagen" },
]

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
  const [days, setDays] = useState(14)
  const [selectedType, setSelectedType] = useState("")
  const [selectedCommissie, setSelectedCommissie] = useState("")
  const [search, setSearch] = useState("")

  useEffect(() => {
    setLoading(true)
    fetch(`/api/agenda?days=${days}`)
      .then((r) => r.json())
      .then((data) => {
        setAllItems(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [days])

  // Extract available types from data, sorted by count
  const availableTypes = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const item of allItems) {
      counts[item.Soort] = (counts[item.Soort] ?? 0) + 1
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count }))
  }, [allItems])

  // Extract available commissies for the selected type
  const availableCommissies = useMemo(() => {
    if (!selectedType || !TYPES_WITH_COMMISSIE.has(selectedType)) return []
    const counts: Record<string, number> = {}
    for (const item of allItems) {
      if (item.Soort === selectedType && item.Voortouwnaam) {
        counts[item.Voortouwnaam] = (counts[item.Voortouwnaam] ?? 0) + 1
      }
    }
    return Object.entries(counts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }))
  }, [allItems, selectedType])

  // Reset commissie when type changes
  useEffect(() => {
    setSelectedCommissie("")
  }, [selectedType])

  // Filter items
  const filtered = useMemo(() => {
    let items = allItems
    if (selectedType) {
      items = items.filter((i) => i.Soort === selectedType)
    }
    if (selectedCommissie) {
      items = items.filter((i) => i.Voortouwnaam === selectedCommissie)
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
  }, [allItems, selectedType, selectedCommissie, search])

  const grouped = groupByDate(filtered)
  const dates = Object.keys(grouped).sort()

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Filters */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700"
          >
            <option value="">Alle types ({allItems.length})</option>
            {availableTypes.map(({ type, count }) => (
              <option key={type} value={type}>
                {type} ({count})
              </option>
            ))}
          </select>

          {selectedType && availableCommissies.length > 0 && (
            <select
              value={selectedCommissie}
              onChange={(e) => setSelectedCommissie(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700"
            >
              <option value="">Alle commissies</option>
              {availableCommissies.map(({ name, count }) => (
                <option key={name} value={name}>
                  {name.replace(/^vaste commissie voor /, "").replace(/^tijdelijke commissie /, "")} ({count})
                </option>
              ))}
            </select>
          )}

          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700"
          >
            {DAYS_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoeken..."
            className="w-40 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Count */}
      {!loading && (
        <div className="shrink-0 bg-gray-50 px-4 py-1.5 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <span className="text-xs text-gray-400">
              {filtered.length} vergaderingen
            </span>
          </div>
        </div>
      )}

      {/* Agenda list */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
              <span className="ml-3 text-sm text-gray-500">Agenda laden...</span>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="py-20 text-center text-sm text-gray-400">
              Geen vergaderingen gevonden.
            </div>
          )}

          {!loading && dates.map((date) => (
            <div key={date} className="mb-6">
              <h2 className="mb-2 text-sm font-semibold text-gray-900 capitalize">
                {formatDate(grouped[date][0].Datum)}
              </h2>
              <div className="space-y-1.5">
                {grouped[date].map((item) => (
                  <div
                    key={item.Id}
                    className="flex items-start gap-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-100"
                  >
                    <div className="shrink-0 pt-0.5 text-xs text-gray-400" style={{ minWidth: "5rem" }}>
                      {formatTime(item.Aanvangstijd)}
                      {item.Eindtijd && <> – {formatTime(item.Eindtijd)}</>}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          TYPE_COLORS[item.Soort] ?? "bg-gray-100 text-gray-600"
                        }`}>
                          {item.Soort}
                        </span>
                        {item.Voortouwafkorting && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                            {item.Voortouwafkorting}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-800">
                        {item.Onderwerp}
                      </p>
                      {item.Voortouwnaam && (
                        <p className="mt-0.5 text-xs text-gray-400">
                          {item.Voortouwnaam}
                        </p>
                      )}
                    </div>

                    <Link
                      href={`/voorbereiden?topic=${encodeURIComponent(item.Onderwerp)}`}
                      className="shrink-0 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
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
