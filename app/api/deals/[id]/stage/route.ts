import { NextResponse } from 'next/server';
import { getAuthenticatedBroker } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { stage, note } = await request.json();
  if (!stage) return NextResponse.json({ error: 'stage is required' }, { status: 400 });

  const deal = await prisma.deal.findFirst({ where: { id: params.id, broker_id: broker.id } });
  if (!deal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.$transaction([
    prisma.deal.update({
      where: { id: params.id },
      data: { stage },
    }),
    prisma.stageHistory.create({
      data: { deal_id: params.id, stage, note: note ?? null },
    }),
  ]);

  return NextResponse.json({ success: true, stage });
}
