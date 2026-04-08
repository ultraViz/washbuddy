import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as any;
  if (user?.role !== "ADMIN" || !user?.businessId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Get agent name to find matching user
  const { data: agent } = await supabase
    .from("agents")
    .select("name")
    .eq("id", id)
    .eq("business_id", user.businessId)
    .maybeSingle();

  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  // Delete agent record
  const { error: aErr } = await supabase
    .from("agents")
    .delete()
    .eq("id", id);

  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });

  // Delete linked user account
  await supabase
    .from("users")
    .delete()
    .eq("name", agent.name)
    .eq("business_id", user.businessId)
    .eq("role", "AGENT");

  return NextResponse.json({ success: true });
}
