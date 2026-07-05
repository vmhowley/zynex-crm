"use client";

import Link from "next/link";
import { MessageSquare, ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

export default function MembersDocPage() {
  const { t } = useTranslations();
  const isEn = t("auth.login") !== "Iniciar Sesión";

  const content = isEn ? {
    title: "Team Members",
    subtitle: "Invite team members and manage access permissions.",
    sections: [
      { title: "Invite Members", desc: "Send invitations via email to join your workspace." },
      { title: "Roles", desc: "Assign roles: Admin, Agent, or Viewer." },
      { title: "Permissions", desc: "Control who can send messages, edit settings, or manage billing." },
      { title: "Remove Members", desc: "Remove members from your workspace at any time." },
      { title: "Ownership Transfer", desc: "Transfer account ownership to another admin." },
    ],
    prev: "Back: AI Assistant",
    next: "Next: Settings"
  } : {
    title: "Miembros del Equipo",
    subtitle: "Invita miembros al equipo y gestiona permisos de acceso.",
    sections: [
      { title: "Invitar Miembros", desc: "Envía invitaciones por correo para unirse a tu espacio de trabajo." },
      { title: "Roles", desc: "Asigna roles: Administrador, Agente, o Visor." },
      { title: "Permisos", desc: "Controla quién puede enviar mensajes, editar configuraciones o gestionar facturación." },
      { title: "Eliminar Miembros", desc: "Elimina miembros de tu espacio de trabajo en cualquier momento." },
      { title: "Transferencia de Propiedad", desc: "Transfiere la propiedad de la cuenta a otro administrador." },
    ],
    prev: "Atrás: Asistente de IA",
    next: "Siguiente: Configuración"
  };

  const c = content;

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
          <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            {isEn ? "Pricing" : "Precios"}
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> {isEn ? "Back to Documentation" : "Volver a Documentación"}
        </Link>

        <h1 className="text-4xl font-bold mb-4">{c.title}</h1>
        <p className="text-lg text-muted-foreground mb-12">{c.subtitle}</p>

        <div className="space-y-6">
          {c.sections.map((section, i) => (
            <div key={i} className="p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
              <p className="text-muted-foreground">{section.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-between">
          <Link href="/docs/ai-assistant" className="text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> {c.prev}
          </Link>
          <Link href="/docs/settings" className="text-primary hover:underline inline-flex items-center gap-1">
            {c.next} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
