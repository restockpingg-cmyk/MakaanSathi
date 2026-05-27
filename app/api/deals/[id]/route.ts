import { NextResponse } from 'next/server';
import { getAuthenticatedBroker } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const deal = await prisma.deal.findFirst({
    where: { id: params.id, broker_id: broker.id },
    include: {
      buyer: true, property: true,
      documents: { orderBy: { document_name: 'asc' } },
      stage_history: { orderBy: { moved_at: 'asc' } },
    },
  });

  if (!deal) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(deal);
}

// PATCH handles document toggle and notes update
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  // Toggle document received
  if (body.document_id !== undefined) {
    const doc = await prisma.document.findFirst({
      where: { id: body.document_id, deal: { broker_id: broker.id } },
    });
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    await prisma.document.update({
      where: { id: body.document_id },
      data: { is_received: body.is_received, received_at: body.is_received ? new Date() : null },
    });
    return NextResponse.json({ success: true });
  }

  // General deal update
  const { notes, commission_amount, expected_close_date } = body;
  await prisma.deal.updateMany({
    where: { id: params.id, broker_id: broker.id },
    data: {
      notes: notes !== undefined ? notes : undefined,
      commission_amount: commission_amount !== undefined ? Number(commission_amount) : undefined,
      expected_close_date: expected_close_date !== undefined ? (expected_close_date ? new Date(expected_close_date) : null) : undefined,
    },
  });

  return NextResponse.json({ success: true });
}
