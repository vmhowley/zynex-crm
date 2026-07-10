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
    | HandoffNodeConfig
    | Record<string, unknown>;
}

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
        text: "Hi! 👋 Welcome to support. Are you an existing customer or new here?",
        footer_text: "Tap a button below to continue.",
        buttons: [
          {
            reply_id: "existing",
            title: "Existing customer",
            next_node_key: "existing_handoff",
          },
          {
            reply_id: "new",
            title: "New customer",
            next_node_key: "new_handoff",
          },
        ],
      } as SendButtonsNodeConfig,
    },
    {
      node_key: "existing_handoff",
      node_type: "handoff",
      config: {
        note: "Existing customer needs assistance — please check account history before replying.",
      } as HandoffNodeConfig,
    },
    {
      node_key: "new_handoff",
      node_type: "handoff",
      config: {
        note: "New customer — share pricing + onboarding link.",
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
// 4. Zynex Lead Nurturing — 3-way routing: Demo / Trial / Soporte
// ============================================================
// NOTE: set_tag nodes use placeholder tag UUIDs. Replace with actual
// tag IDs from your Zynex CRM tags before activating the flow.
// Tag IDs: {LEAD_CALIENTE_TAG}, {LEAD_TIBIO_TAG}, {SOPORTE_Q_TAG}
// These are configured in the tag picker UI in the Flow Builder.
const ZYNEX_LEAD_NURTURE: FlowTemplate = {
  slug: "zynex_lead_nurture",
  name: "Zynex Lead Nurturing",
  description:
    "Captures leads from WhatsApp and routes them through Demo, Trial, or Support paths. Captures company + RNC + contact + email and hands off to the right agent with all data interpolated in the note.",
  icon: "Zap",
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
        text: "¡Hola! 👋 Bienvenido a Zynex CRM. ¿En qué podemos ayudarte hoy?",
        next_node_key: "main_menu",
      } as SendMessageNodeConfig,
    },
    // ── Main menu ────────────────────────────────────────────
    {
      node_key: "main_menu",
      node_type: "send_buttons",
      config: {
        text: "Selecciona una opción:",
        footer_text: "Respuesta en minutos ✓",
        buttons: [
          { reply_id: "demo", title: "📊 Solicitar demo", next_node_key: "demo_intro" },
          { reply_id: "trial", title: "🚀 Probar gratis 30 días", next_node_key: "trial_intro" },
          { reply_id: "soporte", title: "🆘 Soporte técnico", next_node_key: "soporte_path" },
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
        text: "¡Perfecto! 📊 La demo de Zynex CRM muestra cómo DigitBill + WhatsApp reducen tu workload de facturación electrónica en un 80%.",
        next_node_key: "demo_company",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "demo_company",
      node_type: "collect_input",
      config: {
        prompt_text: "¿Cuál es el nombre de tu empresa o negocio?",
        var_key: "company",
        next_node_key: "demo_rnc",
      } as CollectInputNodeConfig,
    },
    {
      node_key: "demo_rnc",
      node_type: "collect_input",
      config: {
        prompt_text: "Gracias, {{vars.company}}. ¿Tienes RNC o Cédula? (Lo necesitamos para configurar DigitBill en tu cuenta.)",
        var_key: "rnc",
        next_node_key: "demo_email",
      } as CollectInputNodeConfig,
    },
    {
      node_key: "demo_email",
      node_type: "collect_input",
      config: {
        prompt_text: "Último paso — ¿cuál es tu correo electrónico?",
        var_key: "email",
        next_node_key: "demo_score_check",
      } as CollectInputNodeConfig,
    },
    // Lead scoring — check if RNC was provided
    {
      node_key: "demo_score_check",
      node_type: "condition",
      config: {
        subject: "var",
        subject_key: "rnc",
        operator: "present",
        true_next: "score_alta",
        false_next: "score_media",
      } as ConditionNodeConfig,
    },
    {
      node_key: "score_alta",
      node_type: "set_tag",
      config: {
        mode: "add",
        tag_id: "{LEAD_CALIENTE_TAG}",
        next_node_key: "demo_confirm",
      } as SetTagNodeConfig,
    },
    {
      node_key: "score_media",
      node_type: "set_tag",
      config: {
        mode: "add",
        tag_id: "{LEAD_TIBIO_TAG}",
        next_node_key: "demo_confirm",
      } as SetTagNodeConfig,
    },
    {
      node_key: "demo_confirm",
      node_type: "send_message",
      config: {
        text: "✅ ¡Listo! Te contactamos en menos de 2 horas. Recibirás un correo de bienvenida en {{vars.email}}.",
        next_node_key: "demo_handoff",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "demo_handoff",
      node_type: "handoff",
      config: {
        note: "🚨 LEAD DEMO — empresa={{vars.company}}, RNC={{vars.rnc}}, email={{vars.email}}. Interesado en ver cómo DigitBill automatiza la e-CF. Prioridad ALTA.",
      } as HandoffNodeConfig,
    },

    // ════════════════════════════════════════════════════════
    // PATH B — TRIAL
    // ════════════════════════════════════════════════════════
    {
      node_key: "trial_intro",
      node_type: "send_message",
      config: {
        text: "¡Genial! 🚀 Te damos 30 días con todas las funciones activas — WhatsApp flows, DigitBill, CRM completo. Sin compromiso.",
        next_node_key: "trial_company",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "trial_company",
      node_type: "collect_input",
      config: {
        prompt_text: "¿Cuál es el nombre de tu empresa?",
        var_key: "company",
        next_node_key: "trial_agree",
      } as CollectInputNodeConfig,
    },
    {
      node_key: "trial_agree",
      node_type: "send_buttons",
      config: {
        text: "Perfecto. Para activar tu trial necesitamos tu consentimiento. ¿Aceptas?",
        footer_text: "Puedes cancelar cuando quieras.",
        buttons: [
          { reply_id: "accept", title: "✅ Acepto y continuo", next_node_key: "trial_confirm" },
          { reply_id: "later", title: "⏳ Después", next_node_key: "trial_decline" },
        ],
      } as SendButtonsNodeConfig,
    },
    {
      node_key: "trial_confirm",
      node_type: "send_message",
      config: {
        text: "🎉 ¡Trial activado! Te enviamos los datos de acceso a tu WhatsApp en minutos. Bienvenido a Zynex CRM, {{vars.company}}.",
        next_node_key: "trial_handoff",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "trial_handoff",
      node_type: "handoff",
      config: {
        note: "✅ TRIAL ACTIVADO — empresa={{vars.company}}, contacto={{vars.name}}. Trial 30 días activado. Añadir tag 'trial_activo' y crear deal en pipeline Ventas.",
      } as HandoffNodeConfig,
    },
    {
      node_key: "trial_decline",
      node_type: "send_message",
      config: {
        text: "Sin problema. Cuando quieras activar tu trial, simplemente escribe 'trial' y te ayudamos. 😊",
        next_node_key: "end",
      } as SendMessageNodeConfig,
    },

    // ════════════════════════════════════════════════════════
    // PATH C — SOPORTE
    // ════════════════════════════════════════════════════════
    {
      node_key: "soporte_path",
      node_type: "send_message",
      config: {
        text: "🆘 Entendido. Nuestro equipo de soporte está activo de Lun–Vier, 9am–6pm (hora RD). Fuera de ese horario respondemos al siguiente día hábil.",
        next_node_key: "soporte_issue",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "soporte_issue",
      node_type: "collect_input",
      config: {
        prompt_text: "Cuéntanos brevemente tu problema o consulta:",
        var_key: "issue",
        next_node_key: "soporte_confirm",
      } as CollectInputNodeConfig,
    },
    {
      node_key: "soporte_confirm",
      node_type: "send_message",
      config: {
        text: "Recibido 📝. Un agente te responde en menos de 2 horas. Te notificamos por WhatsApp cuando haya respuesta.",
        next_node_key: "soporte_tag",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "soporte_tag",
      node_type: "set_tag",
      config: {
        mode: "add",
        tag_id: "{SOPORTE_Q_TAG}",
        next_node_key: "soporte_handoff",
      } as SetTagNodeConfig,
    },
    {
      node_key: "soporte_handoff",
      node_type: "handoff",
      config: {
        note: "🆘 SOPORTE — contacto={{vars.name}}, problema={{vars.issue}}. Consulta de soporte — clasificar por categoría (DigitBill / WhatsApp / CRM).",
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
// 5. Zynex Onboarding — checklist-style onboarding for new customers
// ============================================================
// Trigger: keyword "onboarding" or "empezar" OR tag_added trial_activo
const ZYNEX_ONBOARDING: FlowTemplate = {
  slug: "zynex_onboarding",
  name: "Zynex Onboarding",
  description:
    "Guide new customers through setup after trial activation. Checklist-style with 4 sections: WhatsApp connection, DigitBill setup, team invitation, and pipeline creation.",
  icon: "CheckSquare",
  trigger_type: "keyword",
  trigger_config: { keywords: ["onboarding", "empezar", "setup"], match_type: "contains" },
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
        header_text: "🎯 Tu checklist de onboarding",
        text: "Tienes 4 pasos para dejar todo listo. ¿Por cuál empezamos?",
        button_label: "Ver pasos",
        sections: [
          {
            title: "📱 WhatsApp",
            rows: [
              { reply_id: "wa_connect", title: "Conectar número WhatsApp", description: "Vincula tu línea existente en 2 min", next_node_key: "step_wa" },
            ],
          },
          {
            title: "🧾 DigitBill",
            rows: [
              { reply_id: "digitbill_setup", title: "Configurar e-CF (DigitBill)", description: "Automatiza facturas electrónicas DGII", next_node_key: "step_digitbill" },
            ],
          },
          {
            title: "👥 Equipo",
            rows: [
              { reply_id: "team_invite", title: "Invitar a tu equipo", description: "Agrega hasta 5 agentes", next_node_key: "step_team" },
            ],
          },
          {
            title: "📊 Pipeline",
            rows: [
              { reply_id: "pipeline_setup", title: "Crear tu primer pipeline", description: "Organiza tus deals y clientes", next_node_key: "step_pipeline" },
            ],
          },
        ],
      } as SendListNodeConfig,
    },

    // ── Step: WhatsApp ───────────────────────────────────────
    {
      node_key: "step_wa",
      node_type: "send_message",
      config: {
        text: "📱 Conectar WhatsApp:\n\n1. Ve a Ajustes → Canales\n2. Selecciona WhatsApp → Agregar número\n3. Escanea el QR con tu teléfono Business\n\nCuando termines, escribe 'listo' para marcar este paso ✅",
        next_node_key: "wait_wa_done",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "wait_wa_done",
      node_type: "collect_input",
      config: {
        prompt_text: "Escribe 'listo' cuando hayas conectado tu WhatsApp:",
        var_key: "wa_confirmed",
        next_node_key: "step_digitbill",
      } as CollectInputNodeConfig,
    },

    // ── Step: DigitBill ───────────────────────────────────────
    {
      node_key: "step_digitbill",
      node_type: "send_message",
      config: {
        text: "🧾 Configurar DigitBill:\n\n1. Ve a Ajustes → Integraciones → DigitBill\n2. Ingresa tu RNC\n3. Autoriza la conexión con DGII\n\n⚠️ Si aún no tienes cuenta DigitBill, crea una en digitbill.do — el primer mes es gratis.\n\nCuando esté listo, escribe 'digitbill_ok'",
        next_node_key: "wait_digitbill_done",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "wait_digitbill_done",
      node_type: "collect_input",
      config: {
        prompt_text: "Escribe 'digitbill_ok' cuando esté configurado:",
        var_key: "digitbill_confirmed",
        next_node_key: "step_team",
      } as CollectInputNodeConfig,
    },

    // ── Step: Team ───────────────────────────────────────────
    {
      node_key: "step_team",
      node_type: "send_message",
      config: {
        text: "👥 Invitar al equipo:\n\n1. Ve a Ajustes → Equipo\n2. Agrega los emails de tus colaboradores\n3. Asigna roles: Agente, Admin, o Viewer\n\nDelegar tareas reduce tu carga drásticamente. ¿A quién vas a invitar primero?",
        next_node_key: "step_pipeline",
      } as SendMessageNodeConfig,
    },

    // ── Step: Pipeline ───────────────────────────────────────
    {
      node_key: "step_pipeline",
      node_type: "send_message",
      config: {
        text: "📊 Crear tu primer pipeline:\n\n1. Ve a Deals → Pipelines\n2. Crea un pipeline nuevo\n3. Añade etapas: Lead, Qualification, Proposal, Closed\n\nUn pipeline organizado es la clave para no perder ventas. ¡Empieza hoy!",
        next_node_key: "onboarding_complete",
      } as SendMessageNodeConfig,
    },

    // ── Completion ────────────────────────────────────────────
    {
      node_key: "onboarding_complete",
      node_type: "send_message",
      config: {
        text: "🎉 ¡Onboarding completado!\n\nTu cuenta Zynex CRM está lista:\n✅ WhatsApp conectado\n✅ DigitBill configurado\n✅ Equipo invitado\n✅ Pipeline creado\n\nTu próximo paso: crear tu primer flow de ventas. Escribe 'flows' para ver cómo empezar.\n\n¿Necesitas ayuda? Escribe 'soporte' y te conectamos.",
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
  zynex_lead_nurture: ZYNEX_LEAD_NURTURE,
  zynex_onboarding: ZYNEX_ONBOARDING,
};

export function getFlowTemplate(slug: string): FlowTemplate | null {
  return TEMPLATES[slug] ?? null;
}

export function listFlowTemplates(): FlowTemplate[] {
  return Object.values(TEMPLATES);
}
