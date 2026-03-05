"use client"

import { useState, useEffect } from "react"
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

const PROVIDERS = [
  { id: "anthropic", name: "Anthropic", placeholder: "sk-ant-..." },
  { id: "openai", name: "OpenAI", placeholder: "sk-..." },
  { id: "google", name: "Google", placeholder: "AIza..." },
] as const

// Hardcode model options to avoid importing server-only module
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

  // Form state
  const [provider, setProvider] = useState<string>("anthropic")
  const [apiKey, setApiKey] = useState("")
  const [model, setModel] = useState("")

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

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-8 text-2xl font-semibold text-gray-900">Instellingen</h1>

      {/* Existing keys */}
      {!loading && keys.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-4 text-lg font-medium text-gray-800">
            Je API keys
          </h2>
          <div className="space-y-3">
            {keys.map((k) => (
              <div
                key={k.id}
                className={`flex items-center justify-between rounded-xl border p-4 ${
                  k.isActive
                    ? "border-blue-300 bg-blue-50"
                    : "border-gray-200"
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
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                    >
                      Activeren
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(k.id)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
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
      <div className="rounded-xl border border-gray-200 p-6">
        <h2 className="mb-4 text-lg font-medium text-gray-800">
          API key toevoegen
        </h2>

        <div className="space-y-4">
          {/* Provider select */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Model select */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            >
              {modelsForProvider.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* API key input */}
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Test result */}
          {testResult && (
            <div
              className={`rounded-lg p-3 text-sm ${
                testResult.valid
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {testResult.valid
                ? "Key is geldig!"
                : `Ongeldige key: ${testResult.error}`}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleTest}
              disabled={!apiKey || testing}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {testing ? "Testen..." : "Test key"}
            </button>
            <button
              onClick={handleSave}
              disabled={!apiKey || saving !== null}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Opslaan..." : "Opslaan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
