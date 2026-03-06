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
      <header
        id="main-nav"
        className="sticky top-0 z-50 border-b border-primary-30 bg-primary-dark/95 text-white backdrop-blur"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
          <span className="text-lg font-semibold tracking-tight">Kamertool</span>
        </div>
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
    <header
      id="main-nav"
      className="sticky top-0 z-50 border-b border-primary-30 bg-primary-dark/95 text-white backdrop-blur"
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-6">
          <Link
            href="/"
            className="shrink-0 text-lg font-semibold tracking-tight text-white hover:text-white"
          >
            Kamertool
          </Link>
          <nav className="hidden min-w-0 items-center gap-1 md:flex">
            {mainLinks.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`border-b-2 px-2.5 py-1 text-sm font-medium transition-colors ${
                    active
                      ? "border-white text-white"
                      : "border-transparent text-white/90 hover:border-white/70 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          {session && (
            <span className="hidden max-w-xs truncate text-sm text-white/80 sm:inline">
              {session.user.email}
            </span>
          )}
          {moreLinks.length > 0 && (
            <nav className="hidden items-center gap-1 lg:flex">
              {moreLinks.map((link) => {
                const active = pathname.startsWith(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`border-b-2 px-2.5 py-1 text-sm font-medium transition-colors ${
                      active
                        ? "border-white text-white"
                        : "border-transparent text-white/90 hover:border-white/70 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>
          )}
          <div className="flex items-center gap-1">
            {session ? (
              <button
                onClick={() => signOut()}
                className="rounded-full border border-white/30 px-3 py-1.5 text-xs font-medium text-white hover:border-white hover:bg-white/10"
              >
                Uitloggen
              </button>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-primary hover:bg-white/90"
              >
                Inloggen
              </Link>
            )}
            {moreLinks.length > 0 && (
              <div className="relative md:hidden" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="rounded-full p-1.5 text-white/90 hover:bg-white/10 hover:text-white"
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
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-primary-30 bg-white py-1 text-primary shadow-lg">
                    {mainLinks.map((link) => {
                      const active =
                        link.href === "/"
                          ? pathname === "/"
                          : pathname.startsWith(link.href)
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={`block px-4 py-2 text-sm ${
                            active
                              ? "bg-primary-15 font-medium text-primary-dark"
                              : "hover:bg-primary-15"
                          }`}
                        >
                          {link.label}
                        </Link>
                      )
                    })}
                    <div className="my-1 h-px bg-primary-15" />
                    {moreLinks.map((link) => {
                      const active = pathname.startsWith(link.href)
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={`block px-4 py-2 text-sm ${
                            active
                              ? "bg-primary-15 font-medium text-primary-dark"
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
          </div>
        </div>
      </div>
    </header>
  )
}
