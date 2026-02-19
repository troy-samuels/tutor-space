import en from "./en.json";
import es from "./es.json";
import { isCopyLocale, type CopyLocale, type CopyPack } from "./schema";

const COPY: Record<CopyLocale, CopyPack> = {
  en,
  es,
};

export function getCopy(locale: string | null | undefined): CopyPack {
  if (isCopyLocale(locale)) {
    return COPY[locale];
  }
  return COPY.en;
}
