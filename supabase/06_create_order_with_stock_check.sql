-- Atomic Order Creation with Stock Check (RPC Function)
-- Phase R4A: Critical Security - Server-Side Validation
-- Created: 29/08/2026

-- Master Prompt Seksyen 19: STOCK CONCURRENCY
-- Master Prompt Seksyen 29: PRICE SECURITY
-- Master Prompt Seksyen 65: DATABASE TRANSACTION

DROP FUNCTION IF EXISTS public.create_order_with_stock_check(jsonb);

CREATE OR REPLACE FUNCTION public.create_order_with_stock_check(
  order_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS \$\$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_product record;
  v_calculated_subtotal decimal(10, 2) := 0;
  v_calculated_total_cost decimal(10, 2) := 0;
  v_delivery_fee decimal(10, 2);
  v_calculated_total decimal(10, 2);
BEGIN
  -- Validate required fields
  IF order_data->>'seller_id' IS NULL THEN
    RAISE EXCEPTION 'seller_id is required';
  END IF;

  IF order_data->>'customer_name' IS NULL OR order_data->>'customer_phone' IS NULL THEN
    RAISE EXCEPTION 'Customer name and phone are required';
  END IF;

  IF jsonb_array_length(order_data->'items') = 0 THEN
    RAISE EXCEPTION 'Order must have at least one item';
  END IF;

  v_delivery_fee := COALESCE((order_data->>'delivery_fee')::decimal(10, 2), 0);

  -- STEP 1: Validate stock and calculate totals
  FOR v_item IN SELECT * FROM jsonb_array_elements(order_data->'items')
  LOOP
    SELECT p.* INTO v_product
    FROM public.products p
    WHERE p.id = (v_item->>'product_id')::uuid
    FOR UPDATE; -- Lock row

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found: %%', v_item->>'product_id';
    END IF;

    IF NOT v_product.is_available THEN
      RAISE EXCEPTION 'Product not available: %%', v_product.name;
    END IF;

    -- Check stock (not for pre-order)
    IF NOT v_product.is_preorder THEN
      IF v_product.stock_quantity < (v_item->>'quantity')::integer THEN
        RAISE EXCEPTION 'Insufficient stock: %% (Available: %%, Requested: %%)', 
          v_product.name, v_product.stock_quantity, (v_item->>'quantity')::integer;
      END IF;
    END IF;

    -- Calculate using DATABASE prices
    v_calculated_subtotal := v_calculated_subtotal + 
      (v_product.price * (v_item->>'quantity')::integer);

    v_calculated_total_cost := v_calculated_total_cost + 
      (v_product.cost_price * (v_item->>'quantity')::integer);
  END LOOP;

  v_calculated_total := v_calculated_subtotal + v_delivery_fee;

  -- STEP 2: Validate total
  IF ABS(v_calculated_total - (order_data->>'total_price')::decimal(10, 2)) > 0.01 THEN
    RAISE EXCEPTION 'Price mismatch - Server: %%, Client: %%', 
      v_calculated_total, (order_data->>'total_price')::decimal(10, 2);
  END IF;

  -- STEP 3: Create order
  INSERT INTO public.orders (
    seller_id, customer_name, customer_phone, customer_address,
    customer_pin_location, delivery_mode, subtotal, delivery_fee,
    total_price, total_cost, calculated_distance, status,
    is_custom_preorder, delivery_datetime, special_notes,
    whatsapp_sent, created_by,
    customer_name_snapshot, customer_phone_snapshot,
    customer_address_snapshot, delivery_distance_snapshot,
    delivery_fee_snapshot
  ) VALUES (
    (order_data->>'seller_id')::uuid,
    order_data->>'customer_name',
    order_data->>'customer_phone',
    order_data->>'customer_address',
    order_data->>'customer_pin_location',
    COALESCE(order_data->>'delivery_mode', 'Self-Pickup'),
    v_calculated_subtotal,
    v_delivery_fee,
    v_calculated_total,
    v_calculated_total_cost,
    (order_data->>'calculated_distance')::decimal(10, 2),
    'New', false,
    (order_data->>'delivery_datetime')::timestamptz,
    order_data->>'special_notes',
    false, auth.uid(),
    order_data->>'customer_name',
    order_data->>'customer_phone',
    order_data->>'customer_address',
    (order_data->>'calculated_distance')::decimal(10, 2),
    v_delivery_fee
  ) RETURNING id INTO v_order_id;

  -- STEP 4: Create items & deduct stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(order_data->'items')
  LOOP
    SELECT p.* INTO v_product
    FROM public.products p
    WHERE p.id = (v_item->>'product_id')::uuid;

    INSERT INTO public.order_items (
      order_id, product_id, quantity, unit_price,
      product_name_snapshot, cost_price_snapshot
    ) VALUES (
      v_order_id, v_product.id,
      (v_item->>'quantity')::integer,
      v_product.price,
      v_product.name,
      v_product.cost_price
    );

    IF NOT v_product.is_preorder THEN
      UPDATE public.products
      SET stock_quantity = stock_quantity - (v_item->>'quantity')::integer
      WHERE id = v_product.id;
    END IF;
  END LOOP;

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'subtotal', v_calculated_subtotal,
    'delivery_fee', v_delivery_fee,
    'total', v_calculated_total,
    'message', 'Order created successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Order creation failed: ' || SQLERRM
    );
END;
\$\$;

GRANT EXECUTE ON FUNCTION public.create_order_with_stock_check(jsonb) TO authenticated;

COMMENT ON FUNCTION public.create_order_with_stock_check(jsonb) IS 
'Atomic order creation with stock validation and price verification';

DO \$\$
BEGIN
  RAISE NOTICE '✅ RPC Function created: create_order_with_stock_check()';
  RAISE NOTICE 'Features: Atomic stock check, server price validation, snapshots';
END \$\$;
