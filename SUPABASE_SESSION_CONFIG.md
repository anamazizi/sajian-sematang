# 🔧 Supabase 7-Day Session Configuration

**Requirement:** Master Prompt Seksyen 10 - Session 7 hari  
**Status:** ⏳ Needs manual configuration in Supabase Dashboard

---

## 📋 Configuration Steps

### Step 1: Access Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select project: **Sajian Sematang** (ecortjyopjmintikurzq)
3. Navigate to: **Authentication** → **Settings**

---

### Step 2: Configure Session Duration

Scroll to **Session Management** section:

**Setting 1: JWT Expiry**
- Current: 3600 seconds (1 hour) - Keep as is
- This is for access token only (auto-refreshed)

**Setting 2: Refresh Token Lifetime** ⚠️ **IMPORTANT**
- Current: Unknown (check dashboard)
- **Change to:** `604800` seconds (7 days)
- Formula: 7 days × 24 hours × 60 min × 60 sec = 604,800 seconds

**Setting 3: Automatic Token Refresh**
- Status: Should be **ENABLED** (default)
- This allows session to persist across browser restarts

**Setting 4: Session Inactivity Timeout**
- Optional: Can set to 7 days as well
- Or leave as "Never" if user should stay logged in until explicit logout

---

### Step 3: Save Configuration

1. Click **Save** button
2. Wait for confirmation message
3. Changes apply immediately (no restart needed)

---

## ✅ Verification

After configuration:

### Test 1: Session Persistence
```
Day 0: Login with Google
Day 1: Close browser, reopen → ✅ Still logged in
Day 3: Close browser, reopen → ✅ Still logged in
Day 6: Close browser, reopen → ✅ Still logged in
Day 8: Close browser, reopen → ❌ Logged out (expected)
```

### Test 2: Auto Refresh
```
1. Login
2. Wait 2 hours (beyond JWT expiry)
3. Make API call (e.g., fetch profile)
4. ✅ Should work (token auto-refreshed)
```

### Test 3: Explicit Logout
```
1. Login
2. Click logout button
3. Try to access protected route
4. ✅ Should redirect to login (session cleared)
```

---

## 🔍 How to Check Current Settings

Via Supabase Dashboard:
1. Authentication → Settings
2. Look for "Refresh Token Rotation" and "Session Settings"
3. Check current values

Via SQL (if needed):
```sql
-- Check auth config (admin only)
SELECT * FROM auth.config;
```

---

## 📊 Expected Behavior After Configuration

**Before 7-Day Config:**
- User logged out after ~1 hour (JWT expiry)
- Poor UX (frequent re-login required)

**After 7-Day Config:**
- User stays logged in for 7 days
- Token auto-refreshes in background
- Better UX (aligns with Master Prompt requirement)

---

## 🚨 Important Notes

1. **Logout Still Works:** 7-day session doesn't prevent logout
2. **Security:** Refresh tokens stored securely in httpOnly cookies
3. **Revocation:** Admin can revoke sessions anytime in dashboard
4. **Device-Specific:** Each device/browser has own session

---

## ✅ Completion Checklist

- [ ] Access Supabase Dashboard
- [ ] Navigate to Authentication → Settings
- [ ] Set Refresh Token Lifetime to 604800 seconds
- [ ] Ensure Automatic Token Refresh is ENABLED
- [ ] Save configuration
- [ ] Test session persistence (Day 1, Day 3, Day 6)
- [ ] Verify auto-refresh works
- [ ] Confirm explicit logout still works

---

**Configuration Time:** ~5 minutes  
**Testing Time:** ~1 minute (basic test), 7 days (full test)

**Status:** ⏳ Awaiting manual configuration in Supabase Dashboard

**Note:** Cannot automate this via code - must be done in Supabase Dashboard UI.
