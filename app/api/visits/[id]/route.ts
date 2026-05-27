import { NextResponse } from 'next/server';
import { getAuthenticatedBroker } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { status, buyer_feedback, broker_notes } = body;

  const result = await prisma.siteVisit.updateMany({
    where: { id: params.id, broker_id: broker.id },
    data: {
      status: status ?? undefined,
      buyer_feedback: buyer_feedback !== undefined ? buyer_feedback : undefined,
      broker_notes: broker_notes !== undefined ? broker_notes : undefined,
    },
  });

  if (result.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
