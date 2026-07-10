# Zynex CRM — Growth Flows & Automations Spec

## Context

**Product:** Zynex CRM (WhatsApp-first CRM for Dominican SMBs)  
**Stack:** Flow engine (`src/lib/flows/`) + Automation engine (`src/lib/automations/`)  
**Integrations:** DigitBill (e-CF invoicing), WhatsApp Meta API

---

## Architecture Decision Framework

| Pattern | Use when | Built as |
|---|---|---|
| Conversational branching with customer input | Multi-step dialogue, menu routing, lead qualification sequences | **Flow** |
| Time-delayed actions | Re-engagement after X days, follow-up nudges, SLA checks | **Automation** with `wait` step |
| Event → instant reaction | Tag on first reply, route on keyword, create deal on handoff | **Automation** with instant trigger |
| Condition-based routing | Branch on tag presence, contact field, message content | **Flow** `condition` node OR **Automation** `condition` step |
| Complex SLA monitoring | Agent response timeouts, escalation chains | **Automation** (`time_based` cron) + internal notification |

---

## Shared Primitives

### Variables & Interpolation

Flow engine uses `{{vars.var_key}}` syntax in node configs (`text`, `prompt_text`, `note`).  
Automation engine uses `{{ vars.field }}` and `{{ message.text }}` in step configs.

All captured flow vars are available in the handoff `note` field via interpolation:
```
New lead — company={{vars.company}}, email={{vars.email}}, contact={{vars.name}}
```

### Available Flow Node Types

| Node type | Pauses for customer? | Auto-advance? |
|---|---|---|
| `send_message` | No | Yes → `next_node_key` |
| `send_buttons` | Yes (1-3 buttons) | Suspends until button tap |
| `send_list` | Yes (1-10 rows) | Suspends until list row tap |
| `send_media` | No | Yes |
| `collect_input` | Yes (free text) | Suspends; captures into `vars[var_key]` |
| `condition` | No | Yes → `true_next` or `false_next` |
| `set_tag` | No | Yes |
| `http_fetch` | No | Yes — makes outbound HTTP request; errors are non-fatal |
| `handoff` | No | Terminates run; writes note; flips conversation to `pending` |
| `end` | No | Terminates run |

### Available Automation Triggers

- `new_contact_created` — contact record inserted
- `first_inbound_message` — first WhatsApp message from a contact
- `new_message_received` — every inbound message
- `keyword_match` — keyword in message text
- `conversation_assigned` — conversation assigned to agent
- `tag_added` — tag attached to contact
- `time_based` — cron schedule (handled by external cron hitting the pending executions queue)

### Available Automation Step Types

`send_message`, `send_template`, `add_tag`, `remove_tag`, `assign_conversation`, `update_contact_field`, `create_deal`, `wait`, `condition`, `send_webhook`, `close_conversation`

---

## Flow 1 — Lead Nurturing Sequence

**Classification: FLOW**  
**Why:** Conversational multi-step sequence with branching customer input.

### Purpose
Greet every new contact and instantly route them down one of three tracks: **Demo** (high intent), **Trial** (medium intent), or **Soporte** (post-sale support). Captures company + RNC data for DigitBill cross-selling. Ends with a handoff that includes all captured variables in the note.

### Trigger
`first_inbound_message` — fires on the very first WhatsApp message from any contact.

### Flow Diagram

```
[start]
   │
   ▼
[welcome_message]  ── "¡Hola! 👋 Bienvenido a Zynex CRM. ¿En qué podemos ayudarte hoy?"
   │ (auto-advance)
   ▼
[main_menu]  ── send_buttons
   │
   ├── "📊 Solicitar demo" ────────────────→ [demo_path]
   ├── "🚀 Probar gratis 30 días" ─────────→ [trial_path]
   └── "🆘 Soporte técnico" ────────────────→ [soporte_path]
```

### Node-by-Node Breakdown

#### Node: `start`
```json
{ "node_type": "start", "config": { "next_node_key": "welcome_message" } }
```

