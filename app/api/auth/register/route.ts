export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { supabase_uid, name, email, phone, office_area, rera_number } = body;

    if (!supabase_uid || !name || !email || !phone || !office_area) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const broker = await prisma.broker.create({
      data: { supabase_uid, name, email, phone, office_area, rera_number: rera_number ?? null },
    });

    return NextResponse.json(broker, { status: 201 });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
