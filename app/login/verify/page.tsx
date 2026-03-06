export default function VerifyPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-primary-15">
      <div className="w-full max-w-sm rounded-2xl border border-primary-30 bg-white p-8 text-center shadow-lg">
        <h1 className="text-2xl font-semibold text-primary">Check je e-mail</h1>
        <p className="mt-2 text-primary-75">
          We hebben een magic link verstuurd. Klik op de link in je e-mail om in te loggen.
        </p>
      </div>
    </div>
  )
}
