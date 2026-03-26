/**
 * Service client for use outside of Next.js request context
 * (e.g., in background workers, scripts, etc.)
 * Does NOT import next/headers.
 */
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

export function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
