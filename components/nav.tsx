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
      <header id="main-nav" className="sticky top-0 z-50">
        {/* Accent bar */}
        <div className="h-1 bg-primary" />
        {/* Header zone skeleton */}
        <div className="hidden border-b border-border-light bg-white md:block">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <span className="text-xl font-bold tracking-tight text-primary">Kamertool</span>
          </div>
        </div>
        {/* Nav bar skeleton */}
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
        { href: "/briefings", label: "Eerdere briefings" },
        { href: "/instructies", label: "Instructies" },
        ...(session.user.organisationId
          ? [{ href: "/dashboard", label: "Organisatie" }]
          : []),
        { href: "/settings", label: "Instellingen" },
      ]
    : [
        { href: "/", label: "Chat" },
        { href: "/agenda", label: "Agenda" },
      ]

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href)
  }

  return (
    <header id="main-nav" className="sticky top-0 z-50">
      {/* Rijkshuisstijl accent bar */}
      <div className="h-1 bg-primary" />

      {/* Band 1 — Header zone (hidden on mobile) */}
      <div className="hidden border-b border-border-light bg-white md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-primary hover:text-primary-dark"
          >
            Kamertool
          </Link>
          <div className="flex items-center gap-4">
            {session && (
              <span className="text-sm text-text-muted">
                {session.user.email}
              </span>
            )}
            {session ? (
              <button
                onClick={() => signOut()}
                className="rounded border border-border bg-white px-3 py-1.5 text-xs font-medium text-primary hover:bg-surface-muted"
              >
                Uitloggen
              </button>
            ) : (
              <Link
                href="/login"
                className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-dark"
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
            className="text-lg font-bold tracking-tight text-white md:hidden"
          >
            Kamertool
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden items-center gap-0.5 md:flex">
            {allLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`-my-2 px-4 py-2 text-sm font-medium ${
                  isActive(link.href)
                    ? "bg-white/20 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile: right side */}
          <div className="flex items-center gap-2 md:hidden">
            {session ? (
              <button
                onClick={() => signOut()}
                className="rounded border border-white/30 px-3 py-1.5 text-xs font-medium text-white hover:border-white hover:bg-white/10"
              >
                Uitloggen
              </button>
            ) : (
              <Link
                href="/login"
                className="rounded bg-white px-3 py-1.5 text-xs font-medium text-primary hover:bg-white/90"
              >
                Inloggen
              </Link>
            )}
            {allLinks.length > 2 && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="rounded p-1.5 text-white/90 hover:bg-white/10 hover:text-white"
                  aria-label="Menu"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    {menuOpen ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    )}
                  </svg>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-lg border border-border bg-white py-1 text-primary shadow-lg">
                    {allLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`block px-4 py-2 text-sm ${
                          isActive(link.href)
                            ? "bg-surface-muted font-medium text-primary-dark"
                            : "hover:bg-surface-muted"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
