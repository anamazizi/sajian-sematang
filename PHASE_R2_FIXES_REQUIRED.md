# 🔧 Phase R2: Required Fixes Checklist

**Status:** Ready to implement  
**Priority:** HIGH - Must complete before Phase R3

---

## 🔴 HIGH PRIORITY FIXES

### ☐ Fix #1: Create Root Middleware (5 min)

**File:** `/middleware.ts` (new file)

**Code:**
```typescript
import { type NextRequest } from 'next/server';
import { updateSession } from './lib/auth/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

---

### ☐ Fix #2: Change Table Name `profiles` → `users` (2 min)

**File 1:** `app/auth/callback/page.tsx` (line 29)
```typescript
// BEFORE:
const { data: profile } = await supabase.from('profiles')

// AFTER:
const { data: profile } = await supabase.from('users')
```

**File 2:** `app/page.tsx` (line 28)
```typescript
// BEFORE:
.from('profiles')

// AFTER:
.from('users')
```

---

### ☐ Fix #3: Add Lat/Long to Database (10 min)

**File:** `/supabase/add_user_location_fields.sql` (new file)

```sql
-- Add location fields for delivery calculation
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS latitude decimal(10, 6);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS longitude decimal(10, 6);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS google_maps_url text;

-- Create index for geospatial queries (future optimization)
CREATE INDEX IF NOT EXISTS idx_users_location ON public.users(latitude, longitude);
```

**Action:** Run in Supabase SQL Editor

---

## 🟡 MEDIUM PRIORITY FIXES

### ☐ Fix #4: Update Profile Form with Coordinates (45 min)

**File:** `app/auth/profile/page.tsx`

**Changes:**
1. Add latitude/longitude to formData state
2. Add input fields (or auto-extract from google_maps_url)
3. Update validation
4. Update save logic

**Helper function needed:**
```typescript
function extractCoordinatesFromMapsUrl(url: string): { lat: number; lng: number } | null {
  // Parse Google Maps URL
  // Example: https://maps.app.goo.gl/... or https://www.google.com/maps?q=...
  // Return { lat, lng } or null
}
```

---

### ☐ Fix #5: Configure 7-Day Session (5 min)

**Location:** Supabase Dashboard

**Steps:**
1. Go to: Authentication → Settings
2. Find: "Session Management"
3. Set: Refresh Token Lifetime = 604800 seconds (7 days)
4. Enable: "Automatic token refresh"
5. Save changes

---

### ☐ Fix #6: Fix Supabase Client for SSR (20 min)

**File 1:** Create `/lib/supabase/server.ts`
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
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
```

**File 2:** Update `lib/supabase/client.ts`
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const supabase = createClient();
```

---

## 🟢 LOW PRIORITY (Optional)

### ☐ Fix #7: Remove localStorage.clear() (1 min)

**File:** `app/page.tsx` (line 42)
```typescript
// REMOVE THIS LINE:
localStorage.clear();

// Keep only:
await supabase.auth.signOut();
setUser(null);
setProfile(null);
window.location.reload();
```

---

## ✅ Testing Checklist

After fixes:

- [ ] Login with Google works
- [ ] New user redirected to profile completion
- [ ] Profile saves with lat/long
- [ ] Redirect to correct dashboard after profile
- [ ] Protected routes redirect to login
- [ ] Session persists after browser close
- [ ] Logout clears session
- [ ] Role-based navigation works

---

## 📝 Notes

- Start with HIGH priority (#1-#3)
- Test after each fix
- Can defer MEDIUM/LOW if time limited
- Document any issues found

**Ready to start?** 🚀
