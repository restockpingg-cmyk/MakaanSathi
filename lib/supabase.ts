import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client for client components (auth, storage uploads)
export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Service-role admin client — only use in server-side API routes
export function createSupabaseAdminClient() {
  return createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Upload a file to Supabase Storage and return the public URL
export async function uploadToStorage(
  bucket: 'property-photos' | 'profile-photos',
  path: string,
  file: File
): Promise<string | null> {
  const client = createSupabaseBrowserClient();
  const { data, error } = await client.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) {
    console.error('Storage upload error:', error.message);
    return null;
  }
  const { data: urlData } = client.storage.from(bucket).getPublicUrl(data.path);
  return urlData.publicUrl;
}
