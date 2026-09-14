from pathlib import Path


def replace(path_str: str, old: str, new: str, label: str):
    path = Path(path_str)
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 match, found {count}')
    path.write_text(text.replace(old, new, 1))


# dashboard: hooks must stay in components/custom hooks
replace(
    'src/app/(dashboard)/dashboard/page.tsx',
    '''function deltaLabel(delta: number, suffix: string): string {\n  const { t } = useTranslations()\n\n  if (delta === 0) return `${t('No change')} ${suffix}`\n  const sign = delta > 0 ? '+' : ''\n  return `${sign}${delta.toLocaleString()} ${suffix}`\n}''',
    '''function deltaLabel(delta: number, suffix: string): string {\n  if (delta === 0) return `0 ${suffix}`\n  const sign = delta > 0 ? '+' : ''\n  return `${sign}${delta.toLocaleString()} ${suffix}`\n}''',
    'dashboard deltaLabel',
)

# JSX quote escaping
replace(
    'src/app/(dashboard)/flows/page.tsx',
    '''Choose the language for "{selectedTemplate?.name}". Select "Both" to create English and Spanish versions.''',
    '''Choose the language for &quot;{selectedTemplate?.name}&quot;. Select &quot;Both&quot; to create English and Spanish versions.''',
    'flow dialog quotes',
)
replace(
    'src/components/contacts/contact-detail-view.tsx',
    '''No hay flows manuales activos. Crea un flow con trigger "Manual" en la sección Flows.''',
    '''No hay flows manuales activos. Crea un flow con trigger &quot;Manual&quot; en la sección Flows.''',
    'contact flow quotes',
)

# Translation provider: defer browser-derived state update so the effect is an external-system sync.
replace(
    'src/hooks/use-translations.tsx',
    '''  useEffect(() => {\n    const saved = localStorage.getItem("locale") as Locale;\n    if (saved && (saved === "es" || saved === "en")) {\n      setLocale(saved);\n    } else {\n      const browserLang = navigator.language.split("-")[0];\n      if (browserLang === "en") {\n        setLocale("en");\n      }\n    }\n  }, []);''',
    '''  useEffect(() => {\n    const saved = localStorage.getItem("locale") as Locale;\n    const browserLang = navigator.language.split("-")[0];\n    const nextLocale: Locale =\n      saved === "es" || saved === "en" ? saved : browserLang === "en" ? "en" : "es";\n\n    const timer = window.setTimeout(() => setLocale(nextLocale), 0);\n    return () => window.clearTimeout(timer);\n  }, []);''',
    'translation effect',
)

# Payment history: replace broad any with the actual selected row shape.
path = Path('src/app/api/payments/history/route.ts')
text = path.read_text()
anchor = 'import { createClient } from "@/lib/supabase/server";\n'
insert = '''import { createClient } from "@/lib/supabase/server";\n\ninterface PaymentPlanRow {\n  name: string;\n  plan_type: string;\n}\n\ninterface PaymentSubscriptionRow {\n  id: string;\n  plan_id: string;\n  plans: PaymentPlanRow | PaymentPlanRow[] | null;\n}\n\ninterface PaymentHistoryRow {\n  id: string;\n  amount: number;\n  currency: string;\n  status: string;\n  payment_method: string | null;\n  payment_reference: string | null;\n  proof_image_url: string | null;\n  notes: string | null;\n  requested_at: string | null;\n  processed_at: string | null;\n  created_at: string;\n  subscription_id: string | null;\n  subscriptions: PaymentSubscriptionRow | PaymentSubscriptionRow[] | null;\n}\n'''
if text.count(anchor) != 1:
    raise SystemExit('payment history import anchor')
text = text.replace(anchor, insert, 1)
text = text.replace('(payment: any) =>', '(payment: PaymentHistoryRow) =>', 1)
path.write_text(text)

# Usage route plan typing.
path = Path('src/app/api/usage/route.ts')
text = path.read_text()
anchor = 'import { createClient } from "@/lib/supabase/server";\n'
insert = '''import { createClient } from "@/lib/supabase/server";\n\ninterface UsagePlanRow {\n  id: string;\n  name: string;\n  plan_type: string;\n  max_contacts: number | null;\n  max_team_members: number | null;\n  max_whatsapp_numbers: number | null;\n}\n'''
if text.count(anchor) != 1:
    raise SystemExit('usage import anchor')
text = text.replace(anchor, insert, 1)
old = '  const plan = subscription.plans as any;\n'
new = '''  const rawPlan = subscription.plans as unknown as UsagePlanRow | UsagePlanRow[] | null;\n  const plan = Array.isArray(rawPlan) ? rawPlan[0] : rawPlan;\n  if (!plan) {\n    return NextResponse.json({ error: "Subscription plan not found" }, { status: 500 });\n  }\n'''
if text.count(old) != 1:
    raise SystemExit('usage plan cast')
