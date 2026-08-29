-- Test Script for create_order_with_stock_check RPC
-- Phase R4A: Verification
-- Run this AFTER running migrations 05 and 06

-- Test 1: Valid order (should succeed)
SELECT create_order_with_stock_check('{
  "seller_id": "YOUR_SELLER_UUID_HERE",
  "customer_name": "Test Customer",
  "customer_phone": "0123456789",
  "customer_address": "Test Address",
  "customer_pin_location": "https://maps.google.com/?q=4.2167,100.6333",
  "delivery_mode": "Self-Pickup",
  "delivery_fee": 0,
  "calculated_distance": 0,
  "total_price": 10.00,
  "items": [
    {
      "product_id": "YOUR_PRODUCT_UUID_HERE",
      "quantity": 1
    }
  ]
}'::jsonb);

-- Test 2: Price mismatch (should fail)
SELECT create_order_with_stock_check('{
  "seller_id": "YOUR_SELLER_UUID_HERE",
  "customer_name": "Test Customer",
  "customer_phone": "0123456789",
  "total_price": 0.01,
  "items": [
    {
      "product_id": "YOUR_PRODUCT_UUID_HERE",
      "quantity": 1
    }
  ]
}'::jsonb);

-- Test 3: Insufficient stock (should fail)
-- First reduce product stock to 0
-- UPDATE products SET stock_quantity = 0 WHERE id = 'YOUR_PRODUCT_UUID';
-- Then try to order
SELECT create_order_with_stock_check('{
  "seller_id": "YOUR_SELLER_UUID_HERE",
  "customer_name": "Test Customer",
  "customer_phone": "0123456789",
  "total_price": 10.00,
  "items": [
    {
      "product_id": "YOUR_PRODUCT_UUID_HERE",
      "quantity": 1
    }
  ]
}'::jsonb);

-- Verify order created
SELECT * FROM orders ORDER BY created_at DESC LIMIT 1;

-- Verify order items with snapshot
SELECT 
  oi.*,
  p.name as current_product_name,
  p.price as current_price
FROM order_items oi
LEFT JOIN products p ON p.id = oi.product_id
ORDER BY oi.id DESC LIMIT 5;

-- Verify stock was deducted
SELECT id, name, stock_quantity FROM products 
WHERE id = 'YOUR_PRODUCT_UUID_HERE';

-- Verify stock movement was logged (from Phase R3E trigger)
SELECT * FROM stock_movements 
ORDER BY created_at DESC LIMIT 5;
