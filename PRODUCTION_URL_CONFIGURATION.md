# PRODUCTION URL CONFIGURATION GUIDE
## Google Cloud Console & Supabase Auth Setup
## Date: 31 Ogos 2026

---

## 🎯 OVERVIEW

### **Purpose:** Configure production URLs for authentication
### **Critical for:** Google OAuth + Supabase Auth integration
### **Estimated Setup Time:** 15-20 minutes

---

## 🔐 GOOGLE CLOUD CONSOLE SETUP

### **Step 1: Access Google Cloud Console**
1. Go to: https://console.cloud.google.com/
2. Select/Create project: **"SAJIAN SEMATANG Production"**

### **Step 2: Configure OAuth Consent Screen**
```
Navigation: APIs & Services → OAuth consent screen
Settings:
- User Type: External
- App Name: SAJIAN SEMATANG
- User support email: [your-email@domain.com]
- Developer contact: [your-email@domain.com]
- Scopes: email, profile, openid
- Test Users: Add admin emails
```

### **Step 3: Create OAuth 2.0 Client ID**
```
Navigation: APIs & Services → Credentials
Action: Create Credentials → OAuth 2.0 Client IDs
Settings:
- Application type: Web application
- Name: SAJIAN SEMATANG Production Client
```

### **Step 4: Configure Authorized Redirect URIs (CRITICAL)**

**Add these EXACT URLs:**

```text
# PRIMARY PRODUCTION URL (Vercel)
https://sajian-sematang.vercel.app/auth/callback

# ALTERNATIVE PATTERNS (Vercel)
https://*.vercel.app/auth/callback

# CUSTOM DOMAIN (If using)
https://www.sajiansematang.com/auth/callback
https://sajiansematang.com/auth/callback

# DEVELOPMENT URL
http://localhost:3000/auth/callback

# PREVIEW DEPLOYMENTS (Vercel)
https://*-git-*.vercel.app/auth/callback
```

### **Step 5: Get Client ID & Secret**
1. Copy **Client ID** → Set as `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
2. Copy **Client Secret** → Set as `GOOGLE_CLIENT_SECRET`
3. **DO NOT** commit these values to Git

---

## 🗄️ SUPABASE AUTH DASHBOARD SETUP

### **Step 1: Create Supabase Production Project**
1. Go to: https://supabase.com/dashboard
2. Click **"New Project"**
3. **Project Name:** sajian-sematang-production
4. **Database Password:** [Generate secure password]
5. **Region:** Singapore (ap-southeast-1) - nearest to Malaysia

### **Step 2: Configure Authentication Providers**
```
Navigation: Authentication → Providers
1. Enable "Google"
2. Paste Client ID & Secret from Google Cloud Console
3. Configure Redirect URL: https://sajian-sematang.vercel.app/auth/callback
```

### **Step 3: Configure Site URL**
```
Navigation: Authentication → URL Configuration
- Site URL: https://sajian-sematang.vercel.app
- Additional Redirect URLs: Same as Google Cloud Console list
```

### **Step 4: Configure CORS (Cross-Origin Resource Sharing)**
```
Navigation: Settings → API
- CORS Origins: Add the following:
  https://sajian-sematang.vercel.app
  https://*.vercel.app
  http://localhost:3000
  (Add custom domain if applicable)
```