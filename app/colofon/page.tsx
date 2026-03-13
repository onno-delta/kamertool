"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Users, Search } from "lucide-react"
import { MultiSelect } from "@/components/multi-select"
import { PARTIES, PARTY_COLORS } from "@/lib/parties"
import { DOSSIERS, COMMISSIE_DOSSIER_MAP } from "@/lib/dossiers"

type Entry = {
  id: string
  naam: string
  fractie: string
  rol: "Kamerlid" | "Minister" | "Staatssecretaris"
  portefeuille?: string
  fotoUrl?: string
  commissies?: string[]
}

const ROLE_OPTIONS = [
  { value: "Kamerlid", label: "Kamerlid" },
  { value: "Minister", label: "Minister" },
  { value: "Staatssecretaris", label: "Staatssecretaris" },
]

export default function ColofonPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedParties, setSelectedParties] = useState<Set<string>>(new Set())
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set())
  const [selectedDossiers, setSelectedDossiers] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch("/api/colofon")
      .then((r) => r.json())
      .then((data) => {
        setEntries(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const partyOptions = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const e of entries) {
      counts[e.fractie] = (counts[e.fractie] ?? 0) + 1
    }
    return PARTIES
      .filter((p) => counts[p.shortName])
      .map((p) => ({
        value: p.shortName,
        label: p.shortName,
        count: counts[p.shortName],
      }))
  }, [entries])

  const dossierOptions = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const e of entries) {
      if (!e.commissies) continue
      const seen = new Set<string>()
      for (const c of e.commissies) {
        const d = COMMISSIE_DOSSIER_MAP[c]
        if (d && !seen.has(d)) {
          seen.add(d)
          counts[d] = (counts[d] ?? 0) + 1
        }
      }
    }
    return DOSSIERS
      .filter((d) => counts[d.id])
      .map((d) => ({ value: d.id, label: d.label, count: counts[d.id] }))
  }, [entries])

  const filtered = useMemo(() => {
    let items = entries
    if (search) {
      const q = search.toLowerCase()
      items = items.filter((e) => {
        if (e.naam.toLowerCase().includes(q)) return true
        // Also search on commission/dossier names
        if (e.commissies) {
          for (const c of e.commissies) {
            if (c.toLowerCase().includes(q)) return true
            const d = COMMISSIE_DOSSIER_MAP[c]
            if (d) {
              const label = DOSSIERS.find((ds) => ds.id === d)?.label
              if (label?.toLowerCase().includes(q)) return true
            }
          }
        }
        return false
      })
    }
    if (selectedParties.size > 0) {
      items = items.filter((e) => selectedParties.has(e.fractie))
    }
    if (selectedRoles.size > 0) {
      items = items.filter((e) => selectedRoles.has(e.rol))
    }
    if (selectedDossiers.size > 0) {
      items = items.filter((e) => {
        if (!e.commissies) return false
        return e.commissies.some((c) => {
          const d = COMMISSIE_DOSSIER_MAP[c]
          return d && selectedDossiers.has(d)
        })
      })
    }
    return items
  }, [entries, search, selectedParties, selectedRoles, selectedDossiers])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header */}
      <section className="mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-primary">Colofon</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Alle Kamerleden, ministers en staatssecretarissen op een rij.
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="shrink-0 rounded-xl border border-border-light bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <MultiSelect
            label="Partij"
            options={partyOptions}
            selected={selectedParties}
            onChange={setSelectedParties}
          />
          <MultiSelect
            label="Rol"
            options={ROLE_OPTIONS}
            selected={selectedRoles}
            onChange={setSelectedRoles}
          />
          <MultiSelect
            label="Dossier"
            options={dossierOptions}
            selected={selectedDossiers}
            onChange={setSelectedDossiers}
          />
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoek op naam of dossier"
              className="w-56 rounded border border-border bg-white py-1.5 pl-8 pr-3 text-sm text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>
          {!loading && (
            <span className="ml-auto text-xs text-text-muted">
              {filtered.length} {filtered.length === 1 ? "persoon" : "personen"}
            </span>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="mt-4 flex-1 overflow-y-auto">
        {loading && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-xl bg-border-light/60"
              />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="mx-auto max-w-md py-16">
            <div className="rounded-xl border border-border-light bg-white px-6 py-10 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
              <Users className="mx-auto h-10 w-10 text-text-muted" />
              <p className="mt-3 font-medium text-primary">Geen resultaten</p>
              <p className="mt-1 text-sm text-text-secondary">
                Pas de filters aan om personen te zien.
              </p>
            </div>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((entry) => (
              <Link
                key={entry.id}
                href={`/colofon/${entry.id}`}
                className="flex items-start gap-3 rounded-xl border border-border-light bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]"
              >
                {entry.fotoUrl ? (
                  <img
                    src={entry.fotoUrl}
                    alt=""
                    className="mt-0.5 h-10 w-10 shrink-0 rounded-full object-cover bg-border-light"
                    onError={(e) => {
                      const target = e.currentTarget
                      target.style.display = "none"
                      const fallback = target.nextElementSibling as HTMLElement
                      if (fallback) fallback.style.display = ""
                    }}
                  />
                ) : null}
                <span
                  className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: PARTY_COLORS[entry.fractie] ?? "#888",
                    display: entry.fotoUrl ? "none" : undefined,
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-primary">
                    {entry.naam}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                      {entry.fractie}
                    </span>
                    {entry.rol !== "Kamerlid" && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {entry.rol}
                      </span>
                    )}
                  </div>
                  {entry.portefeuille && (
                    <p className="mt-1 text-xs text-text-muted line-clamp-1">
                      {entry.portefeuille}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
