export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { getAuthenticatedBroker } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const deal = await prisma.deal.findFirst({
    where: { id: params.id, broker_id: broker.id },
    include: {
      buyer: true,
      property: true,
      documents: { orderBy: { required_from: 'asc' } },
      stage_history: { orderBy: { moved_at: 'asc' } },
    },
  });

  if (!deal) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(deal);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  // Toggle document received status
  if (body.document_id !== undefined) {
    const doc = await prisma.document.findFirst({
      where: { id: body.document_id },
      include: { deal: { select: { broker_id: true } } },
    });
    if (!doc || doc.deal.broker_id !== broker.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    await prisma.document.update({
      where: { id: body.document_id },
      data: {
        is_received: body.is_received,
        received_at: body.is_received ? new Date() : null,
      },
    });
    return NextResponse.json({ success: true });
  }

  // Update deal fields
  const { commission_amount, expected_close_date, notes } = body;
  await prisma.deal.updateMany({
    where: { id: params.id, broker_id: broker.id },
    data: {
      ...(commission_amount !== undefined && { commission_amount: commission_amount !== null ? Number(commission_amount) : null }),
      ...(expected_close_date !== undefined && { expected_close_date: expected_close_date ? new Date(expected_close_date) : null }),
      ...(notes !== undefined && { notes }),
    },
  });

  return NextResponse.json({ success: true });
}
