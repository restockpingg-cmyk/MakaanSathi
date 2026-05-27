import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from './prisma';
import type { Broker } from '@prisma/client';

// Server-side Supabase client using cookie-based session
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

// Resolve the current session and return the matching Broker row
export async function getAuthenticatedBroker(): Promise<Broker | null> {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const broker = await prisma.broker.findUnique({
      where: { supabase_uid: session.user.id },
    });
    return broker;
  } catch {
    return null;
  }
}
