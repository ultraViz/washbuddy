import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { hash } from "bcryptjs";

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: businesses, error } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: admins } = await supabase
    .from("users")
    .select("id, name, email, business_id")
    .eq("role", "ADMIN");

  const result = (businesses ?? []).map((b: any) => ({
    ...b,
    admins: (admins ?? []).filter((u: any) => u.business_id === b.id),
  }));

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, email, phone, address, adminName, adminEmail, adminPassword } = await req.json();

  if (!name || !adminEmail || !adminPassword) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", adminEmail)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Admin email already exists" }, { status: 400 });
  }

  const { data: biz, error: bErr } = await supabase
    .from("businesses")
    .insert({ name, email: email ?? null, phone: phone ?? null, address: address ?? null })
    .select("id")
    .single();

  if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 });

  const hashedPassword = await hash(adminPassword, 10);

  const { error: uErr } = await supabase
    .from("users")
    .insert({ name: adminName ?? null, email: adminEmail, password: hashedPassword, role: "ADMIN", business_id: biz.id });

  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

  return NextResponse.json({ success: true, businessId: biz.id });
}
