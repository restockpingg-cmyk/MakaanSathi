import { NextResponse } from 'next/server';
import { getAuthenticatedBroker } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const property = await prisma.property.findFirst({
    where: { id: params.id, broker_id: broker.id },
    include: {
      site_visits: { include: { buyer: true }, orderBy: { scheduled_at: 'desc' } },
      deals: { include: { buyer: true }, orderBy: { created_at: 'desc' } },
    },
  });

  if (!property) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(property);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const result = await prisma.property.updateMany({
    where: { id: params.id, broker_id: broker.id },
    data: body,
  });

  if (result.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.property.deleteMany({ where: { id: params.id, broker_id: broker.id } });
  return NextResponse.json({ success: true });
}
