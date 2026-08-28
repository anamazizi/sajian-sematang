-- ============================================
-- VERIFY COLUMNS BEFORE RUNNING RLS POLICIES
-- ============================================
-- Run skrip ini untuk check sama ada semua column
-- yang diperlukan oleh RLS policies sudah wujud
-- ============================================

\echo '================================'
\echo 'CHECKING CRITICAL COLUMNS'
\echo '================================'
\echo ''

-- Check SELLERS.user_id (yang sebabkan error semalam)
\echo 'Checking sellers.user_id...'
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'sellers' 
      AND column_name = 'user_id'
    ) 
    THEN '✅ sellers.user_id EXISTS'
    ELSE '❌ sellers.user_id MISSING - Run 00_patch_all_missing_columns.sql first!'
  END as check_result;

\echo ''

-- Check SELLERS.shop_name
\echo 'Checking sellers.shop_name...'
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'sellers' 
      AND column_name = 'shop_name'
    ) 
    THEN '✅ sellers.shop_name EXISTS'
    ELSE '❌ sellers.shop_name MISSING - Run 00_patch_all_missing_columns.sql first!'
  END as check_result;

\echo ''

-- Check PRODUCTS.category
\echo 'Checking products.category...'
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'products' 
      AND column_name = 'category'
    ) 
    THEN '✅ products.category EXISTS'
    ELSE '❌ products.category MISSING - Run 00_patch_all_missing_columns.sql first!'
  END as check_result;

\echo ''

-- Check USERS.is_active (diperlukan oleh helper functions)
\echo 'Checking users.is_active...'
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'is_active'
    ) 
    THEN '✅ users.is_active EXISTS'
    ELSE '❌ users.is_active MISSING - Run 00_patch_all_missing_columns.sql first!'
  END as check_result;

\echo ''

-- Check ORDER_ITEMS table exists
\echo 'Checking order_items table...'
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'order_items'
    ) 
    THEN '✅ order_items TABLE EXISTS'
    ELSE '❌ order_items TABLE MISSING - Run 00_patch_all_missing_columns.sql first!'
  END as check_result;

\echo ''

-- Check PAYOUTS table exists
\echo 'Checking payouts table...'
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'payouts'
    ) 
    THEN '✅ payouts TABLE EXISTS'
    ELSE '❌ payouts TABLE MISSING - Run 00_patch_all_missing_columns.sql first!'
  END as check_result;

\echo ''

-- Check AUDIT_LOGS table exists
\echo 'Checking audit_logs table...'
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'audit_logs'
    ) 
    THEN '✅ audit_logs TABLE EXISTS'
    ELSE '❌ audit_logs TABLE MISSING - Run 00_patch_all_missing_columns.sql first!'
  END as check_result;

\echo ''
\echo '================================'
\echo 'VERIFICATION COMPLETE'
\echo '================================'
\echo ''
\echo 'Jika semua ✅, anda boleh run RLS policies:'
\echo '  \\i supabase/rls_policies_final.sql'
\echo ''
\echo 'Jika ada ❌, run patch dahulu:'
\echo '  \\i supabase/00_patch_all_missing_columns.sql'
\echo ''
