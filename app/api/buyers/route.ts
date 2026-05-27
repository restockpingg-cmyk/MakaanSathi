import { NextResponse } from 'next/server';
import { getAuthenticatedBroker } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const buyers = await prisma.buyer.findMany({
    where: { broker_id: broker.id },
    orderBy: { created_at: 'desc' },
  });

  return NextResponse.json(buyers);
}

export async function POST(request: Request) {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const {
      name, phone, email, budget_min, budget_max,
      preferred_localities, bhk_requirement, floor_preference,
      furnishing_preference, purpose, notes,
    } = body;

    if (!name || !phone || !budget_min || !budget_max || !preferred_localities?.length || !bhk_requirement?.length || !purpose) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const buyer = await prisma.buyer.create({
      data: {
        broker_id: broker.id,
        name, phone,
        email: email || null,
        budget_min: Number(budget_min),
        budget_max: Number(budget_max),
        preferred_localities,
        bhk_requirement,
        floor_preference: floor_preference || null,
        furnishing_preference: furnishing_preference || null,
        purpose,
        notes: notes || null,
      },
    });

    return NextResponse.json(buyer, { status: 201 });
  } catch (err) {
    console.error('Create buyer error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
