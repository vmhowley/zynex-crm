import {
  Coins,
  CreditCard,
  FileText,
  KeyRound,
  LayoutGrid,
  Palette,
  PlugZap,
  Shield,
  Sparkles,
  Tags,
  User,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';

export const SETTINGS_SECTIONS = [
  'overview',
  'profile',
  'security',
  'appearance',
  'subscription',
  'whatsapp',
  'templates',
  'fields',
  'deals',
  'members',
  'ai',
  'api',
] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

export const DEFAULT_SECTION: SettingsSection = 'overview';

export interface SectionMeta {
  id: SettingsSection;
  label: string;
  icon: LucideIcon;
  group: 'top' | 'account' | 'workspace';
}

const labels = {
  es: {
    overview: "Resumen",
    profile: "Tu perfil",
    security: "Inicio y seguridad",
    appearance: "Apariencia",
    subscription: "Suscripción",
    whatsapp: "WhatsApp",
    templates: "Plantillas",
    fields: "Campos y etiquetas",
    deals: "Negocios y moneda",
    members: "Miembros del equipo",
    ai: "Asistente de IA",
    api: "Claves API",
  },
  en: {
    overview: "Overview",
    profile: "Your profile",
    security: "Login & security",
    appearance: "Appearance",
    subscription: "Subscription",
    whatsapp: "WhatsApp",
    templates: "Templates",
    fields: "Fields & tags",
    deals: "Deals & currency",
    members: "Team members",
    ai: "AI Assistant",
    api: "API keys",
  },
};

export function getSectionMeta(locale: 'es' | 'en' = 'es'): Record<SettingsSection, SectionMeta> {
  const l = labels[locale];
  return {
    overview: { id: 'overview', label: l.overview, icon: LayoutGrid, group: 'top' },
    profile: { id: 'profile', label: l.profile, icon: User, group: 'account' },
    security: { id: 'security', label: l.security, icon: Shield, group: 'account' },
    appearance: { id: 'appearance', label: l.appearance, icon: Palette, group: 'account' },
    subscription: { id: 'subscription', label: l.subscription, icon: CreditCard, group: 'account' },
    whatsapp: { id: 'whatsapp', label: l.whatsapp, icon: PlugZap, group: 'workspace' },
    templates: { id: 'templates', label: l.templates, icon: FileText, group: 'workspace' },
    fields: { id: 'fields', label: l.fields, icon: Tags, group: 'workspace' },
    deals: { id: 'deals', label: l.deals, icon: Coins, group: 'workspace' },
    members: { id: 'members', label: l.members, icon: UsersRound, group: 'workspace' },
    ai: { id: 'ai', label: l.ai, icon: Sparkles, group: 'workspace' },
    api: { id: 'api', label: l.api, icon: KeyRound, group: 'workspace' },
  };
}

export const SECTION_META = getSectionMeta('es');

export const RAIL_GROUPS = {
  es: [
    { label: null, group: 'top' as const },
    { label: 'Cuenta', group: 'account' as const },
    { label: 'Espacio de trabajo', group: 'workspace' as const },
  ],
  en: [
    { label: null, group: 'top' as const },
    { label: 'Account', group: 'account' as const },
    { label: 'Workspace', group: 'workspace' as const },
  ],
};

function isSection(value: string | null): value is SettingsSection {
  return !!value && (SETTINGS_SECTIONS as readonly string[]).includes(value);
}

export function resolveSection(raw: string | null): SettingsSection {
  if (raw === 'tags' || raw === 'custom-fields') return 'fields';
  if (isSection(raw)) return raw;
  return DEFAULT_SECTION;
}
