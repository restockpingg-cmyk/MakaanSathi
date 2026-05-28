export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfWeek, endOfWeek } from 'date-fns';
import { sendWhatsApp, buildOwnerReportMessage } from '@/lib/twilio';

// Runs every Monday at 11:00 AM IST (05:30 UTC)
// Sends weekly inquiry + visit summary to each property owner
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const properties = await prisma.property.findMany({
    where: { status: 'AVAILABLE' },
    select: {
      id: true, owner_name: true, owner_phone: true, society_name: true, broker_id: true,
      deals: {
        where: { created_at: { gte: weekStart, lte: weekEnd } },
        select: { id: true },
      },
      site_visits: {
        where: { scheduled_at: { gte: weekStart, lte: weekEnd }, status: 'COMPLETED' },
        select: { id: true },
      },
    },
  });

  let sent = 0;
  const errors: string[] = [];

  for (const p of properties) {
    const message = buildOwnerReportMessage(
      p.owner_name,
      p.society_name,
      p.deals.length,
      p.site_visits.length
    );

    const ok = await sendWhatsApp(p.owner_phone, message);
    if (ok) {
      await prisma.whatsappLog.create({
        data: {
          broker_id: p.broker_id,
          recipient_phone: p.owner_phone,
          recipient_name: p.owner_name,
          message_type: 'OWNER_REPORT',
          message_body: message,
        },
      });
      sent++;
    } else {
      errors.push(`Failed: ${p.owner_name} (${p.owner_phone})`);
    }
  }

  return NextResponse.json({ success: true, reports_sent: sent, errors });
}
