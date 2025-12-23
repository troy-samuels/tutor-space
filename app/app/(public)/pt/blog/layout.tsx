import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    template: "%s | Blog TutorLingua",
    default: "Blog | TutorLingua - Recursos para Tutores de Idiomas",
  },
  description:
    "Guias especializados, dicas e estratégias para tutores de idiomas independentes. Aprenda a expandir seu negócio de tutoria, reduzir taxas de plataforma e manter mais da sua renda.",
  keywords: [
    "dicas de tutoria de idiomas",
    "guia de tutor online",
    "negócio de tutoria",
    "alternativas ao Preply",
    "dicas iTalki",
    "reduzir comissões de tutoria",
  ],
  openGraph: {
    type: "website",
    siteName: "Blog TutorLingua",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function BlogLayoutPT({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Blog Header */}
      <header className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="flex items-center justify-between mb-6">
            <Link href="/" className="text-2xl font-bold hover:opacity-90">
              TutorLingua
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/pt/blog"
                className="hover:underline underline-offset-4"
              >
                Blog
              </Link>
              <Link
                href="/pricing"
                className="hover:underline underline-offset-4"
              >
                Preços
              </Link>
              <Link
                href="/signup"
                className="bg-white text-primary px-4 py-2 rounded-lg font-semibold hover:bg-primary/10 transition-colors"
              >
                Começar Grátis
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Blog Footer CTA */}
      <section className="bg-gradient-to-br from-primary via-primary to-accent text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para Manter Mais da Sua Renda de Tutoria?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            TutorLingua oferece tudo o que você precisa para aceitar reservas diretas:
            página de reservas profissional, pagamentos, lembretes automáticos e
            gestão de alunos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary/10 transition-colors"
            >
              Começar Grátis
            </Link>
            <Link
              href="/pricing"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Ver Preços
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Produto</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/features/booking" className="hover:text-white">
                    Calendário de Reservas
                  </Link>
                </li>
                <li>
                  <Link href="/features/payments" className="hover:text-white">
                    Processamento de Pagamentos
                  </Link>
                </li>
                <li>
                  <Link href="/features/students" className="hover:text-white">
                    CRM de Alunos
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white">
                    Preços
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Recursos</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/pt/blog" className="hover:text-white">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pt/blog/taxas-ocultas-plataformas-tutoria"
                    className="hover:text-white"
                  >
                    Reduzir Comissões
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pt/blog/ferramentas-tecnologicas-tutores-2025"
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
                    Sobre
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    Política de Privacidade
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white">
                    Termos de Uso
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
                <li>
                  <Link href="/fr/blog" className="hover:text-white">
                    Français
                  </Link>
                </li>
                <li>
                  <Link href="/pt/blog" className="hover:text-white">
                    Português
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p>© {new Date().getFullYear()} TutorLingua. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
