import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const STATUS_ORDER = ["IN_QUEUE", "WASH_BAY", "FINISHING_BAY", "COMPLETED"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = (session.user as any)?.businessId;
  if (!businessId) return Response.json({ error: "No business" }, { status: 400 });

  const { id } = await params;
  const { action, paymentMethod, totalAmount } = await request.json();

  const { data: item } = await supabase
    .from("queue_items")
    .select("status")
    .eq("id", id)
    .eq("business_id", businessId)
    .maybeSingle();

  if (!item) return Response.json({ error: "Not found" }, { status: 404 });

  if (action === "advance") {
    const currentIndex = STATUS_ORDER.indexOf(item.status);
    if (currentIndex === -1 || currentIndex === STATUS_ORDER.length - 1) {
      return Response.json({ error: "Cannot advance status" }, { status: 400 });
    }
    const nextStatus = STATUS_ORDER[currentIndex + 1];
    const isCompleting = nextStatus === "COMPLETED";

    const { error } = await supabase
      .from("queue_items")
      .update({
        status: nextStatus,
        ...(paymentMethod != null ? { payment_method: paymentMethod } : {}),
        ...(totalAmount    != null ? { total_amount:   totalAmount }   : {}),
        ...(isCompleting           ? { completed_at:   new Date().toISOString() } : {}),
      })
      .eq("id", id);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ status: nextStatus });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
