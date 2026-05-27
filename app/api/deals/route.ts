import { NextResponse } from 'next/server';
import { getAuthenticatedBroker } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const deals = await prisma.deal.findMany({
    where: { broker_id: broker.id },
    include: { buyer: true, property: true },
    orderBy: { updated_at: 'desc' },
  });

  return NextResponse.json(deals);
}

export async function POST(request: Request) {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { buyer_id, property_id, stage, expected_close_date, commission_amount, notes } = body;

    if (!buyer_id || !property_id) {
      return NextResponse.json({ error: 'buyer_id and property_id are required' }, { status: 400 });
    }

    // Verify buyer and property belong to this broker
    const [buyer, property] = await Promise.all([
      prisma.buyer.findFirst({ where: { id: buyer_id, broker_id: broker.id } }),
      prisma.property.findFirst({ where: { id: property_id, broker_id: broker.id } }),
    ]);
    if (!buyer || !property) return NextResponse.json({ error: 'Invalid buyer or property' }, { status: 400 });

    const deal = await prisma.deal.create({
      data: {
        broker_id: broker.id,
        buyer_id, property_id,
        stage: stage ?? 'INQUIRY',
        expected_close_date: expected_close_date ? new Date(expected_close_date) : null,
        commission_amount: commission_amount ? Number(commission_amount) : null,
        notes: notes ?? null,
        stage_history: {
          create: [{ stage: stage ?? 'INQUIRY' }],
        },
        // Pre-populate standard document checklist
        documents: {
          create: [
            { document_name: 'Aadhar Card', required_from: 'BUYER' },
            { document_name: 'PAN Card', required_from: 'BUYER' },
            { document_name: 'Bank Statement (6 months)', required_from: 'BUYER' },
            { document_name: 'Property Title Deed', required_from: 'SELLER' },
            { document_name: 'Electricity Bill', required_from: 'SELLER' },
            { document_name: 'NOC from Society', required_from: 'SOCIETY' },
          ],
        },
      },
      include: { buyer: true, property: true },
    });

    return NextResponse.json(deal, { status: 201 });
  } catch (err) {
    console.error('Create deal error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
