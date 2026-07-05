"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Locale = "es" | "en";

interface Translations {
  [key: string]: string | Translations;
}

interface TranslationContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextType | null>(null);

const es: Translations = {
  common: {
    loading: "Cargando...",
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    edit: "Editar",
    add: "Añadir",
    back: "Volver",
    next: "Siguiente",
    close: "Cerrar",
    search: "Buscar",
    filter: "Filtrar",
    export: "Exportar",
    import: "Importar",
    success: "Éxito",
    error: "Error",
    confirm: "Confirmar",
    create: "Crear",
    update: "Actualizar",
    view: "Ver",
    actions: "Acciones",
    status: "Estado",
    name: "Nombre",
    email: "Correo",
    phone: "Teléfono",
    noData: "No hay datos",
    yes: "Sí",
    no: "No",
  },
  nav: {
    dashboard: "Panel",
    inbox: "Bandeja de Entrada",
    contacts: "Contactos",
    pipelines: "Pipelines",
    broadcasts: "Broadcasts",
    automations: "Automatizaciones",
    flows: "Flujos",
    settings: "Configuración",
    logout: "Cerrar Sesión",
    profile: "Perfil",
  },
  auth: {
    login: "Iniciar Sesión",
    signup: "Crear Cuenta",
    logout: "Cerrar Sesión",
    email: "Correo Electrónico",
    password: "Contraseña",
    confirmPassword: "Confirmar Contraseña",
    forgotPassword: "¿Olvidaste tu contraseña?",
    noAccount: "¿No tienes cuenta?",
    haveAccount: "¿Ya tienes cuenta?",
    signUp: "Regístrate",
    signIn: "Inicia sesión",
    createAccount: "Crear Cuenta",
    welcomeBack: "Bienvenido de nuevo",
    getStarted: "Empieza gratis",
  },
  landing: {
    heroTitle: "Gestiona tu negocio por WhatsApp desde un solo lugar",
    heroSubtitle: "Bandeja de entrada compartida, contactos, pipelines de ventas, broadcasts y automatizaciones. Todo lo que necesitas para escalar tu negocio por WhatsApp.",
    cta: "Empezar Gratis",
    ctaSecondary: "Ver Planes",
    features: "Todo lo que necesitas",
    howItWorks: "En vivo en menos de 30 minutos",
    pricing: "Planes diseñados para ti",
    faq: "Preguntas Frecuentes",
  },
  plans: {
    free: "Gratis",
    basic: "Básico",
    pro: "Pro",
    enterprise: "Empresarial",
    month: "/mes",
    currentPlan: "Plan Actual",
    upgrade: "Mejorar Plan",
    mostPopular: "Más Popular",
    selectPlan: "Seleccionar Plan",
    trial: "Prueba gratis",
    perMonth: "por mes",
    features: "Características",
    contacts: "contactos",
    teamMembers: "miembros del equipo",
    whatsappNumbers: "números de WhatsApp",
    unlimited: "ilimitados",
  },
  inbox: {
    title: "Bandeja de Entrada",
    search: "Buscar conversaciones...",
    noConversations: "No hay conversaciones",
    newMessage: "Nuevo Mensaje",
    typeMessage: "Escribe un mensaje...",
    send: "Enviar",
    selectChat: "Selecciona un chat para empezar",
    today: "Hoy",
    yesterday: "Ayer",
  },
  contacts: {
    title: "Contactos",
    add: "Añadir Contacto",
    import: "Importar Contactos",
    search: "Buscar contactos...",
    noContacts: "No hay contactos",
    name: "Nombre",
    phone: "Teléfono",
    email: "Correo",
    tags: "Etiquetas",
    notes: "Notas",
    lastContact: "Último contacto",
    importCsv: "Importar CSV",
    export: "Exportar",
    delete: "Eliminar contacto",
    edit: "Editar",
  },
  pipelines: {
    title: "Pipelines",
    new: "Nuevo Pipeline",
    stages: "Etapas",
    deals: "Negocios",
    won: "Ganado",
    lost: "Perdido",
    value: "Valor",
    newDeal: "Nuevo Negocio",
  },
  broadcasts: {
    title: "Broadcasts",
    new: "Nueva Campaña",
    send: "Enviar",
    scheduled: "Programados",
    sent: "Enviados",
    failed: "Fallidos",
    selectTemplate: "Seleccionar Plantilla",
  },
  automations: {
    title: "Automatizaciones",
    new: "Nueva Automatización",
    enable: "Activar",
    disable: "Desactivar",
    trigger: "Disparador",
    action: "Acción",
    active: "Activa",
    inactive: "Inactiva",
  },
  flows: {
    title: "Flujos",
    new: "Nuevo Flujo",
    edit: "Editar Flujo",
    activate: "Activar",
    deactivate: "Desactivar",
    runs: "Ejecuciones",
    templates: "Plantillas",
  },
  settings: {
    title: "Configuración",
    profile: "Perfil",
    account: "Cuenta",
    whatsapp: "WhatsApp",
    appearance: "Apariencia",
    notifications: "Notificaciones",
    team: "Equipo",
    billing: "Facturación",
    subscription: "Suscripción",
    api: "API",
    dangerZone: "Zona de Peligro",
    save: "Guardar Cambios",
    fullName: "Nombre Completo",
    phoneNumber: "Número de Teléfono",
    company: "Empresa",
    role: "Rol",
    currentPlan: "Plan Actual",
    manageSubscription: "Gestionar Suscripción",
    viewPlans: "Ver Planes",
  },
  subscription: {
    title: "Suscripción",
    currentPlan: "Plan Actual",
    plan: "Plan",
    price: "Precio",
    billingCycle: "Ciclo de Facturación",
    nextBilling: "Próxima Facturación",
    paymentMethod: "Método de Pago",
    upgrade: "Mejorar Plan",
    cancel: "Cancelar Suscripción",
    trial: "Prueba",
    trialEnds: "La prueba termina",
    daysLeft: "días restantes",
    expired: "Expirado",
    active: "Activa",
    pending: "Pendiente",
    pastDue: "Vencida",
    selectPlan: "Seleccionar Plan",
    bankTransfer: "Transferencia Bancaria",
    uploadReceipt: "Subir Recibo",
    pendingApproval: "Pendiente de Aprobación",
  },
  admin: {
    title: "Administración",
    payments: "Pagos",
    users: "Usuarios",
    pendingPayments: "Pagos Pendientes",
    approve: "Aprobar",
    reject: "Rechazar",
    amount: "Monto",
    date: "Fecha",
    status: "Estado",
  },
};

