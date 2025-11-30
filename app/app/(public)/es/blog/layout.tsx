import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    template: "%s | Blog de TutorLingua",
    default: "Blog | TutorLingua - Recursos para Tutores de Idiomas",
  },
  description:
    "Guías expertas, consejos y estrategias para tutores de idiomas independientes. Aprende cómo hacer crecer tu negocio de tutoría, reducir comisiones y conservar más de tus ingresos.",
  keywords: [
    "consejos tutoría idiomas",
    "guía tutor online",
    "negocio de tutoría",
    "alternativas a Preply",
    "consejos iTalki",
    "reducir comisiones tutoría",
  ],
  openGraph: {
    type: "website",
    siteName: "Blog de TutorLingua",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function BlogLayoutES({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Blog Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="flex items-center justify-between mb-6">
            <Link href="/" className="text-2xl font-bold hover:opacity-90">
              TutorLingua
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/es/blog"
                className="hover:underline underline-offset-4"
              >
                Blog
              </Link>
              <Link
                href="/pricing"
                className="hover:underline underline-offset-4"
              >
                Precios
              </Link>
              <Link
                href="/signup"
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Empezar Gratis
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Blog Footer CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            ¿Listo para Conservar Más de Tus Ingresos de Tutoría?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            TutorLingua te da todo lo que necesitas para aceptar reservas directas:
            página de reservas profesional, pagos, recordatorios automáticos y
            gestión de estudiantes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Empezar Gratis Hoy
            </Link>
            <Link
              href="/pricing"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Ver Precios
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Producto</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/features/booking" className="hover:text-white">
                    Calendario de Reservas
                  </Link>
                </li>
                <li>
                  <Link href="/features/payments" className="hover:text-white">
                    Procesamiento de Pagos
                  </Link>
                </li>
                <li>
                  <Link href="/features/students" className="hover:text-white">
                    CRM de Estudiantes
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white">
                    Precios
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Recursos</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/es/blog" className="hover:text-white">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/es/blog/reducir-comisiones-plataformas"
                    className="hover:text-white"
                  >
                    Reducir Comisiones
                  </Link>
                </li>
                <li>
                  <Link
                    href="/es/blog/stack-tecnologico-tutores-2025"
                    className="hover:text-white"
                  >
                    Stack Tecnológico
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="hover:text-white">
                    Acerca de
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    Política de Privacidad
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white">
                    Términos de Servicio
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Idioma</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/blog" className="hover:text-white">
                    English
                  </Link>
                </li>
                <li>
                  <Link href="/es/blog" className="hover:text-white">
                    Español
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p>© {new Date().getFullYear()} TutorLingua. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
