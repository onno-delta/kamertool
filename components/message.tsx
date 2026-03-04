import type { UIMessage } from "ai"

export function Message({ message }: { message: UIMessage }) {
  const { role, parts } = message

  return (
    <div
      className={`flex ${role === "user" ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          role === "user"
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-900"
        }`}
      >
        {parts.map((part, i) => {
          if (part.type === "text") {
            return (
              <div key={i} className="whitespace-pre-wrap">
                {part.text}
              </div>
            )
          }

          if (part.type === "reasoning") {
            return (
              <div key={i} className="mb-2 text-xs italic text-gray-500">
                {part.text}
              </div>
            )
          }

          // Handle dynamic tool calls (server-side tools from the chat route)
          if (part.type === "dynamic-tool") {
            const isStreaming =
              part.state === "input-streaming" ||
              part.state === "input-available"
            const isDone =
              part.state === "output-available" ||
              part.state === "output-error"
            return (
              <div key={i} className="mb-2 text-xs italic text-gray-500">
                {isStreaming && `Zoeken: ${part.toolName}...`}
                {isDone && `Klaar: ${part.toolName}`}
              </div>
            )
          }

          return null
        })}
      </div>
    </div>
  )
}
