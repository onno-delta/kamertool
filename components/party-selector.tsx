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
      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
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
