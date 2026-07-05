"use client";

import { useState, useEffect, useRef } from "react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/hooks/use-translations";

const languages = [
  { code: "es", label: "Español", flag: "🇩🇴" },
  { code: "en", label: "English", flag: "🇺🇸" },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwitch = (code: string) => {
    setLocale(code as "es" | "en");
    setIsOpen(false);
  };

  const currentLanguage = languages.find((l) => l.code === locale) || languages[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{currentLanguage.label}</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 rounded-md border bg-popover p-1 shadow-md z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSwitch(lang.code)}
              className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent ${
                locale === lang.code ? "bg-accent" : ""
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
