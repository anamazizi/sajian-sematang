// Client-side Supabase Client
// For use in Client Components (with 'use client' directive)
// Sajian Sematang - Phase R2

import { createBrowserClient } from '@supabase/ssr';

/**
 * Create a Supabase client for browser/client-side operations
 * Properly handles cookies for authentication in the browser
 * 
 * Usage in Client Components:
 * ```typescript
 * 'use client';
 * import { createClient } from '@/lib/supabase/client';
 * 
 * export default function ClientComponent() {
 *   const supabase = createClient();
 *   // ...
 * }
 * ```
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Legacy export for backward compatibility
// Prefer using createClient() in new code
export const supabase = createClient();