import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from './prisma';
import type { Broker } from '@prisma/client';

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

export async function getAuthenticatedBroker(): Promise<Broker | null> {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    const broker = await prisma.broker.findUnique({
      where: { supabase_uid: user.id },
    });
    return broker;
  } catch {
    return null;
  }
}