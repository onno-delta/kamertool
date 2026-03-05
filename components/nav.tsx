"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"

export function Nav() {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  // Don't render anything while loading to avoid flash
  if (status === "loading") {
    return (
      <header className="sticky top-0 z-50 flex shrink-0 items-center border-b border-gray-200 bg-white px-3 py-2 sm:px-6">
        <span className="text-lg font-semibold text-gray-900">Kamertool</span>
      </header>
    )
  }

  const links = session
    ? [
        { href: "/", label: "Chat" },
        { href: "/agenda", label: "Agenda" },
        { href: "/briefings", label: "Eerdere briefings" },
        ...(session.user.organisationId
          ? [{ href: "/dashboard", label: "Organisatie" }]
          : []),
        { href: "/settings", label: "Instellingen" },
      ]
    : [
        { href: "/", label: "Chat" },
        { href: "/agenda", label: "Agenda" },
      ]

  return (
    <header className="sticky top-0 z-50 flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-3 py-2 shadow-sm sm:px-6">
      <div className="flex min-w-0 items-center gap-3 sm:gap-6">
        <Link href="/" className="shrink-0 text-lg font-semibold text-gray-900">
          Kamertool
        </Link>
        {links.length > 0 && (
          <nav className="flex min-w-0 items-center gap-0.5 overflow-x-auto sm:gap-1">
            {links.map((link) => {
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
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        {session ? (
          <>
            <span className="hidden text-sm text-gray-500 sm:inline">
              {session.user.email}
            </span>
            <button
              onClick={() => signOut()}
              className="shrink-0 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 sm:px-3"
            >
              Uitloggen
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 sm:px-4"
          >
            Inloggen
          </Link>
        )}
      </div>
    </header>
  )
}
