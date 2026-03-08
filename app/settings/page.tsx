"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Vote, FolderOpen, Users, Search, X, Check, Save, Globe, Plus, Database } from "lucide-react"
import { DOSSIERS, COMMISSIE_DOSSIER_MAP } from "@/lib/dossiers"
import { PartySelector } from "@/components/party-selector"
import { useDataContext } from "@/components/data-context"

type Party = { id: string; name: string; shortName: string }
type Kamerlid = { id: string; naam: string; fractie?: string }
type Source = { url: string; title?: string }

const BUILTIN_SOURCES = [
  { name: "Overheid.nl (SRU)", desc: "Full-text parlementaire documenten" },
  { name: "Tweede Kamer OData API", desc: "Kamerstukken, moties, stemmingen, toezeggingen, agenda" },
  { name: "Google Nieuws", desc: "Actueel nieuws via Serper" },
  { name: "Partijprogramma's", desc: "Verkiezingsprogramma's van 13 partijen" },
  { name: "CBS", desc: "Centraal Bureau voor de Statistiek - cbs.nl" },
  { name: "CPB", desc: "Centraal Planbureau - cpb.nl" },
  { name: "PBL", desc: "Planbureau voor de Leefomgeving - pbl.nl" },
  { name: "SCP", desc: "Sociaal en Cultureel Planbureau - scp.nl" },
  { name: "WRR", desc: "Wetenschappelijke Raad voor het Regeringsbeleid - wrr.nl" },
  { name: "Raad van State", desc: "Adviezen en uitspraken - raadvanstate.nl" },
  { name: "Algemene Rekenkamer", desc: "Controle op rijksuitgaven - rekenkamer.nl" },
  { name: "Rijksoverheid.nl", desc: "Beleidsinformatie en regelgeving" },
]

