export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { getAuthenticatedBroker } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const buyer = await prisma.buyer.findFirst({
    where: { id: params.id, broker_id: broker.id },
  });

  if (!buyer) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(buyer);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const {
    name, phone, email, budget_min, budget_max,
    preferred_localities, bhk_requirement, floor_preference,
    furnishing_preference, purpose, status, notes,
  } = body;

  const buyer = await prisma.buyer.updateMany({
    where: { id: params.id, broker_id: broker.id },
    data: {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email: email || null }),
      ...(budget_min !== undefined && { budget_min: Number(budget_min) }),
      ...(budget_max !== undefined && { budget_max: Number(budget_max) }),
      ...(preferred_localities !== undefined && { preferred_localities }),
      ...(bhk_requirement !== undefined && { bhk_requirement }),
      ...(floor_preference !== undefined && { floor_preference: floor_preference || null }),
      ...(furnishing_preference !== undefined && { furnishing_preference: furnishing_preference || null }),
      ...(purpose !== undefined && { purpose }),
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes: notes || null }),
    },
  });

  return NextResponse.json({ success: true });
}
