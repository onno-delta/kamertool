"use client"

import { useState, useEffect } from "react"
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
  { key: "claude-sonnet-4-5", provider: "anthropic", label: "Claude Sonnet 4.5" },
  { key: "claude-haiku-4-5", provider: "anthropic", label: "Claude Haiku 4.5" },
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
  const [kamerleidSearching, setKamerleidSearching] = useState(false)
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

  // Kamerlid search with debounce
  useEffect(() => {
    if (kamerleidSearch.length < 2) {
      setKamerleidResults([])
      return
    }
    const timeout = setTimeout(async () => {
      setKamerleidSearching(true)
      try {
        const res = await fetch(`/api/kamerleden?q=${encodeURIComponent(kamerleidSearch)}`)
        if (res.ok) {
          const data = await res.json()
          // Filter out already selected
          const selectedIds = new Set(selectedKamerleden.map((k) => k.id))
          setKamerleidResults(data.filter((k: Kamerlid) => !selectedIds.has(k.id)))
        }
      } catch {}
      setKamerleidSearching(false)
    }, 300)
    return () => clearTimeout(timeout)
  }, [kamerleidSearch, selectedKamerleden])

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
    <div className="mx-auto max-w-2xl overflow-y-auto px-6 py-10">
      <h1 className="mb-8 text-2xl font-semibold text-gray-900">Instellingen</h1>

      {/* Party & Dossiers */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-medium text-gray-800">
          Partij en dossiers
        </h2>

        <div className="space-y-5">
          {/* Party selector */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Partij
            </label>
            <select
              value={selectedPartyId}
              onChange={(e) => {
                setSelectedPartyId(e.target.value)
                setPrefsSaved(false)
              }}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900"
            >
              <option value="">Geen partij (neutraal)</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.shortName} — {p.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">
              De standaardpartij wordt automatisch geselecteerd in de chat.
            </p>
          </div>

          {/* Dossier checkboxes */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Dossiers
            </label>
            <p className="mb-3 text-xs text-gray-400">
              Selecteer de beleidsterreinen die je volgt. Deze worden meegenomen in briefings.
            </p>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {DOSSIERS.map((d) => (
                <label
                  key={d.id}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    selectedDossiers.includes(d.id)
                      ? "bg-blue-50 text-blue-900"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedDossiers.includes(d.id)}
                    onChange={() => toggleDossier(d.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {d.label}
                </label>
              ))}
            </div>
          </div>

          {/* Kamerleden selector */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Relevante Kamerleden
            </label>
            <p className="mb-3 text-xs text-gray-400">
              Selecteer Kamerleden die je volgt. Hun standpunten en uitspraken worden meegenomen in briefings.
            </p>

            {/* Selected kamerleden chips */}
            {selectedKamerleden.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {selectedKamerleden.map((k) => (
                  <span
                    key={k.id}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-50 py-1 pl-3 pr-1.5 text-sm text-blue-900"
                  >
                    {k.naam}
                    {k.fractie && (
                      <span className="text-blue-500">({k.fractie})</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeKamerlid(k.id)}
                      className="ml-0.5 rounded-full p-0.5 text-blue-400 hover:bg-blue-100 hover:text-blue-700"
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
                placeholder="Zoek op naam..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
              />
              {kamerleidSearching && (
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
                </div>
              )}

              {/* Dropdown results */}
              {kamerleidResults.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {kamerleidResults.map((k) => (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => addKamerlid(k)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-800 hover:bg-blue-50"
                    >
                      <span className="font-medium">{k.naam}</span>
                      {k.fractie && (
                        <span className="text-xs text-gray-400">{k.fractie}</span>
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
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {prefsSaving ? "Opslaan..." : prefsSaved ? "Opgeslagen" : "Voorkeuren opslaan"}
          </button>
        </div>
      </div>

      {/* Existing keys */}
      {!loading && keys.length > 0 && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium text-gray-800">
            Je API keys
          </h2>
          <div className="space-y-3">
            {keys.map((k) => (
              <div
                key={k.id}
                className={`flex items-center justify-between rounded-xl p-4 ${
                  k.isActive
                    ? "bg-blue-50 ring-1 ring-blue-200"
                    : "bg-gray-50"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {k.provider}
                    </span>
                    <span className="text-sm text-gray-500">{k.model}</span>
                    {k.isActive && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        actief
                      </span>
                    )}
                  </div>
                  {k.label && (
                    <p className="text-sm text-gray-500">{k.label}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!k.isActive && (
                    <button
                      onClick={() => handleActivate(k.id)}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
                    >
                      Activeren
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(k.id)}
                    className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
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
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-medium text-gray-800">
          API key toevoegen
        </h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900"
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900"
            >
              {modelsForProvider.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                PROVIDERS.find((p) => p.id === provider)?.placeholder
              }
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {testResult && (
            <div
              className={`rounded-xl p-3 text-sm ${
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
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {testing ? "Testen..." : "Test key"}
            </button>
            <button
              onClick={handleSave}
              disabled={!apiKey || saving !== null}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Opslaan..." : "Opslaan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
