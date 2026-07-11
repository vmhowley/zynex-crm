"use client";

import Link from "next/link";
import { MessageSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/hooks/use-translations";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function TermsPage() {
  const { t } = useTranslations();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/login">
              <Button variant="ghost" size="sm">{t("nav_login")}</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">{t("nav_cta")}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {t("terms_title")}
          </h1>
          <p className="text-muted-foreground">
            {t("terms_lastUpdate")}: {new Date().toLocaleDateString("es-DO", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
          {/* Section 1: Acceptance */}
          <section>
            <h2 className="text-xl font-semibold mb-3">{t("terms_section_1_title")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("terms_section_1_content")}
            </p>
          </section>

          {/* Section 2: Description */}
          <section>
            <h2 className="text-xl font-semibold mb-3">{t("terms_section_2_title")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("terms_section_2_content")}
            </p>
          </section>

          {/* Section 3: Accounts */}
          <section>
            <h2 className="text-xl font-semibold mb-3">{t("terms_section_3_title")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("terms_section_3_content")}
            </p>
          </section>

          {/* Section 4: Subscriptions */}
          <section>
            <h2 className="text-xl font-semibold mb-3">{t("terms_section_4_title")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("terms_section_4_content")}
            </p>
          </section>

          {/* Section 5: User Conduct */}
          <section>
            <h2 className="text-xl font-semibold mb-3">{t("terms_section_5_title")}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t("terms_section_5_content")}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{t("terms_prohibited_1")}</li>
              <li>{t("terms_prohibited_2")}</li>
              <li>{t("terms_prohibited_3")}</li>
              <li>{t("terms_prohibited_4")}</li>
              <li>{t("terms_prohibited_5")}</li>
            </ul>
          </section>

          {/* Section 6: Intellectual Property */}
          <section>
            <h2 className="text-xl font-semibold mb-3">{t("terms_section_6_title")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("terms_section_6_content")}
            </p>
          </section>

          {/* Section 7: Limitation of Liability */}
          <section>
            <h2 className="text-xl font-semibold mb-3">{t("terms_section_7_title")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("terms_section_7_content")}
            </p>
          </section>

          {/* Section 8: Termination */}
          <section>
            <h2 className="text-xl font-semibold mb-3">{t("terms_section_8_title")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("terms_section_8_content")}
            </p>
          </section>

          {/* Section 9: Governing Law */}
          <section>
            <h2 className="text-xl font-semibold mb-3">{t("terms_section_9_title")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("terms_section_9_content")}
            </p>
          </section>

          {/* Section 10: Contact */}
          <section>
            <h2 className="text-xl font-semibold mb-3">{t("terms_section_10_title")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("terms_section_10_content")}
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 px-4 mt-12">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary">
                <MessageSquare className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium">Zynex CRM</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground transition-colors">
                {t("nav_terms")}
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                {t("nav_privacy")}
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("footer_copyright")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
