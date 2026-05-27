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
  const buyer = await prisma.buyer.updateMany({
    where: { id: params.id, broker_id: broker.id },
    data: body,
  });

  if (buyer.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.buyer.deleteMany({ where: { id: params.id, broker_id: broker.id } });
  return NextResponse.json({ success: true });
}
