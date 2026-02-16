import type { Metadata } from "next";
import ComparisonPage from "@/components/compare/ComparisonPage";

export const metadata: Metadata = {
  title: "TutorLingua vs Preply : Pourquoi les Tuteurs Indépendants Changent",
  description:
    "Comparez TutorLingua et Preply côte à côte. Commissions, contrôle des réservations, paiements et gestion des élèves pour les tuteurs de langues indépendants.",
  openGraph: {
    title: "TutorLingua vs Preply : L'Alternative Sans Commission",
    description:
      "Les tuteurs indépendants quittent Preply pour TutorLingua. Zéro commission, contrôle total de vos élèves et outils conçus pour l'indépendance.",
    type: "article",
    url: "/fr/compare/preply",
  },
  alternates: {
    canonical: "/fr/compare/preply",
    languages: {
      en: "/compare/preply",
      es: "/es/compare/preply",
      fr: "/fr/compare/preply",
      de: "/de/compare/preply",
    },
  },
};

export default function PreplyComparisonPageFR() {
  return (
    <ComparisonPage
      competitorName="Preply"
      competitorSlug="preply"
      title="TutorLingua vs Preply : Pourquoi les Tuteurs Changent"
      subtitle="Comparaison honnête"
      heroDescription="Preply est excellent pour trouver vos premiers élèves. Mais une fois que vous avez des réguliers, payer 18 à 33 % de commission sur chaque cours ressemble moins à des frais de marketplace et plus à un impôt. Voici comment les plateformes se comparent."
      features={[
        {
          feature: "Taux de commission",
          tutorlingua: "0 % — toujours",
          competitor: "18-33 % par cours",
          highlight: true,
        },
        {
          feature: "Propriété de l'élève",
          tutorlingua: "La relation vous appartient",
          competitor: "La plateforme possède l'élève",
        },
        {
          feature: "Conditions de paiement",
          tutorlingua: "Directement via Stripe",
          competitor: "Délai de retrait de 5 jours",
        },
        {
          feature: "Contrôle des réservations",
          tutorlingua: "Contrôle total, votre emploi du temps",
          competitor: "Calendrier géré par la plateforme",
        },
        {
          feature: "Fixation des prix",
          tutorlingua: "Fixez n'importe quel prix, forfaits inclus",
          competitor: "Prix guidés, influencés par la plateforme",
        },
        {
          feature: "Résumés de cours par IA",
          tutorlingua: "✅ 7 types d'exercices, multilingue",
          competitor: "❌ Non disponible",
          highlight: true,
        },
        {
          feature: "Découverte d'élèves",
          tutorlingua: "Profil personnel + SEO",
          competitor: "Recherche marketplace + algorithme",
        },
        {
          feature: "Portabilité des avis",
          tutorlingua: "Votre profil, vos avis",
          competitor: "Verrouillés dans Preply",
        },
        {
          feature: "Politique d'annulation",
          tutorlingua: "Vous définissez la vôtre",
          competitor: "Règles imposées par la plateforme",
        },
        {
          feature: "Cours d'essai gratuits",
          tutorlingua: "Optionnel, vous décidez",
          competitor: "Obligatoires pour les nouveaux élèves",
        },
      ]}
      painPoints={[
        {
          quote:
            "Je suis sur Preply depuis 2 ans. Ils prennent 33 % sur mes cours d'essai et 18 % sur tout le reste. Ce sont des centaines d'euros par mois juste pour être sur une plateforme.",
          source: "Tuteur sur r/Preply",
        },
        {
          quote:
            "Le pire, c'est que vous ne pouvez pas emporter vos avis. J'ai plus de 200 avis cinq étoiles et ils sont tous verrouillés dans Preply.",
          source: "Tuteur sur r/OnlineESLTeaching",
        },
        {
          quote:
            "Ils vous trouvent UN élève et prennent 33 % de chaque cours POUR TOUJOURS. Les chiffres sont hallucinants quand on les additionne vraiment.",
          source: "Discussion communauté de tuteurs",
        },
        {
          quote:
            "J'ai enfin calculé mon vrai taux horaire après la commission de Preply. Ça m'a ouvert les yeux. Devenir indépendant a été la meilleure décision que j'ai prise.",
          source: "Tuteur sur r/freelance",
        },
      ]}
      whySwitchReasons={[
        "Gardez 100 % de ce que vous gagnez — aucune commission sur aucun cours, jamais. Votre travail, vos revenus.",
        "Possédez vos relations avec vos élèves. Quand un élève réserve avec vous, c'est VOTRE élève. Pas de plateforme entre vous.",
        "Résumés de cours par IA avec 7 types d'exercices interactifs. Envoyez des devoirs à vos élèves en 10 secondes. Rien de comparable n'existe sur Preply.",
        "Tarification flexible avec forfaits, abonnements et cours individuels. Fixez vos tarifs sans interférence de la plateforme.",
        "Recevez vos paiements directement via Stripe — pas de délai d'attente, pas de montant minimum de retrait.",
        "Votre profil, votre marque. Construisez une présence qui vous appartient, pas à un marketplace qui peut changer son algorithme du jour au lendemain.",
      ]}
      otherComparisons={[
        { name: "iTalki", slug: "italki" },
        { name: "Cambly", slug: "cambly" },
      ]}
    />
  );
}