#### Node: `welcome_message`
```json
{
  "node_type": "send_message",
  "config": {
    "text": "¡Hola! 👋 Bienvenido a Zynex CRM. ¿En qué podemos ayudarte hoy?",
    "next_node_key": "main_menu"
  }
}
```

#### Node: `main_menu`
```json
{
  "node_type": "send_buttons",
  "config": {
    "header_text": "Zynex CRM",
    "text": "Selecciona una opción:",
    "footer_text": "Respuesta en minutos ✓",
    "buttons": [
      { "reply_id": "demo", "title": "📊 Solicitar demo", "next_node_key": "demo_intro" },
      { "reply_id": "trial", "title": "🚀 Probar gratis 30 días", "next_node_key": "trial_intro" },
      { "reply_id": "soporte", "title": "🆘 Soporte técnico", "next_node_key": "soporte_path" }
    ]
  }
}
```

---

### Path A — Demo (`demo_intro` → `demo_company` → `demo_rnc` → `demo_handoff`)

#### Node: `demo_intro`
```json
{
  "node_type": "send_message",
  "config": {
    "text": "¡Perfecto! 📊 La demo de Zynex CRM muestra cómo DigitBill + WhatsApp reducen tu workload de facturación electrónica en un 80%. Te va a encantar.",
    "next_node_key": "demo_company"
  }
}
```

#### Node: `demo_company`
```json
{
  "node_type": "collect_input",
  "config": {
    "prompt_text": "¿Cuál es el nombre de tu empresa o negocio?",
    "var_key": "company",
    "next_node_key": "demo_rnc"
  }
}
```

#### Node: `demo_rnc`
```json
{
  "node_type": "collect_input",
  "config": {
    "prompt_text": "Gracias, {{vars.company}}. ¿Tienes RNC o Cédula? (Lo necesitamos para configurar DigitBill en tu cuenta.)",
    "var_key": "rnc",
    "next_node_key": "demo_email"
  }
}
```

#### Node: `demo_email`
```json
{
  "node_type": "collect_input",
  "config": {
    "prompt_text": "Último paso — ¿cuál es tu correo electrónico?",
    "var_key": "email",
    "next_node_key": "demo_confirm"
  }
}
```

#### Node: `demo_confirm`
```json
{
  "node_type": "send_message",
  "config": {
    "text": "✅ ¡Listo, {{vars.name}}! Te contactamos en menos de 2 horas. Recibirás un correo de onboarding en {{vars.email}}.",
    "next_node_key": "demo_handoff"
  }
}
```

#### Node: `demo_handoff`
```json
{
  "node_type": "handoff",
  "config": {
    "note": "🚨 LEAD DEMO — empresa={{vars.company}}, RNC={{vars.rnc}}, email={{vars.email}}. Interesado en ver cómo DigitBill automatiza la e-CF. Prioridad ALTA.",
    "assign_to": ""
  }
}
```

---

### Path B — Trial (`trial_intro` → `trial_company` → `trial_agree` → `trial_handoff`)

#### Node: `trial_intro`
```json
{
  "node_type": "send_message",
  "config": {
    "text": "¡Genial! 🚀 Te damos 30 días con todas las funciones activas — WhatsApp flows, DigitBill, CRM completo. Sin compromiso.",
    "next_node_key": "trial_company"
  }
}
```

#### Node: `trial_company`
```json
{
  "node_type": "collect_input",
  "config": {
    "prompt_text": "¿Cuál es el nombre de tu empresa?",
    "var_key": "company",
    "next_node_key": "trial_agree"
  }
}
```

#### Node: `trial_agree`
```json
{
  "node_type": "send_buttons",
  "config": {
    "text": "Perfecto. Para activar tu trial necesitamos tu consentimiento para crearte la cuenta. ¿Aceptas?",
    "footer_text": "Puedes cancelar cuando quieras.",
    "buttons": [
      { "reply_id": "accept", "title": "✅ Acepto y continuo", "next_node_key": "trial_confirm" },
      { "reply_id": "later", "title": "⏳ Después", "next_node_key": "trial_decline" }
    ]
  }
}
```

