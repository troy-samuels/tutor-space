import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    template: "%s | Blog TutorLingua",
    default: "Blog | TutorLingua - Ressources pour Tuteurs de Langues",
  },
  description:
    "Guides experts, conseils et stratégies pour les tuteurs de langues indépendants. Apprenez à développer votre activité de tutorat, réduire les frais de plateforme et conserver plus de vos revenus.",
  keywords: [
    "conseils tutorat langues",
    "guide tuteur en ligne",
    "activité de tutorat",
    "alternatives à Preply",
    "conseils iTalki",
    "réduire commissions tutorat",
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

export default function BlogLayoutFR({
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
                href="/fr/blog"
                className="hover:underline underline-offset-4"
              >
                Blog
              </Link>
              <Link
                href="/pricing"
                className="hover:underline underline-offset-4"
              >
                Tarifs
              </Link>
              <Link
                href="/signup"
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Commencer Gratuitement
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
            Prêt à Conserver Plus de Vos Revenus de Tutorat ?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            TutorLingua vous donne tout ce dont vous avez besoin pour accepter des réservations directes :
            page de réservation professionnelle, paiements, rappels automatiques et
            gestion des étudiants.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Commencer Gratuitement
            </Link>
            <Link
              href="/pricing"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Voir les Tarifs
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Produit</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/features/booking" className="hover:text-white">
                    Calendrier de Réservation
                  </Link>
                </li>
                <li>
                  <Link href="/features/payments" className="hover:text-white">
                    Traitement des Paiements
                  </Link>
                </li>
                <li>
                  <Link href="/features/students" className="hover:text-white">
                    CRM Étudiants
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white">
                    Tarifs
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Ressources</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/fr/blog" className="hover:text-white">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/fr/blog/reduire-frais-plateformes-tutorat"
                    className="hover:text-white"
                  >
                    Réduire les Commissions
                  </Link>
                </li>
                <li>
                  <Link
                    href="/fr/blog/outils-technologiques-tuteur-2025"
                    className="hover:text-white"
                  >
                    Stack Technologique
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Entreprise</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="hover:text-white">
                    À Propos
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    Politique de Confidentialité
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white">
                    Conditions d&apos;Utilisation
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Langue</h3>
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
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p>© {new Date().getFullYear()} TutorLingua. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
