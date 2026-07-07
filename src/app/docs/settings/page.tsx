"use client";

import Link from "next/link";
import { Settings, ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

const es = {
  title: "Configuración",
  subtitle: "Personaliza Zynex CRM según las necesidades de tu equipo.",
  intro: "El panel de configuración está disponible en el menú lateral para admins y owners. Aquí puedes gestionar los ajustes generales de la cuenta, configurar tu número de WhatsApp, gestionar miembros del workspace, y más.",
  sections: "Secciones",
  sectionsDesc: "Accede a las diferentes áreas de configuración desde el menú lateral dentro de Settings.",
  general: "General",
  generalDesc: "Nombre de la cuenta, timezone, idioma de la interfaz, y formato de fecha/hora.",
  whatsapp: "WhatsApp",
  whatsappDesc: "Conecta tu número de WhatsApp Business. Requiere escanear un código QR con WhatsApp Web. Solo un número por cuenta.",
  whatsappSteps: [
    "Ve a Settings → WhatsApp.",
    "Haz clic en Conectar WhatsApp.",
    "Escanea el código QR con WhatsApp en tu teléfono (Settings → Dispositivos vinculados → Vincular dispositivo).",
    "Confirma la conexión.",
  ],
  appearance: "Apariencia",
  appearanceDesc: "Cambia entre tema claro y oscuro. Zynex CRM guarda la preferencia en tu navegador.",
  theme: "Tema",
  themeModes: ["Claro", "Oscuro", "Sistema"],
  notifications: "Notificaciones",
  notificationsDesc: "Recibe alertas por email cuando lleguen mensajes importantes, cuando un broadcast termine, o cuando haya errores en tus automatizaciones.",
  apiKeys: "Claves API",
  apiKeysDesc: "Genera claves para usar la REST API. Cada clave tiene scopes específicos. Ver documentación completa en API Pública.",
  danger: "Zona de peligro",
  dangerDesc: "Acciones irreversibles. Confirma antes de ejecutar.",
  deleteAccount: "Eliminar cuenta",
  deleteAccountNote: "Borra permanentemente la cuenta, todos los datos, mensajes, contactos y configuraciones. No se puede deshacer.",
  prevLabel: "Atrás: Webhooks",
  nextLabel: "Siguiente: Solución de problemas",
};

const en = {
  title: "Settings",
  subtitle: "Customize Zynex CRM to your team's needs.",
  intro: "The settings panel is available in the sidebar for admins and owners. Here you can manage general account settings, configure your WhatsApp number, manage workspace members, and more.",
  sections: "Sections",
  sectionsDesc: "Access different configuration areas from the sidebar menu inside Settings.",
  general: "General",
  generalDesc: "Account name, timezone, interface language, and date/time format.",
  whatsapp: "WhatsApp",
  whatsappDesc: "Connect your WhatsApp Business number. Requires scanning a QR code with WhatsApp Web. Only one number per account.",
  whatsappSteps: [
    "Go to Settings → WhatsApp.",
    "Click Connect WhatsApp.",
    "Scan the QR code with WhatsApp on your phone (Settings → Linked Devices → Link a Device).",
    "Confirm the connection.",
  ],
  appearance: "Apariencia",
  appearanceDesc: "Switch between light and dark theme. Zynex CRM saves the preference in your browser.",
  theme: "Theme",
  themeModes: ["Light", "Dark", "System"],
  notifications: "Notifications",
  notificationsDesc: "Receive email alerts when important messages arrive, when a broadcast finishes, or when there are errors in your automations.",
  apiKeys: "API Keys",
  apiKeysDesc: "Generate keys to use the REST API. Each key has specific scopes. See full documentation at Public API.",
  danger: "Danger zone",
  dangerDesc: "Irreversible actions. Confirm before executing.",
  deleteAccount: "Delete account",
  deleteAccountNote: "Permanently deletes the account, all data, messages, contacts, and settings. Cannot be undone.",
  prevLabel: "Back: Webhooks",
  nextLabel: "Next: Troubleshooting",
};

const s = { es, en };

export default function SettingsDocPage() {
  const { locale } = useTranslations();
  const c = s[locale] ?? s.en;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/docs" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <Settings className="h-5 w-5 text-primary-foreground" />
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
        <p className="text-lg text-muted-foreground mb-4">{c.subtitle}</p>
        <p className="text-muted-foreground mb-8">{c.intro}</p>

        <div className="space-y-8">
          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.sections}</h2>
            <p className="text-sm text-muted-foreground mb-4">{c.sectionsDesc}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.general}</h2>
            <p className="text-sm text-muted-foreground">{c.generalDesc}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.whatsapp}</h2>
            <p className="text-sm text-muted-foreground mb-4">{c.whatsappDesc}</p>
            <ol className="space-y-1">
              {c.whatsappSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="font-bold text-primary shrink-0">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.appearance}</h2>
            <p className="text-sm text-muted-foreground mb-2">{c.appearanceDesc}</p>
            <h3 className="text-lg font-medium mb-2">{c.theme}</h3>
            <div className="flex gap-2">
              {c.themeModes.map((mode) => (
                <span key={mode} className="px-3 py-1 rounded-full bg-muted text-sm">{mode}</span>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.notifications}</h2>
            <p className="text-sm text-muted-foreground">{c.notificationsDesc}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.apiKeys}</h2>
            <p className="text-sm text-muted-foreground">{c.apiKeysDesc}</p>
          </div>

          <div className="p-6 rounded-lg border border-destructive/50">
            <h2 className="text-xl font-semibold mb-3 text-destructive">{c.danger}</h2>
            <p className="text-sm text-muted-foreground mb-3">{c.dangerDesc}</p>
            <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90">
              {c.deleteAccount}
            </button>
            <p className="text-xs text-muted-foreground italic mt-2">{c.deleteAccountNote}</p>
          </div>
        </div>

        <div className="mt-12 flex justify-between">
          <Link href="/docs/whatsapp-setup" className="text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            {c.prevLabel}
          </Link>
          <Link href="/docs/troubleshooting" className="text-primary hover:underline inline-flex items-center gap-1">
            {c.nextLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
