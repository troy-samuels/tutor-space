import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    template: "%s | Blog TutorLingua",
    default: "Blog | TutorLingua - Risorse per Tutor di Lingue",
  },
  description:
    "Guide esperte, consigli e strategie per tutor di lingue indipendenti. Impara a far crescere la tua attività di tutoring, ridurre le commissioni delle piattaforme e trattenere più guadagni.",
  keywords: [
    "consigli tutoring lingue",
    "guida tutor online",
    "attività di tutoring",
    "alternative a Preply",
    "consigli iTalki",
    "ridurre commissioni tutoring",
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

export default function BlogLayoutIT({
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
                href="/it/blog"
                className="hover:underline underline-offset-4"
              >
                Blog
              </Link>
              <Link
                href="/pricing"
                className="hover:underline underline-offset-4"
              >
                Prezzi
              </Link>
              <Link
                href="/signup"
                className="bg-white text-primary px-4 py-2 rounded-lg font-semibold hover:bg-primary/10 transition-colors"
              >
                Inizia Gratis
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Blog Footer CTA */}
      <section className="bg-primary text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto a Trattenere Più dei Tuoi Guadagni di Tutoring?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            TutorLingua ti offre tutto ciò di cui hai bisogno per accettare prenotazioni dirette:
            pagina di prenotazione professionale, pagamenti, promemoria automatici e
            gestione degli studenti.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary/10 transition-colors"
            >
              Inizia Gratis
            </Link>
            <Link
              href="/pricing"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Vedi Prezzi
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Prodotto</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/features/booking" className="hover:text-white">
                    Calendario Prenotazioni
                  </Link>
                </li>
                <li>
                  <Link href="/features/payments" className="hover:text-white">
                    Elaborazione Pagamenti
                  </Link>
                </li>
                <li>
                  <Link href="/features/students" className="hover:text-white">
                    CRM Studenti
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white">
                    Prezzi
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Risorse</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/it/blog" className="hover:text-white">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/it/blog/commissioni-nascoste-piattaforme-tutoring"
                    className="hover:text-white"
                  >
                    Ridurre Commissioni
                  </Link>
                </li>
                <li>
                  <Link
                    href="/it/blog/strumenti-tech-tutor-indipendenti-2025"
                    className="hover:text-white"
                  >
                    Stack Tecnologico
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Azienda</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="hover:text-white">
                    Chi Siamo
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white">
                    Termini di Servizio
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Lingua</h3>
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
                  <Link href="/it/blog" className="hover:text-white">
                    Italiano
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p>© {new Date().getFullYear()} TutorLingua. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