const en: Translations = {
  common: {
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    back: "Back",
    next: "Next",
    close: "Close",
    search: "Search",
    filter: "Filter",
    export: "Export",
    import: "Import",
    success: "Success",
    error: "Error",
    confirm: "Confirm",
    create: "Create",
    update: "Update",
    view: "View",
    actions: "Actions",
    status: "Status",
    name: "Name",
    email: "Email",
    phone: "Phone",
    noData: "No data",
    yes: "Yes",
    no: "No",
  },
  nav: {
    dashboard: "Dashboard",
    inbox: "Inbox",
    contacts: "Contacts",
    pipelines: "Pipelines",
    broadcasts: "Broadcasts",
    automations: "Automations",
    flows: "Flows",
    settings: "Settings",
    logout: "Logout",
    profile: "Profile",
  },
  auth: {
    login: "Sign In",
    signup: "Sign Up",
    logout: "Logout",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    forgotPassword: "Forgot your password?",
    noAccount: "Don't have an account?",
    haveAccount: "Already have an account?",
    signUp: "Sign up",
    signIn: "Sign in",
    createAccount: "Create Account",
    welcomeBack: "Welcome back",
    getStarted: "Get started for free",
  },
  landing: {
    heroTitle: "Manage your WhatsApp business from one place",
    heroSubtitle: "Shared inbox, contacts, sales pipelines, broadcasts and automations. Everything you need to scale your WhatsApp business.",
    cta: "Get Started Free",
    ctaSecondary: "View Plans",
    features: "Everything you need",
    howItWorks: "Live in under 30 minutes",
    pricing: "Plans designed for you",
    faq: "Frequently Asked Questions",
  },
  plans: {
    free: "Free",
    basic: "Basic",
    pro: "Pro",
    enterprise: "Enterprise",
    month: "/month",
    currentPlan: "Current Plan",
    upgrade: "Upgrade",
    mostPopular: "Most Popular",
    selectPlan: "Select Plan",
    trial: "Free trial",
    perMonth: "per month",
    features: "Features",
    contacts: "contacts",
    teamMembers: "team members",
    whatsappNumbers: "WhatsApp numbers",
    unlimited: "unlimited",
  },
  inbox: {
    title: "Inbox",
    search: "Search conversations...",
    noConversations: "No conversations",
    newMessage: "New Message",
    typeMessage: "Type a message...",
    send: "Send",
    selectChat: "Select a chat to start",
    today: "Today",
    yesterday: "Yesterday",
  },
  contacts: {
    title: "Contacts",
    add: "Add Contact",
    import: "Import Contacts",
    search: "Search contacts...",
    noContacts: "No contacts",
    name: "Name",
    phone: "Phone",
    email: "Email",
    tags: "Tags",
    notes: "Notes",
    lastContact: "Last contact",
    importCsv: "Import CSV",
    export: "Export",
    delete: "Delete contact",
    edit: "Edit",
  },
  pipelines: {
    title: "Pipelines",
    new: "New Pipeline",
    stages: "Stages",
    deals: "Deals",
    won: "Won",
    lost: "Lost",
    value: "Value",
    newDeal: "New Deal",
  },
  broadcasts: {
    title: "Broadcasts",
    new: "New Campaign",
    send: "Send",
    scheduled: "Scheduled",
    sent: "Sent",
    failed: "Failed",
    selectTemplate: "Select Template",
  },
  automations: {
    title: "Automations",
    new: "New Automation",
    enable: "Enable",
    disable: "Disable",
    trigger: "Trigger",
    action: "Action",
    active: "Active",
    inactive: "Inactive",
  },
  flows: {
    title: "Flows",
    new: "New Flow",
    edit: "Edit Flow",
    activate: "Activate",
    deactivate: "Deactivate",
    runs: "Runs",
    templates: "Templates",
  },
  settings: {
    title: "Settings",
    profile: "Profile",
    account: "Account",
    whatsapp: "WhatsApp",
    appearance: "Appearance",
    notifications: "Notifications",
    team: "Team",
    billing: "Billing",
    subscription: "Subscription",
    api: "API",
    dangerZone: "Danger Zone",
    save: "Save Changes",
    fullName: "Full Name",
    phoneNumber: "Phone Number",
    company: "Company",
    role: "Role",
    currentPlan: "Current Plan",
    manageSubscription: "Manage Subscription",
    viewPlans: "View Plans",
  },
  subscription: {
    title: "Subscription",
    currentPlan: "Current Plan",
    plan: "Plan",
    price: "Price",
    billingCycle: "Billing Cycle",
    nextBilling: "Next Billing",
    paymentMethod: "Payment Method",
    upgrade: "Upgrade Plan",
    cancel: "Cancel Subscription",
    trial: "Trial",
    trialEnds: "Trial ends in",
    daysLeft: "days left",
    expired: "Expired",
    active: "Active",
    pending: "Pending",
    pastDue: "Past Due",
    selectPlan: "Select Plan",
    bankTransfer: "Bank Transfer",
    uploadReceipt: "Upload Receipt",
    pendingApproval: "Pending Approval",
  },
  admin: {
    title: "Admin",
    payments: "Payments",
    users: "Users",
    pendingPayments: "Pending Payments",
    approve: "Approve",
    reject: "Reject",
    amount: "Amount",
    date: "Date",
    status: "Status",
  },
};

const translations: Record<Locale, Translations> = { es, en };

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

  const t = (key: string): string => {
    const keys = key.split(".");
    let result: any = translations[locale];
    for (const k of keys) {
      if (result && typeof result === "object" && k in result) {
        result = result[k];
      } else {
        return key;
      }
    }
    return typeof result === "string" ? result : key;
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
