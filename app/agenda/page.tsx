"use client"

import { useState, useEffect } from "react"
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

const TYPE_FILTERS = [
  { id: "", label: "Alles" },
  { id: "plenair", label: "Plenair" },
  { id: "commissie", label: "Commissie" },
  { id: "overig", label: "Overig" },
]

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
  const [items, setItems] = useState<Activiteit[]>([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState("")
  const [days, setDays] = useState(14)
  const [search, setSearch] = useState("")

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ days: String(days) })
    if (type) params.set("type", type)
    if (search) params.set("q", search)

    fetch(`/api/agenda?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setItems(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [type, days, search])

  const grouped = groupByDate(items)
  const dates = Object.keys(grouped).sort()

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Filters */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 sm:gap-3">
          {/* Type filter */}
          <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setType(f.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
                  type === f.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Days selector */}
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 sm:text-sm"
          >
            {DAYS_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>

          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op onderwerp of commissie..."
            className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 sm:text-sm"
          />

          {/* Count */}
          {!loading && (
            <span className="shrink-0 text-xs text-gray-400">
              {items.length} vergaderingen
            </span>
          )}
        </div>
      </div>

      {/* Agenda list */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
              <span className="ml-3 text-sm text-gray-500">Agenda laden...</span>
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="py-20 text-center text-sm text-gray-400">
              Geen vergaderingen gevonden voor deze periode.
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
                    {/* Time */}
                    <div className="shrink-0 pt-0.5 text-xs text-gray-400" style={{ minWidth: "5rem" }}>
                      {formatTime(item.Aanvangstijd)}
                      {item.Eindtijd && (
                        <> – {formatTime(item.Eindtijd)}</>
                      )}
                    </div>

                    {/* Content */}
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

                    {/* Action */}
                    <Link
                      href={`/?topic=${encodeURIComponent(item.Onderwerp)}`}
                      className="shrink-0 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
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
