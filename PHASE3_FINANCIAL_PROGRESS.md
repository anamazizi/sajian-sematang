# 🏗️ Fasa 3: Financial System - IN PROGRESS

## 📋 Status

**Tarikh Mula**: 16 Ogos 2026  
**Status**: 🔄 Dalam Pembangunan (25% Selesai)

---

## ✅ Komponen Yang Telah Siap

### 1. **Payout Utility Functions** ✅
**File**: [`lib/financial/payout.ts`](lib/financial/payout.ts)

Functions yang telah dibuat:
- `calculateSellerOutstanding(sellerId)` - Kira tunggakan seller
- `getUnpaidOrders(sellerId)` - Dapatkan senarai order belum bayar
- `getAllSellersOutstanding()` - Dapatkan ringkasan semua seller
- `createPayout(params)` - Buat rekod payout
- `getSellerPayoutHistory(sellerId)` - Sejarah payout seller
- `verifyOrdersForPayout(sellerId, orderIds)` - Verify orders
- `calculateTotalCostFromOrders(orderIds)` - Kira jumlah kos

### 2. **WhatsApp Payout Receipt Generator** ✅
**File**: [`lib/utils.ts`](lib/utils.ts) (updated)

Function: `generatePayoutWhatsAppLink(payoutDetails)`

Format mesej:
```
🏦 RESIT PEMBAYARAN - SAJIAN SEMATANG

📋 Maklumat Pembayaran:
Penerima: [Nama Seller]
Jumlah: RM [Amount]
Kaedah: [Payment Method]
Rujukan: [Reference Number]
Tarikh: [Date]

📦 Pesanan Dibayar:
1. #12345678
2. #23456789
...

Jumlah Pesanan: X

---
Terima kasih atas perkhidmatan anda!
Sajian Sematang
```

---

## 🔄 Komponen Yang Perlu Dibuat

### 3. **Admin Payout Dashboard** ⏳
**File**: `app/admin/payouts/page.tsx`

Features yang perlu:
- List semua seller dengan tunggakan
- Display total outstanding untuk setiap seller
- Show QR DuitNow seller
- Button "Lihat Detail" untuk setiap seller
- Button "Sahkan Sudah Bayar"
- Filter & search functionality
- Export to CSV

**Struktur UI**:
```
┌─────────────────────────────────────────────────┐
│ 🏦 Dashboard Payout Admin                       │
├─────────────────────────────────────────────────┤
│ Total Tunggakan Semua Seller: RM X,XXX.XX      │
│ Jumlah Seller: XX                               │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ Kedai Mak Cik Kiah                          │ │
│ │ Tunggakan: RM 450.00                        │ │
│ │ Pesanan Selesai: 15                         │ │
│ │ [Lihat Detail] [Sahkan Sudah Bayar]         │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ Warung Pak Abu                              │ │
│ │ Tunggakan: RM 320.00                        │ │
│ │ Pesanan Selesai: 12                         │ │
│ │ [Lihat Detail] [Sahkan Sudah Bayar]         │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 4. **Seller Outstanding Component** ⏳
**File**: `components/admin/SellerOutstanding.tsx`

Props:
```typescript
interface SellerOutstandingProps {
  seller: SellerOutstandingSummary;
  onViewDetails: (sellerId: string) => void;
  onCreatePayout: (sellerId: string) => void;
}
```

Features:
- Display seller info
- Show outstanding amount
- Show unpaid orders count
- QR DuitNow display
- Action buttons

### 5. **Payout Modal Component** ⏳
**File**: `components/admin/PayoutModal.tsx`

Props:
```typescript
interface PayoutModalProps {
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  duitnowQrUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
```

Features:
- Show seller details
- Display QR DuitNow
- List unpaid orders dengan checkbox
- Calculate total amount
- Payment method selection
- Reference number input
- Notes textarea
- Confirm button yang:
  1. Create payout record
  2. Generate WhatsApp link
  3. Open WhatsApp
  4. Close modal
  5. Refresh data

### 6. **Product Form with Dual Pricing** ⏳
**File**: `components/products/ProductForm.tsx`

Fields to add:
```typescript
- price: number (Harga Jualan)
- cost_price: number (Harga Kos)
- margin: number (calculated: price - cost_price)
```

Validation:
- cost_price must be > 0
- price must be > cost_price
- Show margin percentage

---

## 📝 Implementation Guide

### Step 1: Create Admin Payout Dashboard

```typescript
// app/admin/payouts/page.tsx
'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { getAllSellersOutstanding } from '@/lib/financial/payout';
import SellerOutstanding from '@/components/admin/SellerOutstanding';
import PayoutModal from '@/components/admin/PayoutModal';

export default function AdminPayoutsPage() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  useEffect(() => {
    fetchSellers();
  }, []);

