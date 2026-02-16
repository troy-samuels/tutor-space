import type { Metadata } from "next";
import ComparisonPage from "@/components/compare/ComparisonPage";

export const metadata: Metadata = {
  title: "TutorLingua vs iTalki: La Alternativa Sin Comisiones",
  description:
    "Compara TutorLingua e iTalki para tutores de idiomas. Cero comisión vs 15%, pagos directos, resúmenes con IA y propiedad total de tus estudiantes.",
  openGraph: {
    title: "TutorLingua vs iTalki: La Alternativa Sin Comisiones",
    description:
      "Deja de pagar el 15% en cada clase. TutorLingua da a los tutores independientes las herramientas para gestionar estudiantes sin comisión de marketplace.",
    type: "article",
    url: "/es/compare/italki",
  },
  alternates: {
    canonical: "/es/compare/italki",
    languages: {
      en: "/compare/italki",
      es: "/es/compare/italki",
      fr: "/fr/compare/italki",
      de: "/de/compare/italki",
    },
  },
};

export default function iTalkiComparisonPageES() {
  return (
    <ComparisonPage
      competitorName="iTalki"
      competitorSlug="italki"
      title="TutorLingua vs iTalki: La Alternativa Sin Comisiones"
      subtitle="Comparación honesta"
      heroDescription="iTalki construyó una comunidad enorme de estudiantes y tutores de idiomas. Pero su comisión del 15% — más los cambios recientes en la interfaz y los retrasos en los pagos — tiene a los tutores buscando alternativas. Así nos comparamos."
      features={[
        {
          feature: "Tasa de comisión",
          tutorlingua: "0% — siempre",
          competitor: "15% por clase",
          highlight: true,
        },
        {
          feature: "Profesor vs Tutor Comunitario",
          tutorlingua: "Un solo nivel — eres tutor",
          competitor: "Dos niveles con precios diferentes",
        },
        {
          feature: "Procesamiento de pagos",
          tutorlingua: "Stripe directo, instantáneo",
          competitor: "Sistema de créditos iTalki",
        },
        {
          feature: "Retiro mínimo",
          tutorlingua: "Ninguno",
          competitor: "$30 mínimo",
        },
        {
          feature: "Resúmenes de clase con IA",
          tutorlingua: "✅ 7 tipos de ejercicios, multilingüe",
          competitor: "❌ No disponible",
          highlight: true,
        },
        {
          feature: "Paquetes de clases",
          tutorlingua: "Soporte completo de paquetes + suscripciones",
          competitor: "Opciones básicas de paquetes",
        },
        {
          feature: "Propiedad de datos del estudiante",
          tutorlingua: "Acceso total, exportable",
          competitor: "Controlado por la plataforma",
        },
        {
          feature: "Idiomas soportados",
          tutorlingua: "Todos los idiomas",
          competitor: "130+ idiomas",
        },
        {
          feature: "Marca personalizada",
          tutorlingua: "Tu perfil, tu marca",
          competitor: "Perfil estándar de iTalki",
        },
        {
          feature: "Flexibilidad de cancelación",
          tutorlingua: "Tú defines tu política",
          competitor: "Reglas de la plataforma",
        },
      ]}
      painPoints={[
        {
          quote:
            "iTalki cambió su interfaz OTRA VEZ y ahora la mitad de mis estudiantes no encuentran el botón para reagendar. Cada vez que 'mejoran' la UX, pierdo reservas.",
          source: "Tutor en r/iTalki",
        },
        {
          quote:
            "Menos clases en 2026. ¿Soy solo yo o alguien más ha notado una caída importante? No sé si es la IA o el algoritmo de la plataforma enterrándome.",
          source: "Discusión de tutores, febrero 2026",
        },
        {
          quote:
            "El 15% no parece mucho hasta que haces 100 horas al mes. Son 15 horas de trabajo que van directo a iTalki por… ¿un listado en su buscador?",
          source: "Tutor en r/OnlineESLTeaching",
        },
        {
          quote:
            "El sistema de créditos significa que los estudiantes le pagan a iTalki, no a ti. Si hay una disputa, la plataforma retiene TU dinero mientras lo resuelven.",
          source: "Discusión en comunidad de tutores",
        },
      ]}
      whySwitchReasons={[
        "Quédate con el 100% de tus ganancias. Sin comisión, sin sistema de créditos, sin retiro mínimo. Tu dinero es tu dinero.",
        "Un solo tipo de tutor — sin la división de 'Profesor Profesional' vs 'Tutor Comunitario'. Fija tus tarifas según tu valor.",
        "Resúmenes de clase con IA que generan deberes interactivos en 10 segundos. 7 tipos de ejercicios incluyendo escucha, emparejamiento y traducción. A los estudiantes les encanta.",
        "Cobra en moneda real, directamente. Sin intermediario de créditos iTalki. Stripe se encarga de todo — rápido, fiable, global.",
        "Sin ansiedad por el algoritmo. Tu perfil no se entierra porque tomaste una semana libre. Construye una base estable de estudiantes que vengan directamente a ti.",
        "Exporta los datos de tus estudiantes. Tu historial de clases, notas y contactos te pertenecen. Llévalos donde quieras.",
      ]}
      otherComparisons={[
        { name: "Preply", slug: "preply" },
        { name: "Cambly", slug: "cambly" },
      ]}
    />
  );
}
