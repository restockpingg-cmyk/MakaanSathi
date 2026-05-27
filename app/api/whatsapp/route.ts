import { NextResponse } from 'next/server';
import { getAuthenticatedBroker } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';
import { sendWhatsApp, buildBuyerFollowUpMessage } from '@/lib/twilio';

export async function GET() {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const logs = await prisma.whatsappLog.findMany({
    where: { broker_id: broker.id },
    orderBy: { sent_at: 'desc' },
    take: 50,
  });

  return NextResponse.json(logs);
}

export async function POST(request: Request) {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { buyer_id, message_type, custom_message } = body;

  if (!buyer_id) return NextResponse.json({ error: 'buyer_id is required' }, { status: 400 });

  const buyer = await prisma.buyer.findFirst({ where: { id: buyer_id, broker_id: broker.id } });
  if (!buyer) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });

  const messageBody = custom_message?.trim()
    ? custom_message.trim()
    : buildBuyerFollowUpMessage(buyer.name, broker.name);

  const sent = await sendWhatsApp(buyer.phone, messageBody);

  if (!sent) {
    return NextResponse.json({ error: 'Failed to send WhatsApp message. Check Twilio config.' }, { status: 500 });
  }

  // Log the message
  const log = await prisma.whatsappLog.create({
    data: {
      broker_id: broker.id,
      recipient_phone: buyer.phone,
      recipient_name: buyer.name,
      message_type: message_type ?? 'BUYER_FOLLOWUP',
      message_body: messageBody,
    },
  });

  // Update last_contacted_at on buyer
  await prisma.buyer.update({
    where: { id: buyer_id },
    data: { last_contacted_at: new Date() },
  });

  return NextResponse.json(log, { status: 201 });
}
