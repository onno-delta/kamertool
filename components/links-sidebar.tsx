"use client"

import { useState } from "react"
import {
  ExternalLink,
  Landmark,
  Scale,
  BookOpen,
  BarChart3,
  Newspaper,
  ChevronDown,
} from "lucide-react"

type LinkItem = {
  label: string
  url: string
}

type LinkGroup = {
  title: string
  icon: React.ReactNode
  links: LinkItem[]
}

const LINK_GROUPS: LinkGroup[] = [
  {
    title: "Kamer",
    icon: <Landmark className="h-3.5 w-3.5" />,
    links: [
      { label: "Tweede Kamer", url: "https://www.tweedekamer.nl" },
      { label: "Kameragenda", url: "https://www.tweedekamer.nl/debat_en_vergadering" },
      { label: "Kamerstukken", url: "https://www.tweedekamer.nl/kamerstukken" },
      { label: "Open Data TK", url: "https://opendata.tweedekamer.nl" },
      { label: "Parlement.com", url: "https://www.parlement.com" },
    ],
  },
  {
    title: "Wetgeving",
    icon: <Scale className="h-3.5 w-3.5" />,
    links: [
      { label: "Wetten.nl", url: "https://wetten.overheid.nl" },
      { label: "Officielebekendmakingen.nl", url: "https://www.officielebekendmakingen.nl" },
      { label: "Internetconsultatie", url: "https://www.internetconsultatie.nl" },
      { label: "Raad van State", url: "https://www.raadvanstate.nl" },
    ],
  },
  {
    title: "Advies & onderzoek",
    icon: <BarChart3 className="h-3.5 w-3.5" />,
    links: [
      { label: "CPB", url: "https://www.cpb.nl" },
      { label: "Rekenkamer", url: "https://www.rekenkamer.nl" },
      { label: "SER", url: "https://www.ser.nl" },
      { label: "WRR", url: "https://www.wrr.nl" },
      { label: "SCP", url: "https://www.scp.nl" },
    ],
  },
  {
    title: "Overheid",
    icon: <BookOpen className="h-3.5 w-3.5" />,
    links: [
      { label: "Rijksoverheid", url: "https://www.rijksoverheid.nl" },
      { label: "Rijksbegroting", url: "https://www.rijksfinancien.nl" },
      { label: "CBS", url: "https://www.cbs.nl" },
    ],
  },
  {
    title: "Nieuws",
    icon: <Newspaper className="h-3.5 w-3.5" />,
    links: [
      { label: "NOS Politiek", url: "https://nos.nl/politiek" },
      { label: "RTL Politiek", url: "https://www.rtlnieuws.nl/politiek" },
      { label: "De Hofvijver", url: "https://www.montesquieu-instituut.nl/hofvijver" },
    ],
  },
]

function CollapsibleGroup({ group }: { group: LinkGroup }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 rounded px-1 py-1 text-xs font-medium text-primary transition-colors hover:bg-surface-muted"
      >
        {group.icon}
        <span className="flex-1 text-left">{group.title}</span>
        <ChevronDown className={`h-3 w-3 text-text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="mt-0.5 space-y-0.5 pl-5">
          {group.links.map((link) => (
            <li key={link.url}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded px-2 py-1 text-[0.8125rem] text-text-secondary transition-colors hover:bg-surface-muted hover:text-primary"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function LinksSidebar() {
  return (
    <div className="sticky top-4">
      <div className="rounded-xl border border-border-light bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <h3 className="mb-3 flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.075em] text-text-muted">
          <ExternalLink className="h-[13px] w-[13px]" />
          Snelkoppelingen
        </h3>
        <div className="space-y-1">
          {LINK_GROUPS.map((group) => (
            <CollapsibleGroup key={group.title} group={group} />
          ))}
        </div>
      </div>
    </div>
  )
}
