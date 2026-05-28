export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { getAuthenticatedBroker } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';

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

// POST just logs the message â€” actual sending happens via wa.me link on the client
export async function POST(request: Request) {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { buyer_id, message_type, message_body } = body;

  if (!buyer_id || !message_body) {
    return NextResponse.json({ error: 'buyer_id and message_body are required' }, { status: 400 });
  }

  const buyer = await prisma.buyer.findFirst({ where: { id: buyer_id, broker_id: broker.id } });
  if (!buyer) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });

  const [log] = await Promise.all([
    prisma.whatsappLog.create({
      data: {
        broker_id: broker.id,
        recipient_phone: buyer.phone,
        recipient_name: buyer.name,
        message_type: message_type ?? 'BUYER_FOLLOWUP',
        message_body: message_body,
      },
    }),
    prisma.buyer.update({
      where: { id: buyer_id },
      data: { last_contacted_at: new Date() },
    }),
  ]);

  return NextResponse.json(log, { status: 201 });
}