import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const plate = request.nextUrl.searchParams.get("plate");
  if (!plate) return Response.json(null);

  const { data } = await supabase
    .from("vehicles")
    .select("id, license_plate, owner_name, owner_phone, vehicle_type, car_make, car_description")
    .eq("license_plate", plate.toUpperCase().trim())
    .maybeSingle();

  if (!data) return Response.json(null);

  return Response.json({
    id:             data.id,
    licensePlate:   data.license_plate,
    ownerName:      data.owner_name,
    ownerPhone:     data.owner_phone,
    vehicleType:    data.vehicle_type,
    carMake:        data.car_make,
    carDescription: data.car_description,
  });
}
