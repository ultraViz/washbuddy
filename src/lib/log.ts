import { supabase } from "@/lib/supabase";

export async function logActivity(params: {
  businessId: string;
  agentName: string;
  action: string;
  description: string;
}) {
  // Fire-and-forget — never throw, never block the main request
  supabase.from("activity_logs").insert({
    business_id: params.businessId,
    agent_name:  params.agentName,
    action:      params.action,
    description: params.description,
  }).then();
}
