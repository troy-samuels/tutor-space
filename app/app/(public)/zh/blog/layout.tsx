import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    template: "%s | TutorLingua 博客",
    default: "博客 | TutorLingua - 语言教师资源",
  },
  description:
    "为独立语言教师提供的专业指南、技巧和策略。学习如何发展您的辅导业务、降低平台费用并保留更多收入。",
  keywords: [
    "语言辅导技巧",
    "在线教师指南",
    "辅导业务",
    "Preply替代品",
    "iTalki技巧",
    "降低辅导佣金",
  ],
  openGraph: {
    type: "website",
    siteName: "TutorLingua 博客",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function BlogLayoutZH({
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
                href="/zh/blog"
                className="hover:underline underline-offset-4"
              >
                博客
              </Link>
              <Link
                href="/pricing"
                className="hover:underline underline-offset-4"
              >
                价格
              </Link>
              <Link
                href="/signup"
                className="bg-white text-primary px-4 py-2 rounded-lg font-semibold hover:bg-primary/10 transition-colors"
              >
                免费开始
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
            准备好保留更多的辅导收入了吗？
          </h2>
          <p className="text-xl text-white/80 mb-8">
            TutorLingua为您提供接受直接预约所需的一切：
            专业预约页面、支付处理、自动提醒和学生管理。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary/10 transition-colors"
            >
              免费开始
            </Link>
            <Link
              href="/pricing"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              查看价格
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">产品</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/features/booking" className="hover:text-white">
                    预约日历
                  </Link>
                </li>
                <li>
                  <Link href="/features/payments" className="hover:text-white">
                    支付处理
                  </Link>
                </li>
                <li>
                  <Link href="/features/students" className="hover:text-white">
                    学生CRM
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white">
                    价格
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">资源</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/zh/blog" className="hover:text-white">
                    博客
                  </Link>
                </li>
                <li>
                  <Link
                    href="/zh/blog/fudao-pingtai-yincang-feiyong"
                    className="hover:text-white"
                  >
                    降低佣金
                  </Link>
                </li>
                <li>
                  <Link
                    href="/zh/blog/duli-jiaoshi-keji-gongju-2025"
                    className="hover:text-white"
                  >
                    技术工具
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">公司</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="hover:text-white">
                    关于我们
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    隐私政策
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white">
                    服务条款
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">语言</h3>
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
                  <Link href="/zh/blog" className="hover:text-white">
                    中文
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p>© {new Date().getFullYear()} TutorLingua. 保留所有权利。</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
