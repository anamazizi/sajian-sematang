# 🔐 PHASE REBUILD-1: FIX RLS POLICIES

**Date**: 26 Ogos 2026, 11:00 PM
**Status**: 🔄 60% COMPLETE
**Priority**: 🔴 CRITICAL

## 🎯 OBJECTIVE

Fix critical RLS security issues:
1. Customer can view cost_price ❌
2. Customer can view seller QR codes ❌
3. No validation on orders/prices ❌
4. Cross-user data access ❌

## ✅ COMPLETED (60%)

### Files Created:
1. ✅ `rls_policies_part1_cleanup.sql` — Drop old policies, create helpers & views
2. ✅ `rls_policies_part2_main.sql` — ~40 new strict policies
3. ✅ `rls_test_suite.sql` — Testing queries

### Key Features:
- ✅ Helper functions: is_admin(), is_staff(), get_user_seller_id()
- ✅ Customer-safe views: products_customer_view (no cost_price)
- ✅ Customer-safe views: sellers_customer_view (no QR codes)
- ✅ 40 strict policies (users, sellers, products, orders, payouts, audit_logs)
- ✅ Default-deny principle (no policy = no access)

## 🔄 TODO (40%)

1. [ ] Apply policies to Supabase (run SQL scripts)
2. [ ] Create test users (customer, seller, admin)
3. [ ] Run test suite and verify
4. [ ] Update app code to use customer views
5. [ ] Document results

## 🔑 KEY SECURITY FIXES

| Issue | Before | After |
|-------|--------|-------|
| Cost price leak | Customer can SELECT | Customer uses view (no cost_price) |
| QR code leak | Customer can view | Customer uses view (no QR) |
| Cross-user access | Weak/missing | Strict per-user policies |
| Role enforcement | Inconsistent | Helper functions + clear policies |

## 📝 DEVELOPER NOTES

### Customer Queries:
```typescript
// ✅ USE THIS:
supabase.from('products_customer_view').select('*')

// ❌ NOT THIS:
supabase.from('products').select('*') // Will fail for customers
```

### Seller Queries:
```typescript
// ✅ OK: Seller can access products table (with cost_price)
supabase.from('products').select('*') // RLS filters to own products
```

## ⏭️ NEXT STEPS

1. Run part1 SQL in Supabase (5 min)
2. Run part2 SQL in Supabase (5 min)
3. Verify with test queries (10 min)
4. Update app code (20 min)

**Est. time to complete**: 1-2 hours

---

**Status**: Policies ready, need to apply & test
