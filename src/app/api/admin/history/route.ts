import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await auth();
  const user = session?.user as any;
  if (user?.role !== "ADMIN" || !user?.businessId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch all completed items with date and amount
  const { data, error } = await supabase
    .from("queue_items")
    .select("completed_at, total_amount, services(price)")
    .eq("business_id", user.businessId)
    .eq("status", "COMPLETED")
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = (data ?? []) as any[];

  // Helper: get amount from item
  const amount = (item: any) => item.total_amount ?? item.services?.price ?? 0;

  // Daily aggregates — last 60 days
  const dailyMap = new Map<string, { washes: number; revenue: number }>();
  for (const item of items) {
    const day = item.completed_at.slice(0, 10); // "YYYY-MM-DD"
    const entry = dailyMap.get(day) ?? { washes: 0, revenue: 0 };
    entry.washes += 1;
    entry.revenue += Number(amount(item));
    dailyMap.set(day, entry);
  }
  const daily = Array.from(dailyMap.entries())
    .map(([date, v]) => ({ date, ...v }))
    .slice(0, 60);

  // Monthly aggregates
  const monthlyMap = new Map<string, { washes: number; revenue: number }>();
  for (const item of items) {
    const month = item.completed_at.slice(0, 7); // "YYYY-MM"
    const entry = monthlyMap.get(month) ?? { washes: 0, revenue: 0 };
    entry.washes += 1;
    entry.revenue += Number(amount(item));
    monthlyMap.set(month, entry);
  }
  const monthly = Array.from(monthlyMap.entries())
    .map(([month, v]) => ({ month, ...v }))
    .slice(0, 24);

  return NextResponse.json({ daily, monthly });
}
