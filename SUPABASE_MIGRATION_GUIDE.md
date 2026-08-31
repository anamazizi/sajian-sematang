# SUPABASE PRODUCTION MIGRATION GUIDE
## Database Migration Sequence for Production Deployment
## Date: 31 Ogos 2026

---

## 📋 MIGRATION OVERVIEW

### **Total Migration Files:** 13 Core Files (Numbered Sequence)
### **Migration Strategy:** Run in numerical order, each file idempotent
### **Target Environment:** Supabase Production (Singapore Region)
### **Estimated Time:** 30-45 minutes

---

## 🔢 MIGRATION SEQUENCE (RUN IN THIS ORDER)

### **PHASE 1: SCHEMA FOUNDATION**
```
File: 00_patch_all_missing_columns.sql
Purpose: Fix all missing columns and type mismatches
Status: ✅ REQUIRED (Foundational)
```

### **PHASE 2: USER PROFILE ENHANCEMENT**
```
File: 02_add_user_location_fields.sql
Purpose: Add latitude, longitude, google_maps_url to profiles
Status: ✅ REQUIRED (Customer location features)
```

### **PHASE 3: STORAGE BUCKETS**
```
File: 03_create_storage_buckets.sql
Purpose: Create product-images and seller-qr storage buckets with RLS
Status: ✅ REQUIRED (File upload functionality)
```

### **PHASE 4: STOCK MANAGEMENT**
```
File: 04_create_stock_movements_table.sql
Purpose: Create stock_movements table for auditable stock tracking
Status: ✅ REQUIRED (Stock history audit trail)
```

### **PHASE 5: ORDER SNAPSHOT SYSTEM**
```
File: 05_add_order_snapshot_fields.sql
Purpose: Add snapshot fields to order_items for historical data
Status: ✅ CRITICAL (Historical transaction integrity)
```

### **PHASE 6: ORDER CREATION RPC**
```
File: 06_create_order_with_stock_check.sql
Purpose: Create atomic RPC function for order creation with stock validation
Status: ✅ CRITICAL (Stock concurrency protection)
```

### **PHASE 7: PRODUCT OPTIONS SYSTEM**
```
File: 09_create_product_options_table.sql
Purpose: Create product_options table and related views
Status: ✅ REQUIRED (Product variants/add-ons)
```

### **PHASE 8: ORDER ITEM OPTIONS**
```
File: 10_add_order_item_options.sql
Purpose: Add order_item_options table for option snapshot
Status: ✅ REQUIRED (Option tracking in orders)
```

### **PHASE 9: UPDATE ORDER RPC WITH OPTIONS**
```
File: 11_update_order_rpc_with_options.sql
Purpose: Update RPC function to handle product options
Status: ✅ REQUIRED (Complete order functionality)
```

### **PHASE 10: RLS COST PRICE PROTECTION**
```
File: 13_fix_rls_cost_price_protection.sql
Purpose: Final RLS policies with cost_price protection
Status: ✅ CRITICAL (Security - customer cannot see cost_price)
```

### **PHASE 11: SELLER BANK FIELDS**
```
File: add_bank_fields_to_sellers.sql
Purpose: Add bank_name and bank_account to seller_profiles
Status: ✅ REQUIRED (Seller payment processing)
```

### **PHASE 12: FIX SELLER NAME COLUMN**
```
File: fix_sellers_name_column.sql
Purpose: Fix column naming consistency in seller_profiles
Status: ✅ REQUIRED (Data consistency)
```

---

## 🚀 QUICK MIGRATION SCRIPT

Buat file `run_production_migrations.sql` dengan content berikut:

```sql
-- Production Migration Script - Run in Supabase SQL Editor
-- WARNING: Backup database before running

-- 1. Schema Foundation
\i 00_patch_all_missing_columns.sql

-- 2. User Profile Enhancement  
\i 02_add_user_location_fields.sql

-- 3. Storage Buckets
\i 03_create_storage_buckets.sql

-- 4. Stock Management
\i 04_create_stock_movements_table.sql

-- 5. Order Snapshot System
\i 05_add_order_snapshot_fields.sql

-- 6. Order Creation RPC
\i 06_create_order_with_stock_check.sql

-- 7. Product Options System
\i 09_create_product_options_table.sql

-- 8. Order Item Options
\i 10_add_order_item_options.sql

-- 9. Update Order RPC with Options
\i 11_update_order_rpc_with_options.sql

-- 10. RLS Cost Price Protection
\i 13_fix_rls_cost_price_protection.sql

-- 11. Seller Bank Fields
\i add_bank_fields_to_sellers.sql

-- 12. Fix Seller Name Column
\i fix_sellers_name_column.sql

-- 13. Verification (Optional)
-- \i 12_verify_options_integration.sql
```