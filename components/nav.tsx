"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"

export function Nav() {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session) return null

  const links = [
    { href: "/", label: "Chat" },
    { href: "/briefings", label: "Briefings" },
    ...(session.user.organisationId
      ? [{ href: "/dashboard", label: "Organisatie" }]
      : []),
    { href: "/settings", label: "Instellingen" },
  ]

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-lg font-semibold text-gray-900">
          Kamertool
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
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
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">{session.user.email}</span>
        <button
          onClick={() => signOut()}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700"
        >
          Uitloggen
        </button>
      </div>
    </header>
  )
}
