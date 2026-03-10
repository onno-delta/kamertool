import Link from "next/link"
import { BookOpen, MessageSquare, Calendar, FileText, Users, Settings, PenLine, Building2, Database, Globe, Key, Search } from "lucide-react"

export const metadata = {
  title: "Handleiding - Kamertool",
  description: "Hoe werkt Kamertool? Alles over debatvoorbereiding met AI.",
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border-light bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-3 border-b border-border-light bg-surface-muted rounded-t-xl px-5 py-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-15">
          {icon}
        </div>
        <h2 className="text-sm font-semibold text-primary">{title}</h2>
      </div>
      <div className="px-5 py-5 text-sm leading-relaxed text-primary">
        {children}
      </div>
    </div>
  )
}

export default function HandleidingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-10 sm:px-6 sm:py-8">
      <nav aria-label="Kruimelpad" className="mb-4 text-sm text-text-muted">
        <Link href="/" className="hover:text-primary hover:underline">Home</Link>
        <span className="mx-1.5">&rsaquo;</span>
        <span className="text-primary font-medium">Handleiding</span>
      </nav>

      <section className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary">Handleiding</h1>
        <p className="mt-2 text-sm text-text-secondary">
          AI-debatvoorbereiding voor de Tweede Kamer
        </p>
      </section>

      {/* Intro */}
      <div className="mb-5 rounded-xl border border-primary/20 bg-primary-15 px-5 py-5">
        <p className="text-sm leading-relaxed text-primary">
          Kamertool is een AI-assistent die Kamerleden helpt bij debatvoorbereiding. Je stelt een vraag of kiest een agendapunt, en de AI doorzoekt automatisch parlementaire databases, nieuwsbronnen en partijprogramma&apos;s. Het resultaat: een complete briefing op maat van jouw partij en portefeuille.
        </p>
      </div>

      {/* Bronnen */}
      <div className="mb-5">
        <Section icon={<Database className="h-4 w-4 text-primary" />} title="Bronnen die Kamertool doorzoekt">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              { label: "Parlementaire documenten", desc: "Kamerstukken, moties, amendementen, Kamerbrieven, nota's" },
              { label: "Debatverslagen", desc: "Handelingen, plenaire en commissiedebatten" },
              { label: "Stemmingen", desc: "Uitslagen per fractie" },
              { label: "Toezeggingen", desc: "Openstaande toezeggingen van ministers" },
              { label: "Kamervragen", desc: "Recente schriftelijke vragen" },
              { label: "Agenda", desc: "Komende debatten en commissievergaderingen" },
              { label: "Nieuws", desc: "Actuele berichtgeving via Google" },
              { label: "Partijprogramma's", desc: "Standpunten per dossier, ideologische profielen" },
              { label: "Eigen documenten", desc: "Geupload via Dashboard (PDF, DOCX, XLSX, TXT)" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border-light bg-surface-muted px-3 py-2">
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-text-muted">{item.desc}</div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Inloggen */}
      <div className="mb-5">
        <Section icon={<Key className="h-4 w-4 text-primary" />} title="Inloggen">
          <ol className="mb-3 list-inside list-decimal space-y-1">
            <li>Ga naar <strong>kamer.deltainstituut.nl</strong> en klik op <strong>Login</strong></li>
            <li>Vul je e-mailadres in - je ontvangt een magic link per e-mail</li>
            <li>Klik op de link om in te loggen (geen wachtwoord nodig)</li>
          </ol>
          <p className="text-xs text-text-muted">
            Gebruikers met een <code className="rounded bg-surface-muted px-1 py-0.5">@tweedekamer.nl</code>-adres worden automatisch gekoppeld aan hun Kamerlidprofiel en hebben onbeperkte toegang. Overige gebruikers: 10 berichten per dag gratis, of onbeperkt met een eigen API-sleutel. De chat is ook zonder account te gebruiken.
          </p>
        </Section>
      </div>

      <h2 className="mb-4 mt-8 text-lg font-bold text-primary">De pagina&apos;s</h2>

      <div className="space-y-5">
        {/* Chat */}
        <Section icon={<MessageSquare className="h-4 w-4 text-primary" />} title="Chat (startpagina)">
          <p className="mb-3">
            De hoofdinterface. Stel een vraag over een debat of onderwerp en de AI zoekt direct relevante bronnen op. Een volledig antwoord bevat: samenvatting, relevante Kamerstukken, moties, openstaande toezeggingen, fractiestandpunten, recent nieuws en suggestievragen voor het debat.
          </p>
          <ul className="space-y-1.5 text-xs text-text-muted">
            <li><strong className="text-primary">Partij selecteren</strong> (linksboven) - de AI formuleert vanuit jouw partijperspectief</li>
            <li><strong className="text-primary">Kamerlid selecteren</strong> - de AI zoekt eerdere interventies en personaliseert suggesties</li>
            <li><strong className="text-primary">Model wisselen</strong> - kies tussen AI-modellen (Anthropic, OpenAI, Google)</li>
            <li><strong className="text-primary">URL delen</strong> - plak een link en de AI haalt de inhoud op als startpunt</li>
          </ul>
        </Section>

        {/* Agenda */}
        <Section icon={<Calendar className="h-4 w-4 text-primary" />} title="Agenda">
          <p>
            Kameragenda voor de komende 14 dagen. Filter op commissie of selecteer een Kamerlid om alleen relevante vergaderingen te zien. Klik op <strong>Voorbereiden</strong> bij een agendapunt om direct een briefing te starten.
          </p>
        </Section>

        {/* Voorbereiden */}
        <Section icon={<FileText className="h-4 w-4 text-primary" />} title="Voorbereiden">
          <p className="mb-3">Genereer een uitgebreide debatbriefing. De generator werkt in drie fasen:</p>
          <ol className="mb-3 list-inside list-decimal space-y-1">
            <li><strong>Bronnen zoeken</strong> - doorzoekt alle beschikbare databases</li>
            <li><strong>Documenten lezen</strong> - haalt volledige teksten op van relevante documenten</li>
            <li><strong>Briefing schrijven</strong> - stelt het document samen met bronverwijzingen</li>
          </ol>
          <p className="text-xs text-text-muted">
            Selecteer het vergadertype (plenair debat, commissiedebat, wetgevingsoverleg, etc.) voor een briefing op maat. De inhoud past zich aan: bij een plenair debat krijg je interruptiestrategieen, bij een wetgevingsoverleg meer technische analyse.
          </p>
        </Section>

        {/* Briefings */}
        <Section icon={<FileText className="h-4 w-4 text-primary" />} title="Briefings">
          <p>
            Overzicht van al je opgeslagen briefings. Zoek op onderwerp. Open een briefing om de inhoud te bekijken, als PDF te downloaden of als Markdown te kopieren.
          </p>
        </Section>

        {/* Smoelenboek */}
        <Section icon={<Users className="h-4 w-4 text-primary" />} title="Smoelenboek">
          <p className="mb-2">
            Ledenlijst van alle Kamerleden en kabinetsleden. Zoek op naam, filter op partij of rol. De detailpagina per persoon toont: foto, biografie, commissielidmaatschappen, contactgegevens, medewerkers en activiteitenfeeds (documenten, stemmingen, toezeggingen, debatbijdragen, agenda).
          </p>
          <p className="text-xs text-text-muted">
            Je kunt zelf contactgegevens en medewerkers toevoegen per Kamerlid.
          </p>
        </Section>

        {/* Instellingen */}
        <Section icon={<Settings className="h-4 w-4 text-primary" />} title="Instellingen">
          <ul className="space-y-1.5">
            <li><strong>Kamerleden</strong> - selecteer welke Kamerleden je volgt (bepaalt automatisch je partij en relevante dossiers)</li>
            <li><strong>Bronnen</strong> - beheer 60+ ingebouwde bronnen en voeg eigen bronnen toe</li>
            <li><strong>API-sleutel</strong> - voeg je eigen sleutel toe (Anthropic, OpenAI of Google) voor onbeperkt gebruik</li>
            <li><strong>Gebruik</strong> - bekijk hoeveel van je daglimiet je hebt verbruikt</li>
          </ul>
        </Section>

        {/* Instructies */}
        <Section icon={<PenLine className="h-4 w-4 text-primary" />} title="Instructies">
          <p>
            Pas de briefing-instructies aan per vergadertype. Elk van de 13 vergadertypen heeft een standaard prompttemplate. Overschrijf dit met eigen instructies om altijd bepaalde secties te krijgen, een vaste speechlengte af te dwingen, of een specifieke toon te kiezen.
          </p>
        </Section>

        {/* Dashboard */}
        <Section icon={<Building2 className="h-4 w-4 text-primary" />} title="Dashboard (Organisatie)">
          <p>
            Organisatiebeheer: voeg collega&apos;s toe en upload gedeelde documenten (PDF, DOCX, XLSX, TXT). Geuploadde documenten worden doorzoekbaar voor alle teamleden in chat en briefings.
          </p>
        </Section>
      </div>

      {/* FAQ */}
      <h2 className="mb-4 mt-8 text-lg font-bold text-primary">Veelgestelde vragen</h2>

      <div className="space-y-3">
        {[
          {
            q: "\"Dagelijkse limiet bereikt\"",
            a: "Voeg in Instellingen een eigen API-sleutel toe voor onbeperkt gebruik, of wacht tot de volgende dag.",
          },
          {
            q: "De briefing is te lang of te kort",
            a: "Pas in Instructies de instructie voor het vergadertype aan (bijv. \"Concept-speech maximaal 4 minuten\").",
          },
          {
            q: "Hoe actueel is de informatie?",
            a: "Kamertool zoekt live in parlementaire databases en nieuwsbronnen. De informatie is zo actueel als de bronnen zelf.",
          },
          {
            q: "Kan ik de AI vertrouwen?",
            a: "De AI geeft altijd bronverwijzingen (Kamerstuknummers, data, namen). Controleer belangrijke claims. De tool is een startpunt voor voorbereiding, geen vervanging van eigen onderzoek.",
          },
          {
            q: "Welk AI-model wordt gebruikt?",
            a: "Standaard Claude Sonnet 4.5 (Anthropic). Wissel via de modelkiezer in de chat naar andere modellen.",
          },
        ].map((faq) => (
          <div
            key={faq.q}
            className="rounded-xl border border-border-light bg-white px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]"
          >
            <p className="mb-1 text-sm font-semibold text-primary">{faq.q}</p>
            <p className="text-sm text-text-muted">{faq.a}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-text-muted">
        Kamertool is een product van Delta Instituut voor Staatscapaciteit.
      </p>
    </div>
  )
}
