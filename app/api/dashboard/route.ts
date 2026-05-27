import { NextResponse } from 'next/server';
import { getAuthenticatedBroker } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [buyers, properties, deals, followUps, visits] = await Promise.all([
    prisma.buyer.count({ where: { broker_id: broker.id, status: 'ACTIVE' } }),
    prisma.property.count({ where: { broker_id: broker.id, status: 'AVAILABLE' } }),
    prisma.deal.findMany({
      where: { broker_id: broker.id },
      select: { stage: true, commission_amount: true },
    }),
    prisma.followUp.count({ where: { broker_id: broker.id, is_done: false, due_at: { lt: new Date() } } }),
    prisma.siteVisit.count({ where: { broker_id: broker.id, status: 'SCHEDULED' } }),
  ]);

  const activeDeals = deals.filter((d) => d.stage !== 'CLOSED_LOST' && d.stage !== 'REGISTERED').length;
  const totalCommission = deals
    .filter((d) => d.stage === 'REGISTERED')
    .reduce((s, d) => s + (d.commission_amount ?? 0), 0);

  return NextResponse.json({
    active_buyers: buyers,
    available_properties: properties,
    active_deals: activeDeals,
    total_commission: totalCommission,
    overdue_followups: followUps,
    upcoming_visits: visits,
  });
}
