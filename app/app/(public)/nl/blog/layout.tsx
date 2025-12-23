import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    template: "%s | TutorLingua Blog",
    default: "Blog | TutorLingua - Bronnen voor Taaldocenten",
  },
  description:
    "Expertgidsen, tips en strategieën voor zelfstandige taaldocenten. Leer hoe je je bijlesbedrijf kunt laten groeien, platformkosten kunt verlagen en meer van je inkomen kunt behouden.",
  keywords: [
    "tips voor taalles",
    "online tutor gids",
    "bijlesbedrijf",
    "Preply alternatieven",
    "iTalki tips",
    "bijles commissies verlagen",
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

export default function BlogLayoutNL({
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
                href="/nl/blog"
                className="hover:underline underline-offset-4"
              >
                Blog
              </Link>
              <Link
                href="/pricing"
                className="hover:underline underline-offset-4"
              >
                Prijzen
              </Link>
              <Link
                href="/signup"
                className="bg-white text-primary px-4 py-2 rounded-lg font-semibold hover:bg-primary/10 transition-colors"
              >
                Gratis Beginnen
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
            Klaar om Meer van je Bijles-Inkomen te Behouden?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            TutorLingua geeft je alles wat je nodig hebt om directe boekingen te accepteren:
            professionele boekingspagina, betalingen, automatische herinneringen en
            leerlingenbeheer.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary/10 transition-colors"
            >
              Gratis Beginnen
            </Link>
            <Link
              href="/pricing"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Prijzen Bekijken
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/features/booking" className="hover:text-white">
                    Boekingskalender
                  </Link>
                </li>
                <li>
                  <Link href="/features/payments" className="hover:text-white">
                    Betalingsverwerking
                  </Link>
                </li>
                <li>
                  <Link href="/features/students" className="hover:text-white">
                    Leerlingen CRM
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white">
                    Prijzen
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Bronnen</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/nl/blog" className="hover:text-white">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/nl/blog/verborgen-kosten-bijlesplatformen"
                    className="hover:text-white"
                  >
                    Commissies Verlagen
                  </Link>
                </li>
                <li>
                  <Link
                    href="/nl/blog/tech-stack-zelfstandige-tutoren-2025"
                    className="hover:text-white"
                  >
                    Tech Stack
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Bedrijf</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="hover:text-white">
                    Over Ons
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    Privacybeleid
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white">
                    Gebruiksvoorwaarden
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Taal</h3>
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
                  <Link href="/nl/blog" className="hover:text-white">
                    Nederlands
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p>© {new Date().getFullYear()} TutorLingua. Alle rechten voorbehouden.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