#### Node: `trial_confirm`
```json
{
  "node_type": "send_message",
  "config": {
    "text": "🎉 ¡Trial activado! Te enviamos los datos de acceso a tu WhatsApp en minutos. Bienvenido a Zynex CRM, {{vars.company}}.",
    "next_node_key": "trial_handoff"
  }
}
```

#### Node: `trial_handoff`
```json
{
  "node_type": "handoff",
  "config": {
    "note": "✅ TRIAL ACTIVADO — empresa={{vars.company}}, contacto={{vars.name}}. Trial 30 días activado. Añadir tag 'trial_activo' y crear deal en pipeline Ventas.",
    "assign_to": ""
  }
}
```

#### Node: `trial_decline`
```json
{
  "node_type": "send_message",
  "config": {
    "text": "Sin problema. Cuando quieras activar tu trial, simplemente escribe 'trial' y te ayudamos. 😊",
    "next_node_key": "end"
  }
}
```

#### Node: `end`
```json
{ "node_type": "end", "config": {} }
```

---

### Path C — Soporte (`soporte_path` → `soporte_issue` → `soporte_confirm`)

#### Node: `soporte_path`
```json
{
  "node_type": "send_message",
  "config": {
    "text": "🆘 Entendido. Nuestro equipo de soporte está activo de Lun–Vier, 9am–6pm (hora RD). Fuera de ese horario respondemos al siguiente día hábil.",
    "next_node_key": "soporte_issue"
  }
}
```

#### Node: `soporte_issue`
```json
{
  "node_type": "collect_input",
  "config": {
    "prompt_text": "Cuéntanos brevemente tu problema o consulta:",
    "var_key": "issue",
    "next_node_key": "soporte_confirm"
  }
}
```

#### Node: `soporte_confirm`
```json
{
  "node_type": "send_message",
  "config": {
    "text": "Recibido 📝. Un agente te responde en menos de 2 horas. Te notificamos por WhatsApp cuando haya respuesta.",
    "next_node_key": "soporte_handoff"
  }
}
```

#### Node: `soporte_handoff`
```json
{
  "node_type": "handoff",
  "config": {
    "note": "🆘 SOPORTE — contacto={{vars.name}}, problema={{vars.issue}}. Consulta de soporte — clasificar por categoría (DigitBill / WhatsApp / CRM).",
    "assign_to": ""
  }
}
```

---

## Flow 2 — Re-engagement Flow

**Classification: AUTOMATION** (time-delayed, no customer conversational input in the wait period)

### Purpose
Win back contacts who went silent after initial interest. Sent automatically at day 7 and day 14 if no reply. Nudges with increasing urgency, then marks as `inactivo` tag and routes to a low-priority nurture sequence.

### Trigger
`time_based` — cron fires daily at 9:00 AM RD time. The automation's first step is a `wait` that delays until the target day, then checks if the contact replied.

### Tag Prerequisite
Contacts entering this flow are tagged `lead_nurture`. Contacts tagged `cliente_activo` or `trial_activo` are excluded by condition.

### Automation Steps

```
Trigger: time_based (daily 9am)
   │
   ├── [STEP 1] condition: contact has tag "lead_nurture"
   │       │
   │       ├── YES → [STEP 2] condition: last_message_at < 7 days ago?
   │       │       │
   │       │       ├── YES → [STEP 3] send_message "nudge_day_7"
   │       │       │           → [STEP 4] wait 7 days
   │       │       │           → [STEP 5] condition: replied since step 3?
   │       │       │               ├── YES → [STEP 6] remove_tag "lead_nurture"
   │       │       │               │       → END
   │       │       │               └── NO  → [STEP 7] send_message "nudge_day_14"
   │       │       │                       → [STEP 8] wait 7 days
   │       │       │                       → [STEP 9] condition: replied since step 7?
   │       │       │                           ├── YES → [STEP 10] remove_tag "lead_nurture"
   │       │       │                           │       → END
   │       │       │                           └── NO  → [STEP 11] add_tag "inactivo"
   │       │       │                                   → [STEP 12] send_webhook → DigitBill "lead_inactivo" event
   │       │       │                                   → END
   │       │       └── NO (contact already replied) → END
   │       │
   │       └── NO → END
```

