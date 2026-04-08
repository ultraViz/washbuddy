import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken  = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_FROM; // e.g. whatsapp:+14155238886
const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME ?? "WashBuddy";

const MESSAGES: Record<string, (plate: string, biz: string) => string> = {
  IN_QUEUE: (plate, biz) =>
    `Hi! 👋 Your vehicle *${plate}* has been checked in at *${biz}* and is now in the queue. We'll keep you updated as it moves through. 🚗`,

  WASH_BAY: (plate, biz) =>
    `Your vehicle *${plate}* at *${biz}* has started being washed! 🧼💦 We'll notify you when it moves to finishing.`,

  FINISHING_BAY: (plate, biz) =>
    `Almost done! ✨ Your vehicle *${plate}* at *${biz}* is now in the finishing bay — final touches underway.`,

  COMPLETED: (plate, biz) =>
    `✅ Your vehicle *${plate}* is ready for collection at *${biz}*! Please come fetch it at your convenience. Thank you for choosing us! 🙏`,
};

/**
 * Send a WhatsApp notification to the vehicle owner.
 * Fire-and-forget — never throws, never blocks the main request.
 */
export async function notifyOwner(params: {
  ownerPhone: string | null | undefined;
  licensePlate: string;
  status: string;
}) {
  const { ownerPhone, licensePlate, status } = params;

  // Silently skip if not configured or no phone number
  if (!accountSid || !authToken || !fromNumber || !ownerPhone) return;

  const messageFn = MESSAGES[status];
  if (!messageFn) return;

  const body = messageFn(licensePlate, businessName);

  // Normalise the phone number — strip spaces/dashes, ensure + prefix
  const raw = ownerPhone.replace(/[\s\-()]/g, "");
  const to  = `whatsapp:${raw.startsWith("+") ? raw : `+27${raw.replace(/^0/, "")}`}`;

  try {
    const client = twilio(accountSid, authToken);
    await client.messages.create({ from: fromNumber, to, body });
  } catch (err: any) {
    // Log but never break the main flow
    console.error("[WhatsApp] Failed to send:", err?.message ?? err);
  }
}
