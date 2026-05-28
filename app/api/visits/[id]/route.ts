import { NextResponse } from 'next/server';
import { getAuthenticatedBroker } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { status, buyer_feedback, broker_notes } = body;

  // Fetch the visit first so we can read buyer/property for the auto follow-up
  const visit = await prisma.siteVisit.findFirst({
    where: { id: params.id, broker_id: broker.id },
    include: { property: true },
  });
  if (!visit) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.siteVisit.update({
    where: { id: params.id },
    data: {
      status: status ?? undefined,
      buyer_feedback: buyer_feedback !== undefined ? buyer_feedback : undefined,
      broker_notes: broker_notes !== undefined ? broker_notes : undefined,
    },
  });

  // Auto-create a follow-up when a visit is marked completed
  if (status === 'COMPLETED' && visit.buyer_id) {
    // Avoid duplicates — only create if no pending follow-up already exists for this buyer+property
    const existing = await prisma.followUp.findFirst({
      where: {
        broker_id: broker.id,
        buyer_id: visit.buyer_id,
        property_id: visit.property_id,
        is_done: false,
      },
    });

    if (!existing) {
      const dueAt = new Date();
      dueAt.setDate(dueAt.getDate() + 2); // due in 2 days
      dueAt.setHours(10, 0, 0, 0); // 10 AM

      await prisma.followUp.create({
        data: {
          broker_id: broker.id,
          buyer_id: visit.buyer_id,
          property_id: visit.property_id,
          type: 'CALL',
          due_at: dueAt,
          note: `Post-visit follow-up: ${visit.property.society_name}, ${visit.property.locality}`,
          is_done: false,
        },
      });
    }
  }

  return NextResponse.json({ success: true });
}