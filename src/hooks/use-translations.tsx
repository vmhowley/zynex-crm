"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import esMessages from "@/messages/es.json";
import enMessages from "@/messages/en.json";

type Locale = "es" | "en";

interface TranslationContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const dict: Record<Locale, Record<string, string>> = { es: esMessages, en: enMessages };

const TranslationContext = createContext<TranslationContextType | null>(null);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("es");

  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale;
    if (saved && (saved === "es" || saved === "en")) {
      setLocale(saved);
    } else {
      const browserLang = navigator.language.split("-")[0];
      if (browserLang === "en") {
        setLocale("en");
      }
    }
  }, []);

  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem("locale", newLocale);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let value = dict[locale][key] ?? dict.en[key] ?? key;
    if (params) {
      value = value.replace(/\{(\w+)\}/g, (_, p) => {
        const v = params[p];
        return v !== undefined ? String(v) : `{${p}}`;
      });
    }
    return value;
  };

  return (
    <TranslationContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslations() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslations must be used within a TranslationProvider");
  }
  return context;
}
