"use client"

import { useState, useEffect, use, useCallback } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  ArrowLeft,
  FileText,
  Vote,
  Handshake,
  Calendar,
  ExternalLink,
  Mail,
  AtSign,
  Linkedin,
  Globe,
  Trash2,
  Plus,
  UserPlus,
  MessageSquare,
  Users,
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
  fotoUrl?: string
  email?: string | null
  bio?: string | null
  tweedekamerUrl?: string | null
  contacten?: ContactItem[]
  medewerkers?: MedewerkerItem[]
}

type ContactItem = {
  id: string
  personId: string
  type: string
  value: string
  label?: string
  submittedBy: string
  createdAt: string
}

type MedewerkerItem = {
  id: string
  personId: string
  naam: string
  rol: string
  email?: string | null
  submittedBy: string
  createdAt: string
}

type DocItem = {
  id: string
  nummer: string
  soort: string
  onderwerp: string
  datum: string
  relatie: string
  url?: string
}

type StemItem = {
  fractie: string
  stem: string
  zetels: number
  besluit: string
  besluitSoort: string
  url?: string
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
  nummer?: string
  type: string
  onderwerp: string
  datum: string
  aanvang: string
  commissie: string
}

type HandelingItem = {
  nummer: string
  onderwerp: string
  datum: string
  type: string
  url: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

const CONTACT_TYPE_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  twitter: AtSign,
  linkedin: Linkedin,
  website: Globe,
}

const CONTACT_TYPE_LABELS: Record<string, string> = {
  email: "E-mail",
  twitter: "Twitter/X",
  linkedin: "LinkedIn",
  website: "Website",
}