export default function SettingsPage() {
  const { parties, preferences, refreshPreferences } = useDataContext()

  // Preferences state
  const [selectedParty, setSelectedParty] = useState<Party | null>(null)
  const [selectedDossiers, setSelectedDossiers] = useState<string[]>([])
  const [selectedKamerleden, setSelectedKamerleden] = useState<Kamerlid[]>([])
  const [kamerleidSearch, setKamerleidSearch] = useState("")
  const [kamerleidFocused, setKamerleidFocused] = useState(false)
  const [prefsSaving, setPrefsSaving] = useState(false)
  const [prefsSaved, setPrefsSaved] = useState(false)
  const prefsApplied = useRef(false)

  // Sources state
  const [userSources, setUserSources] = useState<Source[]>([])
  const [newSourceUrl, setNewSourceUrl] = useState("")
  const [newSourceTitle, setNewSourceTitle] = useState("")

  // Apply cached preferences + parties
  useEffect(() => {
    if (prefsApplied.current || !preferences) return
    setSelectedDossiers(preferences.dossiers ?? [])
    setSelectedKamerleden(preferences.kamerleden ?? [])
    setUserSources((preferences.sources ?? []).map((s) => ({ url: s.url, title: s.title ?? undefined })))
    if (preferences.defaultPartyId && parties.length > 0) {
      const match = parties.find((p) => p.id === preferences.defaultPartyId)
      if (match) setSelectedParty(match)
    }
    prefsApplied.current = true
  }, [preferences, parties])

  function toggleDossier(dossierId: string) {
    setSelectedDossiers((prev) =>
      prev.includes(dossierId)
        ? prev.filter((d) => d !== dossierId)
        : [...prev, dossierId]
    )
    setPrefsSaved(false)
  }

  // All current TK members (fetched once)
  const [allKamerleden, setAllKamerleden] = useState<Kamerlid[]>([])

  useEffect(() => {
    fetch("/api/kamerleden")
      .then((r) => r.ok ? r.json() : [])
      .then(setAllKamerleden)
      .catch(() => {})
  }, [])

  // Filter kamerleden by search input
  const kamerleidResultsFiltered = (() => {
    const selectedIds = new Set(selectedKamerleden.map((k) => k.id))
    const available = allKamerleden.filter((k) => !selectedIds.has(k.id))
    if (!kamerleidSearch.trim()) return available
    const q = kamerleidSearch.toLowerCase()
    return available.filter((k) => k.naam.toLowerCase().includes(q))
  })()

  function addKamerlid(k: Kamerlid) {
    setSelectedKamerleden((prev) => [...prev, k])
    setKamerleidSearch("")
    if (k.fractie) {
      const match = parties.find((p) => p.shortName === k.fractie)
      if (match) setSelectedParty(match)
    }
    setPrefsSaved(false)
  }

  function removeKamerlid(id: string) {
    setSelectedKamerleden((prev) => prev.filter((k) => k.id !== id))
    setPrefsSaved(false)
  }

  // Auto-select dossiers based on kamerlid committee memberships
  useEffect(() => {
    if (selectedKamerleden.length === 0) return
    const ids = selectedKamerleden.map((k) => k.id).join(",")
    fetch(`/api/kamerleden/commissies?ids=${ids}&vast=true`)
      .then((r) => r.ok ? r.json() : { commissies: [] })
      .then((data) => {
        const dossierIds = (data.commissies as string[])
          .map((afk) => {
            const mapped = COMMISSIE_DOSSIER_MAP[afk]
            if (!mapped) console.log(`[settings] Unknown commissie abbreviation: ${afk}`)
            return mapped
          })
          .filter(Boolean)
        if (dossierIds.length > 0) setSelectedDossiers(dossierIds)
      })
      .catch(() => {})
  }, [selectedKamerleden])

  function addSource() {
    const url = newSourceUrl.trim()
    if (!url) return
    // Basic URL validation
    try { new URL(url.startsWith("http") ? url : `https://${url}`) } catch { return }
    const normalized = url.startsWith("http") ? url : `https://${url}`
    if (userSources.some((s) => s.url === normalized)) return
    setUserSources((prev) => [...prev, { url: normalized, title: newSourceTitle.trim() || undefined }])
    setNewSourceUrl("")
    setNewSourceTitle("")
    setPrefsSaved(false)
  }

  function removeSource(url: string) {
    setUserSources((prev) => prev.filter((s) => s.url !== url))
    setPrefsSaved(false)
  }

  async function handleSavePrefs() {
    setPrefsSaving(true)
    try {
      const res = await fetch("/api/settings/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultPartyId: selectedParty?.id ?? null,
          dossiers: selectedDossiers,
          kamerleden: selectedKamerleden,
          sources: userSources,
        }),
      })
      if (!res.ok) throw new Error()
      await refreshPreferences()
      setPrefsSaved(true)
      setTimeout(() => setPrefsSaved(false), 2000)
    } catch {
      // silent fail — user sees button revert to "Opslaan"
    } finally {
      setPrefsSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl overflow-y-auto px-4 py-6 pb-10 sm:px-6 sm:py-8">
      <nav aria-label="Kruimelpad" className="mb-4 text-sm text-text-muted">
        <Link href="/" className="hover:text-primary hover:underline">Home</Link>
        <span className="mx-1.5">&rsaquo;</span>
        <span className="text-primary font-medium">Instellingen</span>
      </nav>

      <section className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary">Instellingen</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Beheer je standaardpartij, commissies, bronnen en Kamerleden.
        </p>
      </section>

      {/* Kamerleden card */}
      <div className="mb-5 rounded-xl border border-border-light bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3 border-b border-border-light bg-surface-muted rounded-t-xl px-5 py-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-15">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-primary">Relevante Kamerleden</h2>
            {selectedKamerleden.length > 0 && (
              <p className="text-xs text-text-muted">
                {selectedKamerleden.length} geselecteerd
              </p>
            )}
          </div>
        </div>

        <div className="px-5 py-5">
          <p className="mb-4 text-xs leading-relaxed text-text-muted">
            Selecteer Kamerleden die je volgt. Hun standpunten en uitspraken worden meegenomen in briefings.
          </p>

          {/* Selected kamerleden chips */}
          {selectedKamerleden.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {selectedKamerleden.map((k) => (
                <span
                  key={k.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border-light bg-surface-muted py-1 pl-3 pr-1.5 text-sm text-primary"
                >
                  {k.naam}
                  {k.fractie && (
                    <span className="text-text-muted">({k.fractie})</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeKamerlid(k.id)}
                    className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-border-light hover:text-primary"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search input */}
          <div className="relative">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2 transition-[border-color,box-shadow] focus-within:border-primary focus-within:shadow-[0_0_0_2px_rgba(21,66,115,0.08)]">
              <Search className="h-4 w-4 shrink-0 text-text-muted" />
              <input
                type="text"
                value={kamerleidSearch}
                onChange={(e) => setKamerleidSearch(e.target.value)}
                onFocus={() => setKamerleidFocused(true)}
                onBlur={() => setTimeout(() => setKamerleidFocused(false), 200)}
                placeholder="Zoek op naam..."
                className="w-full border-none bg-transparent text-sm text-primary placeholder:text-text-muted focus:outline-none"
              />
            </div>

            {/* Dropdown results */}
            {kamerleidFocused && kamerleidResultsFiltered.length > 0 && (
              <div className="absolute z-10 mt-1.5 max-h-48 w-full overflow-y-auto rounded-xl border border-border-light bg-white shadow-lg">
                {kamerleidResultsFiltered.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => addKamerlid(k)}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-primary transition-colors hover:bg-surface-muted"
                  >
                    <span className="font-medium">{k.naam}</span>
                    {k.fractie && (
                      <span className="text-xs text-text-muted">{k.fractie}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Party selector card */}
      <div className="mb-5 rounded-xl border border-border-light bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3 border-b border-border-light bg-surface-muted px-5 py-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-15">
            <Vote className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-sm font-semibold text-primary">Partij</h2>
        </div>

        <div className="px-5 py-5">
          <label className="mb-1.5 block text-sm font-medium text-primary">
            Standaardpartij
          </label>
          <p className="mb-3 text-xs leading-relaxed text-text-muted">
            De standaardpartij wordt automatisch geselecteerd in de chat en bij briefings.
          </p>
          <PartySelector
            value={selectedParty}
            onChange={(p) => {
              setSelectedParty(p)
              setPrefsSaved(false)
            }}
          />
        </div>
      </div>

      {/* Commissies card */}
      <div className="mb-5 overflow-hidden rounded-xl border border-border-light bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3 border-b border-border-light bg-surface-muted px-5 py-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-15">
            <FolderOpen className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-primary">Commissies</h2>
            <p className="text-xs text-text-muted">
              {selectedDossiers.length} van {DOSSIERS.length} geselecteerd
            </p>
          </div>
        </div>

        <div className="px-5 py-5">
          <p className="mb-4 text-xs leading-relaxed text-text-muted">
            Selecteer de commissies die je volgt. Deze worden meegenomen in briefings.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {DOSSIERS.map((d) => {
              const isSelected = selectedDossiers.includes(d.id)
              return (
                <label
                  key={d.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm transition-colors ${
                    isSelected
                      ? "border-primary/20 bg-primary-15 font-medium text-primary"
                      : "border-border-light bg-white text-primary hover:border-primary/10 hover:bg-surface-muted"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleDossier(d.id)}
                    className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary"
                  />
                  {d.label}
                </label>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bronnen card */}
      <div className="mb-8 rounded-xl border border-border-light bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3 border-b border-border-light bg-surface-muted rounded-t-xl px-5 py-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-15">
            <Database className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-primary">Bronnen</h2>
            <p className="text-xs text-text-muted">
              Databases en websites die worden geraadpleegd
            </p>
          </div>
        </div>

        <div className="px-5 py-5">
          {/* Built-in sources */}
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-muted">Geintegreerde bronnen</p>
          <div className="mb-5 space-y-1.5">
            {BUILTIN_SOURCES.map((s) => (
              <div
                key={s.name}
                className="flex items-center gap-2.5 rounded-lg border border-border-light bg-surface-muted px-3.5 py-2"
              >
                <Globe className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="text-sm font-medium text-primary">{s.name}</span>
                <span className="text-xs text-text-muted">{s.desc}</span>
              </div>
            ))}
          </div>

          {/* User sources */}
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-muted">Eigen websites</p>
          <p className="mb-3 text-xs leading-relaxed text-text-muted">
            Voeg websites toe die de AI actief raadpleegt bij het maken van briefings en het beantwoorden van vragen.
          </p>

          {userSources.length > 0 && (
            <div className="mb-4 space-y-2">
              {userSources.map((s) => (
                <div
                  key={s.url}
                  className="flex items-center gap-2 rounded-lg border border-border-light bg-white px-3.5 py-2.5"
                >
                  <Globe className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                  <div className="min-w-0 flex-1">
                    {s.title && <div className="text-sm font-medium text-primary">{s.title}</div>}
                    <div className="truncate text-xs text-text-muted">{s.url}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSource(s.url)}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-border-light hover:text-primary"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add source form */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={newSourceTitle}
              onChange={(e) => setNewSourceTitle(e.target.value)}
              placeholder="Naam (optioneel)"
              className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 sm:w-40"
            />
            <div className="flex flex-1 gap-2">
              <input
                type="url"
                value={newSourceUrl}
                onChange={(e) => setNewSourceUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSource() } }}
                placeholder="https://..."
                className="min-w-0 flex-1 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={addSource}
                disabled={!newSourceUrl.trim()}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark active:translate-y-px disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
                Toevoegen
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSavePrefs}
        disabled={prefsSaving}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark active:translate-y-px disabled:opacity-50"
      >
        {prefsSaving ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Opslaan...
          </>
        ) : prefsSaved ? (
          <>
            <Check className="h-4 w-4" />
            Opgeslagen
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Voorkeuren opslaan
          </>
        )}
      </button>

    </div>
  )
}
