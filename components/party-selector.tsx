"use client"

import { useEffect, useState, useRef } from "react"
import { ChevronDown } from "lucide-react"
import { PARTY_COLORS } from "@/lib/parties"

type Party = { id: string; name: string; shortName: string }

export function PartySelector({
  value,
  onChange,
}: {
  value: Party | null
  onChange: (party: Party | null) => void
}) {
  const [parties, setParties] = useState<Party[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/parties")
      .then((r) => r.json())
      .then(setParties)
  }, [])

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

  const color = value ? PARTY_COLORS[value.shortName] ?? "#6B7280" : undefined

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
            <span className="font-medium">{value.shortName}</span>
          </>
        ) : (
          <span className="text-text-muted">Partij</span>
        )}
        <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1 max-h-80 w-72 overflow-y-auto rounded-lg border border-border bg-white shadow-lg"
        >
          <button
            role="option"
            aria-selected={!value}
            onClick={() => { onChange(null); setOpen(false) }}
            className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-surface-muted ${!value ? "bg-surface-muted" : ""}`}
          >
            <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-gray-300" />
            <span className="font-medium text-text-muted">Geen partij</span>
            <span className="text-xs text-text-muted">Neutraal</span>
          </button>
          {parties.map((p) => {
            const c = PARTY_COLORS[p.shortName] ?? "#6B7280"
            const selected = value?.id === p.id
            return (
              <button
                key={p.id}
                role="option"
                aria-selected={selected}
                onClick={() => { onChange(p); setOpen(false) }}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-surface-muted ${selected ? "bg-surface-muted" : ""}`}
              >
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: c }}
                />
                <span className="font-medium text-primary">{p.shortName}</span>
                <span className="truncate text-xs text-text-muted">{p.name}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
