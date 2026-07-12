import { supabaseAdmin } from "./admin-client";
import { advanceFromNodeKey, loadAllNodes } from "./engine";

interface FlowWithNodes {
  id: string;
  account_id: string;
  user_id: string;
  name: string;
  entry_node_id: string;
  flow_nodes: Array<{
    id: string;
    node_key: string;
    node_type: string;
    config: Record<string, unknown>;
  }>;
}

export async function startFlowManually(
  flow: FlowWithNodes,
  contactId: string,
  configOwnerUserId: string
): Promise<{ success: boolean; runId?: string; error?: string }> {
  const db = supabaseAdmin();

  // Check for existing active runs
  const { data: existingRuns } = await db
    .from("flow_runs")
    .select("id")
    .eq("contact_id", contactId)
    .in("status", ["active", "awaiting_reply"]);

  if (existingRuns && existingRuns.length > 0) {
    for (const r of existingRuns) {
      await db
        .from("flow_runs")
        .update({ status: "completed", end_reason: "cancelled_by_manual_start" })
        .eq("id", r.id);
    }
  }

  // Get or create conversation
  const { data: existingConv } = await db
    .from("conversations")
    .select("id")
    .eq("contact_id", contactId)
    .eq("user_id", configOwnerUserId)
    .maybeSingle();

  let conversationId = existingConv?.id;

  if (!conversationId) {
    const { data: newConv, error: convError } = await db
      .from("conversations")
      .insert({
        user_id: configOwnerUserId,
        contact_id: contactId,
        status: "open",
      })
      .select("id")
      .single();

    if (convError) {
      return { success: false, error: "Error al crear conversación: " + convError.message };
    }
    conversationId = newConv?.id;
  }

  // Load nodes using the engine's function
  const nodes = await loadAllNodes(db, flow.id);

  // Create run
  const { data: run, error: runError } = await db
    .from("flow_runs")
    .insert({
      flow_id: flow.id,
      account_id: flow.account_id,
      user_id: configOwnerUserId,
      contact_id: contactId,
      conversation_id: conversationId,
      status: "active",
      current_node_key: flow.entry_node_id,
    })
    .select()
    .single();

  if (runError) {
    console.error("[flows] Create run error:", runError);
    return { success: false, error: runError.message };
  }

  // Log start
  await db.from("flow_run_events").insert({
    run_id: run.id,
    event_type: "started",
    node_key: flow.entry_node_id,
    payload: { trigger_type: "manual" },
  });

  await db.rpc("increment_flow_execution_count", { p_flow_id: flow.id });

  // Execute using the engine's advanceFromNodeKey
  try {
    const runWithFullData = {
      ...run,
      vars: {},
      last_prompt_message_id: null,
      reprompt_count: 0,
      started_at: run.created_at,
      last_advanced_at: run.created_at,
      ended_at: null,
      end_reason: null,
    };

    const outcome = await advanceFromNodeKey(
      db,
      runWithFullData,
      flow.entry_node_id,
      nodes
    );

    // Update run status based on outcome
    if (outcome.outcome === "completed" || outcome.outcome === "handed_off") {
      await db
        .from("flow_runs")
        .update({ 
          status: outcome.outcome === "completed" ? "completed" : "handed_off",
          current_node_key: null 
        })
        .eq("id", run.id);
    } else if (outcome.outcome === "advanced") {
      // Flow is suspended waiting for response
      await db
        .from("flow_runs")
        .update({ status: "awaiting_reply" })
        .eq("id", run.id);
    }
  } catch (execError) {
    console.error("[flows] Execute error:", execError);
  }

  return { success: true, runId: run.id };
}
