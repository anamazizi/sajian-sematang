# ✅ SAJIAN SEMATANG - PRODUCTION DEPLOYMENT CHECKLIST

**Phase R7: Pre-Launch Verification**  
**Date:** 30 Ogos 2026

---

## 🚀 PRE-DEPLOYMENT

### 📊 Environment Variables

#### Supabase (Dashboard → Settings → API)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon/Public key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role (⚠️ Server-side only)

#### Google OAuth (Google Cloud Console)
- [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] Authorized redirect URIs updated:
  - Production: `https://yourdomain.com/auth/callback`
  - Vercel preview: `https://*-yourusername.vercel.app/auth/callback`

#### Application
- [ ] `NEXT_PUBLIC_APP_URL` - Production domain
- [ ] `NEXT_PUBLIC_WHATSAPP_NUMBER` - 601110890100

#### Vercel (Auto-configured)
- [ ] `VERCEL_OIDC_TOKEN` - Auto-generated

---

### 📦 Vercel Configuration

- [ ] GitHub repository connected
- [ ] Environment variables configured (Production)
- [ ] Environment variables configured (Preview)
- [ ] Build command: `npm run build`
- [ ] Output directory: `.next`
- [ ] Node.js version: 18.x or 20.x
- [ ] Custom domain configured (if applicable)

---

### 💾 Supabase Configuration

#### Database
- [ ] Production project created
- [ ] Backup scheduled
- [ ] Database password secured

#### Authentication
- [ ] Google OAuth enabled
- [ ] Redirect URLs configured
- [ ] Session timeout: 604800s (7 days)
- [ ] Auto refresh enabled

#### Storage
- [ ] `product-images` bucket (public)
- [ ] `seller-qr` bucket (private)
- [ ] Storage policies configured

#### RLS (Row Level Security)
- [ ] Enabled on all tables
- [ ] Policies tested for each role

---

## 🛠️ BUILD VERIFICATION

### TypeScript
```bash
npm run build
```
- [ ] No TypeScript errors
- [ ] No build warnings (critical)
- [ ] All pages compile

### Code Quality
- [ ] No `ignoreBuildErrors: true`
- [ ] No console.log in production code
- [ ] No TODO/FIXME in critical paths

---

## 💾 DATABASE MIGRATION

Refer to: `supabase/00_DEPLOYMENT_MIGRATION_GUIDE.md`

- [ ] Step 1: Core schema
- [ ] Step 2: User location
- [ ] Step 3: Storage buckets
- [ ] Step 4: Stock movements
- [ ] Step 5: Order snapshots
- [ ] Step 6: Order RPC (base)
- [ ] Step 7: Product options
- [ ] Step 8: Order item options
- [ ] Step 9: RPC with options
- [ ] Step 10: RLS policies
- [ ] Step 11: RLS cost_price protection

---

## ✅ POST-MIGRATION VERIFICATION

### Database Tables
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```
- [ ] 9 tables exist

### RLS Enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```
- [ ] All tables have RLS enabled

### RPC Function
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'create_order_with_stock_check';
```
- [ ] Function exists

---

## 🧪 FUNCTIONAL TESTING

### Customer Flow
- [ ] Google login works
- [ ] Profile setup works
- [ ] Product browsing works
- [ ] Add to cart works
- [ ] Options selection works (Hot/Iced)
- [ ] Delivery fee calculation correct
- [ ] Order submission works
- [ ] WhatsApp link generated
- [ ] Order appears in history

### Seller Flow
- [ ] Login as seller
- [ ] View own products
- [ ] Create new product
- [ ] Edit product
- [ ] Manage stock
- [ ] View orders
- [ ] Update order status
- [ ] Cannot see other sellers' data

### Admin Flow
- [ ] Login as admin
- [ ] View all orders
- [ ] View all sellers
- [ ] Create payout
- [ ] View reports

---

## 🔒 SECURITY VERIFICATION

### RLS Testing
- [ ] Customer A cannot see Customer B orders
- [ ] Customer cannot see cost_price
- [ ] Seller A cannot access Seller B products
- [ ] Non-admin cannot access payouts
- [ ] Price manipulation fails (server validates)

### Authentication
- [ ] Expired session redirects to login
- [ ] Unauthorized access blocked
- [ ] Service role key NOT in client code

---

## 📊 PERFORMANCE

- [ ] Homepage loads < 3s
- [ ] Images optimized
- [ ] No unnecessary re-renders
- [ ] Database queries indexed

---

## 📝 DOCUMENTATION

- [ ] README updated
- [ ] API docs (if applicable)
- [ ] Deployment guide
- [ ] Environment variables documented

---

## 🚀 DEPLOYMENT

### Push to Production
```bash
git push origin main
```
- [ ] Vercel auto-deploys
- [ ] Deployment successful
- [ ] No runtime errors

### Post-Deployment
- [ ] Health check (visit homepage)
- [ ] Test critical flows
- [ ] Monitor error logs (Vercel)
- [ ] Monitor database (Supabase)

---

## 🔄 ROLLBACK PLAN

If deployment fails:

1. Revert Git commit
```bash
git revert HEAD
git push origin main
```

2. Restore database backup

3. Notify team

---

## 📞 SUPPORT CONTACTS

- **Vercel:** https://vercel.com/support
- **Supabase:** https://supabase.com/dashboard/support
- **Google OAuth:** Google Cloud Console

---

## ✅ FINAL SIGN-OFF

- [ ] All checklist items completed
- [ ] Tested in staging
- [ ] Team notified
- [ ] Backup taken
- [ ] Ready for production

**Deployed by:** __________________  
**Date:** __________________  
**Time:** __________________

---

*End of Deployment Checklist*
