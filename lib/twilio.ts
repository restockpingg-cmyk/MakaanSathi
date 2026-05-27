import twilio from 'twilio';

let _client: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (!_client) {
    _client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return _client;
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(-10);
  return `whatsapp:+91${digits}`;
}

export async function sendWhatsApp(to: string, body: string): Promise<boolean> {
  try {
    await getClient().messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM!,
      to: to.startsWith('whatsapp:') ? to : formatPhone(to),
      body,
    });
    return true;
  } catch (err) {
    console.error('WhatsApp send error:', err);
    return false;
  }
}

export function buildBuyerFollowUpMessage(buyerName: string, brokerName: string): string {
  return `Hi ${buyerName}! 👋\n\nThis is ${brokerName} from BrokerBook. Just checking in — are you still looking for a property? We have exciting new listings that match your requirements!\n\nReply here or call me anytime. 🏠`;
}

export function buildOwnerReportMessage(
  ownerName: string,
  societyName: string,
  inquiries: number,
  visits: number
): string {
  return `Dear ${ownerName},\n\n📊 *Weekly Property Report*\n🏢 ${societyName}\n\n📞 Inquiries this week: *${inquiries}*\n🏠 Site visits completed: *${visits}*\n\nYour property is actively listed and being shown to verified buyers. We'll keep you posted!\n\n— BrokerBook CRM`;
}

export function buildDealUpdateMessage(
  buyerName: string,
  societyName: string,
  stage: string
): string {
  const stageLabels: Record<string, string> = {
    INQUIRY: '📋 Inquiry Received',
    SITE_VISIT: '🏠 Site Visit Scheduled',
    NEGOTIATION: '🤝 In Negotiation',
    AGREEMENT: '📝 Agreement in Progress',
    REGISTERED: '✅ Deal Registered',
    CLOSED_LOST: '❌ Deal Closed',
  };
  return `Hi ${buyerName}!\n\n🎉 Update on *${societyName}*:\nStatus: ${stageLabels[stage] ?? stage}\n\nWe'll be in touch on the next steps. Reach out anytime!\n\n— BrokerBook CRM`;
}
