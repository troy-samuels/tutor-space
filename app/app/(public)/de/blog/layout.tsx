import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    template: "%s | TutorLingua Blog",
    default: "Blog | TutorLingua - Ressourcen für Sprachlehrer",
  },
  description:
    "Expertenanleitungen, Tipps und Strategien für unabhängige Sprachlehrer. Lernen Sie, Ihr Nachhilfegeschäft auszubauen, Plattformgebühren zu reduzieren und mehr von Ihrem Einkommen zu behalten.",
  keywords: [
    "Tipps für Sprachunterricht",
    "Online-Tutor-Leitfaden",
    "Nachhilfegeschäft",
    "Preply-Alternativen",
    "iTalki-Tipps",
    "Nachhilfe-Provisionen reduzieren",
  ],
  openGraph: {
    type: "website",
    siteName: "TutorLingua Blog",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function BlogLayoutDE({
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
                href="/de/blog"
                className="hover:underline underline-offset-4"
              >
                Blog
              </Link>
              <Link
                href="/pricing"
                className="hover:underline underline-offset-4"
              >
                Preise
              </Link>
              <Link
                href="/signup"
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Kostenlos Starten
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
            Bereit, Mehr von Ihren Nachhilfe-Einnahmen zu Behalten?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            TutorLingua bietet alles, was Sie für Direktbuchungen brauchen:
            professionelle Buchungsseite, Zahlungsabwicklung, automatische Erinnerungen und
            Schülerverwaltung.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Kostenlos Starten
            </Link>
            <Link
              href="/pricing"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Preise Ansehen
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Produkt</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/features/booking" className="hover:text-white">
                    Buchungskalender
                  </Link>
                </li>
                <li>
                  <Link href="/features/payments" className="hover:text-white">
                    Zahlungsabwicklung
                  </Link>
                </li>
                <li>
                  <Link href="/features/students" className="hover:text-white">
                    Schüler-CRM
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white">
                    Preise
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Ressourcen</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/de/blog" className="hover:text-white">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/de/blog/versteckte-gebuehren-nachhilfe-plattformen"
                    className="hover:text-white"
                  >
                    Provisionen Reduzieren
                  </Link>
                </li>
                <li>
                  <Link
                    href="/de/blog/tech-tools-selbststaendige-tutoren-2025"
                    className="hover:text-white"
                  >
                    Tech-Stack
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Unternehmen</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="hover:text-white">
                    Über Uns
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    Datenschutz
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white">
                    Nutzungsbedingungen
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Sprache</h3>
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
                  <Link href="/de/blog" className="hover:text-white">
                    Deutsch
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p>© {new Date().getFullYear()} TutorLingua. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
