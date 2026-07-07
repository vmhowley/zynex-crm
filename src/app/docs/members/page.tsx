"use client";

import Link from "next/link";
import { MessageSquare, ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

const es = {
  title: "Miembros del Equipo",
  subtitle: "Invita compañeros y gestiona permisos de acceso.",
  intro: "La superficie de Miembros convierte una instalación individual en un espacio de trabajo compartido. Cada instalación de Zynex CRM es scoped por cuenta: tus datos pertenecen a una cuenta, no a tu fila de usuario, y cada miembro de esa cuenta trabaja contra la misma bandeja de entrada, contactos, pipelines, plantillas y flujos.",
  rolesTitle: "Roles",
  rolesIntro: "Cuatro roles en una escalera de privilegios plana. Cada uno hereda todo lo que el rol debajo puede hacer.",
  roles: [
    { role: "Dueño", perms: "Todo. Exactamente uno por cuenta. Además los dos poderes exclusivos de dueño: transferir propiedad y eliminar la cuenta." },
    { role: "Admin", perms: "Gestionar miembros y editar configuraciones de cuenta — WhatsApp, plantillas, pipelines, etiquetas, nombre de cuenta." },
    { role: "Agente", perms: "Trabajo operacional: enviar mensajes, crear/editar contactos, mover tratos, ejecutar broadcasts, construir automatizaciones y flujos." },
    { role: "Visor", perms: "Solo lectura en toda la app. Ve todo, no cambia nada." },
  ],
  permissionTitle: "Matriz de permisos",
  permissionHeaders: ["Capacidad", "Visor", "Agente", "Admin", "Dueño"],
  permissionRows: [
    ["Ver todos los datos (bandeja, contactos, pipelines, ...)", "✅", "✅", "✅", "✅"],
    ["Enviar mensajes, editar contactos/tratos/broadcasts/automatizaciones/flujos", "—", "✅", "✅", "✅"],
    ["Editar cuenta (WhatsApp, plantillas, pipelines, etiquetas, nombre)", "—", "—", "✅", "✅"],
    ["Gestionar miembros (invitar, eliminar, cambiar roles)", "—", "—", "✅", "✅"],
    ["Transferir propiedad", "—", "—", "—", "✅"],
    ["Eliminar la cuenta", "—", "—", "—", "✅"],
  ],
  inviteTitle: "Invitando un compañero",
  inviteSteps: [
    "Configuración → Miembros → Invitar miembro.",
    "Elige el rol que el invitado obtendrá, y una fecha de expiración opcional.",
    "Zynex CRM devuelve un enlace de compartir de un solo uso. Cópialo ahora — el token se muestra exactamente una vez. Solo un hash SHA-256 se almacena en el servidor.",
  ],
  acceptTitle: "Aceptando una invitación",
  acceptDesc: "El destinatario abre el enlace, que aterriza en /join/<token>. Antes de comprometerse, la página muestra quién le invita y a qué cuenta. Si el enlace es válido, necesita un login de Zynex CRM (registrarse o iniciar sesión primero).",
  guardrail: "Si la persona que acepta ya tiene sus propios datos en su cuenta actual (contactos, conversaciones, tratos...), el redencimiento se rechaza con un error claro.",
  manageTitle: "Gestionando miembros",
  manageDesc: "La lista de miembros muestra a todos con su rol y fecha de ingreso.",
  manageItems: [
    "Cambiar un rol — admins+ pick new role from dropdown. No puedes promover a alguien a dueño o degradar al dueño actual así — usa transferencia.",
    "Eliminar un miembro — admins+ puede eliminar a cualquiera debajo de ellos. La persona eliminada mantiene su login y se mueve a una cuenta personal fresca.",
  ],
  transferTitle: "Transferir propiedad",
  transferDesc: "Solo dueño. Cada cuenta tiene exactamente un dueño, así que entregarlo es un swap atómico: eliges un miembro, y en una operación se vuelven dueño y bajas a admin.",
  limitsTitle: "Notas y límites",
  limitsItems: [
    "Las invitaciones son solo enlace. No hay entrega por email.",
    "Un dueño a la vez. Usa admins para gestión compartida.",
    "La.tenencia se enforced en la base de datos, no solo en la UI.",
  ],
  prevLabel: "Atrás: Asistente de IA",
  nextLabel: "Siguiente: Configuración",
};

const en = {
  title: "Team Members",
  subtitle: "Invite teammates and manage access permissions.",
  intro: "The Members surface turns a solo install into a shared team workspace. Every Zynex CRM install is account-scoped: your data belongs to an account, not to your user row, and every member of that account works against the same inbox, contacts, pipelines, templates, and flows.",
  rolesTitle: "Roles",
  rolesIntro: "Four roles in a flat privilege ladder. Each one inherits everything the role below it can do.",
  roles: [
    { role: "Owner", perms: "Everything. Exactly one per account. Plus the two owner-only powers: transfer ownership and delete the account." },
    { role: "Admin", perms: "Manage members and edit account-wide settings — WhatsApp, templates, pipelines, tags, account name." },
    { role: "Agent", perms: "Operational work: send messages, create/edit contacts, move deals, run broadcasts, build automations and flows." },
    { role: "Viewer", perms: "Read-only across the whole app. Sees everything, changes nothing." },
  ],
  permissionTitle: "Permission matrix",
  permissionHeaders: ["Capability", "Viewer", "Agent", "Admin", "Owner"],
  permissionRows: [
    ["View all data (inbox, contacts, pipelines, ...)", "✅", "✅", "✅", "✅"],
    ["Send messages, edit contacts/deals/broadcasts/automations/flows", "—", "✅", "✅", "✅"],
    ["Edit account settings (WhatsApp, templates, pipelines, tags, account name)", "—", "—", "✅", "✅"],
    ["Manage members (invite, remove, change roles)", "—", "—", "✅", "✅"],
    ["Transfer ownership", "—", "—", "—", "✅"],
    ["Delete the account", "—", "—", "—", "✅"],
  ],
  inviteTitle: "Inviting a teammate",
  inviteSteps: [
    "Settings → Members → Invite member.",
    "Pick the role the invitee will get, and an optional expiry.",
    "Zynex CRM returns a one-time share link. Copy it now — the token is shown exactly once. Only a SHA-256 hash is stored on the server.",
  ],
  acceptTitle: "Accepting an invite",
  acceptDesc: "The recipient opens the link, which lands on /join/<token>. Before they commit, the page shows who's inviting them and into what account.",
  guardrail: "If the person accepting already has their own data in their current account, redeem is refused with a clear error rather than silently abandoning that data.",
  manageTitle: "Managing members",
  manageDesc: "The members list shows everyone on the account with their role and join date.",
  manageItems: [
    "Change a role — admins+ pick new role from dropdown. Can't promote to owner or demote the current owner — use transfer instead.",
    "Remove a member — admins+ can remove anyone below them. The removed person keeps their login and is moved to a fresh personal account.",
  ],
  transferTitle: "Transferring ownership",
  transferDesc: "Owner only. Every account has exactly one owner, so handing it over is an atomic swap: pick a member, and in one operation they become owner and you drop to admin.",
  limitsTitle: "Notes & limits",
  limitsItems: [
    "Invites are link-only. No email delivery.",
    "One owner at a time. Use admins for shared management.",
    "Tenancy is enforced in the database, not just the UI.",
  ],
  prevLabel: "Back: AI Assistant",
  nextLabel: "Next: Settings",
};

const s = { es, en };

export default function MembersDocPage() {
  const { locale } = useTranslations();
  const c = s[locale] ?? s.en;

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
            {locale === "en" ? "Pricing" : "Precios"}
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          {locale === "en" ? "Back to Documentation" : "Volver a Documentación"}
        </Link>

        <h1 className="text-4xl font-bold mb-4">{c.title}</h1>
        <p className="text-lg text-muted-foreground mb-8">{c.subtitle}</p>
        <p className="text-muted-foreground mb-8">{c.intro}</p>

        <div className="space-y-8">
          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.rolesTitle}</h2>
            <p className="text-sm text-muted-foreground mb-4">{c.rolesIntro}</p>
            <div className="space-y-3">
              {c.roles.map((r, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <div>
                    <span className="font-medium text-sm">{r.role}</span>
                    <span className="text-muted-foreground text-sm"> — {r.perms}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.permissionTitle}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {c.permissionHeaders.map((th, i) => (
                      <th key={i} className="text-left py-2 px-3 font-medium">{th}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {c.permissionRows.map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      {row.map((cell, j) => (
                        <td key={j} className="py-2 px-3 text-muted-foreground">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.inviteTitle}</h2>
            <ol className="space-y-2">
              {c.inviteSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="font-bold text-primary shrink-0">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.acceptTitle}</h2>
            <p className="text-sm text-muted-foreground mb-3">{c.acceptDesc}</p>
            <p className="text-sm text-muted-foreground italic border-l-2 border-primary pl-3">{c.guardrail}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.manageTitle}</h2>
            <p className="text-sm text-muted-foreground mb-3">{c.manageDesc}</p>
            <ul className="space-y-2">
              {c.manageItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.transferTitle}</h2>
            <p className="text-sm text-muted-foreground">{c.transferDesc}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.limitsTitle}</h2>
            <ul className="space-y-2">
              {c.limitsItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex justify-between">
          <Link href="/docs/ai-assistant" className="text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            {c.prevLabel}
          </Link>
          <Link href="/docs/settings" className="text-primary hover:underline inline-flex items-center gap-1">
            {c.nextLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
