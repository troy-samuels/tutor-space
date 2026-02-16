import type { Metadata } from "next";
import ComparisonPage from "@/components/compare/ComparisonPage";

export const metadata: Metadata = {
  title: "TutorLingua vs Cambly: Para Tutores Que Quieren Control",
  description:
    "Compara TutorLingua y Cambly para tutores de inglés. Escapa de las tarifas fijas, pon tus propios precios y construye un negocio real de tutoría sin comisiones.",
  openGraph: {
    title: "TutorLingua vs Cambly: Para Tutores Que Quieren Control",
    description:
      "Cambly paga una tarifa fija. TutorLingua te permite fijar tus propios precios, quedarte con el 100% y construir un negocio real de tutoría.",
    type: "article",
    url: "/es/compare/cambly",
  },
  alternates: {
    canonical: "/es/compare/cambly",
    languages: {
      en: "/compare/cambly",
      fr: "/fr/compare/cambly",
      de: "/de/compare/cambly",
    },
  },
};

export default function CamblyComparisonPageES() {
  return (
    <ComparisonPage
      competitorName="Cambly"
      competitorSlug="cambly"
      title="TutorLingua vs Cambly: Para Tutores Que Quieren Control"
      subtitle="Comparación honesta"
      heroDescription="Cambly es fácil para empezar — inicia sesión, charla, cobra. Pero $0.17/minuto ($10.20/hora) sin control sobre tu horario, tus estudiantes ni tu programa no es una carrera. Es un trabajo temporal. Esta es la alternativa."
      features={[
        {
          feature: "Tarifa por hora",
          tutorlingua: "Tú la defines — $15-$80+/hr",
          competitor: "$10.20/hr (tarifa fija)",
          highlight: true,
        },
        {
          feature: "Comisión",
          tutorlingua: "0%",
          competitor: "La plataforma fija tu tarifa",
        },
        {
          feature: "Control de horario",
          tutorlingua: "Control total, tus condiciones",
          competitor: "Sistema de Horas Prioritarias",
          highlight: true,
        },
        {
          feature: "Selección de estudiantes",
          tutorlingua: "Acepta a quien quieras",
          competitor: "Emparejamiento aleatorio",
        },
        {
          feature: "Libertad de currículo",
          tutorlingua: "Enseña lo que quieras",
          competitor: "Currículo de la plataforma recomendado",
        },
        {
          feature: "Resúmenes de clase con IA",
          tutorlingua: "✅ 7 tipos de ejercicios, multilingüe",
          competitor: "❌ No disponible",
          highlight: true,
        },
        {
          feature: "Relaciones con estudiantes",
          tutorlingua: "Directas, a largo plazo",
          competitor: "Frecuentemente conversaciones únicas",
        },
        {
          feature: "Condiciones de pago",
          tutorlingua: "Stripe directo, flexible",
          competitor: "Transferencia semanal PayPal/banco",
        },
        {
          feature: "Tipos de clase",
          tutorlingua: "Estructurada + conversación",
          competitor: "Principalmente conversación",
        },
        {
          feature: "Potencial de crecimiento",
          tutorlingua: "Construye un negocio real",
          competitor: "Limitado a tarifa fija",
        },
      ]}
      painPoints={[
        {
          quote:
            "Hice las cuentas. A $10.20/hora en Cambly, trabajando 30 horas a la semana, son unos $1,200/mes antes de impuestos. No puedes construir una vida con eso.",
          source: "Tutor en r/OnlineESLTeaching",
        },
        {
          quote:
            "El sistema de Horas Prioritarias es una trampa. Te comprometes a estar disponible a ciertas horas, pero no hay garantía de que aparezcan estudiantes. Solo te sientas y esperas.",
          source: "Tutor en r/WorkOnline",
        },
        {
          quote:
            "Cambly trata a los tutores como piezas intercambiables. Cualquier tutor, cualquier tema, a cualquier hora. No hay forma de especializarte o cobrar más por tu experiencia.",
          source: "Discusión en comunidad de tutores",
        },
        {
          quote:
            "Tenía una alumna regular en Cambly durante 6 meses. Quería reservar más clases pero la plataforma no le permitía elegir horarios específicos conmigo. Se fue.",
          source: "Tutor en r/freelance",
        },
      ]}
      whySwitchReasons={[
        "Fija tus propias tarifas según tu experiencia, especialización y demanda. Los mejores tutores en TutorLingua cobran $40-80/hora — eso es 4-8 veces la tarifa fija de Cambly.",
        "Construye relaciones reales con estudiantes. Sin emparejamiento aleatorio — los estudiantes te encuentran, te reservan y vuelven porque te eligieron A TI.",
        "Resúmenes de clase con IA que convierten cada sesión en deberes interactivos. 7 tipos de ejercicios, generados en 10 segundos. Tus alumnos realmente practican entre clases.",
        "Especialízate y cobra en consecuencia. Enseña inglés de negocios a precio premium. Ofrece preparación para exámenes. Crea paquetes. En Cambly, todos valen $10.20/hora sin importar su experiencia.",
        "Tu horario, tus reglas. Sin Horas Prioritarias, sin penalizaciones por no estar conectado a horas específicas. Acepta reservas cuando te convenga.",
        "Haz la transición gradualmente. Mantén Cambly por ahora mientras construyes tu base de estudiantes independientes en TutorLingua. Sin obligación, sin compromiso.",
      ]}
      otherComparisons={[
        { name: "Preply", slug: "preply" },
        { name: "iTalki", slug: "italki" },
      ]}
    />
  );
}
