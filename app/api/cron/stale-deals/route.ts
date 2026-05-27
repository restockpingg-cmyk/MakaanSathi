import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { subDays } from 'date-fns';

// Runs every Monday at 10:00 AM IST (04:30 UTC)
// Finds deals stuck in the same stage for 10+ days and adds a note
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenDaysAgo = subDays(new Date(), 10);
  let flagged = 0;

  const deals = await prisma.deal.findMany({
    where: {
      stage: { notIn: ['CLOSED_LOST', 'REGISTERED'] },
      updated_at: { lt: tenDaysAgo },
    },
    select: { id: true, broker_id: true, stage: true, updated_at: true },
  });

  for (const deal of deals) {
    // Check if already flagged this week
    const recentNote = await prisma.stageHistory.findFirst({
      where: {
        deal_id: deal.id,
        note: { contains: 'Auto: stale' },
        moved_at: { gte: subDays(new Date(), 7) },
      },
    });

    if (!recentNote) {
      await prisma.stageHistory.create({
        data: {
          deal_id: deal.id,
          stage: deal.stage as any,
          note: `Auto: stale — stuck in ${deal.stage} since ${deal.updated_at.toLocaleDateString('en-IN')}`,
        },
      });
      flagged++;
    }
  }

  return NextResponse.json({ success: true, deals_flagged: flagged });
}
