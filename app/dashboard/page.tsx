"use client"

import { useState, useEffect } from "react"
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
      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="mb-4 text-2xl font-semibold text-gray-900">Organisatie</h1>
        <p className="text-gray-500">
          Je bent nog niet gekoppeld aan een organisatie. Neem contact op met je fractiebeheerder.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-8 text-2xl font-semibold text-gray-900">Organisatie Dashboard</h1>

      {loading && <p className="text-gray-500">Laden...</p>}

      {!loading && (
        <div className="space-y-10">
          {/* Members section */}
          <section>
            <h2 className="mb-4 text-lg font-medium text-gray-800">Leden</h2>
            <div className="mb-4 space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                  <div>
                    <span className="font-medium text-gray-900">{m.name || m.email}</span>
                    {m.name && <span className="ml-2 text-sm text-gray-500">{m.email}</span>}
                  </div>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
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
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  disabled={inviting || !newEmail}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {inviting ? "Uitnodigen..." : "Uitnodigen"}
                </button>
              </form>
            )}
          </section>

          {/* Documents section */}
          <section>
            <h2 className="mb-4 text-lg font-medium text-gray-800">Documenten</h2>
            {docs.length > 0 ? (
              <div className="mb-4 space-y-2">
                {docs.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                    <span className="font-medium text-gray-900">{d.title}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(d.createdAt).toLocaleDateString("nl-NL")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mb-4 text-sm text-gray-500">Nog geen documenten geupload.</p>
            )}

            <form onSubmit={handleUploadDoc} className="space-y-3 rounded-xl border border-gray-200 p-4">
              <input
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                placeholder="Documenttitel"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400"
              />
              <textarea
                value={newDocContent}
                onChange={(e) => setNewDocContent(e.target.value)}
                placeholder="Plak hier de inhoud van het document..."
                rows={6}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400"
              />
              <button
                type="submit"
                disabled={uploading || !newDocTitle || !newDocContent}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? "Uploaden..." : "Document toevoegen"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