  async function fetchSellers() {
    const data = await getAllSellersOutstanding();
    setSellers(data);
    setLoading(false);
  }

  return (
    <ProtectedRoute requireAuth allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold">🏦 Dashboard Payout</h1>
          </div>
        </header>

        {/* Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Outstanding */}
            {/* Total Sellers */}
            {/* Pending Payouts */}
          </div>

          {/* Sellers List */}
          <div className="space-y-4">
            {sellers.map(seller => (
              <SellerOutstanding
                key={seller.seller_id}
                seller={seller}
                onViewDetails={() => {/* ... */}}
                onCreatePayout={() => {
                  setSelectedSeller(seller);
                  setShowPayoutModal(true);
                }}
              />
            ))}
          </div>
        </main>

        {/* Payout Modal */}
        {showPayoutModal && selectedSeller && (
          <PayoutModal
            sellerId={selectedSeller.seller_id}
            sellerName={selectedSeller.shop_name}
            sellerPhone={selectedSeller.phone_number}
            duitnowQrUrl={selectedSeller.duitnow_qr_url}
            isOpen={showPayoutModal}
            onClose={() => setShowPayoutModal(false)}
            onSuccess={() => {
              fetchSellers();
              setShowPayoutModal(false);
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
```

### Step 2: Create Seller Outstanding Component

```typescript
// components/admin/SellerOutstanding.tsx
export default function SellerOutstanding({ seller, onViewDetails, onCreatePayout }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold">{seller.shop_name}</h3>
          <p className="text-gray-600">{seller.phone_number}</p>
          <p className="text-2xl font-bold text-orange-600 mt-2">
            RM {seller.total_outstanding.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500">
            {seller.unpaid_orders_count} pesanan belum bayar
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => onViewDetails(seller.seller_id)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Lihat Detail
          </button>
          <button
            onClick={() => onCreatePayout(seller.seller_id)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            disabled={seller.total_outstanding === 0}
          >
            Sahkan Sudah Bayar
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Step 3: Create Payout Modal

```typescript
// components/admin/PayoutModal.tsx
export default function PayoutModal({
  sellerId,
  sellerName,
  sellerPhone,
  duitnowQrUrl,
  isOpen,
  onClose,
  onSuccess
}) {
  const [unpaidOrders, setUnpaidOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('DuitNow');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    // 1. Create payout
    const payout = await createPayout({...});
    
    // 2. Generate WhatsApp link
    const whatsappLink = generatePayoutWhatsAppLink({...});
    
    // 3. Open WhatsApp
    window.open(whatsappLink, '_blank');
    
    // 4. Success callback
    onSuccess();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal content */}
      </div>
    </div>
  );
}
```

---

## 🧪 Testing Checklist

- [ ] Calculate outstanding correctly
- [ ] Display all sellers with tunggakan
- [ ] QR DuitNow displayed properly
- [ ] Select orders for payout
- [ ] Calculate total amount correctly
- [ ] Create payout record
- [ ] Generate WhatsApp link
- [ ] WhatsApp opens with correct message
- [ ] Outstanding resets to RM0.00 after payout
- [ ] Payout history recorded

---

## 📚 Next Steps

1. **Complete Admin Payout Dashboard** - Implement full UI
2. **Create Seller Outstanding Component** - Reusable card component
3. **Create Payout Modal** - With QR display & order selection
4. **Update Product Form** - Add dual pricing fields
5. **Test Financial Calculations** - Verify all formulas
6. **Create Documentation** - Usage guide for admin

---

## 🔗 Related Files

- [`lib/financial/payout.ts`](lib/financial/payout.ts) - Payout utilities ✅
- [`lib/utils.ts`](lib/utils.ts) - WhatsApp generator ✅
- [`types/database.ts`](types/database.ts) - Type definitions ✅
- [`supabase/migration_business_structure.sql`](supabase/migration_business_structure.sql) - Database schema ✅

---

**Status**: 25% Complete  
**Estimated Time Remaining**: 4-6 hours  
**Next Priority**: Admin Payout Dashboard UI
