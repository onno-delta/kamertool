"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
  MessageSquare,
  Calendar,
  FileText,
  PenLine,
  Settings,
  Building2,
  Layers,
  Menu,
  X,
  Users,
  BookOpen,
} from "lucide-react"
import { useDataContext } from "./data-context"
import { PARTY_COLORS } from "@/lib/parties"

const NAV_ICONS: Record<string, React.ReactNode> = {
  "/": <MessageSquare className="h-[15px] w-[15px] opacity-80" />,
  "/agenda": <Calendar className="h-[15px] w-[15px] opacity-80" />,
  "/briefings": <FileText className="h-[15px] w-[15px] opacity-80" />,
  "/instructies": <PenLine className="h-[15px] w-[15px] opacity-80" />,
  "/dashboard": <Building2 className="h-[15px] w-[15px] opacity-80" />,
  "/smoelenboek": <Users className="h-[15px] w-[15px] opacity-80" />,
  "/handleiding": <BookOpen className="h-[15px] w-[15px] opacity-80" />,
  "/settings": <Settings className="h-[15px] w-[15px] opacity-80" />,
}

export function Nav() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { parties, preferences } = useDataContext()
  const selectedParty = parties.find(p => p.id === preferences?.defaultPartyId)

  // Close menu on route change
  const prevPathname = useRef(pathname)
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      setMenuOpen(false) // eslint-disable-line react-hooks/set-state-in-effect -- respond to route change
      prevPathname.current = pathname
    }
  }, [pathname])

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [menuOpen])

  // Don't render anything while loading to avoid flash
  if (status === "loading") {
    return (
      <header id="main-nav" className="sticky top-0 z-50">
        <div className="h-[3px] bg-primary" />
        <div className="hidden border-b border-border-light bg-white md:block">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <span className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
              <Layers className="h-[22px] w-[22px]" />
              Kamertool
            </span>
          </div>
        </div>
        <div className="bg-primary">
          <div className="mx-auto flex max-w-6xl items-center px-4 py-2 sm:px-6 md:hidden">
            <span className="text-lg font-bold tracking-tight text-white">Kamertool</span>
          </div>
        </div>
      </header>
    )
  }

  const allLinks = session
    ? [
        { href: "/", label: "Chat" },
        { href: "/agenda", label: "Agenda" },
        { href: "/briefings", label: "Briefings" },
        { href: "/instructies", label: "Instructies" },
        ...(session.user.organisationId
          ? [{ href: "/dashboard", label: "Organisatie" }]
          : []),
        { href: "/smoelenboek", label: "Smoelenboek" },
        { href: "/handleiding", label: "Handleiding" },
        { href: "/settings", label: "Instellingen" },
      ]
    : [
        { href: "/", label: "Chat" },
        { href: "/agenda", label: "Agenda" },
        { href: "/smoelenboek", label: "Smoelenboek" },
        { href: "/handleiding", label: "Handleiding" },
      ]

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href)
  }

  return (
    <header id="main-nav" className="sticky top-0 z-50">
      {/* Rijkshuisstijl accent bar */}
      <div className="h-[3px] bg-primary" />

      {/* Band 1 — Header zone (hidden on mobile) */}
      <div className="hidden border-b border-border-light bg-white md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary hover:text-primary-dark"
          >
            <Layers className="h-[22px] w-[22px]" />
            Kamertool
            {selectedParty && (
              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                style={{ backgroundColor: PARTY_COLORS[selectedParty.shortName] }}
              >
                {selectedParty.shortName}
              </span>
            )}
          </Link>
          <div className="flex items-center gap-4">
            {session && (
              <span className="text-[0.8125rem] text-text-muted">
                {session.user.email}
              </span>
            )}
            {session ? (
              <button
                onClick={() => signOut()}
                className="rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-primary hover:bg-surface-muted"
              >
                Uitloggen
              </button>
            ) : (
              <Link
                href="/login"
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-dark"
              >
                Inloggen
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Band 2 — Navigation bar */}
      <div className="bg-primary">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 sm:px-6">
          {/* Mobile: logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-white md:hidden"
          >
            Kamertool
            {selectedParty && (
              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                style={{ backgroundColor: PARTY_COLORS[selectedParty.shortName] }}
              >
                {selectedParty.shortName}
              </span>
            )}
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden items-center gap-0.5 md:flex">
            {allLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`-my-2 inline-flex items-center gap-1.5 px-4 py-2 text-[0.8125rem] font-medium ${
                  isActive(link.href)
                    ? "bg-white/15 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                {NAV_ICONS[link.href]}
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile: right side */}
          <div className="flex items-center gap-2 md:hidden">
            {session ? (
              <button
                onClick={() => signOut()}
                className="rounded-md border border-white/30 px-3 py-1.5 text-xs font-medium text-white hover:border-white hover:bg-white/10"
              >
                Uitloggen
              </button>
            ) : (
              <Link
                href="/login"
                className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-primary hover:bg-white/90"
              >
                Inloggen
              </Link>
            )}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="rounded p-1.5 text-white/90 hover:bg-white/10 hover:text-white"
                aria-label="Menu"
              >
                {menuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-lg border border-border bg-white py-1 text-primary shadow-lg">
                  {allLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-2.5 px-4 py-2 text-sm ${
                        isActive(link.href)
                          ? "bg-surface-muted font-medium text-primary-dark"
                          : "hover:bg-surface-muted"
                      }`}
                    >
                      {NAV_ICONS[link.href]}
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
