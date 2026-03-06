"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { MEETING_SKILLS, getDefaultSkill } from "@/lib/meeting-skills"

export default function InstructiesPage() {
  const [meetingSkills, setMeetingSkills] = useState<Record<string, string>>({})
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/settings/preferences")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.meetingSkills) setMeetingSkills(data.meetingSkills)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    // Only save skills that differ from the default
    const customOnly: Record<string, string> = {}
    for (const [soort, prompt] of Object.entries(meetingSkills)) {
      if (prompt.trim() && prompt.trim() !== getDefaultSkill(soort).trim()) {
        customOnly[soort] = prompt
      }
    }
    await fetch("/api/settings/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingSkills: customOnly }),
    })
    setMeetingSkills(customOnly)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
      <nav aria-label="Kruimelpad" className="mb-4 text-sm text-text-muted">
        <Link href="/" className="hover:text-primary hover:underline">Home</Link>
        <span className="mx-1.5">&rsaquo;</span>
        <span className="text-primary font-medium">Instructies</span>
      </nav>

      <section className="mb-6">
        <h1 className="text-4xl font-bold tracking-tight text-primary">Instructies</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Pas aan hoe de AI briefings genereert per type vergadering. Elk vergadertype heeft
          standaardinstructies die je hier kunt overschrijven met eigen tekst.
        </p>
      </section>

      <div className="space-y-2">
        {MEETING_SKILLS.map((skill) => {
          const isExpanded = expandedSkill === skill.soort
          const hasCustom = skill.soort in meetingSkills && meetingSkills[skill.soort].trim() !== skill.prompt.trim()
          return (
            <div
              key={skill.soort}
              className="rounded-lg border border-border bg-white"
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedSkill(isExpanded ? null : skill.soort)
                }
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-medium text-primary">
                    {skill.label}
                  </span>
                  {hasCustom && (
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-medium text-primary">
                      aangepast
                    </span>
                  )}
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {isExpanded && (
                <div className="border-t border-border-light px-4 py-4">
                  <textarea
                    value={meetingSkills[skill.soort] ?? skill.prompt}
                    onChange={(e) => {
                      setMeetingSkills((prev) => ({
                        ...prev,
                        [skill.soort]: e.target.value,
                      }))
                      setSaved(false)
                    }}
                    rows={12}
                    className="w-full rounded border border-border px-3 py-2 text-sm text-primary"
                  />
                  <div className="mt-2 flex items-center justify-end">
                    {hasCustom && (
                      <button
                        type="button"
                        onClick={() => {
                          setMeetingSkills((prev) => {
                            const next = { ...prev }
                            delete next[skill.soort]
                            return next
                          })
                          setSaved(false)
                        }}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Terugzetten naar standaard
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark active:translate-y-px disabled:opacity-50"
        >
          {saving ? "Opslaan..." : saved ? "Opgeslagen" : "Instructies opslaan"}
        </button>
      </div>
    </div>
  )
}
