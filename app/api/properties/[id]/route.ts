export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { getAuthenticatedBroker } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const properties = await prisma.property.findMany({
    where: { broker_id: broker.id },
    orderBy: { created_at: 'desc' },
  });

  return NextResponse.json(properties);
}

export async function POST(request: Request) {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const {
      owner_name, owner_phone, locality, society_name, address,
      bhk, floor, total_floors, area_sqft, price,
      property_type, furnishing, parking, amenities, photos,
    } = body;

    if (!owner_name || !owner_phone || !locality || !society_name || !address || !bhk || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const property = await prisma.property.create({
      data: {
        broker_id: broker.id,
        owner_name, owner_phone, locality, society_name, address, bhk,
        floor: Number(floor), total_floors: Number(total_floors),
        area_sqft: Number(area_sqft), price: Number(price),
        property_type, furnishing,
        parking: Boolean(parking),
        amenities: amenities ?? [],
        photos: Array.isArray(photos) ? photos : [],
      },
    });

    return NextResponse.json(property, { status: 201 });
  } catch (err) {
    console.error('Create property error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
