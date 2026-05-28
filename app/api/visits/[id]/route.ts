export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { getAuthenticatedBroker } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const visit = await prisma.siteVisit.findFirst({
    where: { id: params.id, broker_id: broker.id },
    include: { buyer: true, property: true },
  });

  if (!visit) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(visit);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { status, buyer_feedback, broker_notes } = body;

  await prisma.siteVisit.updateMany({
    where: { id: params.id, broker_id: broker.id },
    data: {
      ...(status !== undefined && { status }),
      ...(buyer_feedback !== undefined && { buyer_feedback }),
      ...(broker_notes !== undefined && { broker_notes }),
    },
  });

  return NextResponse.json({ success: true });
}
