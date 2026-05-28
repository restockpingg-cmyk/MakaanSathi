export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { getAuthenticatedBroker } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';
import { getTopMatches } from '@/lib/matching';

export async function GET(request: Request) {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get('limit') ?? '20');

  const [buyers, properties] = await Promise.all([
    prisma.buyer.findMany({ where: { broker_id: broker.id, status: 'ACTIVE' } }),
    prisma.property.findMany({ where: { broker_id: broker.id } }),
  ]);

  const matches = getTopMatches(buyers, properties, limit);

  return NextResponse.json(matches.map((m) => ({
    score: m.score,
    breakdown: m.breakdown,
    buyer: { id: m.buyer.id, name: (m.buyer as any).name, budget_min: m.buyer.budget_min, budget_max: m.buyer.budget_max, bhk_requirement: m.buyer.bhk_requirement },
    property: { id: m.property.id, society_name: (m.property as any).society_name, locality: m.property.locality, bhk: m.property.bhk, price: m.property.price },
  })));
}
