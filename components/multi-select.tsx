"use client"

import { useState, useRef, useEffect } from "react"

type Option = {
  value: string
  label: string
  count?: number
}

type Props = {
  label: string
  options: Option[]
  selected: Set<string>
  onChange: (selected: Set<string>) => void
}

export function MultiSelect({ label, options, selected, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  function toggle(value: string) {
    const next = new Set(selected)
    if (next.has(value)) {
      next.delete(value)
    } else {
      next.add(value)
    }
    onChange(next)
  }

  function clear() {
    onChange(new Set())
  }

  const buttonLabel =
    selected.size === 0
      ? label
      : selected.size === 1
        ? options.find((o) => selected.has(o.value))?.label ?? label
        : `${label} (${selected.size})`

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
          selected.size > 0
            ? "border-blue-300 bg-blue-50 text-blue-700"
            : "border-gray-200 bg-white text-gray-700"
        }`}
      >
        <span className="max-w-[200px] truncate">{buttonLabel}</span>
        <svg
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="max-h-64 overflow-y-auto py-1">
            {options.map((opt) => {
              const isSelected = selected.has(opt.value)
              return (
                <button
                  key={opt.value}
                  onClick={() => toggle(opt.value)}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                    isSelected ? "bg-gray-50" : "hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      isSelected
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {isSelected && (
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-gray-700">
                    {opt.label}
                  </span>
                  {opt.count !== undefined && (
                    <span className="shrink-0 text-xs text-gray-400">{opt.count}</span>
                  )}
                </button>
              )
            })}
          </div>
          {selected.size > 0 && (
            <div className="border-t border-gray-100 px-3 py-2">
              <button
                onClick={clear}
                className="text-xs font-medium text-gray-500 hover:text-gray-700"
              >
                Filters wissen
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
