"use client"

import { useState, useEffect } from "react"
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
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl overflow-y-auto px-6 py-10">
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">Instructies</h1>
      <p className="mb-6 text-sm text-gray-500">
        Pas aan hoe de AI briefings genereert per type vergadering. Elk vergadertype heeft standaardinstructies die bepalen welke secties worden geschreven, hoe de speech eruitziet, en waar de nadruk ligt. Je kunt deze aanpassen aan je eigen werkwijze.
      </p>

      <div className="space-y-2">
        {MEETING_SKILLS.map((skill) => {
          const isExpanded = expandedSkill === skill.soort
          const hasCustom = skill.soort in meetingSkills && meetingSkills[skill.soort].trim() !== skill.prompt.trim()
          return (
            <div
              key={skill.soort}
              className="rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedSkill(isExpanded ? null : skill.soort)
                }
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-medium text-gray-800">
                    {skill.label}
                  </span>
                  {hasCustom && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
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
                  className={`text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {isExpanded && (
                <div className="border-t border-gray-100 px-4 py-4">
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
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
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Opslaan..." : saved ? "Opgeslagen" : "Instructies opslaan"}
        </button>
      </div>
    </div>
  )
}
