export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { getAuthenticatedBroker } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const property = await prisma.property.findFirst({
    where: { id: params.id, broker_id: broker.id },
  });

  if (!property) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(property);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const broker = await getAuthenticatedBroker();
  if (!broker) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const {
    owner_name, owner_phone, locality, society_name, address,
    bhk, floor, total_floors, area_sqft, price,
    property_type, furnishing, parking, amenities, photos, status,
  } = body;

  await prisma.property.updateMany({
    where: { id: params.id, broker_id: broker.id },
    data: {
      ...(owner_name !== undefined && { owner_name }),
      ...(owner_phone !== undefined && { owner_phone }),
      ...(locality !== undefined && { locality }),
      ...(society_name !== undefined && { society_name }),
      ...(address !== undefined && { address }),
      ...(bhk !== undefined && { bhk }),
      ...(floor !== undefined && { floor: Number(floor) }),
      ...(total_floors !== undefined && { total_floors: Number(total_floors) }),
      ...(area_sqft !== undefined && { area_sqft: Number(area_sqft) }),
      ...(price !== undefined && { price: Number(price) }),
      ...(property_type !== undefined && { property_type }),
      ...(furnishing !== undefined && { furnishing }),
      ...(parking !== undefined && { parking: Boolean(parking) }),
      ...(amenities !== undefined && { amenities }),
      ...(photos !== undefined && { photos }),
      ...(status !== undefined && { status }),
    },
  });

  return NextResponse.json({ success: true });
}