function ContactTypeIcon({ type }: { type: string }) {
  const Icon = CONTACT_TYPE_ICONS[type] ?? Globe
  return <Icon className="h-4 w-4 text-text-muted" />
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
                <a
                  key={doc.id}
                  href={doc.url || `https://www.tweedekamer.nl/zoeken?qry=${encodeURIComponent(doc.nummer)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-border-light px-3 py-2 transition-colors hover:border-primary/30"
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
                    <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-text-muted" />
                  </div>
                </a>
              ))}

            {type === "stemmingen" &&
              (data as StemItem[]).map((s, i) => (
                <a
                  key={i}
                  href={s.url || `https://www.tweedekamer.nl/zoeken?qry=${encodeURIComponent(s.besluit)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-border-light px-3 py-2 transition-colors hover:border-primary/30"
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
                    <ExternalLink className="h-3 w-3 shrink-0 text-text-muted" />
                  </div>
                </a>
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
                <a
                  key={a.id}
                  href={a.nummer
                    ? `https://www.tweedekamer.nl/debat_en_vergadering/plenaire_vergaderingen/details/activiteit?id=${a.nummer}`
                    : `https://www.tweedekamer.nl/zoeken?qry=${encodeURIComponent(a.onderwerp)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-border-light px-3 py-2 transition-colors hover:border-primary/30"
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
                    <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-text-muted" />
                  </div>
                </a>
              ))}

            {type === "handelingen" &&
              (data as HandelingItem[]).map((h) => (
                <a
                  key={h.nummer}
                  href={h.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-border-light px-3 py-2 transition-colors hover:border-primary/30"
                >
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-800">
                      {h.type || "Handeling"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-primary line-clamp-2">{h.onderwerp}</p>
                      {h.datum && (
                        <p className="mt-0.5 text-xs text-text-muted">
                          {formatDate(h.datum)}
                        </p>
                      )}
                    </div>
                    <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-text-muted" />
                  </div>
                </a>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ContactenSection({
  contacten,
  personId,
  userId,
  onUpdate,
}: {
  contacten: ContactItem[]
  personId: string
  userId?: string
  onUpdate: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState("email")
  const [value, setValue] = useState("")
  const [label, setLabel] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/smoelenboek/${personId}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, value: value.trim(), label: label.trim() || undefined }),
      })
      if (res.ok) {
        setValue("")
        setLabel("")
        setShowForm(false)
        onUpdate()
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(contactId: string) {
    const res = await fetch(
      `/api/smoelenboek/${personId}/contact/${contactId}`,
      { method: "DELETE" }
    )
    if (res.ok) onUpdate()
  }

  if (!userId && contacten.length === 0) return null

  return (
    <div className="rounded-xl border border-border-light bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-2 border-b border-border-light px-4 py-3">
        <Mail className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-primary">Contactgegevens</h2>
      </div>
      <div className="px-4 py-3">
        {contacten.length === 0 && !showForm && (
          <p className="text-sm text-text-muted">
            Nog geen contactgegevens toegevoegd.
          </p>
        )}

        {contacten.length > 0 && (
          <div className="space-y-2">
            {contacten.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-lg border border-border-light px-3 py-2"
              >
                <ContactTypeIcon type={c.type} />
                <div className="min-w-0 flex-1">
                  {c.type === "email" ? (
                    <a
                      href={`mailto:${c.value}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {c.value}
                    </a>
                  ) : c.type === "website" || c.type === "linkedin" ? (
                    <a
                      href={c.value.startsWith("http") ? c.value : `https://${c.value}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {c.value}
                    </a>
                  ) : (
                    <span className="text-sm text-primary">{c.value}</span>
                  )}
                  {c.label && (
                    <span className="ml-2 text-xs text-text-muted">
                      ({c.label})
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-text-muted">
                  {CONTACT_TYPE_LABELS[c.type] ?? c.type}
                </span>
                {userId && c.submittedBy === userId && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-text-muted hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {userId && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-primary/30 hover:text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            Contactgegevens toevoegen
          </button>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-2">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="rounded border border-border bg-white px-2 py-1.5 text-sm text-primary"
              >
                {Object.entries(CONTACT_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Waarde"
                required
                className="min-w-0 flex-1 rounded border border-border bg-white px-2 py-1.5 text-sm text-primary placeholder:text-text-muted"
              />
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Label (optioneel)"
                className="w-32 rounded border border-border bg-white px-2 py-1.5 text-sm text-primary placeholder:text-text-muted"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50"
              >
                Opslaan
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-primary"
              >
                Annuleren
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function MedewerkersSection({
  medewerkers,
  personId,
  userId,
  onUpdate,
}: {
  medewerkers: MedewerkerItem[]
  personId: string
  userId?: string
  onUpdate: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [naam, setNaam] = useState("")
  const [rol, setRol] = useState("Persoonlijk medewerker")
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!naam.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/smoelenboek/${personId}/medewerker`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          naam: naam.trim(),
          rol,
          email: email.trim() || undefined,
        }),
      })
      if (res.ok) {
        setNaam("")
        setEmail("")
        setShowForm(false)
        onUpdate()
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(mwId: string) {
    const res = await fetch(
      `/api/smoelenboek/${personId}/medewerker/${mwId}`,
      { method: "DELETE" }
    )
    if (res.ok) onUpdate()
  }

  if (!userId && medewerkers.length === 0) return null

  return (
    <div className="rounded-xl border border-border-light bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-2 border-b border-border-light px-4 py-3">
        <Users className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-primary">Medewerkers</h2>
      </div>
      <div className="px-4 py-3">
        {medewerkers.length === 0 && !showForm && (
          <p className="text-sm text-text-muted">
            Nog geen medewerkers toegevoegd.
          </p>
        )}

        {medewerkers.length > 0 && (
          <div className="space-y-2">
            {medewerkers.map((mw) => (
              <div
                key={mw.id}
                className="rounded-lg border border-border-light px-3 py-2"
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-primary">
                        {mw.naam}
                      </span>
                      <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                        {mw.rol}
                      </span>
                    </div>
                    {mw.email && (
                      <div className="mt-1">
                        <a
                          href={`mailto:${mw.email}`}
                          className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-primary"
                        >
                          <Mail className="h-3 w-3" />
                          {mw.email}
                        </a>
                      </div>
                    )}
                  </div>
                  {userId && mw.submittedBy === userId && (
                    <button
                      onClick={() => handleDelete(mw.id)}
                      className="mt-0.5 text-text-muted hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {userId && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-primary/30 hover:text-primary"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Medewerker toevoegen
          </button>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={naam}
                onChange={(e) => setNaam(e.target.value)}
                placeholder="Naam"
                required
                className="min-w-0 flex-1 rounded border border-border bg-white px-2 py-1.5 text-sm text-primary placeholder:text-text-muted"
              />
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                className="rounded border border-border bg-white px-2 py-1.5 text-sm text-primary"
              >
                <option>Persoonlijk medewerker</option>
                <option>Politiek assistent</option>
                <option>Beleidsmedewerker</option>
              </select>
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail (optioneel)"
              className="w-full rounded border border-border bg-white px-2 py-1.5 text-sm text-primary placeholder:text-text-muted"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50"
              >
                Opslaan
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-primary"
              >
                Annuleren
              </button>
            </div>
          </form>
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
  const { data: session } = useSession()
  const [person, setPerson] = useState<PersonDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchPerson = useCallback(() => {
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

  useEffect(() => {
    fetchPerson()
  }, [fetchPerson])

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
  const userId = session?.user?.id

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
          {person.fotoUrl ? (
            <img
              src={person.fotoUrl}
              alt=""
              className="mt-0.5 h-20 w-20 shrink-0 rounded-full object-cover bg-border-light"
              onError={(e) => {
                const target = e.currentTarget
                target.style.display = "none"
                const fallback = target.nextElementSibling as HTMLElement
                if (fallback) fallback.style.display = ""
              }}
            />
          ) : null}
          <span
            className="mt-1 h-4 w-4 shrink-0 rounded-full"
            style={{
              backgroundColor: person.fractie
                ? PARTY_COLORS[person.fractie] ?? "#888"
                : "#888",
              display: person.fotoUrl ? "none" : undefined,
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

            {person.email && (
              <a
                href={`mailto:${person.email}`}
                className="mt-2 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Mail className="h-3.5 w-3.5" />
                {person.email}
              </a>
            )}

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

            {person.bio && (
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                {person.bio}
              </p>
            )}

            {!person.isKabinet && (
              <a
                href={
                  person.tweedekamerUrl ??
                  `https://www.tweedekamer.nl/kamerleden_en_commissies/alle_kamerleden/${person.naam.toLowerCase().replace(/\s+/g, "-")}`
                }
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

      {/* Contactgegevens & Medewerkers */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <ContactenSection
          contacten={person.contacten ?? []}
          personId={id}
          userId={userId}
          onUpdate={fetchPerson}
        />
        <MedewerkersSection
          medewerkers={person.medewerkers ?? []}
          personId={id}
          userId={userId}
          onUpdate={fetchPerson}
        />
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
          title="Debatbijdragen"
          icon={<MessageSquare className="h-4 w-4 text-primary" />}
          personId={id}
          type="handelingen"
          naam={person.naam}
        />

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
