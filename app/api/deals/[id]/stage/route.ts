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
    include: { buyer: true },
  });
  if (!deal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Update stage + log history
  await prisma.$transaction([
    prisma.deal.update({ where: { id: params.id }, data: { stage } }),
    prisma.stageHistory.create({ data: { deal_id: params.id, stage, note: note ?? null } }),
  ]);

  // Auto-sync buyer and property status based on new stage
  if (stage === 'REGISTERED') {
    // Deal closed won — close buyer, mark property sold/rented
    const propStatus = deal.buyer.purpose === 'RENTAL' ? 'RENTED' : 'SOLD';
    await prisma.$transaction([
      prisma.buyer.update({ where: { id: deal.buyer_id }, data: { status: 'CLOSED' } }),
      prisma.property.update({ where: { id: deal.property_id }, data: { status: propStatus } }),
    ]);
  } else if (stage === 'CLOSED_LOST') {
    // Deal lost — reactivate buyer and put property back on market
    await prisma.$transaction([
      prisma.buyer.update({ where: { id: deal.buyer_id }, data: { status: 'ACTIVE' } }),
      prisma.property.update({ where: { id: deal.property_id }, data: { status: 'AVAILABLE' } }),
    ]);
  } else if (stage === 'SITE_VISIT' || stage === 'NEGOTIATION') {
    // Actively pursuing — hold the property so it does not appear as free
    await prisma.property.update({ where: { id: deal.property_id }, data: { status: 'ON_HOLD' } });
  }

  return NextResponse.json({ success: true, stage });
}