import type { Metadata } from "next";
import ComparisonPage from "@/components/compare/ComparisonPage";

export const metadata: Metadata = {
  title: "TutorLingua vs Preply: Warum Unabhängige Tutoren Wechseln",
  description:
    "Vergleichen Sie TutorLingua und Preply Seite an Seite. Provisionen, Buchungskontrolle, Zahlungsbedingungen und Schülerverwaltung für unabhängige Sprachlehrer.",
  openGraph: {
    title: "TutorLingua vs Preply: Die Provisionsfreie Alternative",
    description:
      "Unabhängige Tutoren wechseln von Preply zu TutorLingua. Null Provision, volle Kontrolle über Ihre Schüler und Werkzeuge für die Unabhängigkeit.",
    type: "article",
    url: "/de/compare/preply",
  },
  alternates: {
    canonical: "/de/compare/preply",
    languages: {
      en: "/compare/preply",
      es: "/es/compare/preply",
      fr: "/fr/compare/preply",
    },
  },
};

export default function PreplyComparisonPageDE() {
  return (
    <ComparisonPage
      competitorName="Preply"
      competitorSlug="preply"
      title="TutorLingua vs Preply: Warum Tutoren Wechseln"
      subtitle="Ehrlicher Vergleich"
      heroDescription="Preply ist großartig, um Ihre ersten Schüler zu finden. Aber sobald Sie Stammschüler haben, fühlen sich 18–33 % Provision pro Unterrichtsstunde weniger wie eine Marketplace-Gebühr und mehr wie eine Steuer an. So vergleichen sich die Plattformen."
      features={[
        {
          feature: "Provisionssatz",
          tutorlingua: "0 % — immer",
          competitor: "18–33 % pro Stunde",
          highlight: true,
        },
        {
          feature: "Schüler-Eigentum",
          tutorlingua: "Die Beziehung gehört Ihnen",
          competitor: "Plattform besitzt den Schüler",
        },
        {
          feature: "Zahlungsbedingungen",
          tutorlingua: "Direkt an Sie über Stripe",
          competitor: "5-Tage-Auszahlungsfrist",
        },
        {
          feature: "Buchungskontrolle",
          tutorlingua: "Volle Kontrolle, Ihr Zeitplan",
          competitor: "Plattform-verwalteter Kalender",
        },
        {
          feature: "Preisgestaltung",
          tutorlingua: "Setzen Sie jeden Preis, Pakete inklusive",
          competitor: "Geführte Preise, plattformbeeinflusst",
        },
        {
          feature: "KI-Unterrichtszusammenfassungen",
          tutorlingua: "✅ 7 Übungstypen, mehrsprachig",
          competitor: "❌ Nicht verfügbar",
          highlight: true,
        },
        {
          feature: "Schüler-Entdeckung",
          tutorlingua: "Eigenes Profil + SEO",
          competitor: "Marketplace-Suche + Algorithmus",
        },
        {
          feature: "Bewertungs-Portabilität",
          tutorlingua: "Ihr Profil, Ihre Bewertungen",
          competitor: "In Preply gesperrt",
        },
        {
          feature: "Stornierungsrichtlinie",
          tutorlingua: "Sie definieren Ihre eigene",
          competitor: "Von der Plattform vorgegebene Regeln",
        },
        {
          feature: "Kostenlose Probestunden",
          tutorlingua: "Optional, Ihre Entscheidung",
          competitor: "Pflicht für neue Schüler",
        },
      ]}
      painPoints={[
        {
          quote:
            "Ich bin seit 2 Jahren auf Preply. Sie nehmen 33 % meiner Probestunden und 18 % von allem anderen. Das sind hunderte Euro pro Monat, nur um auf einer Plattform zu sein.",
          source: "Tutor auf r/Preply",
        },
        {
          quote:
            "Das Schlimmste ist, dass man seine Bewertungen nicht mitnehmen kann. Ich habe über 200 Fünf-Sterne-Bewertungen und sie sind alle in Preply eingesperrt.",
          source: "Tutor auf r/OnlineESLTeaching",
        },
        {
          quote:
            "Sie finden Ihnen EINEN Schüler und nehmen 33 % von jeder Stunde FÜR IMMER. Die Zahlen sind verrückt, wenn man sie wirklich zusammenrechnet.",
          source: "Diskussion in der Tutor-Community",
        },
        {
          quote:
            "Ich habe endlich meinen tatsächlichen Stundensatz nach der Preply-Provision berechnet. Es war ein Augenöffner. Unabhängig zu werden war die beste Entscheidung, die ich getroffen habe.",
          source: "Tutor auf r/freelance",
        },
      ]}
      whySwitchReasons={[
        "Behalten Sie 100 % Ihrer Einnahmen — keine Provision auf irgendeine Stunde, niemals. Ihre Arbeit, Ihr Einkommen.",
        "Besitzen Sie Ihre Schülerbeziehungen. Wenn ein Schüler bei Ihnen bucht, ist es IHR Schüler. Keine Plattform dazwischen.",
        "KI-gestützte Unterrichtszusammenfassungen mit 7 interaktiven Übungstypen. Senden Sie Schülern Hausaufgaben in 10 Sekunden. So etwas gibt es auf Preply nicht.",
        "Flexible Preisgestaltung mit Paketen, Abonnements und Einzelstunden. Setzen Sie Ihre Preise ohne Plattform-Einmischung.",
        "Erhalten Sie Zahlungen direkt über Stripe — keine Wartezeiten, kein Mindestauszahlungsbetrag.",
        "Ihr Profil, Ihre Marke. Bauen Sie eine Präsenz auf, die Ihnen gehört, nicht einem Marketplace, der seinen Algorithmus über Nacht ändern kann.",
      ]}
      otherComparisons={[
        { name: "iTalki", slug: "italki" },
        { name: "Cambly", slug: "cambly" },
      ]}
    />
  );
}
