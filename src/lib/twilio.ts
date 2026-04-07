import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendWhatsApp(to: string, message: string) {
  if (!to) return;
  const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  return client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM!,
    to: formattedTo,
    body: message,
  });
}
