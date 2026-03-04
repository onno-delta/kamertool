import { auth } from "@/auth"
import Link from "next/link"

export async function Nav() {
  const session = await auth()

  return (
    <nav className="flex items-center gap-4">
      {session ? (
        <>
          <span className="text-sm text-gray-500">{session.user.email}</span>
          {session.user.organisationId && (
            <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
              Organisatie
            </Link>
          )}
          <Link href="/settings" className="text-sm text-blue-600 hover:underline">
            Instellingen
          </Link>
        </>
      ) : (
        <Link href="/login" className="text-sm text-blue-600 hover:underline">
          Inloggen
        </Link>
      )}
    </nav>
  )
}
