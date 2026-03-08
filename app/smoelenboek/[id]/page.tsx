"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  FileText,
  Vote,
  Handshake,
  Calendar,
  ExternalLink,
} from "lucide-react"
import { PARTY_COLORS } from "@/lib/parties"

type PersonDetail = {
  id: string
  naam: string
  fractie?: string
  rol: string
  portefeuille?: string
  commissies?: string[]
  geboortedatum?: string
  isKabinet: boolean
}

type DocItem = {
  id: string
  nummer: string
  soort: string
  onderwerp: string
  datum: string
  relatie: string
}

type StemItem = {
  fractie: string
  stem: string
  zetels: number
  besluit: string
  besluitSoort: string
}

type ToezeggingItem = {
  nummer: string
  tekst: string
  status: string
  datumNakoming: string
  ministerie: string
  minister: string
}

type AgendaItem = {
  id: string
  type: string
  onderwerp: string
  datum: string
  aanvang: string
  commissie: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function ActivitySection({
  title,
  icon,
  personId,
  type,
  fractie,
  naam,
  commissies,
}: {
  title: string
  icon: React.ReactNode
  personId: string
  type: string
  fractie?: string
  naam?: string
  commissies?: string[]
}) {
  const [data, setData] = useState<unknown[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams({ type })
    if (fractie) params.set("fractie", fractie)
    if (naam) params.set("naam", naam)
    if (commissies?.length) params.set("commissies", commissies.join(","))

    fetch(`/api/smoelenboek/${personId}/activiteiten?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((d) => {
        setData(Array.isArray(d) ? d : [])
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [personId, type, fractie, naam, commissies])

  return (
    <div className="rounded-xl border border-border-light bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-2 border-b border-border-light px-4 py-3">
        {icon}
        <h2 className="text-sm font-semibold text-primary">{title}</h2>
      </div>
      <div className="px-4 py-3">
        {loading && (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-border-light/60" />
            ))}
          </div>
        )}

        {error && (
          <p className="text-sm text-text-muted">Kon gegevens niet laden.</p>
        )}

        {!loading && !error && data?.length === 0 && (
          <p className="text-sm text-text-muted">Geen resultaten gevonden.</p>
        )}

        {!loading && !error && data && data.length > 0 && (
          <div className="space-y-2">
            {type === "documenten" &&
              (data as DocItem[]).map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-lg border border-border-light px-3 py-2"
                >
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                      {doc.soort}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-primary">{doc.onderwerp}</p>
                      {doc.datum && (
                        <p className="mt-0.5 text-xs text-text-muted">
                          {formatDate(doc.datum)}
                          {doc.relatie && ` — ${doc.relatie}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

            {type === "stemmingen" &&
              (data as StemItem[]).map((s, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border-light px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        s.stem === "Voor"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {s.stem}
                    </span>
                    <p className="min-w-0 flex-1 text-sm text-primary line-clamp-2">
                      {s.besluit}
                    </p>
                  </div>
                </div>
              ))}

            {type === "toezeggingen" &&
              (data as ToezeggingItem[]).map((t, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border-light px-3 py-2"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        t.status === "Openstaand"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {t.status}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-primary line-clamp-3">
                        {t.tekst}
                      </p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        {t.ministerie}
                        {t.datumNakoming &&
                          ` — Nakoming: ${formatDate(t.datumNakoming)}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

            {type === "agenda" &&
              (data as AgendaItem[]).map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg border border-border-light px-3 py-2"
                >
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-800">
                      {a.type}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-primary">{a.onderwerp}</p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        {formatDate(a.datum)}
                        {a.commissie && ` — ${a.commissie}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [person, setPerson] = useState<PersonDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(`/api/smoelenboek/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((data) => {
        setPerson(data)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 animate-pulse rounded bg-border-light" />
        <div className="h-32 animate-pulse rounded-xl bg-border-light/60" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-48 animate-pulse rounded-xl bg-border-light/60" />
          <div className="h-48 animate-pulse rounded-xl bg-border-light/60" />
        </div>
      </div>
    )
  }

  if (error || !person) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-medium text-primary">Persoon niet gevonden</p>
        <Link
          href="/smoelenboek"
          className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Terug naar overzicht
        </Link>
      </div>
    )
  }

  const isMinister = person.rol === "Minister" || person.rol === "Staatssecretaris"

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Back link */}
      <Link
        href="/smoelenboek"
        className="mb-4 inline-flex w-fit items-center gap-1 text-sm text-text-secondary hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Smoelenboek
      </Link>

      {/* Header card */}
      <div className="mb-6 rounded-xl border border-border-light bg-white px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-start gap-4">
          <span
            className="mt-1 h-4 w-4 shrink-0 rounded-full"
            style={{
              backgroundColor: person.fractie
                ? PARTY_COLORS[person.fractie] ?? "#888"
                : "#888",
            }}
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-primary">
              {person.naam}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {person.fractie && (
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                  style={{
                    backgroundColor: PARTY_COLORS[person.fractie] ?? "#888",
                  }}
                >
                  {person.fractie}
                </span>
              )}
              <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                {person.rol}
              </span>
            </div>
            {person.portefeuille && (
              <p className="mt-2 text-sm text-text-secondary">
                {person.portefeuille}
              </p>
            )}
            {person.commissies && person.commissies.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {person.commissies.map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
            {!person.isKabinet && (
              <a
                href={`https://www.tweedekamer.nl/kamerleden_en_commissies/alle_kamerleden/${person.naam.toLowerCase().replace(/\s+/g, "-")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Profiel op tweedekamer.nl
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Activity feed */}
      <div className="grid gap-4 lg:grid-cols-2">
        {!person.isKabinet && (
          <ActivitySection
            title="Documenten"
            icon={<FileText className="h-4 w-4 text-primary" />}
            personId={id}
            type="documenten"
          />
        )}

        <ActivitySection
          title={`Stemgedrag ${person.fractie ?? ""}`}
          icon={<Vote className="h-4 w-4 text-primary" />}
          personId={id}
          type="stemmingen"
          fractie={person.fractie}
        />

        {person.commissies && person.commissies.length > 0 && (
          <ActivitySection
            title="Agenda"
            icon={<Calendar className="h-4 w-4 text-primary" />}
            personId={id}
            type="agenda"
            commissies={person.commissies}
          />
        )}

        {isMinister && (
          <ActivitySection
            title="Toezeggingen"
            icon={<Handshake className="h-4 w-4 text-primary" />}
            personId={id}
            type="toezeggingen"
            naam={person.naam}
          />
        )}
      </div>
    </div>
  )
}
