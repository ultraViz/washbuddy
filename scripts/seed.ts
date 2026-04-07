import { createClient } from "@supabase/supabase-js";
import { hashSync } from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
);

const password = hashSync("password123", 10);

async function seed() {
  // ── Business ──────────────────────────────────────────────────────────────
  const { data: biz, error: bErr } = await supabase
    .from("businesses")
    .upsert({ id: "00000000-0000-0000-0000-000000000001", name: "WashBuddy HQ", email: "admin@washbuddy.com", phone: "+27-555-0100", address: "123 Clean St, Cape Town" }, { onConflict: "id" })
    .select("id")
    .single();
  if (bErr) { console.error("Business:", bErr.message); process.exit(1); }
  const BIZ_ID = biz.id;

  // ── Users ─────────────────────────────────────────────────────────────────
  await supabase.from("users").upsert([
    { id: "00000000-0000-0000-0001-000000000001", name: "Super Admin",  email: "super@washbuddy.com",  password, role: "SUPER_ADMIN", business_id: BIZ_ID },
    { id: "00000000-0000-0000-0001-000000000002", name: "Admin User",   email: "admin@washbuddy.com",  password, role: "ADMIN",       business_id: BIZ_ID },
    { id: "00000000-0000-0000-0001-000000000003", name: "Agent Alice",  email: "alice@washbuddy.com",  password, role: "AGENT",       business_id: BIZ_ID },
    { id: "00000000-0000-0000-0001-000000000004", name: "Agent Bob",    email: "bob@washbuddy.com",    password, role: "AGENT",       business_id: BIZ_ID },
  ], { onConflict: "id" });

  // ── Services ──────────────────────────────────────────────────────────────
  await supabase.from("services").upsert([
    { id: "00000000-0000-0000-0002-000000000001", name: "Basic Wash",  price: 80,  business_id: BIZ_ID },
    { id: "00000000-0000-0000-0002-000000000002", name: "Full Detail", price: 200, business_id: BIZ_ID },
    { id: "00000000-0000-0000-0002-000000000003", name: "Premium Wax", price: 350, business_id: BIZ_ID },
  ], { onConflict: "id" });

  // ── Agents ────────────────────────────────────────────────────────────────
  await supabase.from("agents").upsert([
    { id: "00000000-0000-0000-0003-000000000001", name: "Alice", phone: "+27-555-0101", business_id: BIZ_ID },
    { id: "00000000-0000-0000-0003-000000000002", name: "Bob",   phone: "+27-555-0102", business_id: BIZ_ID },
  ], { onConflict: "id" });

  // ── Vehicles ──────────────────────────────────────────────────────────────
  await supabase.from("vehicles").upsert([
    { id: "00000000-0000-0000-0004-000000000001", license_plate: "ABC 123 GP", owner_name: "John Doe",   owner_phone: "+27-555-1001", vehicle_type: "Sedan"    },
    { id: "00000000-0000-0000-0004-000000000002", license_plate: "XYZ 456 WC", owner_name: "Jane Smith", owner_phone: "+27-555-1002", vehicle_type: "SUV"      },
    { id: "00000000-0000-0000-0004-000000000003", license_plate: "DEF 789 GP", owner_name: "Mike Brown", owner_phone: "+27-555-1003", vehicle_type: "Truck"    },
    { id: "00000000-0000-0000-0004-000000000004", license_plate: "GHI 012 EC", owner_name: "Sara Lee",   owner_phone: "+27-555-1004", vehicle_type: "Hatchback" },
  ], { onConflict: "id" });

  // ── Queue Items ───────────────────────────────────────────────────────────
  await supabase.from("queue_items").upsert([
    { id: "00000000-0000-0000-0005-000000000001", status: "COMPLETED",    business_id: BIZ_ID, vehicle_id: "00000000-0000-0000-0004-000000000001", service_id: "00000000-0000-0000-0002-000000000001", agent_id: "00000000-0000-0000-0003-000000000001", total_amount: 80,  payment_method: "CASH", check_in_at: "2026-04-04T09:00:00Z", completed_at: "2026-04-04T09:20:00Z" },
    { id: "00000000-0000-0000-0005-000000000002", status: "COMPLETED",    business_id: BIZ_ID, vehicle_id: "00000000-0000-0000-0004-000000000002", service_id: "00000000-0000-0000-0002-000000000002", agent_id: "00000000-0000-0000-0003-000000000002", total_amount: 200, payment_method: "CARD", check_in_at: "2026-04-04T10:00:00Z", completed_at: "2026-04-04T10:45:00Z" },
    { id: "00000000-0000-0000-0005-000000000003", status: "WASH_BAY",     business_id: BIZ_ID, vehicle_id: "00000000-0000-0000-0004-000000000003", service_id: "00000000-0000-0000-0002-000000000003", agent_id: "00000000-0000-0000-0003-000000000001", total_amount: 350, check_in_at: "2026-04-07T08:30:00Z" },
    { id: "00000000-0000-0000-0005-000000000004", status: "IN_QUEUE",     business_id: BIZ_ID, vehicle_id: "00000000-0000-0000-0004-000000000004", service_id: "00000000-0000-0000-0002-000000000001", total_amount: 80,  check_in_at: "2026-04-07T08:45:00Z" },
  ], { onConflict: "id" });

  console.log("✓ Seed complete");
  console.log("");
  console.log("Login credentials:");
  console.log("  super@washbuddy.com  / password123  (SUPER_ADMIN)");
  console.log("  admin@washbuddy.com  / password123  (ADMIN)");
  console.log("  alice@washbuddy.com  / password123  (AGENT)");
  console.log("  bob@washbuddy.com    / password123  (AGENT)");
}

seed().catch(e => { console.error(e); process.exit(1); });
