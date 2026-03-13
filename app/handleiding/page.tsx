import fs from "fs"
import path from "path"
import ReactMarkdown from "react-markdown"

export default function HandleidingPage() {
  const md = fs.readFileSync(
    path.join(process.cwd(), "docs", "HANDLEIDING.md"),
    "utf-8"
  )

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <article className="prose prose-slate max-w-none">
        <ReactMarkdown>{md}</ReactMarkdown>
      </article>
    </main>
  )
}
