"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Vote, FolderOpen, Users, Search, X, Check, Save } from "lucide-react"
import { DOSSIERS, COMMISSIE_DOSSIER_MAP } from "@/lib/dossiers"
import { PartySelector } from "@/components/party-selector"
import { useDataContext } from "@/components/data-context"

type Party = { id: string; name: string; shortName: string }
type Kamerlid = { id: string; naam: string; fractie?: string }

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

  // Apply cached preferences + parties
  useEffect(() => {
    if (prefsApplied.current || !preferences) return
    setSelectedDossiers(preferences.dossiers ?? [])
    setSelectedKamerleden(preferences.kamerleden ?? [])
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
          Beheer je standaardpartij, dossiers en Kamerleden.
        </p>
      </section>

      {/* Kamerleden card */}
      <div className="mb-5 overflow-hidden rounded-xl border border-border-light bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3 border-b border-border-light bg-surface-muted px-5 py-3.5">
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

      {/* Dossier card */}
      <div className="mb-8 overflow-hidden rounded-xl border border-border-light bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3 border-b border-border-light bg-surface-muted px-5 py-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-15">
            <FolderOpen className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-primary">Dossiers</h2>
            <p className="text-xs text-text-muted">
              {selectedDossiers.length} van {DOSSIERS.length} geselecteerd
            </p>
          </div>
        </div>

        <div className="px-5 py-5">
          <p className="mb-4 text-xs leading-relaxed text-text-muted">
            Selecteer de beleidsterreinen die je volgt. Deze worden meegenomen in briefings.
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
