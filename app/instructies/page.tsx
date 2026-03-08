"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { MEETING_SKILLS, getDefaultSkill } from "@/lib/meeting-skills"
import { useDataContext } from "@/components/data-context"
import {
  ChevronDown,
  Megaphone,
  Users,
  Scale,
  Timer,
  FileText,
  Coins,
  CircleDot,
  ClipboardList,
  Presentation,
  MessageCircle,
  Vote,
  CalendarClock,
  MapPin,
  RotateCcw,
  Save,
  Check,
} from "lucide-react"

/** Map each meeting type to a lucide icon */
const SKILL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Plenair debat": Megaphone,
  "Commissiedebat": Users,
  "Wetgevingsoverleg": Scale,
  "Tweeminutendebat": Timer,
  "Notaoverleg": FileText,
  "Begrotingsoverleg": Coins,
  "Rondetafelgesprek": CircleDot,
  "Procedurevergadering": ClipboardList,
  "Technische briefing": Presentation,
  "Gesprek": MessageCircle,
  "Stemmingen": Vote,
  "Regeling van werkzaamheden": CalendarClock,
  "Werkbezoek": MapPin,
}

export default function InstructiesPage() {
  const { preferences, refreshPreferences } = useDataContext()
  const [meetingSkills, setMeetingSkills] = useState<Record<string, string>>({})
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const prefsApplied = useRef(false)

  // Apply cached preferences
  useEffect(() => {
    if (prefsApplied.current) return
    if (preferences) {
      if (preferences.meetingSkills) setMeetingSkills(preferences.meetingSkills)
      prefsApplied.current = true
      setLoading(false)
    }
  }, [preferences])

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
    await refreshPreferences()
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
    <div className="mx-auto max-w-3xl px-4 py-6 pb-10 sm:px-6 sm:py-8">
      <nav aria-label="Kruimelpad" className="mb-4 text-sm text-text-muted">
        <Link href="/" className="hover:text-primary hover:underline">Home</Link>
        <span className="mx-1.5">&rsaquo;</span>
        <span className="text-primary font-medium">Instructies</span>
      </nav>

      <section className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary">Instructies</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Pas aan hoe de AI briefings genereert per type vergadering. Elk vergadertype heeft
          standaardinstructies die je hier kunt overschrijven met eigen tekst.
        </p>
      </section>

      <div className="space-y-3">
        {MEETING_SKILLS.map((skill) => {
          const isExpanded = expandedSkill === skill.soort
          const hasCustom = skill.soort in meetingSkills && meetingSkills[skill.soort].trim() !== skill.prompt.trim()
          const Icon = SKILL_ICONS[skill.soort]
          return (
            <div
              key={skill.soort}
              className={`rounded-xl border bg-white shadow-sm transition-shadow ${
                isExpanded
                  ? "border-primary/30 shadow-md"
                  : "border-border hover:shadow-md"
              }`}
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedSkill(isExpanded ? null : skill.soort)
                }
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  {Icon && (
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      isExpanded
                        ? "bg-primary/10 text-primary"
                        : "bg-surface-muted text-text-muted"
                    }`}>
                      <Icon className="h-[18px] w-[18px]" />
                    </div>
                  )}
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-medium text-primary">
                      {skill.label}
                    </span>
                    {hasCustom && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        aangepast
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-text-muted transition-transform duration-200 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isExpanded && (
                <div className="border-t border-border-light px-5 pb-5 pt-4">
                  <label className="mb-1.5 block text-xs font-medium text-text-muted">
                    Prompt template
                  </label>
                  <textarea
                    value={meetingSkills[skill.soort] ?? skill.prompt}
                    onChange={(e) => {
                      setMeetingSkills((prev) => ({
                        ...prev,
                        [skill.soort]: e.target.value,
                      }))
                      setSaved(false)
                    }}
                    rows={14}
                    className="w-full rounded-xl border border-border bg-surface-muted/50 px-4 py-3 font-mono text-[13px] leading-relaxed text-primary placeholder:text-text-muted focus:border-primary/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10"
                  />
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-text-muted">
                      {hasCustom
                        ? "Je gebruikt een aangepaste versie van deze instructie."
                        : "Dit is de standaardinstructie. Pas de tekst aan om je eigen versie op te slaan."}
                    </p>
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
                        className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                      >
                        <RotateCcw className="h-3 w-3" />
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

      <div className="mt-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-dark active:translate-y-px disabled:opacity-50"
        >
          {saving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Opslaan...
            </>
          ) : saved ? (
            <>
              <Check className="h-4 w-4" />
              Opgeslagen
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Instructies opslaan
            </>
          )}
        </button>
      </div>
    </div>
  )
}
