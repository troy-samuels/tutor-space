"use server";

import { cookies } from "next/headers";
import { defaultLocale, locales, type Locale } from "./config";

export async function setLocale(locale: string) {
  const normalized = locale.toLowerCase() as Locale;
  const isSupported = (locales as readonly string[]).includes(normalized);

  const targetLocale = isSupported ? normalized : defaultLocale;

  const cookieStore = await cookies();
  cookieStore.set("NEXT_LOCALE", targetLocale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}
