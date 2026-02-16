import type { Metadata } from "next";
import ComparisonPage from "@/components/compare/ComparisonPage";

export const metadata: Metadata = {
  title: "TutorLingua vs iTalki : L'Alternative Sans Commission",
  description:
    "Comparez TutorLingua et iTalki pour les tuteurs de langues. Zéro commission vs 15 %, paiements directs, résumés de cours par IA et propriété totale de vos élèves.",
  openGraph: {
    title: "TutorLingua vs iTalki : L'Alternative Sans Commission",
    description:
      "Arrêtez de payer 15 % sur chaque cours. TutorLingua donne aux tuteurs indépendants les outils pour gérer leurs élèves sans commission de marketplace.",
    type: "article",
    url: "/fr/compare/italki",
  },
  alternates: {
    canonical: "/fr/compare/italki",
    languages: {
      en: "/compare/italki",
      es: "/es/compare/italki",
      fr: "/fr/compare/italki",
      de: "/de/compare/italki",
    },
  },
};

export default function iTalkiComparisonPageFR() {
  return (
    <ComparisonPage
      competitorName="iTalki"
      competitorSlug="italki"
      title="TutorLingua vs iTalki : L'Alternative Sans Commission"
      subtitle="Comparaison honnête"
      heroDescription="iTalki a construit une communauté massive d'apprenants et de tuteurs de langues. Mais leur commission de 15 % — plus les changements d'interface récents et les retards de paiement — pousse les tuteurs à chercher des alternatives. Voici notre comparaison."
      features={[
        {
          feature: "Taux de commission",
          tutorlingua: "0 % — toujours",
          competitor: "15 % par cours",
          highlight: true,
        },
        {
          feature: "Professeur vs Tuteur Communautaire",
          tutorlingua: "Un seul niveau — vous êtes tuteur",
          competitor: "Deux niveaux avec tarifs différents",
        },
        {
          feature: "Traitement des paiements",
          tutorlingua: "Stripe direct, instantané",
          competitor: "Système de crédits iTalki",
        },
        {
          feature: "Retrait minimum",
          tutorlingua: "Aucun",
          competitor: "30 $ minimum",
        },
        {
          feature: "Résumés de cours par IA",
          tutorlingua: "✅ 7 types d'exercices, multilingue",
          competitor: "❌ Non disponible",
          highlight: true,
        },
        {
          feature: "Forfaits de cours",
          tutorlingua: "Support complet forfaits + abonnements",
          competitor: "Options de forfaits basiques",
        },
        {
          feature: "Propriété des données élèves",
          tutorlingua: "Accès total, exportable",
          competitor: "Contrôlé par la plateforme",
        },
        {
          feature: "Langues supportées",
          tutorlingua: "Toutes les langues",
          competitor: "130+ langues",
        },
        {
          feature: "Marque personnalisée",
          tutorlingua: "Votre profil, votre marque",
          competitor: "Profil standard iTalki",
        },
        {
          feature: "Flexibilité d'annulation",
          tutorlingua: "Vous définissez votre politique",
          competitor: "Règles de la plateforme",
        },
      ]}
      painPoints={[
        {
          quote:
            "iTalki a changé leur interface ENCORE et maintenant la moitié de mes élèves ne trouvent pas le bouton pour reporter. Chaque fois qu'ils 'améliorent' l'UX, je perds des réservations.",
          source: "Tuteur sur r/iTalki",
        },
        {
          quote:
            "Moins de cours en 2026. C'est juste moi ou quelqu'un d'autre a remarqué une vraie baisse ? Je ne sais pas si c'est l'IA ou l'algorithme de la plateforme qui m'enterre.",
          source: "Discussion de tuteurs, février 2026",
        },
        {
          quote:
            "15 % ça ne paraît pas beaucoup jusqu'à ce que vous fassiez 100 heures par mois. Ce sont 15 heures de travail qui vont directement à iTalki pour quoi — un listing dans leur recherche ?",
          source: "Tuteur sur r/OnlineESLTeaching",
        },
        {
          quote:
            "Le système de crédits signifie que les élèves pré-paient iTalki, pas vous. S'il y a un litige, la plateforme retient VOTRE argent pendant qu'ils règlent le problème.",
          source: "Discussion communauté de tuteurs",
        },
      ]}
      whySwitchReasons={[
        "Gardez 100 % de vos gains. Pas de commission, pas de système de crédits, pas de retrait minimum. Votre argent est votre argent.",
        "Un seul type de tuteur — pas de division 'Professeur Professionnel' vs 'Tuteur Communautaire'. Fixez vos tarifs selon votre valeur.",
        "Résumés de cours par IA qui génèrent des devoirs interactifs en 10 secondes. 7 types d'exercices incluant écoute, association et traduction. Les élèves adorent.",
        "Recevez vos paiements en monnaie réelle, directement. Pas d'intermédiaire de crédits iTalki. Stripe gère tout — rapide, fiable, mondial.",
        "Pas d'angoisse de l'algorithme. Votre profil n'est pas enterré parce que vous avez pris une semaine de congé. Construisez une base stable d'élèves qui viennent directement à vous.",
        "Exportez vos données d'élèves. Votre historique de cours, notes et contacts vous appartiennent. Emportez-les où vous voulez.",
      ]}
      otherComparisons={[
        { name: "Preply", slug: "preply" },
        { name: "Cambly", slug: "cambly" },
      ]}
    />
  );
}
