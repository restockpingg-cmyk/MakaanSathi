export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { getAuthenticatedBroker } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(broker);
}

export async function PATCH(request: Request) {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name, phone, rera_number, office_area } = body;

  const updated = await prisma.broker.update({
    where: { id: broker.id },
    data: {
      name: name ?? undefined,
      phone: phone ?? undefined,
      rera_number: rera_number !== undefined ? (rera_number || null) : undefined,
      office_area: office_area ?? undefined,
    },
  });

  return NextResponse.json(updated);
}
