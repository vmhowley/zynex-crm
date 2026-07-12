import type {
  AutomationStepConfig,
  AutomationStepType,
  AutomationTriggerConfig,
  AutomationTriggerType,
} from '@/types'

export type TemplateSlug =
  | 'welcome_message'
  | 'out_of_office'
  | 'lead_qualifier'
  | 'follow_up_reminder'
  | 'instant_lead_response'
  | 'lead_nurturing_sequence'
  | 'customer_success_onboarding'
  | 're_engagement_campaign'

export interface TemplateStepSeed {
  step_type: AutomationStepType
  step_config: AutomationStepConfig
  branch?: 'yes' | 'no' | null
  /** Index (within this seed list) of the Condition parent, if nested. */
  parent_index?: number | null
}

export interface AutomationTemplateDefinition {
  slug: TemplateSlug
  name: string
  description: string
  trigger_type: AutomationTriggerType
  trigger_config: AutomationTriggerConfig
  steps: TemplateStepSeed[]
}

export const AUTOMATION_TEMPLATES: Record<TemplateSlug, AutomationTemplateDefinition> = {
  welcome_message: {
    slug: 'welcome_message',
    name: 'Welcome Message',
    description: 'Auto-reply to first-time contacts with a greeting.',
    // first_inbound_message (added in PR #33) catches both brand-new
    // contacts AND manually-added/imported contacts on their first-ever
    // reply, which is what a user setting up a "welcome" automation
    // almost always wants. new_contact_created would miss the
    // manually-imported case.
    trigger_type: 'first_inbound_message',
    trigger_config: {},
    steps: [
      {
        step_type: 'send_message',
        step_config: {
          text: "Hi! 👋 Thanks for reaching out. We'll get back to you shortly.",
        },
      },
      {
        step_type: 'add_tag',
        step_config: { tag_id: '' },
      },
    ],
  },
  out_of_office: {
    slug: 'out_of_office',
    name: 'Out of Office',
    description: 'Auto-reply during off-hours so nobody is left waiting.',
    trigger_type: 'new_message_received',
    trigger_config: {},
    steps: [
      {
        step_type: 'condition',
        step_config: {
          subject: 'time_of_day',
          operand: '18:00-09:00',
        },
      },
      {
        step_type: 'send_message',
        step_config: {
          text:
            "Thanks for your message! Our team is offline right now (9am–6pm) and will reply first thing tomorrow.",
        },
        parent_index: 0,
        branch: 'yes',
      },
    ],
  },
  lead_qualifier: {
    slug: 'lead_qualifier',
    name: 'Lead Qualifier',
    description: 'Ask qualification questions to filter inbound leads.',
    trigger_type: 'keyword_match',
    trigger_config: {
      keywords: ['pricing', 'quote', 'buy'],
      match_type: 'contains',
    },
    steps: [
      {
        step_type: 'send_message',
        step_config: {
          text:
            "Great — happy to help with pricing! Quick question: roughly how many seats are you looking for?",
        },
      },
      {
        step_type: 'wait',
        step_config: { amount: 10, unit: 'minutes' },
      },
      {
        step_type: 'assign_conversation',
        step_config: { mode: 'round_robin' },
      },
    ],
  },
  follow_up_reminder: {
    slug: 'follow_up_reminder',
    name: 'Follow-up Reminder',
    description: 'Send a nudge if a contact has not replied within 24 hours.',
    trigger_type: 'new_message_received',
    trigger_config: {},
    steps: [
      {
        step_type: 'wait',
        step_config: { amount: 1, unit: 'days' },
      },
      {
        step_type: 'send_message',
        step_config: {
          text:
            "Just circling back — did you have any other questions for us? Happy to help!",
        },
      },
    ],
  },
  instant_lead_response: {
    slug: 'instant_lead_response',
    name: '⚡ Respuesta Instantánea a Leads',
    description: 'Responde inmediatamente a nuevos leads, clasifica y asigna a un agente en segundos.',
    trigger_type: 'first_inbound_message',
    trigger_config: {},
    steps: [
      {
        step_type: 'send_message',
        step_config: {
          text: "¡Hola! 👋 Gracias por contactarnos. Un agente te atenderá en breve. Mientras tanto, cuéntanos: ¿en qué podemos ayudarte?",
        },
      },
      {
        step_type: 'wait',
        step_config: { amount: 30, unit: 'seconds' },
      },
      {
        step_type: 'add_tag',
        step_config: { tag_id: 'lead-nuevo' },
      },
      {
        step_type: 'assign_conversation',
        step_config: { mode: 'round_robin' },
      },
    ],
  },
  lead_nurturing_sequence: {
    slug: 'lead_nurturing_sequence',
    name: '🌱 Nutrición de Leads (7 días)',
    description: 'Secuencia de 7 días para convertir leads fríos en clientes. Envía valor automáticamente.',
    trigger_type: 'tag_added',
    trigger_config: { tags: ['lead-nuevo'] },
    steps: [
      {
        step_type: 'wait',
        step_config: { amount: 1, unit: 'days' },
      },
      {
        step_type: 'send_message',
        step_config: {
          text: "¡Hola! 👋 Solo quería asegurarme de que resolver todas tus dudas. ¿Hay algo específico en lo que pueda ayudarte hoy?",
        },
      },
      {
        step_type: 'wait',
        step_config: { amount: 2, unit: 'days' },
      },
      {
        step_type: 'send_message',
        step_config: {
          text: "Te comparto algunos casos de éxito de clientes como tú que han transformado su negocio con nuestra solución: [casos de éxito]",
        },
      },
      {
        step_type: 'add_tag',
        step_config: { tag_id: 'lead-nurturing' },
      },
      {
        step_type: 'wait',
        step_config: { amount: 3, unit: 'days' },
      },
      {
        step_type: 'send_message',
        step_config: {
          text: "Tengo una oferta especial por tiempo limitado para nuevos clientes. ¿Te interesa?Podemos agendarte una demo personalizada.",
        },
      },
      {
        step_type: 'wait',
        step_config: { amount: 1, unit: 'days' },
      },
      {
        step_type: 'send_message',
        step_config: {
          text: "Esta es la última oportunidad de la oferta especial. ¿Decidiste? Quedamos a tu disposición.",
        },
      },
    ],
  },
  customer_success_onboarding: {
    slug: 'customer_success_onboarding',
    name: '🎉 Onboarding de Cliente (30 días)',
    description: 'Secuencia de onboarding para nuevos clientes. Asegura que maximalicen el valor del producto.',
    trigger_type: 'tag_added',
    trigger_config: { tags: ['cliente-nuevo'] },
    steps: [
      {
        step_type: 'send_message',
        step_config: {
          text: "¡Bienvenido a Zynex! 🎉 Gracias por confiar en nosotros. Un miembro de nuestro equipo te contactará en las próximas horas para el onboarding.",
        },
      },
      {
        step_type: 'wait',
        step_config: { amount: 4, unit: 'hours' },
      },
      {
        step_type: 'send_message',
        step_config: {
          text: "¿Ya conociste todas las funcionalidades? Te recomiendo nuestra guía de inicio rápido: [enlace]",
        },
      },
      {
        step_type: 'add_tag',
        step_config: { tag_id: 'onboarding' },
      },
      {
        step_type: 'wait',
        step_config: { amount: 3, unit: 'days' },
      },
      {
        step_type: 'send_message',
        step_config: {
          text: "¡Hola! ¿Cómo va tu experiencia? ¿Hay algo que podamos mejorar? Estamos aquí para ayudarte.",
        },
      },
      {
        step_type: 'wait',
        step_config: { amount: 7, unit: 'days' },
      },
      {
        step_type: 'send_message',
        step_config: {
          text: "¿Sabías que puedes integrar más herramientas? Te muestro cómo maximizar tu inversión. ¿Agendamos una llamada?",
        },
      },
      {
        step_type: 'wait',
        step_config: { amount: 14, unit: 'days' },
      },
      {
        step_type: 'send_message',
        step_config: {
          text: "¡Felices 30 días con nosotros! 🎂 ¿Qué tal ha sido tu experiencia? Nos encantaría conocer tu feedback.",
        },
      },
    ],
  },
  re_engagement_campaign: {
    slug: 're_engagement_campaign',
    name: '🔥 Re-activa Leads Inactivos',
    description: 'Recupera leads que no han respondido en 14+ días. Secuencia de win-back.',
    trigger_type: 'tag_added',
    trigger_config: { tags: ['inactivo'] },
    steps: [
      {
        step_type: 'wait',
        step_config: { amount: 1, unit: 'days' },
      },
      {
        step_type: 'send_message',
        step_config: {
          text: "¡Hola! Notamos que no hemos sabido de ti lately. ¿Todo bien? Estamos aquí si necesitas algo.",
        },
      },
      {
        step_type: 'wait',
        step_config: { amount: 3, unit: 'days' },
      },
      {
        step_type: 'send_message',
        step_config: {
          text: "Te extrañamos 🤗 Aquí hay un video corto de nuevas funcionalidades que quizás no conocías: [video]",
        },
      },
      {
        step_type: 'wait',
        step_config: { amount: 5, unit: 'days' },
      },
      {
        step_type: 'send_message',
        step_config: {
          text: "Última llamada ⏰ tenemos una oferta especial solo para ti. ¿Te interesa rejuvenecer tu plan?",
        },
      },
      {
        step_type: 'add_tag',
        step_config: { tag_id: 're-engaged' },
      },
    ],
  },
}

export function getTemplate(slug: string): AutomationTemplateDefinition | null {
  return AUTOMATION_TEMPLATES[slug as TemplateSlug] ?? null
}
