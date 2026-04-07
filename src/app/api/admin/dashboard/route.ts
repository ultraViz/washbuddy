import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await auth();
  const user = session?.user as any;
  if (user?.role !== "ADMIN" || !user?.businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const businessId = user.businessId;
  const today = new Date().toISOString().split("T")[0];

  const { data: allCompleted } = await supabase
    .from("queue_items")
    .select("total_amount, completed_at")
    .eq("business_id", businessId)
    .eq("status", "COMPLETED");

  const { data: active } = await supabase
    .from("queue_items")
    .select("id")
    .eq("business_id", businessId)
    .neq("status", "COMPLETED");

  const completed = allCompleted ?? [];
  const todayCompleted = completed.filter(
    (q: any) => q.completed_at?.startsWith(today)
  );

  return NextResponse.json({
    totalWashes:      completed.length,
    totalRevenue:     completed.reduce((s: number, q: any) => s + (q.total_amount ?? 0), 0),
    todayWashes:      todayCompleted.length,
    todayRevenue:     todayCompleted.reduce((s: number, q: any) => s + (q.total_amount ?? 0), 0),
    activeQueueCount: (active ?? []).length,
  });
}
