"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Upload, FileText, X } from "lucide-react"

type Member = { id: string; name: string | null; email: string | null; role: string }
type Doc = { id: string; title: string; createdAt: string }

const ACCEPTED_TYPES = ".pdf,.docx,.xlsx,.xls,.txt,.md,.csv"

export default function DashboardPage() {
  const { data: session } = useSession()
  const orgId = session?.user?.organisationId

  const [members, setMembers] = useState<Member[]>([])
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState("")
  const [newDocTitle, setNewDocTitle] = useState("")
  const [newDocContent, setNewDocContent] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [inviting, setInviting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadData = useCallback(async () => {
    if (!orgId) return
    setLoading(true)
    const [membersRes, docsRes] = await Promise.all([
      fetch(`/api/organisations/${orgId}/members`),
      fetch(`/api/organisations/${orgId}/documents`),
    ])
    if (membersRes.ok) setMembers(await membersRes.json())
    if (docsRes.ok) setDocs(await docsRes.json())
    setLoading(false)
  }, [orgId])

  useEffect(() => {
    if (orgId) loadData() // eslint-disable-line react-hooks/set-state-in-effect -- async data fetch
  }, [orgId, loadData])

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
    if (!orgId) return
    setUploadError(null)

    // File upload or text paste
    if (selectedFile) {
      setUploading(true)
      const formData = new FormData()
      formData.append("file", selectedFile)
      if (newDocTitle) formData.append("title", newDocTitle)
      const res = await fetch(`/api/organisations/${orgId}/documents`, {
        method: "POST",
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json()
        setUploadError(data.error ?? "Upload mislukt")
        setUploading(false)
        return
      }
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    } else if (newDocTitle && newDocContent) {
      setUploading(true)
      const res = await fetch(`/api/organisations/${orgId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newDocTitle, content: newDocContent }),
      })
      if (!res.ok) {
        const data = await res.json()
        setUploadError(data.error ?? "Upload mislukt")
        setUploading(false)
        return
      }
    } else {
      return
    }

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
    <div className="mx-auto max-w-3xl px-4 py-6 pb-10 sm:px-6 sm:py-8">
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
                {/* File upload area */}
                <div
                  className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed bg-white px-4 py-6 transition-colors ${
                    selectedFile
                      ? "border-primary/40 bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_TYPES}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null
                      setSelectedFile(file)
                      setUploadError(null)
                      if (file && !newDocTitle) {
                        setNewDocTitle(file.name.replace(/\.[^.]+$/, ""))
                      }
                    }}
                  />
                  {selectedFile ? (
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium text-primary">{selectedFile.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedFile(null)
                          if (fileInputRef.current) fileInputRef.current.value = ""
                        }}
                        className="ml-1 rounded-full p-0.5 text-text-muted hover:bg-border-light hover:text-primary"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-text-muted" />
                      <p className="text-sm text-text-secondary">
                        Klik om een bestand te kiezen
                      </p>
                      <p className="text-xs text-text-muted">
                        PDF, DOCX, XLSX, TXT, CSV (max 4MB)
                      </p>
                    </>
                  )}
                </div>

                <input
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Documenttitel (optioneel bij bestandsupload)"
                  className="w-full rounded border border-border bg-white px-3 py-2 text-primary placeholder:text-text-muted"
                />

                {!selectedFile && (
                  <>
                    <div className="flex items-center gap-3 text-xs text-text-muted">
                      <span className="h-px flex-1 bg-border-light" />
                      of plak tekst
                      <span className="h-px flex-1 bg-border-light" />
                    </div>
                    <textarea
                      value={newDocContent}
                      onChange={(e) => setNewDocContent(e.target.value)}
                      placeholder="Plak hier de inhoud van het document..."
                      rows={4}
                      className="w-full rounded border border-border bg-white px-3 py-2 text-primary placeholder:text-text-muted"
                    />
                  </>
                )}

                {uploadError && (
                  <p className="text-sm text-red-600">{uploadError}</p>
                )}

                <button
                  type="submit"
                  disabled={uploading || (!selectedFile && (!newDocTitle || !newDocContent))}
                  className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark active:translate-y-px disabled:opacity-50"
                >
                  {uploading ? "Verwerken..." : "Document toevoegen"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
