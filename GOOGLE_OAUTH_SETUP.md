# 🔐 Google OAuth Setup Guide

Panduan lengkap untuk setup Google OAuth authentication untuk Sajian Sematang.

---

## 📋 Prerequisites

- Google Account
- Supabase Project
- Access to Google Cloud Console

---

## 🚀 Step-by-Step Setup

### Step 1: Google Cloud Console Setup

#### 1.1 Create/Select Project
1. Pergi ke [Google Cloud Console](https://console.cloud.google.com)
2. Klik dropdown project di atas
3. Klik "New Project" atau pilih existing project
4. Nama project: `Sajian Sematang` (atau nama pilihan anda)
5. Klik "Create"

#### 1.2 Enable Google+ API
1. Di sidebar, pergi ke **APIs & Services** > **Library**
2. Cari "Google+ API"
3. Klik dan enable API tersebut

#### 1.3 Configure OAuth Consent Screen
1. Pergi ke **APIs & Services** > **OAuth consent screen**
2. Pilih **External** (untuk public app)
3. Klik "Create"

**Fill in the form:**
- **App name**: Sajian Sematang
- **User support email**: Your email
- **App logo**: (Optional) Upload logo
- **App domain**: 
  - Application home page: `https://your-domain.com`
  - Privacy policy: `https://your-domain.com/privacy`
  - Terms of service: `https://your-domain.com/terms`
- **Authorized domains**: 
  - `your-domain.com`
  - `your-project.supabase.co`
- **Developer contact**: Your email

4. Klik "Save and Continue"

**Scopes:**
5. Klik "Add or Remove Scopes"
6. Select:
   - `userinfo.email`
   - `userinfo.profile`
   - `openid`
7. Klik "Update" then "Save and Continue"

**Test users:** (Optional for development)
8. Add test email addresses
9. Klik "Save and Continue"

10. Review and click "Back to Dashboard"

#### 1.4 Create OAuth 2.0 Credentials
1. Pergi ke **APIs & Services** > **Credentials**
2. Klik "Create Credentials" > "OAuth client ID"
3. Application type: **Web application**
4. Name: `Sajian Sematang Web Client`

**Authorized JavaScript origins:**
```
http://localhost:3000
https://your-domain.com
```

**Authorized redirect URIs:**
```
http://localhost:3000/auth/callback
https://your-project.supabase.co/auth/v1/callback
https://your-domain.com/auth/callback
```

5. Klik "Create"
6. **IMPORTANT**: Copy the **Client ID** and **Client Secret**
   - Save them securely!

---

### Step 2: Supabase Configuration

#### 2.1 Enable Google Provider
1. Login to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Pergi ke **Authentication** > **Providers**
4. Scroll to "Google"
5. Toggle "Enable Sign in with Google"

#### 2.2 Configure Google Provider
Paste the credentials from Google Cloud Console:
- **Client ID**: `your-client-id.apps.googleusercontent.com`
- **Client Secret**: `your-client-secret`

**Redirect URL** (already provided by Supabase):
```
https://your-project.supabase.co/auth/v1/callback
```

6. Klik "Save"

---

### Step 3: Application Configuration

#### 3.1 Environment Variables
Update your `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google OAuth (optional, for reference)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

#### 3.2 Verify Supabase Client
File: `lib/supabase/client.ts` should already be configured:

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

---

### Step 4: Database Setup

#### 4.1 Run Migration
Execute the migration script in Supabase SQL Editor:
```sql
-- File: supabase/migration_business_structure.sql
-- Copy and paste the entire file
```

#### 4.2 Verify Tables
Check that these tables exist:
- ✅ `users` (with role column)
- ✅ `sellers`
- ✅ `products`
- ✅ `orders`
- ✅ `payouts`
- ✅ `audit_logs`

#### 4.3 Create Admin User
After first login via Google OAuth:

```sql
-- Update user role to admin
UPDATE public.users 
SET role = 'admin',
    phone_number = '0111234567',
    is_active = true
WHERE email = 'your-admin-email@gmail.com';
```

---

### Step 5: Testing

#### 5.1 Test Login Flow
1. Start development server:
   ```bash
   cd sajian-sematang
   npm run dev
   ```

2. Navigate to: `http://localhost:3000/auth/login`

3. Click "Log Masuk dengan Google"

4. Select Google account

5. Should redirect to profile completion page

6. Fill in profile details

7. Should redirect to appropriate dashboard based on role

#### 5.2 Test Different Roles

**Test as Customer:**
```sql
UPDATE public.users SET role = 'customer' WHERE email = 'test@example.com';
```
- Should redirect to `/sellers`
- Can browse and order

**Test as Seller:**
```sql
UPDATE public.users SET role = 'seller' WHERE email = 'test@example.com';
-- Also need to create seller record
INSERT INTO public.sellers (user_id, shop_name, duitnow_qr_url)
VALUES ('user-uuid', 'Test Shop', 'https://example.com/qr.png');
```
- Should redirect to `/dashboard`
- Can view own orders and products

**Test as Staff:**
```sql
UPDATE public.users SET role = 'staff' WHERE email = 'test@example.com';
```
- Should redirect to `/staff`
- Can view all orders and products
- NO financial access

**Test as Admin:**
```sql
UPDATE public.users SET role = 'admin' WHERE email = 'test@example.com';
```
- Should redirect to `/admin`
- Full access to everything

---

## 🔒 Security Checklist

- [ ] Client Secret is kept secure (never commit to git)
- [ ] Authorized redirect URIs are correct
- [ ] RLS policies are enabled on all tables
- [ ] Test users removed before production
- [ ] OAuth consent screen is properly configured
- [ ] Environment variables are set correctly

---

## 🐛 Troubleshooting

### Error: "redirect_uri_mismatch"
**Solution**: Add the exact redirect URI to Google Cloud Console:
```
https://your-project.supabase.co/auth/v1/callback
```

### Error: "Access blocked: This app's request is invalid"
**Solution**: 
1. Check OAuth consent screen is configured
2. Verify scopes are added
3. Add your email as test user (for development)

### Error: "User not found in database"
**Solution**: Check that the trigger `on_auth_user_created` is working:
```sql
-- Verify trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Manually create user if needed
INSERT INTO public.users (id, name, email, role)
VALUES ('user-uuid-from-auth', 'User Name', 'email@example.com', 'customer');
```

### Login works but redirects to wrong page
**Solution**: Check user role and permissions:
```sql
SELECT id, email, role, is_active FROM public.users WHERE email = 'your-email@example.com';
```

---

## 📱 Production Deployment

### Before Going Live:

1. **Update OAuth Consent Screen**
   - Change from "Testing" to "In Production"
   - Submit for verification if needed

2. **Update Authorized Domains**
   - Add production domain
   - Remove localhost

3. **Update Redirect URIs**
   - Add production callback URL
   - Keep Supabase callback URL

4. **Environment Variables**
   - Set production env vars in Vercel/Netlify
   - Never expose Client Secret

5. **Test Everything**
   - Test login flow
   - Test all roles
   - Test profile completion
   - Test permissions

---

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Authentication](https://nextjs.org/docs/authentication)

---

**Last Updated**: 16 Ogos 2026  
**Version**: 1.0  
**Status**: Ready for Implementation
