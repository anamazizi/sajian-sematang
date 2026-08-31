# PRODUCTION LAUNCH GUIDE - SAJIAN SEMATANG
## Phase 9: Final Deployment Documentation
## Date: 31 Ogos 2026

---

## 📋 PREREQUISITES CHECKLIST

### ✅ Phase 8 E2E Testing Completed
- [x] Customer flow tested (Auth → Profile → Cart → Checkout → WhatsApp)
- [x] Order snapshot persistence verified
- [x] RLS security policies tested
- [x] Stock concurrency validation working
- [x] Production environment variables configured

### ✅ Codebase Status
- [x] Clean TypeScript build (0 errors)
- [x] Rate limiting middleware implemented
- [x] Audit logging system ready
- [x] Monitoring utilities configured

---

## 🚀 STEP 1: GOOGLE CLOUD OAUTH SETUP

### 1.1 Google Cloud Console Configuration
1. **Navigate to:** [Google Cloud Console](https://console.cloud.google.com/)
2. **Select Project:** Create or select existing project
3. **Enable APIs:** Google Identity Platform

### 1.2 OAuth Consent Screen
```
Steps:
1. APIs & Services → OAuth consent screen
2. User Type: External
3. App Information:
   - App name: SAJIAN SEMATANG
   - User support email: [your-email]
   - Developer contact: [your-email]
4. Scopes: email, profile, openid
5. Test Users: Add admin emails
```

### 1.3 Credentials Creation
```
Steps:
1. APIs & Services → Credentials
2. Create Credentials → OAuth 2.0 Client IDs
3. Application type: Web application
4. Name: SAJIAN SEMATANG Production
```

### 1.4 Authorized Redirect URIs (CRITICAL)
Add these URLs to your OAuth Client configuration:

```text
# Production URLs
https://sajian-sematang.vercel.app/auth/callback
https://www.yourdomain.com/auth/callback

# Vercel Preview URLs (Pattern)
https://*-yourusername.vercel.app/auth/callback

# Development URL
http://localhost:3000/auth/callback
```

### 1.5 Environment Variables to Update
Update your production `.env.local` or Vercel environment variables:

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-production-client-secret
```

---

## 🚀 STEP 2: VERCEL PRODUCTION DEPLOYMENT

### 2.1 Connect GitHub Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your SAJIAN SEMATANG GitHub repository

### 3.2 Database Migration
Run migrations from development to production:

```bash
# Method 1: Using Supabase CLI
supabase db push

# Method 2: Manual SQL (Recommended for first time)
# Run all migration files in order from supabase/ folder:
# 00_patch_all_missing_columns.sql
# 02_add_user_location_fields.sql
# 03_create_storage_buckets.sql
# 04_create_stock_movements_table.sql
# 05_add_order_snapshot_fields.sql
# 06_create_order_with_stock_check.sql
# 09_create_product_options_table.sql
# 10_add_order_item_options.sql
# 11_update_order_rpc_with_options.sql
# 13_fix_rls_cost_price_protection.sql
```

### 3.3 Authentication Configuration
1. **Supabase Dashboard → Authentication → Providers**
2. Enable Google OAuth
3. Add Client ID & Secret from Google Cloud Console
4. Configure Redirect URL: `https://yourdomain.com/auth/callback`

### 3.4 Storage Buckets Setup
```sql
-- Create production storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('product-images', 'product-images', true),
  ('seller-qr', 'seller-qr', false);

-- Set up storage policies (RLS for storage)
-- See supabase/03_create_storage_buckets.sql for policies
```

### 3.5 Email Templates (Optional)
Configure email templates in Supabase:
- Confirm signup
- Password reset
- Magic link
- Email change
### 5.4 Data Privacy Compliance
- ✅ Customer PII masked in logs
- ✅ Addresses partially redacted  
- ✅ Payment info never logged
- ✅ Audit trail for sensitive actions
- ✅ RLS prevents unauthorized access

---

## 🚀 STEP 6: DEPLOYMENT EXECUTION

### 6.1 Production Deployment
```bash
# Method 1: Git push (triggers Vercel auto-deploy)
git add .
git commit -m "chore: production deployment"
git push origin main

# Method 2: Manual deploy via Vercel CLI
vercel --prod
```

### 6.2 Post-Deployment Verification
Checklist after deployment:
- [ ] Homepage loads: https://sajian-sematang.vercel.app
- [ ] Google login works
- [ ] Profile setup functional
- [ ] Products display correctly
- [ ] Cart functionality works
- [ ] Checkout process completes
- [ ] WhatsApp link generation works
- [ ] Admin dashboard accessible
- [ ] Seller dashboard functional

### 6.3 Smoke Testing Script
```bash
# Quick smoke test
curl -I https://sajian-sematang.vercel.app
# Should return 200 OK

# API health check
curl https://sajian-sematang.vercel.app/api/health
# Should return {"status":"healthy"}
```

---

## 🚀 STEP 7: POST-LAUNCH MONITORING

### 7.1 First 24 Hours
- Monitor error rates in Sentry/Vercel logs
- Check database performance in Supabase
- Verify order processing workflow
- Test payment calculations accuracy

### 7.2 User Support Preparation
- Prepare FAQ document
- Set up support email: support@sajiansematang.com
- Create troubleshooting guide
- Document common issues and solutions

### 7.3 Backup Strategy
```sql
-- Supabase Backups
-- 1. Daily automated backups (Supabase default)
-- 2. Weekly full database exports
-- 3. Monthly disaster recovery test

-- Download backup via Supabase CLI
supabase db dump --db-url postgresql://postgres:[PASSWORD]@db.supabase.co:5432/postgres -f backup.sql
```

---

## 🛠️ TROUBLESHOOTING COMMON ISSUES

### Issue 1: Google OAuth Redirect URI Mismatch
**Symptoms:** Login redirects to error page
**Solution:** 
1. Check authorized redirect URIs in Google Cloud Console
2. Ensure exact match with `NEXT_PUBLIC_APP_URL`
3. Update Supabase Auth → Google provider redirect URL

### Issue 2: CORS Errors
**Symptoms:** API requests blocked by browser
**Solution:**
1. Check Supabase CORS settings
2. Verify `NEXT_PUBLIC_SUPABASE_URL` matches deployed domain
3. Update Supabase Dashboard → Settings → API → CORS

### Issue 3: Database Connection Issues
**Symptoms:** "Failed to fetch" or timeout errors
**Solution:**
1. Check Supabase project is active
2. Verify service role key is correct
3. Check IP restrictions in Supabase

### Issue 4: Storage Upload Failures
**Symptoms:** Image uploads fail
**Solution:**
1. Check storage bucket policies
2. Verify file size limits (configured in code)
3. Check RLS policies for storage buckets

---

## 📞 SUPPORT & ESCALATION

### Primary Contacts
- **Technical Lead:** [Your Name/Email]
- **Development Team:** [Team Contact]
- **Infrastructure:** Vercel & Supabase support

### Escalation Path
1. Check application logs in Vercel
2. Review database logs in Supabase  
3. Contact Vercel support for deployment issues
4. Contact Supabase support for database issues
5. Emergency contact: [On-call developer]

### Maintenance Windows
- **Weekly maintenance:** Sunday 2AM-4AM (MYT)
- **Emergency patches:** As needed with 24h notice
- **Database maintenance:** Coordinated with Supabase

---

## ✅ FINAL SIGN-OFF CHECKLIST

### Pre-Launch Sign-off
- [ ] All tests passing (E2E, unit, integration)
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Team trained on new system
- [ ] Rollback plan documented

### Launch Day Sign-off  
- [ ] Production environment configured
- [ ] Monitoring tools active
- [ ] Support team briefed
- [ ] Communication plan ready
- [ ] Go/No-Go decision made

### Post-Launch Sign-off
- [ ] 24-hour monitoring completed
- [ ] Critical issues resolved
- [ ] Performance verified
- [ ] User feedback collected
- [ ] Launch success confirmed

---

## 📋 CHANGE LOG

### Version 1.0 (Initial Production Launch)
- **Date:** 31 Ogos 2026
- **Features:** Complete food ordering platform with seller management
- **Security:** RLS policies, rate limiting, audit logging
- **Monitoring:** Error tracking, performance monitoring
- **Compliance:** Data privacy protection, secure transactions

---

**Document Maintainer:** Roo Code AI Assistant  
**Last Updated:** 31 Ogos 2026  
**Next Review Date:** 30 September 2026  

*End of Production Launch Guide*

---

## 🚀 STEP 4: MONITORING & ERROR TRACKING SETUP

### 4.1 Vercel Log Drains
1. Vercel Dashboard → Project → Settings → Log Drains
2. Add log drain (Sentry, Datadog, or custom endpoint)
3. Configure log level: `error` and `warning`

### 4.2 Sentry Integration (Recommended)
1. Create account at [sentry.io](https://sentry.io)
2. Create new project for SAJIAN SEMATANG
3. Get DSN and add to Vercel environment variables
4. Configure error tracking in `lib/monitoring/audit-logger.ts`

### 4.3 Application Monitoring
- **Uptime Monitoring:** Pingdom or UptimeRobot
- **Performance:** Vercel Analytics + Core Web Vitals
- **Database:** Supabase Dashboard metrics
- **Error Tracking:** Sentry for JavaScript errors

---

## 🚀 STEP 5: SECURITY AUDIT FINAL CHECK

### 5.1 Rate Limiting Verification
Test rate limiting endpoints:
```bash
# Test checkout rate limit (should fail after 10 requests/minute)
curl -X POST https://sajian-sematang.vercel.app/order/test-seller-id

# Test login rate limit (should fail after 5 attempts/15 minutes)
curl -X POST https://sajian-sematang.vercel.app/auth/login
```

### 5.2 RLS Policy Final Test
```sql
-- Run these in Supabase SQL Editor
-- Test Customer A cannot see Customer B data
SET role authenticated;
SET request.jwt.claims.sub TO 'customer-a-uuid';
SELECT * FROM orders; -- Should only see own orders

-- Test Customer cannot see cost_price
SELECT cost_price FROM products; -- Should fail with permission denied

-- Test Seller A cannot access Seller B products
SET request.jwt.claims.sub TO 'seller-a-uuid';
SELECT * FROM products WHERE seller_id != 'seller-a-uuid'; -- Should return empty
```

### 5.3 File Upload Validation
- Product images: Max 5MB, only image files
- Seller QR: Max 2MB, PNG/JPEG only
- Validation implemented in `components/file-upload.tsx`

### 5.4 Data Privacy Compliance
- ✅ Customer PII masked in logs
- ✅ Addresses partially redacted  
- ✅ Payment info never logged
- ✅ Audit trail for sensitive actions
- ✅ RLS prevents unauthorized access
### 2.2 Configure Project Settings
```
Project Name: sajian-sematang (or your preferred name)
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build
Output Directory: .next
```

### 2.3 Environment Variables (Production)
Add these to Vercel Project Settings → Environment Variables:

```env
# Supabase (Get from Supabase Dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key

# Supabase Service Role (SERVER-SIDE ONLY)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google OAuth (From Step 1)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Application Configuration
NEXT_PUBLIC_APP_URL=https://sajian-sematang.vercel.app
NEXT_PUBLIC_WHATSAPP_NUMBER=601110890100

# Monitoring (Optional)
SENTRY_DSN=your-sentry-dsn-if-using
LOG_LEVEL=info
```

### 2.4 Custom Domain Setup (Optional)
If using custom domain:
1. Vercel Dashboard → Project → Domains
2. Add your domain (e.g., sajiansematang.com)
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` to custom domain

---

## 🚀 STEP 3: SUPABASE PRODUCTION CONFIGURATION

### 3.1 Create Production Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose region closest to Malaysia (e.g., Singapore)