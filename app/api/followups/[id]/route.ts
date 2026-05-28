export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { getAuthenticatedBroker } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const followups = await prisma.followUp.findMany({
    where: { broker_id: broker.id },
    include: { buyer: true, property: true },
    orderBy: { due_at: 'asc' },
  });

  return NextResponse.json(followups);
}

export async function POST(request: Request) {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { buyer_id, property_id, due_at, type, note } = body;

  if (!due_at || !type) {
    return NextResponse.json({ error: 'due_at and type are required' }, { status: 400 });
  }

  const followup = await prisma.followUp.create({
    data: {
      broker_id: broker.id,
      buyer_id: buyer_id || null,
      property_id: property_id || null,
      due_at: new Date(due_at),
      type, note: note ?? null,
    },
  });

  return NextResponse.json(followup, { status: 201 });
}
