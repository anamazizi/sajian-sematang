-- ============================================
-- ADD BANK FIELDS TO SELLERS TABLE
-- ============================================
-- Date: 30 Ogos 2026
-- Purpose: Add bank account information for payout processing
-- ============================================

-- Add bank information columns to sellers table
ALTER TABLE public.sellers 
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_account_number text,
  ADD COLUMN IF NOT EXISTS account_holder_name text;

-- Add comment for documentation
COMMENT ON COLUMN public.sellers.bank_name IS 'Bank name for payout (e.g., Maybank, CIMB, Bank Islam)';
COMMENT ON COLUMN public.sellers.bank_account_number IS 'Bank account number for payout';
COMMENT ON COLUMN public.sellers.account_holder_name IS 'Full name of account holder (as per bank account)';

-- Make duitnow_qr_url OPTIONAL (allow NULL)
ALTER TABLE public.sellers 
  ALTER COLUMN duitnow_qr_url DROP NOT NULL;

COMMENT ON COLUMN public.sellers.duitnow_qr_url IS 'DuitNow QR code URL (optional - can be uploaded later in profile)';

-- Verification query
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'sellers'
  AND column_name IN ('bank_name', 'bank_account_number', 'account_holder_name', 'duitnow_qr_url')
ORDER BY ordinal_position;