### Step-by-Step Config

**Step 1 — Condition: has lead_nurture tag**
```json
{
  "step_type": "condition",
  "step_config": {
    "subject": "tag_presence",
    "operand": "<uuid_of_lead_nurture_tag>"
  }
}
```

**Step 2 — Condition: silent for 7+ days**
```json
{
  "step_type": "condition",
  "step_config": {
    "subject": "contact_field",
    "operand": "last_message_at",
    "value": "<cutoff: 7 days ago ISO string — this requires custom evaluation; alternatively use a custom field 'last_contact_at' updated by a message-received automation>"
  }
}
```

> **Implementation note:** `last_message_at` is on the `conversations` table, not `contacts`. The condition engine reads `contacts` fields. Solution: use a `new_message_received` automation that runs on every inbound and uses `update_contact_field` to stamp `last_reply_at` on the contact record. Then the re-engagement condition can read it directly.

**Step 3 — Nudge Day 7 message**
```json
{
  "step_type": "send_message",
  "step_config": {
    "text": "¡Hola {{vars.name}}! 👋 Solo pasaba para ver si tenías alguna pregunta sobre Zynex CRM. ¿Te gustaría agendar una llamada rápida de 15 min para resolver cualquier duda?"
  }
}
```

**Step 4 — Wait 7 days**
```json
{
  "step_type": "wait",
  "step_config": { "amount": 7, "unit": "days" }
}
```

**Step 5 — Condition: did they reply?**
```json
{
  "step_type": "condition",
  "step_config": {
    "subject": "contact_field",
    "operand": "last_reply_at",
    "value": "<cutoff: date of step 3>"
  }
}
```

**Step 6 — Remove lead_nurture (they re-engaged)**
```json
{
  "step_type": "remove_tag",
  "step_config": { "tag_id": "<uuid_of_lead_nurture_tag>" }
}
```

**Step 7 — Nudge Day 14 message**
```json
{
  "step_type": "send_message",
  "step_config": {
    "text": "{{vars.name}}, queremos asegurarnos de que Zynex CRM sea útil para ti. ¿Hay algo que podamos mejorar? Si no es el momento adecuado, no hay presión — simplemente responde 'pausa' y no te molestamos más. 😊"
  }
}
```

**Step 8 — Wait 7 days**
```json
{
  "step_type": "wait",
  "step_config": { "amount": 7, "unit": "days" }
}
```

**Step 11 — Mark inactive**
```json
{
  "step_type": "add_tag",
  "step_config": { "tag_id": "<uuid_of_inactivo_tag>" }
}
```

**Step 12 — Notify DigitBill**
```json
{
  "step_type": "send_webhook",
  "step_config": {
    "url": "https://api.digitbill.do/v1/events/lead_inactivo",
    "body_template": "{\"contact_id\": \"{{vars.contact_id}}\", \"phone\": \"{{vars.phone}}\", \"tag\": \"inactivo\", \"source\": \"zynex_crm\"}"
  }
}
```

---

## Flow 3 — Lead Scoring & Intelligent Routing

**Classification: FLOW** (conversational qualification) + **AUTOMATION** (post-flow scoring and routing)

### Purpose
After a lead completes the Lead Nurturing flow (or any flow ending in handoff), score them by engagement signals and route to the right agent tier. High-score leads go to senior sales; medium to junior sales; low to nurture sequence.

### Routing Matrix

| Score | Signal | Route to |
|---|---|---|
| 80–100 | Demo path + provided RNC + company | Senior Sales (tag `lead_caliente`) |
| 50–79 | Trial path OR Demo without RNC | Junior Sales (tag `lead_tibio`) |
| 0–49 | Soporte path | Support queue (tag `soporte_q`) |

### Flow Segment (Score Capture)

Added as a final segment of the Lead Nurturing flow before handoff. After the user selects their path and provides data, a scoring node evaluates and tags before handoff.

**Implementation:** Add a `condition` node chain at the end of each path that sets a `lead_score` var and adds the appropriate tag, then hands off.

#### At end of Demo path (after `demo_confirm`, before `demo_handoff`):

