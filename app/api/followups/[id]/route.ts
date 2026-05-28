export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { getAuthenticatedBroker } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { is_done, note, due_at, type } = body;

  await prisma.followUp.updateMany({
    where: { id: params.id, broker_id: broker.id },
    data: {
      ...(is_done !== undefined && { is_done }),
      ...(note !== undefined && { note: note || null }),
      ...(due_at !== undefined && { due_at: new Date(due_at) }),
      ...(type !== undefined && { type }),
    },
  });

  return NextResponse.json({ success: true });
}
