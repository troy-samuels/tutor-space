import type { Metadata } from "next";
import ComparisonPage from "@/components/compare/ComparisonPage";

export const metadata: Metadata = {
  title: "TutorLingua vs iTalki: Die Provisionsfreie Alternative",
  description:
    "Vergleichen Sie TutorLingua und iTalki für Sprachlehrer. Null Provision vs 15 %, direkte Zahlungen, KI-Unterrichtszusammenfassungen und volle Schüler-Eigentümerschaft.",
  openGraph: {
    title: "TutorLingua vs iTalki: Die Provisionsfreie Alternative",
    description:
      "Hören Sie auf, 15 % pro Stunde zu zahlen. TutorLingua gibt unabhängigen Tutoren die Werkzeuge, um Schüler ohne Marketplace-Provision zu verwalten.",
    type: "article",
    url: "/de/compare/italki",
  },
  alternates: {
    canonical: "/de/compare/italki",
    languages: {
      en: "/compare/italki",
      es: "/es/compare/italki",
      fr: "/fr/compare/italki",
    },
  },
};

export default function iTalkiComparisonPageDE() {
  return (
    <ComparisonPage
      competitorName="iTalki"
      competitorSlug="italki"
      title="TutorLingua vs iTalki: Die Provisionsfreie Alternative"
      subtitle="Ehrlicher Vergleich"
      heroDescription="iTalki hat eine riesige Community von Sprachlernern und Tutoren aufgebaut. Aber ihre 15 % Provision — plus die jüngsten UX-Änderungen und Zahlungsverzögerungen — bringt Tutoren dazu, nach Alternativen zu suchen. So vergleichen wir uns."
      features={[
        {
          feature: "Provisionssatz",
          tutorlingua: "0 % — immer",
          competitor: "15 % pro Stunde",
          highlight: true,
        },
        {
          feature: "Lehrer vs Community-Tutor",
          tutorlingua: "Eine Stufe — Sie sind Tutor",
          competitor: "Zwei Stufen mit unterschiedlichen Preisen",
        },
        {
          feature: "Zahlungsabwicklung",
          tutorlingua: "Stripe direkt, sofort",
          competitor: "iTalki-Credits-System",
        },
        {
          feature: "Mindestauszahlung",
          tutorlingua: "Keine",
          competitor: "30 $ Minimum",
        },
        {
          feature: "KI-Unterrichtszusammenfassungen",
          tutorlingua: "✅ 7 Übungstypen, mehrsprachig",
          competitor: "❌ Nicht verfügbar",
          highlight: true,
        },
        {
          feature: "Stundenpakete",
          tutorlingua: "Volle Paket- + Abo-Unterstützung",
          competitor: "Grundlegende Paketoptionen",
        },
        {
          feature: "Schülerdaten-Eigentum",
          tutorlingua: "Voller Zugang, exportierbar",
          competitor: "Plattform-kontrolliert",
        },
        {
          feature: "Unterstützte Sprachen",
          tutorlingua: "Alle Sprachen",
          competitor: "130+ Sprachen",
        },
        {
          feature: "Individuelles Branding",
          tutorlingua: "Ihr Profil, Ihre Marke",
          competitor: "Standard-iTalki-Profil",
        },
        {
          feature: "Stornierungsflexibilität",
          tutorlingua: "Sie definieren Ihre Richtlinie",
          competitor: "Plattform-Regeln",
        },
      ]}
      painPoints={[
        {
          quote:
            "iTalki hat ihre Oberfläche SCHON WIEDER geändert und jetzt findet die Hälfte meiner Schüler den Umbuchungs-Button nicht. Jedes Mal, wenn sie die UX 'verbessern', verliere ich Buchungen.",
          source: "Tutor auf r/iTalki",
        },
        {
          quote:
            "Weniger Stunden in 2026. Bin ich das nur oder hat jemand anderes auch einen deutlichen Rückgang bemerkt? Ich weiß nicht, ob es die KI ist oder der Plattform-Algorithmus, der mich vergräbt.",
          source: "Tutor-Diskussion, Februar 2026",
        },
        {
          quote:
            "15 % klingt nicht viel, bis man 100 Stunden im Monat macht. Das sind 15 Stunden Arbeit, die direkt an iTalki gehen — wofür? Einen Sucheintrag?",
          source: "Tutor auf r/OnlineESLTeaching",
        },
        {
          quote:
            "Das Credit-System bedeutet, dass Schüler iTalki vorausbezahlen, nicht Sie. Bei einem Streit hält die Plattform IHR Geld zurück, während sie es klären.",
          source: "Diskussion in der Tutor-Community",
        },
      ]}
      whySwitchReasons={[
        "Behalten Sie 100 % Ihrer Einnahmen. Keine Provision, kein Credits-System, keine Mindestauszahlung. Ihr Geld gehört Ihnen.",
        "Ein Tutor-Typ — keine Teilung in 'Professioneller Lehrer' vs 'Community-Tutor'. Setzen Sie Ihre Preise nach Ihrem Wert.",
        "KI-Unterrichtszusammenfassungen, die interaktive Hausaufgaben in 10 Sekunden generieren. 7 Übungstypen inklusive Hörverständnis, Zuordnung und Übersetzung. Schüler lieben es.",
        "Erhalten Sie Zahlungen in echter Währung, direkt. Kein iTalki-Credits-Vermittler. Stripe erledigt alles — schnell, zuverlässig, weltweit.",
        "Keine Algorithmus-Angst. Ihr Profil wird nicht begraben, weil Sie eine Woche frei genommen haben. Bauen Sie eine stabile Basis von Schülern auf, die direkt zu Ihnen kommen.",
        "Exportieren Sie Ihre Schülerdaten. Ihr Unterrichtsverlauf, Notizen und Kontakte gehören Ihnen. Nehmen Sie sie überallhin mit.",
      ]}
      otherComparisons={[
        { name: "Preply", slug: "preply" },
        { name: "Cambly", slug: "cambly" },
      ]}
    />
  );
}
