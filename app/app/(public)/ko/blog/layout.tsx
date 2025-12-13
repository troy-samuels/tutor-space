import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    template: "%s | TutorLingua 블로그",
    default: "블로그 | TutorLingua - 어학 강사를 위한 리소스",
  },
  description:
    "독립 어학 강사를 위한 전문 가이드, 팁, 전략. 과외 비즈니스를 성장시키고, 플랫폼 수수료를 줄이고, 더 많은 수입을 유지하는 방법을 배우세요.",
  keywords: [
    "어학 과외 팁",
    "온라인 튜터 가이드",
    "과외 비즈니스",
    "Preply 대안",
    "iTalki 팁",
    "과외 수수료 줄이기",
  ],
  openGraph: {
    type: "website",
    siteName: "TutorLingua 블로그",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function BlogLayoutKO({
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
                href="/ko/blog"
                className="hover:underline underline-offset-4"
              >
                블로그
              </Link>
              <Link
                href="/pricing"
                className="hover:underline underline-offset-4"
              >
                가격
              </Link>
              <Link
                href="/signup"
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                무료로 시작
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
            과외 수입을 더 많이 유지할 준비가 되셨나요?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            TutorLingua는 직접 예약을 받는 데 필요한 모든 것을 제공합니다:
            전문 예약 페이지, 결제 처리, 자동 알림 및 학생 관리.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              무료로 시작
            </Link>
            <Link
              href="/pricing"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              가격 보기
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">제품</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/features/booking" className="hover:text-white">
                    예약 캘린더
                  </Link>
                </li>
                <li>
                  <Link href="/features/payments" className="hover:text-white">
                    결제 처리
                  </Link>
                </li>
                <li>
                  <Link href="/features/students" className="hover:text-white">
                    학생 CRM
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white">
                    가격
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">리소스</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/ko/blog" className="hover:text-white">
                    블로그
                  </Link>
                </li>
                <li>
                  <Link
                    href="/ko/blog/gwaoe-platform-sumgyeojin-susuryo"
                    className="hover:text-white"
                  >
                    수수료 줄이기
                  </Link>
                </li>
                <li>
                  <Link
                    href="/ko/blog/dogrib-tutor-pilsu-gisul-dogu-2025"
                    className="hover:text-white"
                  >
                    기술 스택
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">회사</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="hover:text-white">
                    회사 소개
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    개인정보 처리방침
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white">
                    이용약관
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">언어</h3>
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
                  <Link href="/ko/blog" className="hover:text-white">
                    한국어
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