text = text.replace(old, new, 1)
path.write_text(text)

# Subscription enforcement plan typing.
path = Path('src/lib/subscription/enforce.ts')
text = path.read_text()
anchor = 'export type FeatureType = "broadcasts" | "automations" | "flows" | "api";\n'
insert = '''export type FeatureType = "broadcasts" | "automations" | "flows" | "api";\n\ninterface SubscriptionPlan {\n  name: string;\n  plan_type: string;\n  max_contacts: number | null;\n  max_team_members: number | null;\n  max_whatsapp_numbers: number | null;\n  broadcasts_enabled: boolean;\n  automations_enabled: boolean;\n  flows_enabled: boolean;\n  api_access: boolean;\n}\n\nfunction normalizePlan(value: unknown): SubscriptionPlan | null {\n  if (Array.isArray(value)) return (value[0] as SubscriptionPlan | undefined) ?? null;\n  return (value as SubscriptionPlan | null) ?? null;\n}\n'''
if text.count(anchor) != 1:
    raise SystemExit('enforce type anchor')
text = text.replace(anchor, insert, 1)
old = '  const plan = subscription.plans as any;\n'
if text.count(old) != 3:
    raise SystemExit(f'enforce plan casts: expected 3, found {text.count(old)}')
text = text.replace(old, '  const plan = normalizePlan(subscription.plans);\n  if (!plan) return { allowed: false, error: "Subscription plan not found" };\n', 1)
text = text.replace(old, '  const plan = normalizePlan(subscription.plans);\n  if (!plan) return { allowed: false, error: "Subscription plan not found" };\n', 1)
text = text.replace(old, '''  const plan = normalizePlan(subscription.plans);\n  if (!plan) {\n    return {\n      allowed: false,\n      error: "Subscription plan not found",\n      usage: { contacts: 0, team_members: 0, whatsapp_numbers: 0 },\n      limits: { contacts: null, team_members: null, whatsapp_numbers: null },\n    };\n  }\n''', 1)
path.write_text(text)

# Pricing: concrete payment and feature value types.
path = Path('src/app/pricing/page.tsx')
text = path.read_text()
anchor = '''interface Plan {\n  id: string;\n  name: string;\n  plan_type: string;\n  price_rd: number;\n  trial_days: number;\n  max_contacts: number | null;\n  max_team_members: number | null;\n  max_whatsapp_numbers: number | null;\n  broadcasts_enabled: boolean;\n  automations_enabled: boolean;\n  flows_enabled: boolean;\n  api_access: boolean;\n}\n'''
insert = anchor + '''\ninterface PaymentInstructions {\n  instructions?: {\n    bank?: string;\n    account?: string;\n    recipient?: string;\n    reference?: string;\n  };\n  payment_request?: { id?: string };\n}\n\ntype PlanFeatureValue = Plan[keyof Plan];\n'''
if text.count(anchor) != 1:
    raise SystemExit('pricing plan interface')
text = text.replace(anchor, insert, 1)
text = text.replace('useState<any>(null)', 'useState<PaymentInstructions | null>(null)', 1)
text = text.replace('format: (v: any) => string', 'format: (v: PlanFeatureValue) => string', 1)
path.write_text(text)

# Flow node form: move hook-using branches into actual components.
path = Path('src/components/flows/forms/node-config-form.tsx')
text = path.read_text()
assign_start = text.index('    case "assign_agent": {')
create_start = text.index('    case "create_deal": {', assign_start)
end_start = text.index('    case "end":', create_start)
assign_case = '''    case "assign_agent":\n      return (\n        <AssignAgentForm\n          cfg={cfg as AssignAgentCfg}\n          allNodes={allNodes}\n          currentKey={node.node_key}\n          onUpdateConfig={onUpdateConfig}\n        />\n      );\n\n'''
create_case = '''    case "create_deal":\n      return (\n        <CreateDealForm\n          cfg={cfg as CreateDealCfg}\n          allNodes={allNodes}\n          currentKey={node.node_key}\n          onUpdateConfig={onUpdateConfig}\n        />\n      );\n\n'''
text = text[:assign_start] + assign_case + create_case + text[end_start:]
marker = '// ============================================================\n// send_buttons\n// ============================================================\n'
if text.count(marker) != 1:
    raise SystemExit('node form insertion marker')
