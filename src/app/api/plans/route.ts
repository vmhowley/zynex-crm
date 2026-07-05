import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data: plans, error } = await supabase
    .from("plans")
    .select("*")
    .eq("is_active", true)
    .order(
      "CASE plan_type WHEN 'enterprise' THEN 1 WHEN 'pro' THEN 2 WHEN 'basic' THEN 3 WHEN 'free' THEN 4 END"
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ plans });
}
