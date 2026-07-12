/**
 * Starter flow templates.
 *
 * Three pre-canned flows users can clone with one click instead of
 * building from scratch. Each template is a plain JS object describing
 * the same shape `/api/flows` PUT accepts — name, trigger config,
 * entry_node_id, fallback_policy, nodes[] — keyed by a stable
 * `slug`.
 *
 * The clone path (`/api/flows` POST with `template_slug`) creates a
 * NEW flow_row + flow_nodes rows for the user. `node_key`s are kept
 * verbatim (they're stable strings, not UUIDs, so cloning never
 * needs to rewrite edge references).
 *
 * Choosing a single static module over a DB-backed gallery for v1
 * because: (a) the set is small and changes with code releases, not
 * data; (b) keeps templates portable across self-hosted instances
 * without migrations; (c) editing in source is the lowest-friction
 * way to add the next template.
 */

import type {
  AssignAgentNodeConfig,
  CollectInputNodeConfig,
  ConditionNodeConfig,
  CreateDealNodeConfig,
  HandoffNodeConfig,
  HttpFetchNodeConfig,
  KeywordTriggerConfig,
  SendButtonsNodeConfig,
  SendListNodeConfig,
  SendMessageNodeConfig,
  SetTagNodeConfig,
  StartNodeConfig,
} from "./types";

export type FlowTemplateNodeType =
  | "start"
  | "send_message"
  | "send_buttons"
  | "send_list"
  | "collect_input"
  | "condition"
  | "set_tag"
  | "http_fetch"
  | "handoff"
  | "assign_agent"
  | "create_deal"
  | "end";

export interface FlowTemplateNode {
  node_key: string;
  node_type: FlowTemplateNodeType;
  config:
    | StartNodeConfig
    | SendMessageNodeConfig
    | SendButtonsNodeConfig
    | SendListNodeConfig
    | CollectInputNodeConfig
    | ConditionNodeConfig
    | SetTagNodeConfig
    | HttpFetchNodeConfig
    | HandoffNodeConfig
    | Record<string, unknown>;
}

export type Locale = 'en' | 'es';

export interface FlowTemplate {
  slug: string;
  name: string;
  description: string;
  /** Used by the gallery to surface a relevant icon. lucide-react name. */
  icon: "MessageSquare" | "HelpCircle" | "UserPlus" | "Zap" | "CheckSquare" | "Phone" | "Star" | "Settings" | "Users" | "TrendingUp";
  trigger_type: "keyword" | "first_inbound_message" | "manual";
  trigger_config: KeywordTriggerConfig | Record<string, unknown>;
  entry_node_id: string;
  nodes: FlowTemplateNode[];
}

/** Localized text: either a plain string (no localization) or { en: "...", es: "..." } */
export type LocalizedText = string | { en: string; es: string };

/** Recursively replace localized text fields in a config object */
function localizeConfig(config: Record<string, unknown>, lang: Locale): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (key === 'buttons' && Array.isArray(value)) {
      result[key] = (value as Record<string, unknown>[]).map(btn => {
        if (btn && typeof btn === 'object') {
          const buttonObj = btn as Record<string, unknown>;
          const localized: Record<string, unknown> = {};
          for (const [btnKey, btnVal] of Object.entries(buttonObj)) {
            if (btnVal && typeof btnVal === 'object' && 'en' in (btnVal as object) && 'es' in (btnVal as object)) {
              const loc = btnVal as { en: string; es: string };
              localized[btnKey] = lang === 'es' ? loc.es : loc.en;
            } else {
              localized[btnKey] = btnVal;
            }
          }
          return localized;
        }
        return btn;
      });
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>;
      if ('en' in obj && 'es' in obj && typeof obj.en === 'string' && typeof obj.es === 'string') {
        result[key] = lang === 'es' ? obj.es : obj.en;
      } else {
        result[key] = localizeConfig(obj, lang);
      }
    } else {
      result[key] = value;
    }
  }
  return result;
}

/** Compile a template to a specific locale, replacing localized text */
export function compileTemplate(template: FlowTemplate, lang: Locale): FlowTemplate {
  return {
    ...template,
    name: lang === 'es' && !template.name.includes('(ES)') ? `${template.name} (ES)` : template.name,
    nodes: template.nodes.map(node => ({
      ...node,
      config: localizeConfig(node.config as Record<string, unknown>, lang),
    })),
  };
}