**Condition: has_rnc**
```json
{
  "node_type": "condition",
  "config": {
    "subject": "var",
    "subject_key": "rnc",
    "operator": "present",
    "true_next": "score_alta",
    "false_next": "score_media"
  }
}
```

**Node: `score_alta`**
```json
{
  "node_type": "set_tag",
  "config": {
    "mode": "add",
    "tag_id": "<uuid_of_lead_caliente_tag>",
    "next_node_key": "demo_handoff_scored"
  }
}
```

**Node: `score_media`**
```json
{
  "node_type": "set_tag",
  "config": {
    "mode": "add",
    "tag_id": "<uuid_of_lead_tibio_tag>",
    "next_node_key": "demo_handoff_scored"
  }
}
```

**Node: `demo_handoff_scored`** (replaces `demo_handoff`)
```json
{
  "node_type": "handoff",
  "config": {
    "note": "🚨 LEAD CALIENTE [demo] — empresa={{vars.company}}, RNC={{vars.rnc}}, email={{vars.email}}, telefono={{vars.phone}}. Score ALTA. Assignar a Senior Sales.",
    "assign_to": "<uuid_of_senior_sales_agent>"
  }
}
```

### Automation — Auto-assign by Score Tag

**Trigger:** `tag_added`  
**Filter:** Only fires when `lead_caliente` or `lead_tibio` tag is added.

```json
{
  "trigger_type": "tag_added",
  "trigger_config": { "tag_id": "<uuid_of_lead_caliente_tag>" }
}
```

**Steps:**

1. `assign_conversation` — mode: `specific`, agent_id from the handoff note (or use round_robin for Tibio)
2. `create_deal` — pipeline: `Ventas`, stage: `Lead Nuevo`, title: `Lead {{vars.company}} — Demo`
3. `send_webhook` → DigitBill `POST /api/v1/contacts` to sync lead (RNC, company)

**Low-score routing (Soporte path):**
```json
{
  "trigger_type": "tag_added",
  "trigger_config": { "tag_id": "<uuid_of_soporte_q_tag>" }
}
```

Steps:
1. `assign_conversation` — mode: `round_robin` (any support agent)
2. `send_message` to agent notification channel (internal webhook or notification)

---

## Flow 4 — Welcome Onboarding Flow

**Classification: FLOW** (conversational onboarding with milestone confirmations)

### Purpose
Guide new customers through onboarding after they activate their trial or become a paying customer. Ensures they connect their WhatsApp, configure DigitBill, and invite their team. Uses a checklist-style list message with progress.

### Trigger
`tag_added` — fires when a contact receives the `cliente_activo` or `trial_activo` tag.

### Automation that Triggers the Flow
```json
{
  "trigger_type": "tag_added",
  "trigger_config": { "tag_id": "<uuid_of_trial_activo_tag>" }
}
```
Steps:
1. `add_tag` → `onboarding_en_progreso`
2. `send_webhook` → start the onboarding flow (POST to flow engine with contact_id)
3. The flow itself is triggered by a `new_contact_created` + keyword "onboarding" OR by the webhook calling an internal API that starts the flow.

> **Alternative simpler approach:** On `tag_added` of `trial_activo`, send a single `send_message` that contains the onboarding link + first step instructions. The flow is started by a `manual` trigger keyword "empezar onboarding" that the customer types after setup.

### Flow Nodes

#### `start`
```json
{ "node_type": "start", "config": { "next_node_key": "checklist" } }
```

