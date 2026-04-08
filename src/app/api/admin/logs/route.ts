import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const session = await auth();
  const user = session?.user as any;
  if (user?.role !== "ADMIN" || !user?.businessId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "100"), 500);

  const { data, error } = await supabase
    .from("activity_logs")
    .select("id, agent_name, action, description, created_at")
    .eq("business_id", user.businessId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}
