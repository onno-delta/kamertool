"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"

export function Nav() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
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
      <header id="main-nav" className="sticky top-0 z-50 flex shrink-0 items-center bg-primary px-3 py-2 sm:px-6">
        <span className="text-lg font-semibold text-white">Kamertool</span>
      </header>
    )
  }

  const mainLinks = session
    ? [
        { href: "/", label: "Chat" },
        { href: "/agenda", label: "Agenda" },
      ]
    : [
        { href: "/", label: "Chat" },
        { href: "/agenda", label: "Agenda" },
      ]

  // Links shown in hamburger on mobile, inline on desktop
  const moreLinks = session
    ? [
        { href: "/briefings", label: "Eerdere briefings" },
        { href: "/instructies", label: "Instructies" },
        ...(session.user.organisationId
          ? [{ href: "/dashboard", label: "Organisatie" }]
          : []),
        { href: "/settings", label: "Instellingen" },
      ]
    : []

  return (
    <header id="main-nav" className="sticky top-0 z-50 flex shrink-0 items-center justify-between bg-primary px-3 py-2 sm:px-6">
      <div className="flex min-w-0 items-center gap-3 sm:gap-6">
        <Link href="/" className="shrink-0 text-lg font-semibold text-white">
          Kamertool
        </Link>
        <nav className="flex min-w-0 items-center gap-0.5 overflow-x-auto sm:gap-1">
          {mainLinks.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors sm:px-3 ${
                  active
                    ? "bg-white/20 text-white"
                    : "text-white/90 hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            )
          })}
          {moreLinks.map((link) => {
            const active = pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`hidden shrink-0 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors sm:inline-flex sm:px-3 ${
                  active
                    ? "bg-white/20 text-white"
                    : "text-white/90 hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        {moreLinks.length > 0 && (
          <div className="relative sm:hidden" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-lg p-1.5 text-white/90 hover:bg-white/10 hover:text-white"
              aria-label="Menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-primary-30 bg-white py-1 shadow-lg">
                {moreLinks.map((link) => {
                  const active = pathname.startsWith(link.href)
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`block px-4 py-2 text-sm text-primary ${
                        active
                          ? "bg-primary-15 font-medium"
                          : "hover:bg-primary-15"
                      }`}
                    >
                      {link.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}
        {session ? (
          <>
            <span className="hidden text-sm text-white/80 sm:inline">
              {session.user.email}
            </span>
            <button
              onClick={() => signOut()}
              className="shrink-0 rounded-lg px-2 py-1.5 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white sm:px-3"
            >
              Uitloggen
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-primary hover:bg-white/90 sm:px-4"
          >
            Inloggen
          </Link>
        )}
      </div>
    </header>
  )
}