#### `checklist` — List message showing all 4 onboarding steps
```json
{
  "node_type": "send_list",
  "config": {
    "header_text": "🎯 Tu checklist de onboarding",
    "text": "Tienes 4 pasos para dejar todo listo. ¿Por cuál empezamos?",
    "button_label": "Ver pasos",
    "sections": [
      {
        "title": "📱 WhatsApp",
        "rows": [
          { "reply_id": "wa_connect", "title": "Conectar número WhatsApp", "description": "Vincula tu línea existente en 2 min", "next_node_key": "step_wa" }
        ]
      },
      {
        "title": "🧾 DigitBill",
        "rows": [
          { "reply_id": "digitbill_setup", "title": "Configurar e-CF (DigitBill)", "description": "Automatiza facturas electrónicas DGII", "next_node_key": "step_digitbill" }
        ]
      },
      {
        "title": "👥 Equipo",
        "rows": [
          { "reply_id": "team_invite", "title": "Invitar a tu equipo", "description": "Agrega hasta 5 agentes", "next_node_key": "step_team" }
        ]
      },
      {
        "title": "📊 Pipeline",
        "rows": [
          { "reply_id": "pipeline_setup", "title": "Crear tu primer pipeline", "description": "Organiza tus deals y clientes", "next_node_key": "step_pipeline" }
        ]
      }
    ]
  }
}
```

#### `step_wa`
```json
{
  "node_type": "send_message",
  "config": {
    "text": "📱 Conectar WhatsApp:\n\n1. Ve a Ajustes → Canales\n2. Selecciona WhatsApp → Agregar número\n3. Escanea el QR con tu teléfono Business\n\n¿Qué número vas a conectar? ¿809-555-1234?\n\nCuando termines, escribe 'listo' para marcar este paso ✅",
    "next_node_key": "wait_wa_done"
  }
}
```

#### `wait_wa_done` — collects "listo" confirmation
```json
{
  "node_type": "collect_input",
  "config": {
    "prompt_text": "Escribe 'listo' cuando hayas conectado tu WhatsApp:",
    "var_key": "wa_confirmed",
    "next_node_key": "step_digitbill"
  }
}
```

#### `step_digitbill`
```json
{
  "node_type": "send_message",
  "config": {
    "text": "🧾 Configurar DigitBill:\n\n1. Ve a Ajustes → Integraciones → DigitBill\n2. Ingresa tu RNC: {{vars.rnc}}\n3. Autoriza la conexión con DGII\n\n⚠️ Si aún no tienes cuenta DigitBill, crea una en digitbill.do — el primer mes es gratis para clientes Zynex.\n\nCuando esté listo, escribe 'digitbill_ok'",
    "next_node_key": "wait_digitbill_done"
  }
}
```

#### `wait_digitbill_done`
```json
{
  "node_type": "collect_input",
  "config": {
    "prompt_text": "Escribe 'digitbill_ok' cuando esté configurado:",
    "var_key": "digitbill_confirmed",
    "next_node_key": "step_team"
  }
}
```

#### `step_team`
```json
{
  "node_type": "send_message",
  "config": {
    "text": "👥 Invitar al equipo:\n\n1. Ve a Ajustes → Equipo\n2. Agrega los emails de tus colaboradores\n3. Asigna roles: Agente, Admin, o Viewer\n\nDelegar tareas de soporte y ventas reduce tu carga drásticamente. ¿A quién vas a invitar primero?",
    "next_node_key": "onboarding_complete"
  }
}
```

#### `onboarding_complete` — Final message
```json
{
  "node_type": "send_message",
  "config": {
    "text": "🎉 ¡Onboarding completado!\n\nTu cuenta Zynex CRM está lista. Resumen:\n✅ WhatsApp conectado\n✅ DigitBill configurado\n✅ Equipo invitado\n\nTu próximo paso: crear tu primer flow de ventas. Escribe 'flows' para ver cómo empezar.\n\n¿Necesitas ayuda? Escribe 'soporte' y te conectamos.",
    "next_node_key": "end"
  }
}
```

#### `end`
```json
{ "node_type": "end", "config": {} }
```

---

## Flow 5 — Support SLA Escalation

**Classification: AUTOMATION** (time-based monitoring, no customer-facing flow in the wait path)

### Purpose
If a support conversation has been in `pending` status for more than **2 hours** without an agent reply, automatically escalate by: (1) notifying a supervisor, (2) re-assigning to a senior agent, (3) sending an internal notification.

### Implementation: Two-Part System

**Part A — First Response Reminder (2h mark)**

Automation on `conversation_assigned`:
```json
{
  "trigger_type": "conversation_assigned",
  "trigger_config": {}
}
```

