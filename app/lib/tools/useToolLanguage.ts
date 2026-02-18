"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { type ToolLang, isValidToolLang, DEFAULT_LANG } from "./types";

const STORAGE_KEY = "tl_tools_lang";

/**
 * Hook that manages language selection for learner tools.
 *
 * Priority: URL ?lang= param → localStorage → default (en)
 * Setting language updates both localStorage and URL param.
 */
export function useToolLanguage(): [ToolLang, (lang: ToolLang) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [lang, setLangState] = React.useState<ToolLang>(() => {
    // SSR-safe initial value — will be updated in useEffect
    return DEFAULT_LANG;
  });

  // On mount: read URL param → localStorage → default
  React.useEffect(() => {
    const urlLang = searchParams.get("lang");
    if (urlLang && isValidToolLang(urlLang)) {
      setLangState(urlLang);
      try {
        localStorage.setItem(STORAGE_KEY, urlLang);
      } catch {}
      return;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && isValidToolLang(stored)) {
        setLangState(stored);
      }
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setLang = React.useCallback(
    (newLang: ToolLang) => {
      setLangState(newLang);
      try {
        localStorage.setItem(STORAGE_KEY, newLang);
      } catch {}
      // Update URL param for shareability
      const params = new URLSearchParams(searchParams.toString());
      if (newLang === DEFAULT_LANG) {
        params.delete("lang");
      } else {
        params.set("lang", newLang);
      }
      const query = params.toString();
      router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  return [lang, setLang];
}
