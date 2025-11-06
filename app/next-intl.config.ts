import { defaultLocale, locales } from "./lib/i18n/config";

const intlConfig = {
  locales,
  defaultLocale,
  localePrefix: "never",
} as const;

export default intlConfig;
