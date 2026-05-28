import { NextResponse } from 'next/server';
import { getAuthenticatedBroker } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const buyer = await prisma.buyer.findFirst({
    where: { id: params.id, broker_id: broker.id },
    include: {
      site_visits: { include: { property: true }, orderBy: { scheduled_at: 'desc' } },
      deals: { include: { property: true }, orderBy: { created_at: 'desc' } },
      follow_ups: { orderBy: { due_at: 'asc' } },
    },
  });

  if (!buyer) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(buyer);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  // Only update allowed fields
  const allowed = [
    'name', 'phone', 'email', 'budget_min', 'budget_max',
    'preferred_localities', 'bhk_requirement', 'floor_preference',
    'furnishing_preference', 'purpose', 'status', 'notes', 'last_contacted_at',
  ];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  const result = await prisma.buyer.updateMany({
    where: { id: params.id, broker_id: broker.id },
    data,
  });

  if (result.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.buyer.deleteMany({ where: { id: params.id, broker_id: broker.id } });
  return NextResponse.json({ success: true });
}