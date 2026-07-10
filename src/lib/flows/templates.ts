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
        text: "Hi there! 👋 How can we help you today?",
        next_node_key: "main_menu",
      } as SendMessageNodeConfig,
    },
    // ── Main menu ────────────────────────────────────────────
    {
      node_key: "main_menu",
      node_type: "send_buttons",
      config: {
        text: "What are you looking for?",
        footer_text: "We'll get back to you right away",
        buttons: [
          { reply_id: "demo", title: "📊 Request a demo", next_node_key: "demo_intro" },
          { reply_id: "trial", title: "🚀 Start free trial", next_node_key: "trial_intro" },
          { reply_id: "support", title: "💬 Talk to support", next_node_key: "support_path" },
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
        text: "Great choice! 📊 I'll set up a personalized demo for you. Let me ask a few quick questions.",
        next_node_key: "demo_company",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "demo_company",
      node_type: "collect_input",
      config: {
        prompt_text: "What's your company name?",
        var_key: "company",
        next_node_key: "demo_contact",
      } as CollectInputNodeConfig,
    },
    {
      node_key: "demo_contact",
      node_type: "collect_input",
      config: {
        prompt_text: "And what's your name?",
        var_key: "contact_name",
        next_node_key: "demo_email",
      } as CollectInputNodeConfig,
    },
    {
      node_key: "demo_email",
      node_type: "collect_input",
      config: {
        prompt_text: "Last step — what's your email address?",
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
        text: "✅ Got it, {{vars.contact_name}}! We'll reach out within 2 hours. You'll receive a confirmation at {{vars.email}}.",
        next_node_key: "demo_handoff",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "demo_handoff",
      node_type: "handoff",
      config: {
        note: "📊 DEMO REQUEST — company={{vars.company}}, contact={{vars.contact_name}}, email={{vars.email}}. High-interest lead. Schedule demo call.",
      } as HandoffNodeConfig,
    },

    // ════════════════════════════════════════════════════════
    // PATH B — TRIAL
    // ════════════════════════════════════════════════════════
    {
      node_key: "trial_intro",
      node_type: "send_message",
      config: {
        text: "Awesome! 🚀 Let's get you set up with a free trial. Quick question first.",
        next_node_key: "trial_company",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "trial_company",
      node_type: "collect_input",
      config: {
        prompt_text: "What's your company name?",
        var_key: "company",
        next_node_key: "trial_agree",
      } as CollectInputNodeConfig,
    },
    {
      node_key: "trial_agree",
      node_type: "send_buttons",
      config: {
        text: "To start your trial, we just need your consent. Do you agree?",
        footer_text: "You can cancel anytime.",
        buttons: [
          { reply_id: "accept", title: "✅ Yes, continue", next_node_key: "trial_confirm" },
          { reply_id: "later", title: "⏳ Maybe later", next_node_key: "trial_decline" },
        ],
      } as SendButtonsNodeConfig,
    },
    {
      node_key: "trial_confirm",
      node_type: "send_message",
      config: {
        text: "🎉 Trial activated! You'll receive your login details shortly. Welcome aboard, {{vars.company}}!",
        next_node_key: "trial_handoff",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "trial_handoff",
      node_type: "handoff",
      config: {
        note: "🚀 TRIAL ACTIVATED — company={{vars.company}}. Set up account, add {TRIAL_TAG}, create deal in sales pipeline.",
      } as HandoffNodeConfig,
    },
    {
      node_key: "trial_decline",
      node_type: "send_message",
      config: {
        text: "No problem at all. Just message us when you're ready to start your trial. We'll be here! 😊",
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
        text: "Of course! 💬 Our support team is here to help. We're available Mon–Fri, 9am–6pm. Outside hours, we'll respond next business day.",
        next_node_key: "support_issue",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "support_issue",
      node_type: "collect_input",
      config: {
        prompt_text: "Please briefly describe your issue or question:",
        var_key: "issue",
        next_node_key: "support_confirm",
      } as CollectInputNodeConfig,
    },
    {
      node_key: "support_confirm",
      node_type: "send_message",
      config: {
        text: "Got it 📝 An agent will respond within 2 hours. We'll notify you here on WhatsApp.",
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
        note: "💬 SUPPORT — contact={{vars.contact_name}}, issue={{vars.issue}}. Support request — route to support team.",
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
// 5. Customer Onboarding — checklist-style onboarding for new customers
// ============================================================
// Adapt: replace step instructions with your own product setup steps,
// change step count, update completion message for your brand.
const CUSTOMER_ONBOARDING: FlowTemplate = {
  slug: "customer_onboarding",
  name: "Customer Onboarding",
  description:
    "Guide new customers through setup with a checklist-style flow. Covers account connection, configuration, team invitation, and first workflow creation.",
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
        header_text: "🎯 Your onboarding checklist",
        text: "You have 4 steps to get set up. Which shall we start with?",
        button_label: "View steps",
        sections: [
          {
            title: "🔌 Integration",
            rows: [
              { reply_id: "connect", title: "Connect your channel", description: "Link WhatsApp, Instagram, or Messenger", next_node_key: "step_connect" },
            ],
          },
          {
            title: "⚙️ Configuration",
            rows: [
              { reply_id: "configure", title: "Configure your account", description: "Set up business hours, notifications, etc.", next_node_key: "step_configure" },
            ],
          },
          {
            title: "👥 Team",
            rows: [
              { reply_id: "invite", title: "Invite your team", description: "Add up to 5 team members", next_node_key: "step_invite" },
            ],
          },
          {
            title: "🚀 First Workflow",
            rows: [
              { reply_id: "workflow", title: "Create your first workflow", description: "Automate your first process", next_node_key: "step_workflow" },
            ],
          },
        ],
      } as SendListNodeConfig,
    },

    // ── Step: Connect ─────────────────────────────────────────
    {
      node_key: "step_connect",
      node_type: "send_message",
      config: {
        text: "🔌 Connecting your channel:\n\n1. Go to Settings → Channels\n2. Select your channel (WhatsApp, Instagram, etc.)\n3. Follow the auth steps\n\nWhen done, type 'done' to mark this step ✅",
        next_node_key: "wait_connect",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "wait_connect",
      node_type: "collect_input",
      config: {
        prompt_text: "Type 'done' when you've connected your channel:",
        var_key: "connect_done",
        next_node_key: "step_configure",
      } as CollectInputNodeConfig,
    },

    // ── Step: Configure ────────────────────────────────────────
    {
      node_key: "step_configure",
      node_type: "send_message",
      config: {
        text: "⚙️ Configuring your account:\n\n1. Go to Settings → Business Profile\n2. Set your business hours\n3. Configure notification preferences\n\nWhen finished, type 'done'",
        next_node_key: "wait_configure",
      } as SendMessageNodeConfig,
    },
    {
      node_key: "wait_configure",
      node_type: "collect_input",
      config: {
        prompt_text: "Type 'done' when configuration is complete:",
        var_key: "configure_done",
        next_node_key: "step_invite",
      } as CollectInputNodeConfig,
    },

    // ── Step: Invite ──────────────────────────────────────────
    {
      node_key: "step_invite",
      node_type: "send_message",
      config: {
        text: "👥 Inviting your team:\n\n1. Go to Settings → Team\n2. Add your colleagues' emails\n3. Assign roles: Agent, Admin, or Viewer\n\nTip: having agents handle support frees you up to focus on growing your business.",
        next_node_key: "step_workflow",
      } as SendMessageNodeConfig,
    },

    // ── Step: Workflow ────────────────────────────────────────
    {
      node_key: "step_workflow",
      node_type: "send_message",
      config: {
        text: "🚀 Creating your first workflow:\n\n1. Go to Flows → Create new\n2. Choose a template or start from scratch\n3. Set your trigger (e.g. new message, keyword)\n4. Add actions (reply, tag, assign, etc.)\n\nTip: start simple! One flow that works well is better than five half-finished ones.",
        next_node_key: "onboarding_complete",
      } as SendMessageNodeConfig,
    },

    // ── Completion ────────────────────────────────────────────
    {
      node_key: "onboarding_complete",
      node_type: "send_message",
      config: {
        text: "🎉 Onboarding complete!\n\nYour account is ready:\n✅ Channel connected\n✅ Settings configured\n✅ Team invited\n✅ Workflow created\n\nNext step: explore your dashboard and try out some automations!\n\nNeed help? Type 'support' anytime.",
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

export function getFlowTemplate(slug: string): FlowTemplate | null {
  return TEMPLATES[slug] ?? null;
}

export function listFlowTemplates(): FlowTemplate[] {
  return Object.values(TEMPLATES);
}