components = r'''// ============================================================
// assign_agent / create_deal
// ============================================================

interface AssignAgentCfg {
  mode?: string;
  agent_id?: string;
  next_node_key?: string;
}

function AssignAgentForm({
  cfg,
  allNodes,
  currentKey,
  onUpdateConfig,
}: {
  cfg: AssignAgentCfg;
  allNodes: BuilderNode[];
  currentKey: string;
  onUpdateConfig: (patch: Record<string, unknown>) => void;
}) {
  const mode = cfg.mode ?? "round_robin";
  const agentId = cfg.agent_id ?? "";
  const [agents, setAgents] = useState<{ id: string; name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(mode === "specific");

  useEffect(() => {
    if (mode !== "specific") return;
    let active = true;
    setLoading(true);
    fetch("/api/account/members", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (active) setAgents(json.members ?? []);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [mode]);

  const selectedAgent = agents.find((agent) => agent.id === agentId);

  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium">Assignment mode</label>
        <Select
          value={mode}
          onValueChange={(value) =>
            onUpdateConfig({
              mode: value,
              agent_id: value === "round_robin" ? "" : agentId,
            })
          }
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="round_robin">Round-robin</SelectItem>
            <SelectItem value="specific">Specific agent</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {mode === "specific" && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Agent</label>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <select
              className="w-full rounded-md border border-border bg-muted px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
              value={agentId}
              onChange={(event) => onUpdateConfig({ agent_id: event.target.value })}
            >
              <option value="">Select an agent…</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>{agent.name || agent.email}</option>
              ))}
              {agentId && !selectedAgent && (
                <option value={agentId}>{agentId} (unknown)</option>
              )}
            </select>
          )}
        </div>
      )}
      <NextNodeRow
        value={cfg.next_node_key ?? ""}
        allNodes={allNodes}
        currentKey={currentKey}
        onChange={(value) => onUpdateConfig({ next_node_key: value })}
        label="Advances to"
      />
    </>
  );
}

interface CreateDealCfg {
  title?: string;
  value?: number;
  pipeline_id?: string;
  stage_id?: string;
  next_node_key?: string;
}

function CreateDealForm({
  cfg,
  allNodes,
  currentKey,
  onUpdateConfig,
}: {
  cfg: CreateDealCfg;
  allNodes: BuilderNode[];
  currentKey: string;
  onUpdateConfig: (patch: Record<string, unknown>) => void;
}) {
  const title = cfg.title ?? "Nuevo Lead";
  const value = cfg.value ?? 0;
  const pipelineId = cfg.pipeline_id ?? "";
  const stageId = cfg.stage_id ?? "";
  const [pipelines, setPipelines] = useState<{ id: string; name: string }[]>([]);
  const [stages, setStages] = useState<{ id: string; name: string; pipeline_id: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    Promise.all([
      supabase.from("pipelines").select("id, name").order("name"),
      supabase.from("pipeline_stages").select("id, name, pipeline_id").order("position"),
    ]).then(([pipelinesRes, stagesRes]) => {
      if (!active) return;
      setPipelines((pipelinesRes.data as { id: string; name: string }[] | null) ?? []);
      setStages((stagesRes.data as { id: string; name: string; pipeline_id: string }[] | null) ?? []);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <div className="text-sm text-muted-foreground">Loading...</div>;

  const stageOptions = stages.filter((stage) => stage.pipeline_id === pipelineId);
  const selectedPipeline = pipelines.find((pipeline) => pipeline.id === pipelineId);
  const selectedStage = stageOptions.find((stage) => stage.id === stageId);
  const selectClass = "w-full rounded-md border border-border bg-muted px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none disabled:opacity-50";

  const handlePipelineChange = (nextPipelineId: string) => {
    const firstStage = stages.find((stage) => stage.pipeline_id === nextPipelineId);
    onUpdateConfig({ pipeline_id: nextPipelineId, stage_id: firstStage?.id ?? "" });
  };

  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium">Deal title</label>
        <Input value={title} onChange={(event) => onUpdateConfig({ title: event.target.value })} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Value</label>
        <Input type="number" value={value} onChange={(event) => onUpdateConfig({ value: Number(event.target.value) })} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Pipeline</label>
        <select className={selectClass} value={pipelineId} onChange={(event) => handlePipelineChange(event.target.value)}>
          <option value="">Select a pipeline…</option>
          {pipelines.map((pipeline) => <option key={pipeline.id} value={pipeline.id}>{pipeline.name}</option>)}
          {pipelineId && !selectedPipeline && <option value={pipelineId}>{pipelineId} (unknown)</option>}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Stage</label>
        <select
          className={selectClass}
          value={stageId}
          onChange={(event) => onUpdateConfig({ stage_id: event.target.value })}
          disabled={!pipelineId || stageOptions.length === 0}
        >
          <option value="">{pipelineId ? "Select a stage…" : "Select a pipeline first…"}</option>
          {stageOptions.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
          {stageId && pipelineId && !selectedStage && <option value={stageId}>{stageId} (unknown)</option>}
        </select>
      </div>
      <NextNodeRow
        value={cfg.next_node_key ?? ""}
        allNodes={allNodes}
        currentKey={currentKey}
        onChange={(next) => onUpdateConfig({ next_node_key: next })}
        label="Advances to"
      />
    </>
  );
}

'''
text = text.replace(marker, components + marker, 1)
path.write_text(text)