// ============================================================
// 1. Welcome menu — the example from the owner's brief
// ============================================================
const WELCOME_MENU: FlowTemplate = {
  slug: "welcome_menu",
  name: "Welcome menu",
  description:
    "Greet customers who type a keyword and route them to the right agent based on whether they're new or existing.",
  icon: "MessageSquare",
  trigger_type: "keyword",
  trigger_config: { keywords: ["support", "help", "hi"], match_type: "contains" },
  entry_node_id: "start",
  nodes: [
    {
      node_key: "start",
      node_type: "start",
      config: { next_node_key: "welcome" },
    },
    {
      node_key: "welcome",
      node_type: "send_buttons",
      config: {
        text: { en: "Hi! 👋 Welcome to support. Are you an existing customer or new here?", es: "¡Hola! 👋 Bienvenido al soporte. ¿Eres cliente existente o nuevo aquí?" },
        footer_text: { en: "Tap a button below to continue.", es: "Toca un botón para continuar." },
        buttons: [
          {
            reply_id: "existing",
            title: { en: "Existing customer", es: "Cliente existente" },
            next_node_key: "existing_handoff",
          },
          {
            reply_id: "new",
            title: { en: "New customer", es: "Cliente nuevo" },
            next_node_key: "new_handoff",
          },
        ],
      } as SendButtonsNodeConfig,
    },
    {
      node_key: "existing_handoff",
      node_type: "handoff",
      config: {
        note: { en: "Existing customer needs assistance — please check account history before replying.", es: "Cliente existente necesita ayuda — por favor verifica el historial de cuenta antes de responder." },
      } as HandoffNodeConfig,
    },
    {
      node_key: "new_handoff",
      node_type: "handoff",
      config: {
        note: { en: "New customer — share pricing + onboarding link.", es: "Cliente nuevo — comparte precios + enlace de onboarding." },
      } as HandoffNodeConfig,
    },
  ],
};

