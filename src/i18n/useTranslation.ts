import { useState, useEffect, useCallback } from "react";
import { en } from "./en";
import { hi } from "./hi";

export type Language = "en" | "hi";

const translations = { en, hi };

// Deep get with dot notation support
function deepGet(obj: Record<string, unknown>, path: string): string {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return path;
    current = (current as Record<string, unknown>)[part];
  }
  if (typeof current === "string") return current;
  if (Array.isArray(current)) return path;
  return path;
}

// Language event for cross-component sync
const LANG_EVENT = "pratibha-lang-change";

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem("pratibha-lang") as Language) || "en";
  });

  useEffect(() => {
    const handler = (e: Event) => {
      const lang = (e as CustomEvent<Language>).detail;
      setLanguageState(lang);
    };
    window.addEventListener(LANG_EVENT, handler);
    return () => window.removeEventListener(LANG_EVENT, handler);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    localStorage.setItem("pratibha-lang", lang);
    setLanguageState(lang);
    window.dispatchEvent(new CustomEvent<Language>(LANG_EVENT, { detail: lang }));
  }, []);

  return { language, setLanguage };
}

export function useTranslation() {
  const { language, setLanguage } = useLanguage();
  const t = translations[language] as Record<string, unknown>;

  const translate = useCallback(
    (key: string, fallback?: string): string => {
      const result = deepGet(t, key);
      if (result === key) {
        // fallback to english
        const enResult = deepGet(translations.en as Record<string, unknown>, key);
        return enResult !== key ? enResult : fallback ?? key;
      }
      return result;
    },
    [t]
  );

  return { t: translate, language, setLanguage };
}

// Typed helper for direct object access
export function useT() {
  const { language, setLanguage } = useLanguage();
  const dict = translations[language];
  return { dict, language, setLanguage };
}
