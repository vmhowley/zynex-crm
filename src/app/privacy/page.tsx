"use client";

import Link from "next/link";
import { MessageSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/hooks/use-translations";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function PrivacyPage() {
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
            {t("privacy_title")}
          </h1>
          <p className="text-muted-foreground">
            {t("privacy_lastUpdate")}: {new Date().toLocaleDateString("es-DO", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
          {/* Section 1: Introduction */}
          <section>
            <h2 className="text-xl font-semibold mb-3">{t("privacy_section_1_title")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("privacy_section_1_content")}
            </p>
          </section>

          {/* Section 2: Data Collected */}
          <section>
            <h2 className="text-xl font-semibold mb-3">{t("privacy_section_2_title")}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t("privacy_section_2_intro")}
            </p>
            <h3 className="font-medium mb-2">{t("privacy_section_2_personal_title")}</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>{t("privacy_personal_1")}</li>
              <li>{t("privacy_personal_2")}</li>
              <li>{t("privacy_personal_3")}</li>
              <li>{t("privacy_personal_4")}</li>
            </ul>
            <h3 className="font-medium mb-2">{t("privacy_section_2_usage_title")}</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{t("privacy_usage_1")}</li>
              <li>{t("privacy_usage_2")}</li>
              <li>{t("privacy_usage_3")}</li>
              <li>{t("privacy_usage_4")}</li>
            </ul>
          </section>

          {/* Section 3: Data Usage */}
          <section>
            <h2 className="text-xl font-semibold mb-3">{t("privacy_section_3_title")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("privacy_section_3_content")}
            </p>
          </section>

          {/* Section 4: Data Storage */}
          <section>
            <h2 className="text-xl font-semibold mb-3">{t("privacy_section_4_title")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("privacy_section_4_content")}
            </p>
          </section>

          {/* Section 5: Data Sharing */}
          <section>
            <h2 className="text-xl font-semibold mb-3">{t("privacy_section_5_title")}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t("privacy_section_5_intro")}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{t("privacy_sharing_1")}</li>
              <li>{t("privacy_sharing_2")}</li>
              <li>{t("privacy_sharing_3")}</li>
            </ul>
          </section>

          {/* Section 6: Data Security */}
          <section>
            <h2 className="text-xl font-semibold mb-3">{t("privacy_section_6_title")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("privacy_section_6_content")}
            </p>
          </section>

          {/* Section 7: User Rights */}
          <section>
            <h2 className="text-xl font-semibold mb-3">{t("privacy_section_7_title")}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t("privacy_section_7_intro")}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{t("privacy_rights_1")}</li>
              <li>{t("privacy_rights_2")}</li>
              <li>{t("privacy_rights_3")}</li>
              <li>{t("privacy_rights_4")}</li>
              <li>{t("privacy_rights_5")}</li>
            </ul>
          </section>

          {/* Section 8: Cookies */}
          <section>
            <h2 className="text-xl font-semibold mb-3">{t("privacy_section_8_title")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("privacy_section_8_content")}
            </p>
          </section>

          {/* Section 9: Third Party Services */}
          <section>
            <h2 className="text-xl font-semibold mb-3">{t("privacy_section_9_title")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("privacy_section_9_content")}
            </p>
          </section>

          {/* Section 10: Children's Privacy */}
          <section>
            <h2 className="text-xl font-semibold mb-3">{t("privacy_section_10_title")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("privacy_section_10_content")}
            </p>
          </section>

          {/* Section 11: Changes */}
          <section>
            <h2 className="text-xl font-semibold mb-3">{t("privacy_section_11_title")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("privacy_section_11_content")}
            </p>
          </section>

          {/* Section 12: Contact */}
          <section>
            <h2 className="text-xl font-semibold mb-3">{t("privacy_section_12_title")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t("privacy_section_12_content")}
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
