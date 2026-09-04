-- ============================================
-- PART 5: UPDATE/CREATE HELPER FUNCTION (SAFE VERSION)
-- ============================================

-- Use CREATE OR REPLACE instead of DROP + CREATE to avoid dependency issues
-- This is safer than dropping the function which has dependencies
CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'staff')
    AND COALESCE(is_active, true) = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;