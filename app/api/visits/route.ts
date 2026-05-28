import { NextResponse } from 'next/server';
import { getAuthenticatedBroker } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const visits = await prisma.siteVisit.findMany({
    where: { broker_id: broker.id },
    include: { buyer: true, property: true },
    orderBy: { scheduled_at: 'desc' },
  });

  return NextResponse.json(visits);
}

export async function POST(request: Request) {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { buyer_id, property_id, scheduled_at, broker_notes } = body;

  if (!buyer_id || !property_id || !scheduled_at) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const visit = await prisma.siteVisit.create({
    data: {
      broker_id: broker.id,
      buyer_id, property_id,
      scheduled_at: new Date(scheduled_at),
      broker_notes: broker_notes ?? null,
    },
    include: { buyer: true, property: true },
  });

  return NextResponse.json({
    ...visit,
    broker: { name: broker.name, phone: broker.phone, rera_number: broker.rera_number, office_area: broker.office_area },
  }, { status: 201 });
}
