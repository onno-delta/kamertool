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
    <div className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-sm rounded-lg border border-border bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-primary">Kamertool</h1>
        <p className="mt-2 text-sm text-text-secondary">
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
            className="w-full rounded border-2 border-border px-4 py-3 text-primary placeholder:text-text-muted focus:border-primary focus:shadow-[0_0_0_1px_var(--color-primary)] focus:outline-none"
          />
          <button
            type="submit"
            className="mt-4 w-full rounded bg-primary py-3 text-sm font-medium text-white hover:bg-primary-dark active:translate-y-px"
          >
            Verstuur magic link
          </button>
        </form>
      </div>
    </div>
  )
}
