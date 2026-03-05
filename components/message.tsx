import type { UIMessage } from "ai"

const TOOL_LABELS: Record<string, string> = {
  searchKamerstukken: "Kamerstukken doorzoeken",
  searchHandelingen: "Handelingen doorzoeken",
  searchToezeggingen: "Toezeggingen doorzoeken",
  searchStemmingen: "Stemmingen doorzoeken",
  searchNews: "Nieuws doorzoeken",
  searchPartyDocs: "Partijdocumenten doorzoeken",
}

export function Message({ message }: { message: UIMessage }) {
  const { role, parts } = message
  const isUser = role === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-900"
        }`}
      >
        {parts.map((part, i) => {
          if (part.type === "text") {
            return (
              <div key={i} className="whitespace-pre-wrap leading-relaxed">
                {part.text}
              </div>
            )
          }

          if (part.type === "reasoning") {
            return (
              <div key={i} className="mb-2 text-xs italic opacity-60">
                {part.text}
              </div>
            )
          }

          if (part.type === "dynamic-tool") {
            const label = TOOL_LABELS[part.toolName] ?? part.toolName
            const isStreaming =
              part.state === "input-streaming" ||
              part.state === "input-available"
            const isDone =
              part.state === "output-available" ||
              part.state === "output-error"

            if (!isStreaming && !isDone) return null

            return (
              <div
                key={i}
                className="my-1.5 flex items-center gap-2 rounded-lg bg-white/60 px-3 py-1.5 text-xs text-gray-500"
              >
                {isStreaming && (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                    {label}...
                  </>
                )}
                {isDone && (
                  <>
                    <span className="text-green-600">&#10003;</span>
                    {label}
                  </>
                )}
              </div>
            )
          }

          return null
        })}
      </div>
    </div>
  )
}
