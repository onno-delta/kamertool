"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { DOSSIERS } from "@/lib/dossiers"
import { PartySelector } from "@/components/party-selector"

type Party = { id: string; name: string; shortName: string }
type Kamerlid = { id: string; naam: string; fractie?: string }

export default function SettingsPage() {
  // Preferences state
  const [selectedParty, setSelectedParty] = useState<Party | null>(null)
  const [selectedDossiers, setSelectedDossiers] = useState<string[]>([])
  const [selectedKamerleden, setSelectedKamerleden] = useState<Kamerlid[]>([])
  const [kamerleidSearch, setKamerleidSearch] = useState("")
  const [kamerleidFocused, setKamerleidFocused] = useState(false)
  const [prefsSaving, setPrefsSaving] = useState(false)
  const [prefsSaved, setPrefsSaved] = useState(false)

  useEffect(() => {
    // Load preferences + parties, then resolve the default party
    Promise.all([
      fetch("/api/settings/preferences").then((r) => r.ok ? r.json() : null),
      fetch("/api/parties").then((r) => r.json()),
    ]).then(([prefs, allParties]) => {
      if (prefs) {
        setSelectedDossiers(prefs.dossiers ?? [])
        setSelectedKamerleden(prefs.kamerleden ?? [])
        if (prefs.defaultPartyId && allParties) {
          const match = allParties.find((p: Party) => p.id === prefs.defaultPartyId)
          if (match) setSelectedParty(match)
        }
      }
    }).catch(() => {})
  }, [])

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
    setPrefsSaved(false)
  }

  function removeKamerlid(id: string) {
    setSelectedKamerleden((prev) => prev.filter((k) => k.id !== id))
    setPrefsSaved(false)
  }

  async function handleSavePrefs() {
    setPrefsSaving(true)
    await fetch("/api/settings/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        defaultPartyId: selectedParty?.id ?? null,
        dossiers: selectedDossiers,
        kamerleden: selectedKamerleden,
      }),
    })
    setPrefsSaving(false)
    setPrefsSaved(true)
    setTimeout(() => setPrefsSaved(false), 2000)
  }

  return (
    <div className="mx-auto max-w-3xl overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
      <nav aria-label="Kruimelpad" className="mb-4 text-sm text-text-muted">
        <Link href="/" className="hover:text-primary hover:underline">Home</Link>
        <span className="mx-1.5">&rsaquo;</span>
        <span className="text-primary font-medium">Instellingen</span>
      </nav>

      <section className="mb-6">
        <h1 className="text-4xl font-bold tracking-tight text-primary">Instellingen</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Beheer je standaardpartij, dossiers en Kamerleden.
        </p>
      </section>

      {/* Party & Dossiers */}
      <div className="mb-6 rounded-lg border border-border bg-white p-6">
        <h2 className="mb-4 text-lg font-medium text-primary">
          Partij en dossiers
        </h2>

        <div className="space-y-5">
          {/* Party selector */}
          <div>
            <label className="mb-1 block text-sm font-medium text-primary">
              Partij
            </label>
            <PartySelector
              value={selectedParty}
              onChange={(p) => {
                setSelectedParty(p)
                setPrefsSaved(false)
              }}
            />
            <p className="mt-1 text-xs text-text-muted">
              De standaardpartij wordt automatisch geselecteerd in de chat.
            </p>
          </div>

          {/* Dossier checkboxes */}
          <div>
            <label className="mb-2 block text-sm font-medium text-primary">
              Dossiers
            </label>
            <p className="mb-3 text-xs text-text-muted">
              Selecteer de beleidsterreinen die je volgt. Deze worden meegenomen in briefings.
            </p>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {DOSSIERS.map((d) => (
                <label
                  key={d.id}
                  className={`flex cursor-pointer items-center gap-2.5 rounded px-3 py-2 text-sm ${
                    selectedDossiers.includes(d.id)
                      ? "bg-surface-muted text-primary"
                      : "bg-surface-muted/50 text-primary hover:bg-surface-muted"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedDossiers.includes(d.id)}
                    onChange={() => toggleDossier(d.id)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  {d.label}
                </label>
              ))}
            </div>
          </div>

          {/* Kamerleden selector */}
          <div>
            <label className="mb-2 block text-sm font-medium text-primary">
              Relevante Kamerleden
            </label>
            <p className="mb-3 text-xs text-text-muted">
              Selecteer Kamerleden die je volgt. Hun standpunten en uitspraken worden meegenomen in briefings.
            </p>

            {/* Selected kamerleden chips */}
            {selectedKamerleden.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {selectedKamerleden.map((k) => (
                  <span
                    key={k.id}
                    className="inline-flex items-center gap-1 rounded-full bg-surface-muted py-1 pl-3 pr-1.5 text-sm text-primary"
                  >
                    {k.naam}
                    {k.fractie && (
                      <span className="text-primary">({k.fractie})</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeKamerlid(k.id)}
                      className="ml-0.5 rounded-full p-0.5 text-text-muted hover:bg-border-light hover:text-primary"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search input */}
            <div className="relative">
              <input
                type="text"
                value={kamerleidSearch}
                onChange={(e) => setKamerleidSearch(e.target.value)}
                onFocus={() => setKamerleidFocused(true)}
                onBlur={() => setTimeout(() => setKamerleidFocused(false), 200)}
                placeholder="Zoek op naam..."
                className="w-full rounded border border-border px-3 py-2 text-sm text-primary placeholder:text-text-muted"
              />

              {/* Dropdown results */}
              {kamerleidFocused && kamerleidResultsFiltered.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-white shadow-lg">
                  {kamerleidResultsFiltered.map((k) => (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => addKamerlid(k)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-primary hover:bg-surface-muted"
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

          <button
            onClick={handleSavePrefs}
            disabled={prefsSaving}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark active:translate-y-px disabled:opacity-50"
          >
            {prefsSaving ? "Opslaan..." : prefsSaved ? "Opgeslagen" : "Voorkeuren opslaan"}
          </button>
        </div>
      </div>

    </div>
  )
}
