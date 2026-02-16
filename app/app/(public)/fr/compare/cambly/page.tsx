import type { Metadata } from "next";
import ComparisonPage from "@/components/compare/ComparisonPage";

export const metadata: Metadata = {
  title: "TutorLingua vs Cambly : Pour les Tuteurs Qui Veulent le Contrôle",
  description:
    "Comparez TutorLingua et Cambly pour les tuteurs d'anglais. Échappez aux tarifs fixes, fixez vos propres prix et construisez un vrai business de tutorat sans commission.",
  openGraph: {
    title: "TutorLingua vs Cambly : Pour les Tuteurs Qui Veulent le Contrôle",
    description:
      "Cambly paie un tarif fixe. TutorLingua vous permet de fixer vos prix, de garder 100 % et de construire un vrai business de tutorat.",
    type: "article",
    url: "/fr/compare/cambly",
  },
  alternates: {
    canonical: "/fr/compare/cambly",
    languages: {
      en: "/compare/cambly",
      es: "/es/compare/cambly",
      de: "/de/compare/cambly",
    },
  },
};

export default function CamblyComparisonPageFR() {
  return (
    <ComparisonPage
      competitorName="Cambly"
      competitorSlug="cambly"
      title="TutorLingua vs Cambly : Pour les Tuteurs Qui Veulent le Contrôle"
      subtitle="Comparaison honnête"
      heroDescription="Cambly est facile pour débuter — connectez-vous, discutez, encaissez. Mais 0,17 $/minute (10,20 $/heure) sans contrôle sur votre emploi du temps, vos élèves ni votre programme, ce n'est pas une carrière. C'est un petit boulot. Voici l'alternative."
      features={[
        {
          feature: "Tarif horaire",
          tutorlingua: "Vous le fixez — 15-80+ €/h",
          competitor: "10,20 $/h (tarif fixe)",
          highlight: true,
        },
        {
          feature: "Commission",
          tutorlingua: "0 %",
          competitor: "La plateforme fixe votre tarif",
        },
        {
          feature: "Contrôle du planning",
          tutorlingua: "Contrôle total, vos conditions",
          competitor: "Système d'Heures Prioritaires",
          highlight: true,
        },
        {
          feature: "Sélection des élèves",
          tutorlingua: "Acceptez qui vous voulez",
          competitor: "Attribution aléatoire",
        },
        {
          feature: "Liberté de programme",
          tutorlingua: "Enseignez ce que vous voulez",
          competitor: "Programme de la plateforme encouragé",
        },
        {
          feature: "Résumés de cours par IA",
          tutorlingua: "✅ 7 types d'exercices, multilingue",
          competitor: "❌ Non disponible",
          highlight: true,
        },
        {
          feature: "Relations avec les élèves",
          tutorlingua: "Directes, long terme",
          competitor: "Souvent des conversations uniques",
        },
        {
          feature: "Conditions de paiement",
          tutorlingua: "Stripe direct, flexible",
          competitor: "Virement hebdomadaire PayPal/banque",
        },
        {
          feature: "Types de cours",
          tutorlingua: "Structuré + conversation",
          competitor: "Principalement conversation",
        },
        {
          feature: "Potentiel de croissance",
          tutorlingua: "Construisez un vrai business",
          competitor: "Plafonné au tarif fixe",
        },
      ]}
      painPoints={[
        {
          quote:
            "J'ai fait les calculs. À 10,20 $/heure sur Cambly, en travaillant 30 heures par semaine, ça fait environ 1 200 €/mois avant impôts. Vous ne pouvez pas vivre de ça en France.",
          source: "Tuteur sur r/OnlineESLTeaching",
        },
        {
          quote:
            "Le système d'Heures Prioritaires est un piège. Vous vous engagez à être disponible à certaines heures, mais rien ne garantit que des élèves se présenteront. Vous restez assis à attendre.",
          source: "Tuteur sur r/WorkOnline",
        },
        {
          quote:
            "Cambly traite les tuteurs comme des pièces interchangeables. N'importe quel tuteur, n'importe quel sujet, n'importe quand. Impossible de se spécialiser ou de facturer plus pour son expertise.",
          source: "Discussion communauté de tuteurs",
        },
        {
          quote:
            "J'avais une élève régulière sur Cambly pendant 6 mois. Elle voulait réserver plus de cours mais la plateforme ne lui permettait pas de choisir des créneaux spécifiques avec moi. Elle est partie.",
          source: "Tuteur sur r/freelance",
        },
      ]}
      whySwitchReasons={[
        "Fixez vos propres tarifs selon votre expérience, spécialisation et demande. Les meilleurs tuteurs sur TutorLingua facturent 40-80 €/heure — c'est 4 à 8 fois le tarif fixe de Cambly.",
        "Construisez de vraies relations avec vos élèves. Pas d'attribution aléatoire — les élèves vous trouvent, vous réservent et reviennent parce qu'ils vous ont choisi VOUS.",
        "Résumés de cours par IA qui transforment chaque session en devoirs interactifs. 7 types d'exercices, générés en 10 secondes. Vos élèves pratiquent vraiment entre les cours.",
        "Spécialisez-vous et facturez en conséquence. Enseignez l'anglais des affaires à tarif premium. Proposez de la préparation aux examens. Créez des forfaits. Sur Cambly, tout le monde vaut 10,20 $/heure quelle que soit l'expérience.",
        "Votre emploi du temps, vos règles. Pas d'Heures Prioritaires, pas de pénalités pour ne pas être en ligne à des heures précises. Acceptez les réservations quand ça vous arrange.",
        "Faites la transition progressivement. Gardez Cambly pour l'instant tout en construisant votre base d'élèves indépendants sur TutorLingua. Sans obligation, sans engagement.",
      ]}
      otherComparisons={[
        { name: "Preply", slug: "preply" },
        { name: "iTalki", slug: "italki" },
      ]}
    />
  );
}
