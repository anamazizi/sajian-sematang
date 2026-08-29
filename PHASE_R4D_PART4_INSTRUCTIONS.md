# Phase R4D Part 4: Order Options Integration

## Overview
Kemaskini sistem untuk simpan dan paparkan product options dalam order items.

## Step 1: Database Migration

### Migration 1: Add order_items.selected_options column
Buka **Supabase SQL Editor** dan jalankan fail: `supabase/10_add_order_item_options.sql`

### Migration 2: Update RPC with options support
Buka **Supabase SQL Editor** dan jalankan fail: `supabase/11_update_order_rpc_with_options.sql`

**Atau jalankan kedua-dua migration sekaligus:**
```bash
chmod +x scripts/apply-r4d-part4-migration.sh
./scripts/apply-r4d-part4-migration.sh
```

## Step 2: Update Server Action
✅ File: `app/actions/create-order.ts` - akan dikemaskini untuk pass selectedOptions

## Step 3: Update UI
✅ File: `app/order/[sellerId]/page.tsx` - akan dikemaskini untuk papar options

## Step 4: Verification
- Test order dengan product yang ada options
- Pastikan options disimpan dalam database
- Pastikan options dipaparkan dalam order summary
- Pastikan WhatsApp message termasuk options

## Files Modified
- ✅ `supabase/10_add_order_item_options.sql` (NEW)
- ✅ `supabase/11_update_order_rpc_with_options.sql` (NEW)
- ⏳ `app/actions/create-order.ts` (UPDATE)
- ⏳ `app/order/[sellerId]/page.tsx` (UPDATE)
- ⏳ `types/database.ts` (UPDATE - if needed)

## Security Features
- ✅ Server validates options exist
- ✅ Server validates options belong to product
- ✅ Server calculates option prices (tidak percaya client)
- ✅ Option snapshot disimpan (untuk audit trail)
- ✅ Price manipulation prevented
