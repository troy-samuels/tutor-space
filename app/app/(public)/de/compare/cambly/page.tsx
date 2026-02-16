import type { Metadata } from "next";
import ComparisonPage from "@/components/compare/ComparisonPage";

export const metadata: Metadata = {
  title: "TutorLingua vs Cambly: Für Tutoren, Die Kontrolle Wollen",
  description:
    "Vergleichen Sie TutorLingua und Cambly für Englischlehrer. Entkommen Sie festen Tarifen, setzen Sie Ihre eigenen Preise und bauen Sie ein echtes Nachhilfe-Geschäft ohne Provision auf.",
  openGraph: {
    title: "TutorLingua vs Cambly: Für Tutoren, Die Kontrolle Wollen",
    description:
      "Cambly zahlt einen Festpreis. TutorLingua lässt Sie Ihre eigenen Preise setzen, 100 % behalten und ein echtes Nachhilfe-Geschäft aufbauen.",
    type: "article",
    url: "/de/compare/cambly",
  },
  alternates: {
    canonical: "/de/compare/cambly",
    languages: {
      en: "/compare/cambly",
      es: "/es/compare/cambly",
      fr: "/fr/compare/cambly",
    },
  },
};

export default function CamblyComparisonPageDE() {
  return (
    <ComparisonPage
      competitorName="Cambly"
      competitorSlug="cambly"
      title="TutorLingua vs Cambly: Für Tutoren, Die Kontrolle Wollen"
      subtitle="Ehrlicher Vergleich"
      heroDescription="Cambly ist einfach zum Starten — einloggen, chatten, bezahlt werden. Aber 0,17 $/Minute (10,20 $/Stunde) ohne Kontrolle über Ihren Zeitplan, Ihre Schüler oder Ihren Lehrplan ist keine Karriere. Es ist ein Nebenjob. Hier ist die Alternative."
      features={[
        {
          feature: "Stundensatz",
          tutorlingua: "Sie bestimmen — 15–80+ €/h",
          competitor: "10,20 $/h (Festpreis)",
          highlight: true,
        },
        {
          feature: "Provision",
          tutorlingua: "0 %",
          competitor: "Plattform bestimmt Ihren Tarif",
        },
        {
          feature: "Zeitplan-Kontrolle",
          tutorlingua: "Volle Kontrolle, Ihre Bedingungen",
          competitor: "Priority-Hours-System",
          highlight: true,
        },
        {
          feature: "Schüler-Auswahl",
          tutorlingua: "Akzeptieren Sie, wen Sie wollen",
          competitor: "Zufällige Zuordnung",
        },
        {
          feature: "Lehrplan-Freiheit",
          tutorlingua: "Unterrichten Sie, was Sie wollen",
          competitor: "Plattform-Lehrplan empfohlen",
        },
        {
          feature: "KI-Unterrichtszusammenfassungen",
          tutorlingua: "✅ 7 Übungstypen, mehrsprachig",
          competitor: "❌ Nicht verfügbar",
          highlight: true,
        },
        {
          feature: "Schüler-Beziehungen",
          tutorlingua: "Direkt, langfristig",
          competitor: "Oft einmalige Gespräche",
        },
        {
          feature: "Zahlungsbedingungen",
          tutorlingua: "Stripe direkt, flexibel",
          competitor: "Wöchentliche PayPal-/Banküberweisung",
        },
        {
          feature: "Unterrichtstypen",
          tutorlingua: "Strukturiert + Konversation",
          competitor: "Hauptsächlich Konversation",
        },
        {
          feature: "Wachstumspotenzial",
          tutorlingua: "Bauen Sie ein echtes Geschäft auf",
          competitor: "Auf Festpreis begrenzt",
        },
      ]}
      painPoints={[
        {
          quote:
            "Ich habe nachgerechnet. Bei 10,20 $/Stunde auf Cambly, 30 Stunden pro Woche arbeitend, sind das etwa 1.200 €/Monat vor Steuern. Davon kann man in Deutschland nicht leben.",
          source: "Tutor auf r/OnlineESLTeaching",
        },
        {
          quote:
            "Das Priority-Hours-System ist eine Falle. Sie verpflichten sich, zu bestimmten Zeiten verfügbar zu sein, aber es gibt keine Garantie, dass Schüler erscheinen. Sie sitzen einfach da und warten.",
          source: "Tutor auf r/WorkOnline",
        },
        {
          quote:
            "Cambly behandelt Tutoren wie austauschbare Teile. Jeder Tutor, jedes Thema, jederzeit. Es gibt keine Möglichkeit, sich zu spezialisieren oder mehr für Expertise zu verlangen.",
          source: "Diskussion in der Tutor-Community",
        },
        {
          quote:
            "Hatte eine tolle Stammschülerin auf Cambly seit 6 Monaten. Sie wollte mehr Stunden buchen, aber die Plattform ließ sie keine bestimmten Zeiten bei mir auswählen. Sie ist gegangen.",
          source: "Tutor auf r/freelance",
        },
      ]}
      whySwitchReasons={[
        "Setzen Sie Ihre eigenen Preise nach Erfahrung, Spezialisierung und Nachfrage. Top-Tutoren auf TutorLingua verlangen 40–80 €/Stunde — das ist 4–8x der Festpreis von Cambly.",
        "Bauen Sie echte Beziehungen zu Schülern auf. Keine zufällige Zuordnung — Schüler finden Sie, buchen Sie und kommen zurück, weil sie SIE gewählt haben.",
        "KI-gestützte Unterrichtszusammenfassungen verwandeln jede Stunde in interaktive Hausaufgaben. 7 Übungstypen, in 10 Sekunden generiert. Ihre Schüler üben wirklich zwischen den Stunden.",
        "Spezialisieren Sie sich und berechnen Sie entsprechend. Unterrichten Sie Business-Englisch zu Premiumpreisen. Bieten Sie Prüfungsvorbereitung an. Erstellen Sie Pakete. Auf Cambly ist jeder 10,20 $/Stunde wert, ungeachtet der Erfahrung.",
        "Ihr Zeitplan, Ihre Regeln. Keine Priority Hours, keine Strafen für Nicht-Online-Sein zu bestimmten Zeiten. Akzeptieren Sie Buchungen, wenn es Ihnen passt.",
        "Wechseln Sie schrittweise. Behalten Sie Cambly vorerst, während Sie Ihre unabhängige Schülerbasis auf TutorLingua aufbauen. Keine Verpflichtung, kein Lock-in.",
      ]}
      otherComparisons={[
        { name: "Preply", slug: "preply" },
        { name: "iTalki", slug: "italki" },
      ]}
    />
  );
}
