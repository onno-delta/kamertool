"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"

type Member = { id: string; name: string | null; email: string | null; role: string }
type Doc = { id: string; title: string; createdAt: string }

export default function DashboardPage() {
  const { data: session } = useSession()
  const orgId = session?.user?.organisationId

  const [members, setMembers] = useState<Member[]>([])
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState("")
  const [newDocTitle, setNewDocTitle] = useState("")
  const [newDocContent, setNewDocContent] = useState("")
  const [inviting, setInviting] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function loadData() {
    if (!orgId) return
    setLoading(true)
    const [membersRes, docsRes] = await Promise.all([
      fetch(`/api/organisations/${orgId}/members`),
      fetch(`/api/organisations/${orgId}/documents`),
    ])
    if (membersRes.ok) setMembers(await membersRes.json())
    if (docsRes.ok) setDocs(await docsRes.json())
    setLoading(false)
  }

  useEffect(() => {
    if (orgId) loadData()
  }, [orgId])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!orgId || !newEmail) return
    setInviting(true)
    await fetch(`/api/organisations/${orgId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail }),
    })
    setNewEmail("")
    await loadData()
    setInviting(false)
  }

  async function handleUploadDoc(e: React.FormEvent) {
    e.preventDefault()
    if (!orgId || !newDocTitle || !newDocContent) return
    setUploading(true)
    await fetch(`/api/organisations/${orgId}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newDocTitle, content: newDocContent }),
    })
    setNewDocTitle("")
    setNewDocContent("")
    await loadData()
    setUploading(false)
  }

  if (!orgId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="rounded-lg border border-border bg-white px-6 py-6">
          <h1 className="mb-2 text-2xl font-semibold text-primary">Organisatie</h1>
          <p className="text-sm text-text-secondary">
            Je bent nog niet gekoppeld aan een organisatie. Neem contact op met je fractiebeheerder.
          </p>
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <nav aria-label="Kruimelpad" className="mb-4 text-sm text-text-muted">
        <Link href="/" className="hover:text-primary hover:underline">Home</Link>
        <span className="mx-1.5">&rsaquo;</span>
        <span className="text-primary font-medium">Organisatie</span>
      </nav>

      <section className="mb-6">
        <h1 className="text-4xl font-bold tracking-tight text-primary">Organisatiedashboard</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Beheer leden van je fractie en upload documenten die je in Kamertool wilt gebruiken.
        </p>
      </section>

      {loading && <p className="text-text-secondary">Laden...</p>}

      {!loading && (
        <div className="space-y-6">
          {/* Members card */}
          <div className="rounded-lg border border-border bg-white p-6">
            <h2 className="mb-4 text-lg font-medium text-primary">Leden</h2>
            <div className="mb-4 space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg bg-surface-muted px-4 py-3">
                  <div>
                    <span className="font-medium text-primary">{m.name || m.email}</span>
                    {m.name && <span className="ml-2 text-sm text-text-secondary">{m.email}</span>}
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-text-muted ring-1 ring-border">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>

            {session?.user?.role === "admin" && (
              <form onSubmit={handleInvite} className="flex gap-3">
                <input
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="E-mailadres van nieuw lid"
                  type="email"
                  className="flex-1 rounded border border-border px-3 py-2 text-primary placeholder:text-text-muted"
                />
                <button
                  type="submit"
                  disabled={inviting || !newEmail}
                  className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark active:translate-y-px disabled:opacity-50"
                >
                  {inviting ? "Uitnodigen..." : "Uitnodigen"}
                </button>
              </form>
            )}
          </div>

          {/* Documents card */}
          <div className="rounded-lg border border-border bg-white p-6">
            <h2 className="mb-4 text-lg font-medium text-primary">Documenten</h2>
            {docs.length > 0 ? (
              <div className="mb-4 space-y-2">
                {docs.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg bg-surface-muted px-4 py-3">
                    <span className="font-medium text-primary">{d.title}</span>
                    <span className="text-sm text-text-muted">
                      {new Date(d.createdAt).toLocaleDateString("nl-NL")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mb-4 text-sm text-text-secondary">Nog geen documenten geupload.</p>
            )}

            <div className="rounded-lg bg-surface-muted p-4">
              <form onSubmit={handleUploadDoc} className="space-y-3">
                <input
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Documenttitel"
                  className="w-full rounded border border-border bg-white px-3 py-2 text-primary placeholder:text-text-muted"
                />
                <textarea
                  value={newDocContent}
                  onChange={(e) => setNewDocContent(e.target.value)}
                  placeholder="Plak hier de inhoud van het document..."
                  rows={6}
                  className="w-full rounded border border-border bg-white px-3 py-2 text-primary placeholder:text-text-muted"
                />
                <button
                  type="submit"
                  disabled={uploading || !newDocTitle || !newDocContent}
                  className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark active:translate-y-px disabled:opacity-50"
                >
                  {uploading ? "Uploaden..." : "Document toevoegen"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
