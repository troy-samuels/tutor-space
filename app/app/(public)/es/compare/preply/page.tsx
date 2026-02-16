import type { Metadata } from "next";
import ComparisonPage from "@/components/compare/ComparisonPage";

export const metadata: Metadata = {
  title: "TutorLingua vs Preply: Por Qué los Tutores Independientes Están Cambiando",
  description:
    "Compara TutorLingua y Preply lado a lado. Comisiones, control de reservas, pagos y gestión de estudiantes para tutores de idiomas independientes.",
  openGraph: {
    title: "TutorLingua vs Preply: La Alternativa Sin Comisiones",
    description:
      "Los tutores independientes están cambiando de Preply a TutorLingua. Cero comisión, control total de tus estudiantes y herramientas diseñadas para la independencia.",
    type: "article",
    url: "/es/compare/preply",
  },
  alternates: {
    canonical: "/es/compare/preply",
    languages: {
      en: "/compare/preply",
      fr: "/fr/compare/preply",
      de: "/de/compare/preply",
    },
  },
};

export default function PreplyComparisonPageES() {
  return (
    <ComparisonPage
      competitorName="Preply"
      competitorSlug="preply"
      title="TutorLingua vs Preply: Por Qué los Tutores Están Cambiando"
      subtitle="Comparación honesta"
      heroDescription="Preply es genial para encontrar tus primeros estudiantes. Pero cuando ya tienes alumnos regulares, pagar entre un 18% y un 33% de comisión en cada clase deja de parecer una tarifa de marketplace y empieza a parecer un impuesto. Así se comparan las plataformas."
      features={[
        {
          feature: "Tasa de comisión",
          tutorlingua: "0% — siempre",
          competitor: "18-33% por clase",
          highlight: true,
        },
        {
          feature: "Propiedad del estudiante",
          tutorlingua: "La relación es tuya",
          competitor: "La plataforma controla al estudiante",
        },
        {
          feature: "Condiciones de pago",
          tutorlingua: "Directo a ti vía Stripe",
          competitor: "Periodo de retiro de 5 días",
        },
        {
          feature: "Control de reservas",
          tutorlingua: "Control total, tu horario",
          competitor: "Calendario gestionado por la plataforma",
        },
        {
          feature: "Fijación de precios",
          tutorlingua: "Pon el precio que quieras, paquetes incluidos",
          competitor: "Precios guiados, influenciados por la plataforma",
        },
        {
          feature: "Resúmenes de clase con IA",
          tutorlingua: "✅ 7 tipos de ejercicios, multilingüe",
          competitor: "❌ No disponible",
          highlight: true,
        },
        {
          feature: "Descubrimiento de estudiantes",
          tutorlingua: "Perfil propio + SEO",
          competitor: "Búsqueda del marketplace + algoritmo",
        },
        {
          feature: "Portabilidad de reseñas",
          tutorlingua: "Tu perfil, tus reseñas",
          competitor: "Bloqueadas en Preply",
        },
        {
          feature: "Política de cancelación",
          tutorlingua: "Tú defines la tuya",
          competitor: "Reglas impuestas por la plataforma",
        },
        {
          feature: "Clases de prueba gratuitas",
          tutorlingua: "Opcional, tú decides",
          competitor: "Obligatorias para nuevos estudiantes",
        },
      ]}
      painPoints={[
        {
          quote:
            "Llevo 2 años en Preply. Me quitan el 33% de las clases de prueba y el 18% de todo lo demás. Son cientos de euros al mes solo por estar en una plataforma.",
          source: "Tutor en r/Preply",
        },
        {
          quote:
            "Lo peor es que no puedes llevarte tus reseñas. Tengo más de 200 reseñas de cinco estrellas y están todas bloqueadas dentro de Preply.",
          source: "Tutor en r/OnlineESLTeaching",
        },
        {
          quote:
            "Te encuentran UN estudiante y se llevan el 33% de cada clase PARA SIEMPRE. Los números son una locura cuando los sumas de verdad.",
          source: "Discusión en comunidad de tutores",
        },
        {
          quote:
            "Finalmente calculé mi tarifa real por hora después de la comisión de Preply. Fue revelador. Hacerme independiente fue la mejor decisión que tomé.",
          source: "Tutor en r/freelance",
        },
      ]}
      whySwitchReasons={[
        "Quédate con el 100% de lo que ganas — sin comisión en ninguna clase, jamás. Tu trabajo, tus ingresos.",
        "Sé dueño de tus relaciones con estudiantes. Cuando un alumno reserva contigo, es TU estudiante. Sin plataforma de por medio.",
        "Resúmenes de clase con IA con 7 tipos de ejercicios interactivos. Envía deberes a tus alumnos en 10 segundos. Nada parecido existe en Preply.",
        "Precios flexibles con paquetes, suscripciones y clases individuales. Fija tus tarifas sin interferencia de la plataforma.",
        "Cobra directamente a través de Stripe — sin periodos de espera, sin monto mínimo de retiro.",
        "Tu perfil, tu marca. Construye una presencia que te pertenezca, no a un marketplace que puede cambiar su algoritmo de la noche a la mañana.",
      ]}
      otherComparisons={[
        { name: "iTalki", slug: "italki" },
        { name: "Cambly", slug: "cambly" },
      ]}
    />
  );
}
