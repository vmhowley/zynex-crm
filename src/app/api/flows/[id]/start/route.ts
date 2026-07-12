import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { startFlowManually } from "@/lib/flows/manual-start";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: flowId } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_id, account_role")
    .eq("user_id", user.id)
    .single();

  if (!profile || !["owner", "admin"].includes(profile.account_role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { contact_id } = body;

  if (!contact_id) {
    return NextResponse.json(
      { error: "contact_id es requerido" },
      { status: 400 }
    );
  }

  const { data: flow, error: flowError } = await supabase
    .from("flows")
    .select("*, flow_nodes(*)")
    .eq("id", flowId)
    .eq("account_id", profile.account_id)
    .single();

  if (flowError || !flow) {
    return NextResponse.json({ error: "Flow no encontrado" }, { status: 404 });
  }

  if (flow.status !== "active") {
    return NextResponse.json(
      { error: "El flow debe estar activo para ejecutarse" },
      { status: 400 }
    );
  }

  try {
    const result = await startFlowManually(
      flow,
      contact_id,
      user.id
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Error al iniciar flow" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      run_id: result.runId,
      message: "Flow iniciado correctamente",
    });
  } catch (error) {
    console.error("Error starting flow:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