Steps:
1. `wait` → 2 hours
2. `condition` — is conversation still `pending`? (check `conversations.status` via a webhook step or contact_field)
   - If YES → `send_webhook` → internal Slack/email notification with contact name + issue summary
   - If NO → END

**Part B — Escalation (4h mark, if still pending)**

```json
{
  "trigger_type": "time_based",
  "trigger_config": { "schedule": "0 9,12,15,18 * * 1-5" }
}
```

Steps:
1. `condition` — conversation status = `pending` AND assigned_agent_id is set AND last_message_at > 4 hours ago
   - This requires a `send_webhook` step to check the conversation status via the REST API and return a result. Alternatively, a `condition` step reading from a custom field `escalation_4h_pending` that is set by the Part A automation.

**Simpler alternative using tags:**

- When a `soporte_q` conversation is assigned, an automation tags it `sla_2h_pending`.
- A `time_based` automation runs every 30 minutes and checks all contacts with tag `soporte_q` + `sla_2h_pending`.
- If `conversations.last_message_at` (via webhook check) shows > 2 hours without agent reply:
  - Remove `sla_2h_pending`
  - Add `sla_escalated`
  - Assign to senior support agent
  - `send_webhook` → supervisor notification

### Recommended Implementation (Webhook-based SLA Monitor)

**New database field (migration 035_sla_monitors.sql):**
```sql
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS sla_response_deadline timestamptz;
```

**Automation on `conversation_assigned`:**
```
Trigger: conversation_assigned
Steps:
  1. update_contact_field → sla_response_deadline = now() + 2 hours
  2. wait 2 hours
  3. condition: conversation status = 'pending'?
       YES → [ESCALATION PATH]
         a. add_tag "sla_escalated"
         b. assign_conversation → mode: round_robin (senior support pool)
         c. send_webhook → POST /api/notifications { type: "sla_breach", contact_id, conversation_id }
         d. send_message to customer: "Lamentamos la demora. Tu caso ha sido escalado a nuestro equipo senior y te contactamos en la próxima hora. 🙏"
       NO  → END
```

**Condition evaluation for step 3:** The condition step in automations v1 cannot query `conversations.status` directly (it reads from `contacts`). Workaround: use `send_webhook` as step 3 that calls `GET /api/v1/conversations?contact_id={{contact_id}}` and updates a custom field `conversation_status` on the contact. Then step 4 is a condition reading that field.

> **SLA Webhook Step Note:** Add `conversation_status` as a readable `contact_field` in the automations condition evaluator — i.e., extend the `condition` step's `contact_field` subject to also accept `conversation_status` by doing a joined lookup on the conversation table.

---

## Tag Taxonomy (Required for Flows Above)

| Tag UUID placeholder | Tag name | Used in |
|---|---|---|
| `{LEAD_NURTURE_TAG}` | `lead_nurture` | Flow 2, Flow 3 |
| `{LEAD_CALIENTE_TAG}` | `lead_caliente` | Flow 3 |
| `{LEAD_TIBIO_TAG}` | `lead_tibio` | Flow 3 |
| `{SOPORTE_Q_TAG}` | `soporte_q` | Flow 1, Flow 5 |
| `{INACTIVO_TAG}` | `inactivo` | Flow 2 |
| `{TRIAL_ACTIVO_TAG}` | `trial_activo` | Flow 1, Flow 4 |
| `{CLIENTE_ACTIVO_TAG}` | `cliente_activo` | Flow 4 |
| `{ONBOARDING_EN_PROGRESO_TAG}` | `onboarding_en_progreso` | Flow 4 |
| `{SLA_ESCALATED_TAG}` | `sla_escalated` | Flow 5 |
| `{SLA_2H_PENDING_TAG}` | `sla_2h_pending` | Flow 5 |
| `{PENDING_DIGITBILL_TAG}` | `pending_digitbill_account` | Flow 1 (demo path) → triggers automation |

---

## Required DB Migrations

### Migration 035_sla_monitors.sql
```sql
-- Adds SLA tracking fields to contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS sla_response_deadline timestamptz;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_agent_reply_at timestamptz;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS lead_score integer DEFAULT 0;

-- Index for SLA cron sweep
CREATE INDEX IF NOT EXISTS idx_contacts_sla_deadline
  ON contacts(account_id, sla_response_deadline)
  WHERE sla_response_deadline IS NOT NULL;
```

