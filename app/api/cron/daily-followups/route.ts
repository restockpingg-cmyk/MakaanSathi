import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { subDays, addDays } from 'date-fns';

// Vercel calls this at 9:00 AM IST daily (03:30 UTC)
// Secure with CRON_SECRET header
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = subDays(new Date(), 7);
  const twoDaysAgo = subDays(new Date(), 2);
  const tomorrow = addDays(new Date(), 1);
  let created = 0;

  // 1. Buyers not contacted in 7+ days — create follow-up
  const staleBuyers = await prisma.buyer.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        { last_contacted_at: { lt: cutoff } },
        { last_contacted_at: null },
      ],
    },
    select: { id: true, broker_id: true },
  });

  for (const buyer of staleBuyers) {
    // Avoid duplicate: don't create if an open follow-up already exists
    const existing = await prisma.followUp.findFirst({
      where: { buyer_id: buyer.id, is_done: false },
    });
    if (!existing) {
      await prisma.followUp.create({
        data: {
          broker_id: buyer.broker_id,
          buyer_id: buyer.id,
          due_at: tomorrow,
          type: 'CALL',
          note: 'Auto: Buyer not contacted in 7+ days',
        },
      });
      created++;
    }
  }

  // 2. Completed visits with no deal after 2 days — create follow-up
  const recentVisits = await prisma.siteVisit.findMany({
    where: {
      status: 'COMPLETED',
      scheduled_at: { lt: twoDaysAgo },
    },
    select: { id: true, buyer_id: true, property_id: true, broker_id: true },
  });

  for (const visit of recentVisits) {
    const dealExists = await prisma.deal.findFirst({
      where: { buyer_id: visit.buyer_id, property_id: visit.property_id },
    });
    if (!dealExists) {
      const followUpExists = await prisma.followUp.findFirst({
        where: { buyer_id: visit.buyer_id, property_id: visit.property_id, is_done: false },
      });
      if (!followUpExists) {
        await prisma.followUp.create({
          data: {
            broker_id: visit.broker_id,
            buyer_id: visit.buyer_id,
            property_id: visit.property_id,
            due_at: tomorrow,
            type: 'CALL',
            note: 'Auto: Visit completed 2+ days ago with no deal created',
          },
        });
        created++;
      }
    }
  }

  return NextResponse.json({ success: true, followups_created: created });
}
