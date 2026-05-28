export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { getAuthenticatedBroker } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { stage, note } = await request.json();
  if (!stage) return NextResponse.json({ error: 'stage is required' }, { status: 400 });

  const deal = await prisma.deal.findFirst({
    where: { id: params.id, broker_id: broker.id },
    include: { buyer: true, property: true },
  });
  if (!deal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Update deal stage and add history entry in a transaction
  await prisma.$transaction(async (tx) => {
    await tx.deal.update({
      where: { id: params.id },
      data: { stage, updated_at: new Date() },
    });

    await tx.stageHistory.create({
      data: { deal_id: params.id, stage, note: note ?? null },
    });

    // When deal is won: close buyer, mark property sold/rented
    if (stage === 'REGISTERED') {
      await tx.buyer.update({
        where: { id: deal.buyer_id },
        data: { status: 'CLOSED' },
      });
      await tx.property.update({
        where: { id: deal.property_id },
        data: { status: deal.buyer.purpose === 'RENTAL' ? 'RENTED' : 'SOLD' },
      });
    }

    // When deal is lost: reactivate buyer and property
    if (stage === 'CLOSED_LOST') {
      await tx.buyer.update({
        where: { id: deal.buyer_id },
        data: { status: 'ACTIVE' },
      });
      await tx.property.update({
        where: { id: deal.property_id },
        data: { status: 'AVAILABLE' },
      });
    }
  });

  return NextResponse.json({ success: true });
}
