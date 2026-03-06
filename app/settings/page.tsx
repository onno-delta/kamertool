"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { DOSSIERS } from "@/lib/dossiers"

type StoredKey = {
  id: string
  provider: string
  model: string
  label: string | null
  isActive: boolean
  createdAt: string
}

type ModelOption = {
  key: string
  provider: string
  label: string
}

type Party = { id: string; name: string; shortName: string }
type Kamerlid = { id: string; naam: string; fractie?: string }

const PROVIDERS = [
  { id: "anthropic", name: "Anthropic", placeholder: "sk-ant-..." },
  { id: "openai", name: "OpenAI", placeholder: "sk-..." },
  { id: "google", name: "Google", placeholder: "AIza..." },
] as const

const MODEL_OPTIONS: ModelOption[] = [
  { key: "claude-opus-4-6", provider: "anthropic", label: "Claude Opus 4.6" },
  { key: "claude-sonnet-4-5", provider: "anthropic", label: "Claude Sonnet 4.5" },
  { key: "gpt-4o", provider: "openai", label: "GPT-4o" },
  { key: "gpt-4o-mini", provider: "openai", label: "GPT-4o Mini" },
  { key: "gemini-2.5-pro", provider: "google", label: "Gemini 2.5 Pro" },
  { key: "gemini-2.5-flash", provider: "google", label: "Gemini 2.5 Flash" },
]

export default function SettingsPage() {
  const [keys, setKeys] = useState<StoredKey[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    valid: boolean
    error?: string
  } | null>(null)

  // Form state for API keys
  const [provider, setProvider] = useState<string>("anthropic")
  const [apiKey, setApiKey] = useState("")
  const [model, setModel] = useState("")

  // Preferences state
  const [parties, setParties] = useState<Party[]>([])
  const [selectedPartyId, setSelectedPartyId] = useState<string>("")
  const [selectedDossiers, setSelectedDossiers] = useState<string[]>([])
  const [selectedKamerleden, setSelectedKamerleden] = useState<Kamerlid[]>([])
  const [kamerleidSearch, setKamerleidSearch] = useState("")
  const [kamerleidResults, setKamerleidResults] = useState<Kamerlid[]>([])
  const [kamerleidFocused, setKamerleidFocused] = useState(false)
  const [prefsSaving, setPrefsSaving] = useState(false)
  const [prefsSaved, setPrefsSaved] = useState(false)

  const modelsForProvider = MODEL_OPTIONS.filter((m) => m.provider === provider)

  useEffect(() => {
    setModel(modelsForProvider[0]?.key ?? "")
  }, [provider])

  async function loadKeys() {
    const res = await fetch("/api/settings/keys")
    if (res.ok) setKeys(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    loadKeys()
    // Load parties
    fetch("/api/parties")
      .then((r) => r.json())
      .then(setParties)
      .catch(() => {})
    // Load preferences
    fetch("/api/settings/preferences")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setSelectedPartyId(data.defaultPartyId ?? "")
          setSelectedDossiers(data.dossiers ?? [])
          setSelectedKamerleden(data.kamerleden ?? [])
        }
      })
      .catch(() => {})
  }, [])

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    const res = await fetch("/api/settings/keys/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, apiKey, model }),
    })
    setTestResult(await res.json())
    setTesting(false)
  }

  async function handleSave() {
    setSaving(provider)
    await fetch("/api/settings/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, apiKey, model }),
    })
    setApiKey("")
    setTestResult(null)
    await loadKeys()
    setSaving(null)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/settings/keys/${id}`, { method: "DELETE" })
    await loadKeys()
  }

  async function handleActivate(id: string) {
    await fetch(`/api/settings/keys/${id}`, { method: "PUT" })
    await loadKeys()
  }

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
  useEffect(() => {
    const selectedIds = new Set(selectedKamerleden.map((k) => k.id))
    const available = allKamerleden.filter((k) => !selectedIds.has(k.id))
    if (!kamerleidSearch.trim()) {
      setKamerleidResults(available)
    } else {
      const q = kamerleidSearch.toLowerCase()
      setKamerleidResults(available.filter((k) => k.naam.toLowerCase().includes(q)))
    }
  }, [kamerleidSearch, selectedKamerleden, allKamerleden])

  function addKamerlid(k: Kamerlid) {
    setSelectedKamerleden((prev) => [...prev, k])
    setKamerleidSearch("")
    setKamerleidResults([])
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
        defaultPartyId: selectedPartyId || null,
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
          Beheer je standaardpartij, dossiers, Kamerleden en API-keys voor eigen modellen.
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
            <select
              value={selectedPartyId}
              onChange={(e) => {
                setSelectedPartyId(e.target.value)
                setPrefsSaved(false)
              }}
              className="w-full rounded border border-border px-3 py-2 text-primary"
            >
              <option value="">Geen partij (neutraal)</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.shortName} — {p.name}
                </option>
              ))}
            </select>
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
              {kamerleidFocused && kamerleidResults.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-white shadow-lg">
                  {kamerleidResults.map((k) => (
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

      {/* Existing keys */}
      {!loading && keys.length > 0 && (
        <div className="mb-6 rounded-lg border border-border bg-white p-6">
          <h2 className="mb-4 text-lg font-medium text-primary">
            Je API keys
          </h2>
          <div className="space-y-3">
            {keys.map((k) => (
              <div
                key={k.id}
                className={`flex items-center justify-between rounded-lg p-4 ${
                  k.isActive
                    ? "bg-surface-muted ring-1 ring-primary/30"
                    : "bg-surface-muted"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-primary">
                      {k.provider}
                    </span>
                    <span className="text-sm text-text-secondary">{k.model}</span>
                    {k.isActive && (
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-primary">
                        actief
                      </span>
                    )}
                  </div>
                  {k.label && (
                    <p className="text-sm text-text-secondary">{k.label}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!k.isActive && (
                    <button
                      onClick={() => handleActivate(k.id)}
                      className="rounded border border-border bg-white px-3 py-1.5 text-sm hover:bg-surface-muted"
                    >
                      Activeren
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(k.id)}
                    className="rounded border border-red-200 bg-white px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    Verwijderen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add new key */}
      <div className="rounded-lg border border-border bg-white p-6">
        <h2 className="mb-4 text-lg font-medium text-primary">
          API key toevoegen
        </h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-primary">
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full rounded border border-border px-3 py-2 text-primary"
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-primary">
              Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded border border-border px-3 py-2 text-primary"
            >
              {modelsForProvider.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-primary">
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                PROVIDERS.find((p) => p.id === provider)?.placeholder
              }
              className="w-full rounded border border-border px-3 py-2 text-primary placeholder:text-text-muted"
            />
          </div>

          {testResult && (
            <div
              className={`rounded-lg p-3 text-sm ${
                testResult.valid
                  ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                  : "bg-red-50 text-red-700 ring-1 ring-red-200"
              }`}
            >
              {testResult.valid
                ? "Key is geldig!"
                : `Ongeldige key: ${testResult.error}`}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleTest}
              disabled={!apiKey || testing}
              className="rounded border border-border px-4 py-2 text-sm font-medium text-primary hover:bg-surface-muted disabled:opacity-50"
            >
              {testing ? "Testen..." : "Test key"}
            </button>
            <button
              onClick={handleSave}
              disabled={!apiKey || saving !== null}
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark active:translate-y-px disabled:opacity-50"
            >
              {saving ? "Opslaan..." : "Opslaan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
