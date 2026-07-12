import type {
  AutomationStepConfig,
  AutomationStepType,
  AutomationTriggerConfig,
  AutomationTriggerType,
} from '@/types'

export type TemplateSlug =
  | 'lead_distribution'
  | 'customer_success_onboarding'

export interface TemplateStepSeed {
  step_type: AutomationStepType
  step_config: AutomationStepConfig
  branch?: 'yes' | 'no' | null
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
  lead_distribution: {
    slug: 'lead_distribution',
    name: '📤 Distribución de Leads',
    description: 'Cuando se agrega el tag "lead-nuevo", asígnalo automáticamente a un agente y crea una oportunidad en el pipeline. IMPORTANTE: El Flow debe agregar el tag "lead-nuevo" para activar esta automatización.',
    trigger_type: 'tag_added',
    trigger_config: { tag_id: 'lead-nuevo' },
    steps: [
      {
        step_type: 'assign_conversation',
        step_config: { mode: 'round_robin' },
      },
      {
        step_type: 'create_deal',
        step_config: { pipeline_id: '', stage_id: '' },
      },
    ],
  },
  customer_success_onboarding: {
    slug: 'customer_success_onboarding',
    name: '🎉 Onboarding de Cliente',
    description: 'Secuencia de bienvenida para nuevos clientes. Se activa cuando agregas el tag "cliente-nuevo" a un contacto.',
    trigger_type: 'tag_added',
    trigger_config: { tag_id: 'cliente-nuevo' },
    steps: [
      {
        step_type: 'send_message',
        step_config: {
          text: '¡Bienvenido! 🎉 Gracias por confiar en nosotros. Estamos aquí para ayudarte a sacar el máximo provecho de nuestro servicio.',
        },
      },
      {
        step_type: 'wait',
        step_config: { amount: 1, unit: 'days' },
      },
      {
        step_type: 'send_message',
        step_config: {
          text: '📚 Aquí tienes algunos recursos para empezar: [link a documentación]',
        },
      },
      {
        step_type: 'wait',
        step_config: { amount: 3, unit: 'days' },
      },
      {
        step_type: 'send_message',
        step_config: {
          text: '¿Tienes alguna duda? Estamos aquí para ayudarte.',
        },
      },
    ],
  },
}

export function getTemplate(slug: string): AutomationTemplateDefinition | null {
  return AUTOMATION_TEMPLATES[slug as TemplateSlug] ?? null
}
