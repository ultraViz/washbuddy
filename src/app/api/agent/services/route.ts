import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = (session.user as any)?.businessId;
  if (!businessId) return Response.json({ error: "No business" }, { status: 400 });

  const { data, error } = await supabase
    .from("services")
    .select("id, name, price")
    .eq("business_id", businessId)
    .order("name");

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
