import { getRequestConfig } from "next-intl/server";
import { defaultLocale, locales, type Locale } from "@/lib/i18n/config";
import { cookies, headers } from "next/headers";

const supportedLocales = new Set<Locale>(locales);

export default getRequestConfig(async ({ locale, requestLocale }) => {
  const cookieStore = await cookies();
  const headersList = await headers();

  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  const headerLocale = headersList.get("x-locale");
  const pathLocale = await requestLocale;
  const explicitLocale = locale;

  const resolvedLocale =
    (explicitLocale && supportedLocales.has(explicitLocale as Locale))
      ? (explicitLocale as Locale)
      : (pathLocale && supportedLocales.has(pathLocale as Locale))
        ? (pathLocale as Locale)
        : (cookieLocale && supportedLocales.has(cookieLocale as Locale))
          ? (cookieLocale as Locale)
          : (headerLocale && supportedLocales.has(headerLocale as Locale))
            ? (headerLocale as Locale)
            : defaultLocale;

  return {
    locale: resolvedLocale,
    messages: (await import(`@/messages/${resolvedLocale}.json`)).default,
  };
});
