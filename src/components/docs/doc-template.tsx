"use client";

import Link from "next/link";
import { MessageSquare, ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

interface Section {
  title: string;
  content?: string;
  items?: string[];
  type?: "list" | "text" | "table";
  tableHeaders?: string[];
  tableRows?: string[][];
}

interface DocTemplateProps {
  title: string;
  subtitle: string;
  sections: Section[];
  prevHref?: string;
  prevLabel?: string;
  nextHref?: string;
  nextLabel?: string;
  headerLinks?: Array<{ href: string; label: string }>;
  badges?: string[];
}

export function DocTemplate({
  title,
  subtitle,
  sections,
  prevHref,
  prevLabel,
  nextHref,
  nextLabel,
}: DocTemplateProps) {
  const { t, locale } = useTranslations();
  const isEn = locale === "en";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/docs" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <MessageSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Zynex CRM</span>
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {isEn ? "Pricing" : "Precios"}
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link
          href="/docs"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          {isEn ? "Back to Documentation" : "Volver a Documentación"}
        </Link>

        <h1 className="text-4xl font-bold mb-4">{title}</h1>
        <p className="text-lg text-muted-foreground mb-12">{subtitle}</p>

        <div className="space-y-8">
          {sections.map((section, i) => (
            <div key={i} className="p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-3">{section.title}</h2>
              {section.content && (
                <p className="text-muted-foreground mb-3">{section.content}</p>
              )}
              {section.type === "list" && section.items && (
                <ul className="space-y-2">
                  {section.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {section.type === "table" && section.tableHeaders && section.tableRows && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        {section.tableHeaders.map((th, j) => (
                          <th key={j} className="text-left py-2 px-3 font-medium text-foreground">
                            {th}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.tableRows.map((row, j) => (
                        <tr key={j} className="border-b last:border-0">
                          {row.map((cell, k) => (
                            <td key={k} className="py-2 px-3 text-muted-foreground">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-between">
          {prevHref ? (
            <Link
              href={prevHref}
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              {prevLabel}
            </Link>
          ) : (
            <div />
          )}
          {nextHref && (
            <Link
              href={nextHref}
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              {nextLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
