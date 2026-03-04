import { signIn } from "@/auth"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-gray-900">Inloggen</h1>
        <p className="mt-2 text-sm text-gray-500">
          Je ontvangt een magic link via e-mail.
        </p>
        <form
          action={async (formData: FormData) => {
            "use server"
            await signIn("resend", {
              email: formData.get("email"),
              redirectTo: "/",
            })
          }}
          className="mt-6"
        >
          <input
            type="email"
            name="email"
            placeholder="je@email.nl"
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            className="mt-4 w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700"
          >
            Verstuur magic link
          </button>
        </form>
      </div>
    </div>
  )
}
