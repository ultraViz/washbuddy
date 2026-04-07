import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = (session.user as any)?.businessId;
  if (!businessId) return Response.json({ error: "No business" }, { status: 400 });

  const { data, error } = await supabase
    .from("queue_items")
    .select(`
      id, status, extra_services, total_amount, payment_method,
      check_in_at, completed_at, agent_id,
      vehicles ( license_plate, owner_name, owner_phone, vehicle_type ),
      services ( name, price ),
      agents   ( name )
    `)
    .eq("business_id", businessId)
    .order("check_in_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Flatten nested joins for the frontend
  const items = (data ?? []).map((q: any) => ({
    id:            q.id,
    status:        q.status,
    extraServices: q.extra_services,
    totalAmount:   q.total_amount,
    paymentMethod: q.payment_method,
    checkInAt:     q.check_in_at,
    completedAt:   q.completed_at,
    agentId:       q.agent_id,
    licensePlate:  q.vehicles?.license_plate,
    ownerName:     q.vehicles?.owner_name,
    ownerPhone:    q.vehicles?.owner_phone,
    vehicleType:   q.vehicles?.vehicle_type,
    serviceName:   q.services?.name,
    servicePrice:  q.services?.price,
    agentName:     q.agents?.name,
  }));

  return Response.json(items);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = (session.user as any)?.businessId;
  if (!businessId) return Response.json({ error: "No business" }, { status: 400 });

  const body = await request.json();
  const { licensePlate, ownerName, ownerPhone, vehicleType, serviceId } = body;

  if (!licensePlate || !serviceId) {
    return Response.json({ error: "licensePlate and serviceId are required" }, { status: 400 });
  }

  const plate = (licensePlate as string).toUpperCase().trim();

  // Upsert vehicle
  let vehicleId: string;
  const { data: existing } = await supabase
    .from("vehicles")
    .select("id")
    .eq("license_plate", plate)
    .maybeSingle();

  if (existing) {
    vehicleId = existing.id;
    if (ownerName || ownerPhone || vehicleType) {
      await supabase.from("vehicles").update({
        ...(ownerName   ? { owner_name:    ownerName }   : {}),
        ...(ownerPhone  ? { owner_phone:   ownerPhone }  : {}),
        ...(vehicleType ? { vehicle_type:  vehicleType } : {}),
      }).eq("id", vehicleId);
    }
  } else {
    const { data: newVehicle, error: vErr } = await supabase
      .from("vehicles")
      .insert({ license_plate: plate, owner_name: ownerName ?? null, owner_phone: ownerPhone ?? null, vehicle_type: vehicleType ?? null })
      .select("id")
      .single();
    if (vErr) return Response.json({ error: vErr.message }, { status: 500 });
    vehicleId = newVehicle.id;
  }

  // Verify service belongs to business
  const { data: service } = await supabase
    .from("services")
    .select("price")
    .eq("id", serviceId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (!service) return Response.json({ error: "Service not found" }, { status: 404 });

  const { data: item, error: qErr } = await supabase
    .from("queue_items")
    .insert({ business_id: businessId, vehicle_id: vehicleId, service_id: serviceId, total_amount: service.price })
    .select("id")
    .single();

  if (qErr) return Response.json({ error: qErr.message }, { status: 500 });

  return Response.json({ id: item.id }, { status: 201 });
}
