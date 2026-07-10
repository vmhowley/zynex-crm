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
  CollectInputNodeConfig,
  ConditionNodeConfig,
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
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>;
      if ('en' in obj && 'es' in obj && typeof obj.en === 'string' && typeof obj.es === 'string') {
        result[key] = lang === 'es' ? obj.es : obj.en;
      } else if (key === 'buttons' && Array.isArray(obj)) {
        result[key] = (obj as Record<string, unknown>[]).map(btn => {
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
      config: { next_node_key: "welcome" },
    },
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
          { reply_id: "demo", title: { en: "📊 Request a demo", es: "📊 Solicitar demo" }, next_node_key: "demo_intro" },
          { reply_id: "trial", title: { en: "🚀 Start free trial", es: "🚀 Iniciar prueba gratis" }, next_node_key: "trial_intro" },
          { reply_id: "support", title: { en: "💬 Talk to support", es: "💬 Hablar con soporte" }, next_node_key: "support_path" },
        ],
      } as SendButtonsNodeConfig,
    },

    // ════════════════════════════════════════════════════════
    // PATH A — DEMO
    // ════════════════════════════════════════════════════════
    {
      node_key: "demo_intro",
      node_type: "send_message",
      config: {
        text: { en: "Great choice! 📊 I'll set up a personalized demo for you. Let me ask a few quick questions.", es: "¡Gran elección! 📊 Te prepararé una demo personalizada. Déjame hacerte unas preguntas rápidas." },
        next_node_key: "demo_company",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "demo_company",
      node_type: "collect_input",
      config: {
        prompt_text: { en: "What's your company name?", es: "¿Cuál es el nombre de tu empresa?" },
        var_key: "company",
        next_node_key: "demo_contact",
      } as CollectInputNodeConfig,
    },
    {
      node_key: "demo_contact",
      node_type: "collect_input",
      config: {
        prompt_text: { en: "And what's your name?", es: "¿Y tu nombre?" },
        var_key: "contact_name",
        next_node_key: "demo_email",
      } as CollectInputNodeConfig,
    },
    {
      node_key: "demo_email",
      node_type: "collect_input",
      config: {
        prompt_text: { en: "Last step — what's your email address?", es: "Último paso — ¿cuál es tu correo electrónico?" },
        var_key: "email",
        next_node_key: "demo_score_check",
      } as CollectInputNodeConfig,
    },
    // Lead scoring — company provided = high priority
    {
      node_key: "demo_score_check",
      node_type: "condition",
      config: {
        subject: "var",
        subject_key: "company",
        operator: "present",
        true_next: "score_high",
        false_next: "score_medium",
      } as ConditionNodeConfig,
    },
    {
      node_key: "score_high",
      node_type: "set_tag",
      config: {
        mode: "add",
        tag_id: "{HIGH_PRIORITY_TAG}",
        next_node_key: "demo_confirm",
      } as SetTagNodeConfig,
    },
    {
      node_key: "score_medium",
      node_type: "set_tag",
      config: {
        mode: "add",
        tag_id: "{MEDIUM_PRIORITY_TAG}",
        next_node_key: "demo_confirm",
      } as SetTagNodeConfig,
    },
    {
      node_key: "demo_confirm",
      node_type: "send_message",
      config: {
        text: { en: "✅ Got it, {{vars.contact_name}}! We'll reach out within 2 hours. You'll receive a confirmation at {{vars.email}}.", es: "✅ Perfecto, {{vars.contact_name}}! Te contactaremos en 2 horas. Recibirás una confirmación en {{vars.email}}." },
        next_node_key: "create_digitbill_lead",
      } as SendMessageNodeConfig,
    },
    // HTTP Fetch: creates account in DigitBill and sends credentials via email
    // ADAPT: Replace the URL with your DigitBill API endpoint.
    // Body uses {{vars.X}} interpolation to send captured data.
    {
      node_key: "create_digitbill_lead",
      node_type: "http_fetch",
      config: {
        method: "POST",
        url: "https://api.digitbill.do/api/auth/public/register",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: "{{vars.contact_name}}",
          email: "{{vars.email}}",
          phone: "{{vars.phone}}",
          company_name: "{{vars.company}}",
          plan: "pyme",
        }),
        next_node_key: "demo_handoff",
      } as unknown as HttpFetchNodeConfig,
    },
    {
      node_key: "demo_handoff",
      node_type: "handoff",
      config: {
        note: { en: "📊 DEMO REQUEST — company={{vars.company}}, contact={{vars.contact_name}}, email={{vars.email}}. High-interest lead. Schedule demo call.", es: "📊 SOLICITUD DE DEMO — empresa={{vars.company}}, contacto={{vars.contact_name}}, email={{vars.email}}. Lead de alto interés. Agendar llamada de demo." },
      } as HandoffNodeConfig,
    },

    // ════════════════════════════════════════════════════════
    // PATH B — TRIAL
    // ════════════════════════════════════════════════════════
    {
      node_key: "trial_intro",
      node_type: "send_message",
      config: {
        text: { en: "Awesome! 🚀 Let's get you set up with a free trial. Quick question first.", es: "¡Genial! 🚀 Vamos a configurarte una prueba gratuita. Primero una pregunta rápida." },
        next_node_key: "trial_company",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "trial_company",
      node_type: "collect_input",
      config: {
        prompt_text: { en: "What's your company name?", es: "¿Cuál es el nombre de tu empresa?" },
        var_key: "company",
        next_node_key: "trial_agree",
      } as CollectInputNodeConfig,
    },
    {
      node_key: "trial_agree",
      node_type: "send_buttons",
      config: {
        text: { en: "To start your trial, we just need your consent. Do you agree?", es: "Para iniciar tu prueba, solo necesitamos tu consentimiento. ¿Aceptas?" },
        footer_text: { en: "You can cancel anytime.", es: "Puedes cancelar en cualquier momento." },
        buttons: [
          { reply_id: "accept", title: { en: "✅ Yes, continue", es: "✅ Sí, continuar" }, next_node_key: "trial_confirm" },
          { reply_id: "later", title: { en: "⏳ Maybe later", es: "⏳ Quizás después" }, next_node_key: "trial_decline" },
        ],
      } as SendButtonsNodeConfig,
    },
    {
      node_key: "trial_confirm",
      node_type: "send_message",
      config: {
        text: { en: "🎉 Trial activated! You'll receive your login details shortly. Welcome aboard, {{vars.company}}!", es: "🎉 ¡Prueba activada! Recibirás tus datos de acceso pronto. ¡Bienvenido, {{vars.company}}!" },
        next_node_key: "trial_handoff",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "trial_handoff",
      node_type: "handoff",
      config: {
        note: { en: "🚀 TRIAL ACTIVATED — company={{vars.company}}. Set up account, add {TRIAL_TAG}, create deal in sales pipeline.", es: "🚀 PRUEBA ACTIVADA — empresa={{vars.company}}. Configurar cuenta, agregar {TRIAL_TAG}, crear oportunidad en pipeline de ventas." },
      } as HandoffNodeConfig,
    },
    {
      node_key: "trial_decline",
      node_type: "send_message",
      config: {
        text: { en: "No problem at all. Just message us when you're ready to start your trial. We'll be here! 😊", es: "No hay problema. escríbenos cuando estés listo para comenzar tu prueba. ¡Estaremos aquí! 😊" },
        next_node_key: "end",
      } as SendMessageNodeConfig,
    },

    // ════════════════════════════════════════════════════════
    // PATH C — SUPPORT
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
// 5. Customer Onboarding — generic checklist for any business
// ============================================================
// ADAPT THIS TEMPLATE: Replace every step instruction with your own.
// This is a skeleton — edit the text, change step names, add/remove
// steps to match your product's setup process.
const CUSTOMER_ONBOARDING: FlowTemplate = {
  slug: "customer_onboarding",
  name: "Customer Onboarding",
  description:
    "A checklist-style onboarding flow. Guides new customers through setup steps with a confirmation at each one. Adapt the steps and instructions to any product.",
  icon: "CheckSquare",
  trigger_type: "keyword",
  trigger_config: { keywords: ["onboarding", "get started", "setup"], match_type: "contains" },
  entry_node_id: "start",
  nodes: [
    // ── Entry ────────────────────────────────────────────────
    {
      node_key: "start",
      node_type: "start",
      config: { next_node_key: "checklist" },
    },
    // ── Main checklist ───────────────────────────────────────
    {
      node_key: "checklist",
      node_type: "send_list",
      config: {
        header_text: "🎯 Your setup checklist",
        text: "You have 4 steps to get started. Which shall we begin with?",
        button_label: "View steps",
        sections: [
          {
            title: "📋 Step 1",
            rows: [
              { reply_id: "step1", title: "Set up your profile", description: "Add your business info and preferences", next_node_key: "step_1" },
            ],
          },
          {
            title: "📁 Step 2",
            rows: [
              { reply_id: "step2", title: "Add your first item", description: "Add a product, service, or data entry", next_node_key: "step_2" },
            ],
          },
          {
            title: "👥 Step 3",
            rows: [
              { reply_id: "step3", title: "Invite your team", description: "Add colleagues and assign roles", next_node_key: "step_3" },
            ],
          },
          {
            title: "🚀 Step 4",
            rows: [
              { reply_id: "step4", title: "Complete first action", description: "Send, create, or configure your first item", next_node_key: "step_4" },
            ],
          },
        ],
      } as SendListNodeConfig,
    },

    // ── Step 1 ────────────────────────────────────────────────
    {
      node_key: "step_1",
      node_type: "send_message",
      config: {
        text: "📋 Step 1: Set up your profile.\n\n[Replace this with your own instructions — e.g.]\n1. Go to Settings → Profile\n2. Enter your business name, address, and contact info\n3. Save\n\nWhen done, type 'done' to continue ✅",
        next_node_key: "wait_1",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "wait_1",
      node_type: "collect_input",
      config: {
        prompt_text: "Type 'done' when Step 1 is complete:",
        var_key: "step1_done",
        next_node_key: "step_2",
      } as CollectInputNodeConfig,
    },

    // ── Step 2 ────────────────────────────────────────────────
    {
      node_key: "step_2",
      node_type: "send_message",
      config: {
        text: "📁 Step 2: Add your first item.\n\n[Replace with your own — e.g. for CRM: add first contact. For invoicing: add first product.]\n1. Go to [Your Module]\n2. Click Add / New\n3. Fill in the required fields\n4. Save\n\nType 'done' when ready ✅",
        next_node_key: "wait_2",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "wait_2",
      node_type: "collect_input",
      config: {
        prompt_text: "Type 'done' when Step 2 is complete:",
        var_key: "step2_done",
        next_node_key: "step_3",
      } as CollectInputNodeConfig,
    },

    // ── Step 3 ────────────────────────────────────────────────
    {
      node_key: "step_3",
      node_type: "send_message",
      config: {
        text: "👥 Step 3: Invite your team.\n\n[Replace with your own — e.g.]\n1. Go to Settings → Team\n2. Enter your colleagues' emails\n3. Assign roles: Admin, Editor, or Viewer\n\nDelegating tasks helps you focus on what matters. Type 'done' when ready ✅",
        next_node_key: "wait_3",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "wait_3",
      node_type: "collect_input",
      config: {
        prompt_text: "Type 'done' when Step 3 is complete:",
        var_key: "step3_done",
        next_node_key: "step_4",
      } as CollectInputNodeConfig,
    },

    // ── Step 4 ────────────────────────────────────────────────
    {
      node_key: "step_4",
      node_type: "send_message",
      config: {
        text: "🚀 Step 4: Complete your first action.\n\n[Replace with the key action your product enables — e.g. send first invoice, create first deal, post first update.]\n1. Go to [Module]\n2. Click [Action]\n3. Fill in the details\n4. Submit\n\nYou're almost done! Type 'done' to finish ✅",
        next_node_key: "complete",
      } as SendMessageNodeConfig,
    },

    // ── Completion ────────────────────────────────────────────
    {
      node_key: "complete",
      node_type: "send_message",
      config: {
        text: "🎉 You're all set!\n\nYour account is ready to go:\n✅ Profile configured\n✅ First item added\n✅ Team invited\n✅ First action completed\n\nTip: explore the dashboard to discover more features as you need them.\n\nNeed help? Just type 'support' and we'll assist you.",
        next_node_key: "end",
      } as SendMessageNodeConfig,
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

const TEMPLATES: Record<string, FlowTemplate> = {
  welcome_menu: WELCOME_MENU,
  faq_bot: FAQ_BOT,
  lead_capture: LEAD_CAPTURE,
  lead_qualification: LEAD_QUALIFICATION,
  customer_onboarding: CUSTOMER_ONBOARDING,
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
