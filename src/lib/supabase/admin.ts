import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

let cachedAdminClient: ReturnType<typeof createSupabaseClient<Database>> | null = null

export function createAdminClient() {
  if (!cachedAdminClient) {
    const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const serviceRoleKey =
      rawKey && !rawKey.includes('PASTE_SERVICE_ROLE_KEY')
        ? rawKey
        : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    cachedAdminClient = createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  }
  return cachedAdminClient
}
