import { signIn } from "@/auth"
import { AuthError } from "next-auth"
import { redirect } from "next/navigation"

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  return <LoginForm searchParams={searchParams} />
}

async function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="flex flex-1 items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-gray-900">Kamertool</h1>
        <p className="mt-2 text-sm text-gray-500">
          Log in met je e-mail. Je ontvangt een magic link.
        </p>
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            Inloggen mislukt. Probeer het opnieuw.
          </div>
        )}
        <form
          action={async (formData: FormData) => {
            "use server"
            try {
              await signIn("resend", {
                email: formData.get("email"),
                redirectTo: "/",
              })
            } catch (error) {
              if (error instanceof AuthError) {
                redirect(`/login?error=${error.type}`)
              }
              throw error // Re-throw NEXT_REDIRECT and other non-auth errors
            }
          }}
          className="mt-6"
        >
          <input
            type="email"
            name="email"
            placeholder="je@email.nl"
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="mt-4 w-full rounded-xl bg-blue-600 py-3 font-medium text-white shadow-sm hover:bg-blue-700"
          >
            Verstuur magic link
          </button>
        </form>
      </div>
    </div>
  )
}
