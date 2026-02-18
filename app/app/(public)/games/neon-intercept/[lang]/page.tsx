import { notFound, redirect } from "next/navigation";

const SUPPORTED_LANGUAGES = new Set(["en", "es", "fr", "de"]);

export default async function NeonInterceptLanguagePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!SUPPORTED_LANGUAGES.has(lang)) {
    notFound();
  }
  redirect(`/games/neon-intercept?lang=${lang}`);
}

