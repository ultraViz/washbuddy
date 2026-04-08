import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/log";

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
    .select("status, vehicles(license_plate), services(name)")
    .eq("id", id)
    .eq("business_id", businessId)
    .maybeSingle();

  if (!item) return Response.json({ error: "Not found" }, { status: 404 });

  const agentName = (session.user as any)?.name ?? "Unknown";
  const plate = (item as any).vehicles?.license_plate ?? "?";
  const serviceName = (item as any).services?.name ?? "service";

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

    const actionLabel = isCompleting ? "COMPLETE" : "ADVANCE";
    const statusLabel: Record<string, string> = {
      WASH_BAY: "Wash Bay", FINISHING_BAY: "Finishing Bay", COMPLETED: "Completed",
    };
    logActivity({
      businessId,
      agentName,
      action: actionLabel,
      description: isCompleting
        ? `Completed ${plate} (${serviceName}) — R${totalAmount ?? ""} via ${paymentMethod ?? "cash"}`
        : `Moved ${plate} (${serviceName}) to ${statusLabel[nextStatus] ?? nextStatus}`,
    });

    return Response.json({ status: nextStatus });
  }

  if (action === "cancel") {
    const cancellable = ["IN_QUEUE", "WASH_BAY", "FINISHING_BAY"];
    if (!cancellable.includes(item.status)) {
      return Response.json({ error: "Cannot cancel this item" }, { status: 400 });
    }
    const { error } = await supabase
      .from("queue_items")
      .update({ status: "CANCELLED", completed_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return Response.json({ error: error.message }, { status: 500 });

    logActivity({
      businessId,
      agentName,
      action: "CANCEL",
      description: `Cancelled job for ${plate} (${serviceName})`,
    });

    return Response.json({ status: "CANCELLED" });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
