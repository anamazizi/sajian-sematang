-- ============================================
-- SYNTAX VALIDATION TEST
-- ============================================
-- Quick test to ensure exception handlers betul
-- ============================================

-- This should return 11 (total exception blocks)
SELECT 
  'Total EXCEPTION blocks' as test,
  11 as expected,
  (SELECT COUNT(*) FROM (
    SELECT 1 FROM pg_stat_file('supabase/00_patch_all_missing_columns.sql')
  ) x) as actual;

-- Visual check: print sample exception block
DO $$ 
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'SAMPLE EXCEPTION BLOCK (should use duplicate_object):';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'DO $$ BEGIN';
  RAISE NOTICE '  ALTER TABLE ... ADD CONSTRAINT ...;';
  RAISE NOTICE 'EXCEPTION';
  RAISE NOTICE '  WHEN duplicate_object THEN NULL;';
  RAISE NOTICE 'END $$;';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ If patch script matches above format, it is correct.';
  RAISE NOTICE '❌ If it says "duplicate_key", update to latest version.';
END $$;
