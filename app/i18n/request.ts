import { getRequestConfig } from "next-intl/server";
import { defaultLocale, locales, type Locale } from "@/lib/i18n/config";
import { cookies, headers } from "next/headers";

const supportedLocales = new Set<Locale>(locales);

export default getRequestConfig(async () => {
  // Get locale from cookie or header
  const cookieStore = await cookies();
  const headersList = await headers();

  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  const headerLocale = headersList.get("x-locale");

  const locale = (cookieLocale && supportedLocales.has(cookieLocale as Locale))
    ? (cookieLocale as Locale)
    : (headerLocale && supportedLocales.has(headerLocale as Locale))
    ? (headerLocale as Locale)
    : defaultLocale;

  return {
    locale,
    messages: (await import(`@/messages/${locale}.json`)).default,
  };
});
