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
    <select
      value={value?.id ?? ""}
      onChange={(e) => {
        const party = parties.find((p) => p.id === e.target.value) ?? null
        onChange(party)
      }}
      className="rounded-lg border border-primary-30 bg-white px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
    >
      <option value="">Geen partij (neutraal)</option>
      {parties.map((p) => (
        <option key={p.id} value={p.id}>
          {p.shortName} — {p.name}
        </option>
      ))}
    </select>
  )
}
