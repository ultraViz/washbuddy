import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { hash } from "bcryptjs";

export async function GET() {
  const session = await auth();
  const user = session?.user as any;
  if (user?.role !== "ADMIN" || !user?.businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("agents")
    .select("id, name, phone")
    .eq("business_id", user.businessId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as any;
  if (user?.role !== "ADMIN" || !user?.businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, phone, email, password } = await req.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 400 });
  }

  const hashedPassword = await hash(password, 10);

  const { data: agent, error: aErr } = await supabase
    .from("agents")
    .insert({ name, phone: phone ?? null, business_id: user.businessId })
    .select("id")
    .single();

  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });

  const { error: uErr } = await supabase
    .from("users")
    .insert({ name, email, password: hashedPassword, role: "AGENT", business_id: user.businessId });

  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

  return NextResponse.json({ success: true, agentId: agent.id });
}
