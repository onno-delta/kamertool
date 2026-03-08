"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { ChevronDown, User } from "lucide-react"
import { PARTY_COLORS } from "@/lib/parties"

type Kamerlid = { id: string; naam: string; fractie?: string }

export function KamerlidSelector({
  value,
  onChange,
}: {
  value: Kamerlid | null
  onChange: (kamerlid: Kamerlid | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Kamerlid[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/kamerleden?q=${encodeURIComponent(q)}`)
        if (res.ok) {
          const data: Kamerlid[] = await res.json()
          setResults(data.slice(0, 10))
        }
      } catch { /* ignore */ }
      setLoading(false)
    }, 300)
  }, [])

  function handleQueryChange(q: string) {
    setQuery(q)
    search(q)
  }

  const color = value?.fractie ? PARTY_COLORS[value.fractie] ?? "#6B7280" : undefined

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-[0.8125rem] text-primary hover:bg-surface-muted focus:border-primary focus:outline-none"
      >
        {value ? (
          <>
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="font-medium max-w-[10rem] truncate">{value.naam}</span>
          </>
        ) : (
          <>
            <User className="h-3.5 w-3.5 text-text-muted" />
            <span className="text-text-muted">Kamerlid</span>
          </>
        )}
        <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-lg border border-border bg-white shadow-lg">
          <div className="border-b border-border-light px-3 py-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Zoek kamerlid..."
              className="w-full border-none bg-transparent text-sm text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {value && (
              <button
                role="option"
                aria-selected={false}
                onClick={() => { onChange(null); setOpen(false); setQuery(""); setResults([]) }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-surface-muted"
              >
                <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-gray-300" />
                <span className="font-medium text-text-muted">Geen kamerlid</span>
              </button>
            )}
            {loading && (
              <div className="px-3 py-2 text-xs text-text-muted">Zoeken...</div>
            )}
            {!loading && query.length >= 2 && results.length === 0 && (
              <div className="px-3 py-2 text-xs text-text-muted">Geen resultaten</div>
            )}
            {!loading && query.length < 2 && !value && (
              <div className="px-3 py-2 text-xs text-text-muted">Typ minstens 2 tekens</div>
            )}
            {results.map((k) => {
              const c = k.fractie ? PARTY_COLORS[k.fractie] ?? "#6B7280" : "#6B7280"
              const selected = value?.id === k.id
              return (
                <button
                  key={k.id}
                  role="option"
                  aria-selected={selected}
                  onClick={() => { onChange(k); setOpen(false); setQuery(""); setResults([]) }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-surface-muted ${selected ? "bg-surface-muted" : ""}`}
                >
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: c }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="font-medium text-primary">{k.naam}</span>
                    {k.fractie && (
                      <span className="ml-1.5 text-xs text-text-muted">{k.fractie}</span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
