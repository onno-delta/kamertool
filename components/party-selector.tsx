"use client"

import { useEffect, useState } from "react"

type Party = { id: string; name: string; shortName: string }

export function PartySelector({
  value,
  onChange,
}: {
  value: Party | null
  onChange: (party: Party | null) => void
}) {
  const [parties, setParties] = useState<Party[]>([])

  useEffect(() => {
    fetch("/api/parties")
      .then((r) => r.json())
      .then(setParties)
  }, [])

  return (
    <div className="inline-flex items-center gap-2">
      <span className="hidden text-xs font-medium uppercase tracking-wide text-primary-75 sm:inline">
        Partij
      </span>
      <select
        value={value?.id ?? ""}
        onChange={(e) => {
          const party = parties.find((p) => p.id === e.target.value) ?? null
          onChange(party)
        }}
        className="rounded-md border border-primary-30 bg-white px-3 py-1.5 text-sm text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="">Geen partij (neutraal)</option>
        {parties.map((p) => (
          <option key={p.id} value={p.id}>
            {p.shortName} — {p.name}
          </option>
        ))}
      </select>
    </div>
  )
}