// ============================================================
// 2. FAQ bot — list-message answers, fully automated
// ============================================================
const FAQ_BOT: FlowTemplate = {
  slug: "faq_bot",
  name: "FAQ bot",
  description:
    "Answer common questions automatically. Customer picks a topic from a list; the bot replies with the answer and ends.",
  icon: "HelpCircle",
  trigger_type: "keyword",
  trigger_config: {
    keywords: ["faq", "question", "info"],
    match_type: "contains",
  },
  entry_node_id: "start",
  nodes: [
    {
      node_key: "start",
      node_type: "start",
      config: { next_node_key: "topics" },
    },
    {
      node_key: "topics",
      node_type: "send_list",
      config: {
        text: "What can I help you with?",
        button_label: "View topics",
        sections: [
          {
            title: "Common questions",
            rows: [
              {
                reply_id: "hours",
                title: "Opening hours",
                next_node_key: "answer_hours",
              },
              {
                reply_id: "pricing",
                title: "Pricing",
                next_node_key: "answer_pricing",
              },
              {
                reply_id: "refunds",
                title: "Refund policy",
                next_node_key: "answer_refunds",
              },
            ],
          },
          {
            title: "Other",
            rows: [
              {
                reply_id: "human",
                title: "Talk to a human",
                next_node_key: "human_handoff",
              },
            ],
          },
        ],
      } as SendListNodeConfig,
    },
    {
      node_key: "answer_hours",
      node_type: "send_message",
      config: {
        text: "We're open Mon–Fri, 9am–6pm local time. Weekend support is limited to urgent issues.",
        next_node_key: "end",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "answer_pricing",
      node_type: "send_message",
      config: {
        text: "Our pricing starts at $9/mo. Visit https://example.com/pricing for the full breakdown.",
        next_node_key: "end",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "answer_refunds",
      node_type: "send_message",
      config: {
        text: "Refunds are honored within 30 days of purchase. Reply with your order number and we'll process it.",
        next_node_key: "end",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "human_handoff",
      node_type: "handoff",
      config: {
        note: "Customer asked to talk to a human from the FAQ bot.",
      } as HandoffNodeConfig,
    },
    {
      node_key: "end",
      node_type: "end",
      config: {},
    },
  ],
};

// ============================================================
// 3. Lead capture — collect_input chain, ends in a handoff
// ============================================================
const LEAD_CAPTURE: FlowTemplate = {
  slug: "lead_capture",
  name: "Lead capture",
  description:
    "Greet first-time inbounds, capture name + email + company, then hand off to sales with the answers in the note.",
  icon: "UserPlus",
  trigger_type: "first_inbound_message",
  trigger_config: {},
  entry_node_id: "start",
  nodes: [
    {
      node_key: "start",
      node_type: "start",
      config: { next_node_key: "intro" },
    },
    {
      node_key: "intro",
      node_type: "send_message",
      config: {
        text: "Welcome! 👋 I'll ask a few quick questions so we can get you to the right person.",
        next_node_key: "ask_name",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "ask_name",
      node_type: "collect_input",
      config: {
        prompt_text: "What's your name?",
        var_key: "name",
        next_node_key: "ask_email",
      } as CollectInputNodeConfig,
    },
    {
      node_key: "ask_email",
      node_type: "collect_input",
      config: {
        prompt_text: "Thanks {{vars.name}}! What's your work email?",
        var_key: "email",
        next_node_key: "ask_company",
      } as CollectInputNodeConfig,
    },
    {
      node_key: "ask_company",
      node_type: "collect_input",
      config: {
        prompt_text: "Almost done — what's your company name?",
        var_key: "company",
        next_node_key: "handoff",
      } as CollectInputNodeConfig,
    },
    {
      node_key: "handoff",
      node_type: "handoff",
      config: {
        note: "New lead — name={{vars.name}}, email={{vars.email}}, company={{vars.company}}.",
      } as HandoffNodeConfig,
    },
  ],
};

// ============================================================
// 4. Lead Qualification — 3-way routing: Demo / Trial / Support
// ============================================================
// Captures qualified leads and routes them to the right team.
// Adapt: change company field, add/remove qualification questions,
// update tag IDs and handoff notes to match your sales process.
// NOTE: Replace {HIGH_PRIORITY_TAG}, {MEDIUM_PRIORITY_TAG}, {SUPPORT_TAG}
// with actual tag UUIDs from your CRM tags.
const LEAD_QUALIFICATION: FlowTemplate = {
  slug: "lead_qualification",
  name: "Lead Qualification",
  description:
    "Greet incoming leads and route them through Product Demo, Free Trial, or Support paths. Captures company + contact + email and scores leads by qualification level before handoff.",
  icon: "TrendingUp",
  trigger_type: "first_inbound_message",
  trigger_config: {},
  entry_node_id: "start",
  nodes: [
    // ── Entry ────────────────────────────────────────────────
    {
      node_key: "start",
      node_type: "start",
      config: { next_node_key: "add_tag_lead" },
    },
    // ── Add lead tag ───────────────────────────────────────
    {
      node_key: "add_tag_lead",
      node_type: "set_tag",
      config: {
        mode: "add",
        tag_id: "lead-nuevo",
        next_node_key: "assign_agent",
      } as SetTagNodeConfig,
    },
    // ── Assign agent (round-robin) ─────────────────────────
    {
      node_key: "assign_agent",
      node_type: "assign_agent",
      config: {
        mode: "round_robin",
        next_node_key: "create_deal",
      } as AssignAgentNodeConfig,
    },
    // ── Create deal in pipeline ────────────────────────────
    {
      node_key: "create_deal",
      node_type: "create_deal",
      config: {
        pipeline_id: "",
        stage_id: "",
        title: "Nuevo Lead",
        value: 0,
        next_node_key: "welcome",
      } as CreateDealNodeConfig,
    },
    // ── Welcome message ─────────────────────────────────────
    {
      node_key: "welcome",
      node_type: "send_message",
      config: {
        text: { en: "Hi there! 👋 How can we help you today?", es: "¡Hola! 👋 ¿En qué podemos ayudarte hoy?" },
        next_node_key: "main_menu",
      } as SendMessageNodeConfig,
    },
    // ── Main menu ────────────────────────────────────────────
    {
      node_key: "main_menu",
      node_type: "send_buttons",
      config: {
        text: { en: "What are you looking for?", es: "¿Qué estás buscando?" },
        footer_text: { en: "We'll get back to you right away", es: "Te responderemos pronto" },
        buttons: [
          { reply_id: "demo", title: { en: "📊 Try DigitBill", es: "📊 Probar DigitBill" }, next_node_key: "demo_intro" },
          { reply_id: "pricing", title: { en: "💰 See pricing", es: "💰 Ver precios" }, next_node_key: "pricing_path" },
          { reply_id: "support", title: { en: "💬 Talk to support", es: "💬 Soporte" }, next_node_key: "support_path" },
        ],
      } as SendButtonsNodeConfig,
    },

    // ════════════════════════════════════════════════════════
    // PATH A — DEMO (Self-service: demo without registration OR create account)
    // ════════════════════════════════════════════════════════
    {
      node_key: "demo_intro",
      node_type: "send_message",
      config: {
        text: { en: "Great! 📊 We have two options for you to explore:", es: "¡Genial! 📊 Tenemos dos opciones para que explores:" },
        next_node_key: "demo_options",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "demo_options",
      node_type: "send_buttons",
      config: {
        text: { en: "How would you like to try DigitBill?", es: "¿Cómo prefieres probar DigitBill?" },
        footer_text: { en: "Choose an option to continue", es: "Elige una opción para continuar" },
        buttons: [
          { reply_id: "demo_link", title: { en: "📱 Try demo", es: "📱 Probar demo" }, next_node_key: "demo_link_send" },
          { reply_id: "create_account", title: { en: "✅ Create account", es: "✅ Crear cuenta" }, next_node_key: "create_account_info" },
        ],
      } as SendButtonsNodeConfig,
    },
    {
      node_key: "demo_link_send",
      node_type: "send_message",
      config: {
        text: { en: "🎉 Perfect! Here's your demo link:\n\n👉 digitbillrd.com/demo\n\nSelect the profile that best fits your business (Retail, Ferretería, or Taller) and explore freely. No account or credit card needed.\n\nIf you need help, just let us know! 😊", es: "🎉 ¡Perfecto! Este es tu link de demo:\n\n👉 digitbillrd.com/demo\n\nSelecciona el perfil que mejor se adapte a tu negocio (Retail, Ferretería o Taller) y navega libremente. No necesitas cuenta ni tarjeta.\n\n¡Si necesitas ayuda, aquí estamos! 😊" },
        next_node_key: "demo_handoff",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "create_account_info",
      node_type: "send_message",
      config: {
        text: { en: "✅ Great choice! Creating your account is quick and easy:\n\n1️⃣ Go to: digitbillrd.com/register\n2️⃣ Fill in your basic info (RNC optional)\n3️⃣ Start using DigitBill right away\n\n💡 Tip: Have your RNC ready if you want to set up invoicing right away.\n\nWhen you're done, just reply \"iniciar\" here and we'll guide you through the next steps! 🚀\n\nNeed help? An agent can guide you through the process. Just ask!", es: "✅ ¡Gran elección! Crear tu cuenta es rápido y fácil:\n\n1️⃣ Ve a: digitbillrd.com/register\n2️⃣ Llena tu información básica (RNC opcional)\n3️⃣ ¡Empieza a usar DigitBill de inmediato!\n\n💡 Tip: Ten tu RNC a la mano si quieres configurar la facturación desde el inicio.\n\nCuando termines, responde \"iniciar\" aquí y te guiaremos paso a paso 🚀\n\n¿Necesitas ayuda? Un agente puede guiarte paso a paso. ¡Solo pregunta!" },
        next_node_key: "demo_handoff",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "demo_handoff",
      node_type: "handoff",
      config: {
        note: { en: "📊 DEMO INTEREST — contact={{contact.name}}, phone={{contact.phone}}. Needs help with demo or account creation. Follow up promptly.", es: "📊 INTERÉS EN DEMO — contacto={{contact.name}}, teléfono={{contact.phone}}. Necesita ayuda con demo o creación de cuenta. Seguimiento prompto." },
      } as HandoffNodeConfig,
    },

    // ════════════════════════════════════════════════════════
    // PATH C — PRICING
    // ════════════════════════════════════════════════════════
    {
      node_key: "pricing_path",
      node_type: "send_message",
      config: {
        text: { en: "💰 Here are our plans:\n\n📦 **Emprendedor** — RD$990/mo\n• 50 electronic invoices/month\n• CRM & product catalog\n• Basic dashboard\n\n🏪 **Pyme** — RD$2,490/mo\n• Unlimited invoices\n• Inventory & expenses\n• Multi-user access\n• Priority support\n\n🚀 **Profesional** — RD$5,990/mo\n• Everything in Pyme\n• Advanced reports\n• API access\n• Dedicated support\n\n🏢 **Enterprise** — RD$15,000/mo\n• Everything in Profesional\n• Custom integrations\n• Personal onboarding\n• SLA guarantee\n\nAll plans include electronic invoicing (e-CF) certified with DGII.\n\nWant to start free? Reply with **demo** to try it!", es: "💰 Aquí están nuestros planes:\n\n📦 **Emprendedor** — RD$990/mes\n• 50 facturas electrónicas/mes\n• CRM y catálogo de productos\n• Dashboard básico\n\n🏪 **Pyme** — RD$2,490/mes\n• Facturas ilimitadas\n• Inventario y gastos\n• Acceso multi-usuario\n• Soporte prioritario\n\n🚀 **Profesional** — RD$5,990/mes\n• Todo lo de Pyme\n• Reportes avanzados\n• Acceso a API\n• Soporte dedicado\n\n🏢 **Enterprise** — RD$15,000/mes\n• Todo lo de Profesional\n• Integraciones personalizadas\n• Onboarding personalizado\n• Garantía SLA\n\nTodos los planes incluyen facturación electrónica (e-CF) certificada con la DGII.\n\n¿ quieres empezar gratis? Responde con **demo** para probarlo!" },
        next_node_key: "pricing_cta",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "pricing_cta",
      node_type: "send_buttons",
      config: {
        text: { en: "Ready to get started?", es: "¿Listo para comenzar?" },
        buttons: [
          { reply_id: "pricing_demo", title: { en: "📊 Try demo", es: "📊 Probar demo" }, next_node_key: "demo_intro" },
          { reply_id: "pricing_contact", title: { en: "💬 Contact sales", es: "💬 Contactar ventas" }, next_node_key: "pricing_handoff" },
        ],
      } as SendButtonsNodeConfig,
    },
    {
      node_key: "pricing_handoff",
      node_type: "handoff",
      config: {
        note: { en: "💰 PRICING INTEREST — contact={{contact.name}}, phone={{contact.phone}}. Wants information about plans. Follow up promptly.", es: "💰 INTERÉS EN PRECIOS — contacto={{contact.name}}, teléfono={{contact.phone}}. Quiere información sobre planes. Seguimiento prompto." },
      } as HandoffNodeConfig,
    },

    // ════════════════════════════════════════════════════════
    // PATH B — SUPPORT
    // ════════════════════════════════════════════════════════
    {
      node_key: "support_path",
      node_type: "send_message",
      config: {
        text: { en: "Of course! 💬 Our support team is here to help. We're available Mon–Fri, 9am–6pm. Outside hours, we'll respond next business day.", es: "¡Claro! 💬 Nuestro equipo de soporte está aquí para ayudarte. Estamos disponibles Lun–Vie, 9am–6pm. Fuera de horario, responderemos el próximo día hábil." },
        next_node_key: "support_issue",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "support_issue",
      node_type: "collect_input",
      config: {
        prompt_text: { en: "Please briefly describe your issue or question:", es: "Por favor describe brevemente tu problema o pregunta:" },
        var_key: "issue",
        next_node_key: "support_confirm",
      } as CollectInputNodeConfig,
    },
    {
      node_key: "support_confirm",
      node_type: "send_message",
      config: {
        text: { en: "Got it 📝 An agent will respond within 2 hours. We'll notify you here on WhatsApp.", es: "Entendido 📝 Un agente responderá en 2 horas. Te notificaremos por WhatsApp." },
        next_node_key: "support_tag",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "support_tag",
      node_type: "set_tag",
      config: {
        mode: "add",
        tag_id: "{SUPPORT_TAG}",
        next_node_key: "support_handoff",
      } as SetTagNodeConfig,
    },
    {
      node_key: "support_handoff",
      node_type: "handoff",
      config: {
        note: { en: "💬 SUPPORT — contact={{vars.contact_name}}, issue={{vars.issue}}. Support request — route to support team.", es: "💬 SOPORTE — contacto={{vars.contact_name}}, issue={{vars.issue}}. Solicitud de soporte — derivar al equipo de soporte." },
      } as HandoffNodeConfig,
    },

    // ── Terminal ─────────────────────────────────────────────
    {
      node_key: "end",
      node_type: "end",
      config: {},
    },
  ],
};

// ============================================================
// 5. Customer Onboarding — DigitBill quick start guide
// ============================================================
const CUSTOMER_ONBOARDING: FlowTemplate = {
  slug: "customer_onboarding",
  name: "Customer Onboarding",
  description:
    "Welcome new DigitBill customers and guide them through the first steps: configure company, add products, and start invoicing.",
  icon: "CheckSquare",
  trigger_type: "keyword",
  trigger_config: { keywords: ["onboarding", "get started", "setup", "bienvenida"], match_type: "contains" },
  entry_node_id: "start",
  nodes: [
    // ── Entry ────────────────────────────────────────────────
    {
      node_key: "start",
      node_type: "start",
      config: { next_node_key: "welcome" },
    },
    // ── Welcome ─────────────────────────────────────────────
    {
      node_key: "welcome",
      node_type: "send_message",
      config: {
        text: { en: "👋 Welcome! We're excited to have you on board.\n\nHere are your first 3 steps to get started:\n\n1️⃣ Configure your company\n   → digitbillrd.com/settings\n\n2️⃣ Create your first product\n   → digitbillrd.com/products\n\n3️⃣ Start invoicing\n   → digitbillrd.com/invoices\n\nNeed help? Just reply with \"support\" and we'll assist you.", es: "👋 ¡Bienvenido! Nos alegra tenerte aquí.\n\nEstos son tus primeros 3 pasos para empezar:\n\n1️⃣ Configura tu empresa\n   → digitbillrd.com/settings\n\n2️⃣ Crea tu primer producto\n   → digitbillrd.com/products\n\n3️⃣ Empieza a facturar\n   → digitbillrd.com/invoices\n\n¿Necesitas ayuda? Responde con \"soporte\" y te ayudamos." },
        next_node_key: "support_option",
      } as SendMessageNodeConfig,
    },
    // ── Support option ─────────────────────────────────────
    {
      node_key: "support_option",
      node_type: "send_buttons",
      config: {
        text: { en: "Did you need help with anything?", es: "¿Necesitas ayuda con algo?" },
        footer_text: { en: "We're here for you", es: "Estamos para ayudarte" },
        buttons: [
          { reply_id: "yes_support", title: { en: "💬 Talk to support", es: "💬 Hablar con soporte" }, next_node_key: "support_handoff" },
          { reply_id: "no_help", title: { en: "✅ All set!", es: "✅ ¡Todo listo!" }, next_node_key: "end" },
        ],
      } as SendButtonsNodeConfig,
    },
    {
      node_key: "support_handoff",
      node_type: "handoff",
      config: {
        note: { en: "🏆 ONBOARDING — contact={{contact.name}}, phone={{contact.phone}}. New user needs help getting started with DigitBill setup.", es: "🏆 ONBOARDING — contacto={{contact.name}}, teléfono={{contact.phone}}. Nuevo usuario necesita ayuda para comenzar con la configuración de DigitBill." },
      } as HandoffNodeConfig,
    },
    // ── Terminal ─────────────────────────────────────────────
    {
      node_key: "end",
      node_type: "end",
      config: {},
    },
  ],
};

// ============================================================
// Registry
// ============================================================

// ============================================================
// 6. Instant Lead Response — Calificación inmediata de leads
// ============================================================
const INSTANT_LEAD_RESPONSE: FlowTemplate = {
  slug: "instant_lead_response",
  name: "⚡ Respuesta Instantánea a Leads",
  description: "Responde inmediatamente a nuevos leads, califica su necesidad y asigna al agente correcto.",
  icon: "Zap",
  trigger_type: "first_inbound_message",
  trigger_config: {},
  entry_node_id: "start",
  nodes: [
    {
      node_key: "start",
      node_type: "start",
      config: { next_node_key: "greeting" },
    },
    {
      node_key: "greeting",
      node_type: "send_message",
      config: {
        text: { en: "👋 ¡Hola! Gracias por contactarnos. Un momento mientras entendemos tu necesidad.", es: "👋 ¡Hola! Gracias por contactarnos. Un momento mientras entendemos tu necesidad." },
        next_node_key: "menu",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "menu",
      node_type: "send_buttons",
      config: {
        text: { en: "¿En qué podemos ayudarte hoy?", es: "¿En qué podemos ayudarte hoy?" },
        buttons: [
          { reply_id: "demo", title: { en: "📊 Demo", es: "📊 Demo" }, next_node_key: "capture_demo" },
          { reply_id: "info", title: { en: "❓ Info", es: "❓ Info" }, next_node_key: "capture_info" },
          { reply_id: "soporte", title: { en: "🛟 Soporte", es: "🛟 Soporte" }, next_node_key: "soporte_handoff" },
        ],
      } as SendButtonsNodeConfig,
    },
    // ── Demo path ───────────────────────────────────────────────
    {
      node_key: "capture_demo",
      node_type: "collect_input",
      config: {
        prompt_text: { en: "¿Cuántos usuarios aproximadamente necesitan?", es: "¿Cuántos usuarios aproximadamente necesitan?" },
        var_key: "usuarios",
        next_node_key: "demo_email",
      } as CollectInputNodeConfig,
    },
    {
      node_key: "demo_email",
      node_type: "collect_input",
      config: {
        prompt_text: { en: "Perfecto. ¿Cuál es tu email para agendar la demo?", es: "Perfecto. ¿Cuál es tu email para agendar la demo?" },
        var_key: "email",
        next_node_key: "demo_handoff",
      } as CollectInputNodeConfig,
    },
    {
      node_key: "demo_handoff",
      node_type: "set_tag",
      config: {
        mode: "add",
        tag_id: "",
        next_node_key: "end_demo",
      } as SetTagNodeConfig,
    },
    {
      node_key: "end_demo",
      node_type: "send_message",
      config: {
        text: { en: "✅ ¡Gracias! Un agente te contactará pronto para agendar tu demo.", es: "✅ ¡Gracias! Un agente te contactará pronto para agendar tu demo." },
        next_node_key: "handoff_demo",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "handoff_demo",
      node_type: "handoff",
      config: {
        note: { en: "📊 LEAD QUALIFICADO — Interesado en DEMO. Usuarios: {{vars.usuarios}}, Email: {{vars.email}}", es: "📊 LEAD QUALIFICADO — Interesado en DEMO. Usuarios: {{vars.usuarios}}, Email: {{vars.email}}" },
      } as HandoffNodeConfig,
    },
    // ── Info path ───────────────────────────────────────────────
    {
      node_key: "capture_info",
      node_type: "collect_input",
      config: {
        prompt_text: { en: "¿Qué información necesitas?", es: "¿Qué información necesitas?" },
        var_key: "pregunta",
        next_node_key: "info_handoff",
      } as CollectInputNodeConfig,
    },
    {
      node_key: "info_handoff",
      node_type: "set_tag",
      config: {
        mode: "add",
        tag_id: "",
        next_node_key: "end_info",
      } as SetTagNodeConfig,
    },
    {
      node_key: "end_info",
      node_type: "send_message",
      config: {
        text: { en: "✅ Gracias. Un agente te responderá con la información que necesitas.", es: "✅ Gracias. Un agente te responderá con la información que necesitas." },
        next_node_key: "handoff_info",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "handoff_info",
      node_type: "handoff",
      config: {
        note: { en: "❓ LEAD INFO — Pregunta: {{vars.pregunta}}", es: "❓ LEAD INFO — Pregunta: {{vars.pregunta}}" },
      } as HandoffNodeConfig,
    },
    // ── Soporte path ───────────────────────────────────────────
    {
      node_key: "soporte_handoff",
      node_type: "handoff",
      config: {
        note: { en: "🛟 SOLICITUD DE SOPORTE", es: "🛟 SOLICITUD DE SOPORTE" },
      } as HandoffNodeConfig,
    },
    // ── Terminal ───────────────────────────────────────────────
    {
      node_key: "end",
      node_type: "end",
      config: {},
    },
  ],
};

// ============================================================
// 7. Re-engagement — Recuperar leads inactivos (MANUAL - activarlo tú)
// ============================================================
const RE_ENGAGEMENT: FlowTemplate = {
  slug: "re_engagement",
  name: "🔥 Re-activa Leads Inactivos",
  description: "Actívalo manualmente cuando detectes un lead inactivo. NO se activa solo.",
  icon: "TrendingUp",
  trigger_type: "manual",
  trigger_config: {},
  entry_node_id: "start",
  nodes: [
    {
      node_key: "start",
      node_type: "start",
      config: { next_node_key: "welcome" },
    },
    {
      node_key: "welcome",
      node_type: "send_message",
      config: {
        text: { en: "¡Hola! 👋 Te extrañamos. ¿Todo bien? Estamos aquí si necesitas algo.", es: "¡Hola! 👋 Te extrañamos. ¿Todo bien? Estamos aquí si necesitas algo." },
        next_node_key: "menu",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "menu",
      node_type: "send_buttons",
      config: {
        text: { en: "¿Qué te gustaría hacer?", es: "¿Qué te gustaría hacer?" },
        buttons: [
          { reply_id: "volver", title: { en: "🔙 Volver", es: "🔙 Volver" }, next_node_key: "interested" },
          { reply_id: "no_gracias", title: { en: "❌ No gracias", es: "❌ No gracias" }, next_node_key: "bye" },
        ],
      } as SendButtonsNodeConfig,
    },
    {
      node_key: "interested",
      node_type: "send_message",
      config: {
        text: { en: "🎉 ¡Genial! Tenemos una oferta especial para ti. ¿Te cuento?", es: "🎉 ¡Genial! Tenemos una oferta especial para ti. ¿Te cuento?" },
        next_node_key: "offer",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "offer",
      node_type: "send_message",
      config: {
        text: { en: "📱 Te ofrecen 30% de descuento en el primer mes. ¿Te interesa agendar una llamada?", es: "📱 Te ofrecen 30% de descuento en el primer mes. ¿Te interesa agendar una llamada?" },
        next_node_key: "capture_phone",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "capture_phone",
      node_type: "collect_input",
      config: {
        prompt_text: { en: "Déjame tu número y te contactamos", es: "Déjame tu número y te contactamos" },
        var_key: "telefono",
        next_node_key: "interested_handoff",
      } as CollectInputNodeConfig,
    },
    {
      node_key: "interested_handoff",
      node_type: "set_tag",
      config: {
        mode: "add",
        tag_id: "",
        next_node_key: "end_interested",
      } as SetTagNodeConfig,
    },
    {
      node_key: "end_interested",
      node_type: "send_message",
      config: {
        text: { en: "✅ ¡Perfecto! Un agente te contactará pronto. 🎉", es: "✅ ¡Perfecto! Un agente te contactará pronto. 🎉" },
        next_node_key: "handoff_interested",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "handoff_interested",
      node_type: "handoff",
      config: {
        note: { en: "🔥 LEAD RE-ENGAGED — Tel: {{vars.telefono}}", es: "🔥 LEAD RE-ENGAGED — Tel: {{vars.telefono}}" },
      } as HandoffNodeConfig,
    },
    {
      node_key: "bye",
      node_type: "send_message",
      config: {
        text: { en: "¡Ok! Quedamos aquí cuando necesites. 😊", es: "¡Ok! Quedamos aquí cuando necesites. 😊" },
        next_node_key: "end",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "end",
      node_type: "end",
      config: {},
    },
  ],
};

// ============================================================
// 8. Encuesta de Satisfacción Post-atención
// ============================================================
const SATISFACTION_SURVEY: FlowTemplate = {
  slug: "satisfaction_survey",
  name: "⭐ Encuesta de Satisfacción",
  description: "Pregunta al cliente cómo estuvo su experiencia después de una atención.",
  icon: "Star",
  trigger_type: "keyword",
  trigger_config: { keywords: ["encuesta", "feedback", "calificar"], match_type: "contains" },
  entry_node_id: "start",
  nodes: [
    {
      node_key: "start",
      node_type: "start",
      config: { next_node_key: "intro" },
    },
    {
      node_key: "intro",
      node_type: "send_message",
      config: {
        text: { en: "¡Gracias por tu tiempo! 😊 ¿Cómo fue tu experiencia con nosotros?", es: "¡Gracias por tu tiempo! 😊 ¿Cómo fue tu experiencia con nosotros?" },
        next_node_key: "rating",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "rating",
      node_type: "send_buttons",
      config: {
        text: { en: "Del 1 al 5, ¿cómo calificarías tu experiencia?", es: "Del 1 al 5, ¿cómo calificarías tu experiencia?" },
        buttons: [
          { reply_id: "1", title: { en: "⭐ 1", es: "⭐ 1" }, next_node_key: "bad_rating" },
          { reply_id: "3", title: { en: "⭐⭐⭐ 3", es: "⭐⭐⭐ 3" }, next_node_key: "neutral_rating" },
          { reply_id: "5", title: { en: "⭐⭐⭐⭐⭐ 5", es: "⭐⭐⭐⭐⭐ 5" }, next_node_key: "good_rating" },
        ],
      } as SendButtonsNodeConfig,
    },
    {
      node_key: "bad_rating",
      node_type: "send_message",
      config: {
        text: { en: "Lamentamos que no haya sido lo mejor. ¿Qué podríamos mejorar?", es: "Lamentamos que no haya sido lo mejor. ¿Qué podríamos mejorar?" },
        next_node_key: "feedback_bad",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "feedback_bad",
      node_type: "collect_input",
      config: {
        prompt_text: { en: "Cuéntanos más...", es: "Cuéntanos más..." },
        var_key: "comentario",
        next_node_key: "bad_handoff",
      } as CollectInputNodeConfig,
    },
    {
      node_key: "bad_handoff",
      node_type: "handoff",
      config: {
        note: { en: "⚠️ ENCUENTA NEGATIVA — Comentario: {{vars.comentario}}", es: "⚠️ ENCUENTA NEGATIVA — Comentario: {{vars.comentario}}" },
      } as HandoffNodeConfig,
    },
    {
      node_key: "neutral_rating",
      node_type: "send_message",
      config: {
        text: { en: "Gracias. ¿Hay algo específico que podríamos mejorar?", es: "Gracias. ¿Hay algo específico que podríamos mejorar?" },
        next_node_key: "feedback_neutral",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "feedback_neutral",
      node_type: "collect_input",
      config: {
        prompt_text: { en: "Tu feedback nos ayuda...", es: "Tu feedback nos ayuda..." },
        var_key: "comentario",
        next_node_key: "end_survey",
      } as CollectInputNodeConfig,
    },
    {
      node_key: "good_rating",
      node_type: "send_message",
      config: {
        text: { en: "¡Excelente! 🎉 ¡Gracias! ¿Hay algo más en lo que podamos ayudarte?", es: "¡Excelente! 🎉 ¡Gracias! ¿Hay algo más en lo que podamos ayudarte?" },
        next_node_key: "end_survey",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "end_survey",
      node_type: "send_message",
      config: {
        text: { en: "¡Gracias por tu feedback! 💙", es: "¡Gracias por tu feedback! 💙" },
        next_node_key: "end",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "end",
      node_type: "end",
      config: {},
    },
  ],
};

const TEMPLATES: Record<string, FlowTemplate> = {
  welcome_menu: WELCOME_MENU,
  faq_bot: FAQ_BOT,
  lead_capture: LEAD_CAPTURE,
  lead_qualification: LEAD_QUALIFICATION,
  customer_onboarding: CUSTOMER_ONBOARDING,
  instant_lead_response: INSTANT_LEAD_RESPONSE,
  re_engagement: RE_ENGAGEMENT,
  satisfaction_survey: SATISFACTION_SURVEY,
};

export function getFlowTemplate(slug: string, lang?: Locale): FlowTemplate | null {
  const template = TEMPLATES[slug] ?? null;
  if (!template) return null;
  if (!lang) return template;
  return compileTemplate(template, lang);
}

export function listFlowTemplates(): FlowTemplate[] {
  return Object.values(TEMPLATES);
}

/** Returns all available locales for a template (checks if template has localized content) */
export function getTemplateLocales(slug: string): Locale[] {
  const template = TEMPLATES[slug];
  if (!template) return [];
  const hasLocalized = template.nodes.some(node => {
    const config = node.config as Record<string, unknown>;
    return JSON.stringify(config).includes('"en"') && JSON.stringify(config).includes('"es"');
  });
  return hasLocalized ? ['en', 'es'] : ['en'];
}
