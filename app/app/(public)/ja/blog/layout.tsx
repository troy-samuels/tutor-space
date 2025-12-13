import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    template: "%s | TutorLingua ブログ",
    default: "ブログ | TutorLingua - 語学講師のためのリソース",
  },
  description:
    "独立した語学講師のための専門ガイド、ヒント、戦略。チューター業務を成長させ、プラットフォーム手数料を削減し、収入をより多く維持する方法を学びましょう。",
  keywords: [
    "語学チューターのヒント",
    "オンラインチューターガイド",
    "チューター事業",
    "Preplyの代替",
    "iTalkiのヒント",
    "チューター手数料削減",
  ],
  openGraph: {
    type: "website",
    siteName: "TutorLingua ブログ",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function BlogLayoutJA({
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
                href="/ja/blog"
                className="hover:underline underline-offset-4"
              >
                ブログ
              </Link>
              <Link
                href="/pricing"
                className="hover:underline underline-offset-4"
              >
                料金
              </Link>
              <Link
                href="/signup"
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                無料で始める
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
            レッスン収入をより多く維持する準備はできましたか？
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            TutorLinguaは直接予約を受け付けるために必要なすべてを提供します：
            プロフェッショナルな予約ページ、決済処理、自動リマインダー、
            生徒管理。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              無料で始める
            </Link>
            <Link
              href="/pricing"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              料金を見る
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">製品</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/features/booking" className="hover:text-white">
                    予約カレンダー
                  </Link>
                </li>
                <li>
                  <Link href="/features/payments" className="hover:text-white">
                    決済処理
                  </Link>
                </li>
                <li>
                  <Link href="/features/students" className="hover:text-white">
                    生徒CRM
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white">
                    料金
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">リソース</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/ja/blog" className="hover:text-white">
                    ブログ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/ja/blog/kakure-ryoukin-kateikyoushi-platform"
                    className="hover:text-white"
                  >
                    手数料削減
                  </Link>
                </li>
                <li>
                  <Link
                    href="/ja/blog/dokuritsu-tutor-tech-tools-2025"
                    className="hover:text-white"
                  >
                    テックスタック
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">会社</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="hover:text-white">
                    会社概要
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    プライバシーポリシー
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white">
                    利用規約
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">言語</h3>
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
                  <Link href="/ja/blog" className="hover:text-white">
                    日本語
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p>© {new Date().getFullYear()} TutorLingua. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