### Migration 036_lead_score_custom_field.sql
```sql
-- Create custom field definition for lead_score
INSERT INTO custom_fields (id, user_id, account_id, field_name, field_type)
VALUES ('<uuid>', '<system_user_id>', '<default_account_id>', 'lead_score', 'number')
ON CONFLICT DO NOTHING;
```

---

## DigitBill Integration Points

The re-engagement and lead scoring flows should sync data to DigitBill:

1. **Lead captured (demo path)** → `POST /api/v1/contacts` with `{ phone, company, rnc, email, source: "zynex_crm" }` — DigitBill mirrors the contact into its CRM.

2. **Lead marked inactive** → `POST /api/v1/webhooks` event `lead_inactivo` with `{ contact_id, phone, tag: "inactivo" }`.

3. **Trial activated** → `POST /api/v1/contacts` with `{ phone, company, plan: "trial_30d" }`.

4. **Customer converted** → `POST /api/v1/contacts` with `{ phone, plan: "pro" }` + create DigitBill sub-account.

All calls use per-tenant credentials stored in `digitbill_connections` (migration 030) and are signed with the account's HMAC key.

---

## Summary: Flow vs Automation Assignment

| # | Flow / Automation Name | Type | Trigger | Key Nodes / Steps |
|---|---|---|---|---|
| 1 | Lead Nurturing Sequence | **Flow** | `first_inbound_message` | `send_buttons` (3-way branch), `collect_input` (4 fields), `handoff` with interpolated note |
| 2 | Re-engagement Win-Back | **Automation** | `time_based` daily + `wait` 7d/14d + `condition` tag | `send_message` nudge, `add_tag` inactivo, `send_webhook` DigitBill |
| 3 | Lead Scoring & Routing | **Flow** (scoring) + **Automation** (post-tag) | `tag_added` lead_caliente/tibio | `set_tag`, `condition`, `assign_conversation`, `create_deal`, `send_webhook` DigitBill |
| 4 | Welcome Onboarding | **Flow** | `tag_added` trial_activo/cliente_activo | `send_list` (4-section checklist), `collect_input` confirmations, `send_message` instructions |
| 5 | Support SLA Escalation | **Automation** | `conversation_assigned` + `time_based` cron | `wait` 2h, `condition` status check, `assign_conversation` senior, `send_webhook` supervisor notification, `send_message` customer apology |

---

## Implementation Notes

1. **Variable naming conventions:** Flow vars use `snake_case` keys (`company`, `rnc`, `email`, `issue`, `name`). Automation vars use the same keys where data is passed through handoff notes.

2. **Contact field updates from flows:** Flows cannot directly update contact fields (name, email, company). Use the `update_contact_field` automation step triggered by the handoff event (or extend the handoff node to also fire a silent automation).

3. **Time-based conditions in v1 automations:** The `time_of_day` condition subject checks if the current time is within a window. For absolute date comparisons (contact silent since X days), use a `send_webhook` step that calls the REST API and writes a result into a contact custom field, which a subsequent `condition` step then evaluates.

4. **SLA escalation requires DB migration 035:** The `sla_response_deadline` and `last_agent_reply_at` fields are needed for reliable time-based SLA monitoring without webhook round-trips.

5. **Flow cloning:** All flows use stable `node_key` strings. Tag IDs in `set_tag` nodes must be replaced with the actual tag UUIDs after cloning from template, using the builder's tag picker UI.

6. **Error handling:** Flow nodes catch send failures and log them; the run is marked `failed` but the contact is not stranded. Automations catch per-step errors and continue to next step; the log records partial success.

7. **Fallback policy for all flows:** `on_unknown_reply: "reprompt"`, `max_reprompts: 2`, `on_timeout_hours: 24`, `on_exhaust: "handoff"`. This ensures that if a customer goes silent mid-flow and returns days later, they are re-prompted twice before the conversation flips to agent handoff.
