-- ============================================
-- SAJIAN SEMATANG - STORE LOCATION & DELIVERY FEE CALCULATION RPC
-- Migration untuk Seksyen 23 & 24 (Master Prompt)
-- ============================================
-- Tarikh: 14 September 2026
-- ============================================

-- BAHAGIAN 1: CREATE STORE SETTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.store_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    store_name text NOT NULL DEFAULT 'Sajian Sematang',
    address text,
    latitude numeric(10, 6) NOT NULL,
    longitude numeric(10, 6) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.store_settings IS 'Store location configuration for delivery fee calculation';

-- Insert default store location (Seri Manjung, Perak)
INSERT INTO public.store_settings (store_name, address, latitude, longitude, is_active)
VALUES (
    'Sajian Sematang',
    'Seri Manjung, Perak',
    4.2167,
    100.6333,
    true
)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read access to store settings" 
    ON public.store_settings FOR SELECT 
    USING (true);

CREATE POLICY "Only admin can insert store settings" 
    ON public.store_settings FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admin can update store settings" 
    ON public.store_settings FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
-- ============================================
-- BAHAGIAN 2: HAVERSINE DISTANCE FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.haversine_distance(
    lat1 numeric,
    lon1 numeric,
    lat2 numeric,
    lon2 numeric
)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    R constant numeric := 6371; -- Radius of Earth in kilometers
    dlat numeric;
    dlon numeric;
    a numeric;
    c numeric;
BEGIN
    -- Convert degrees to radians
    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    
    -- Haversine formula
    a := sin(dlat/2) * sin(dlat/2) + 
         cos(radians(lat1)) * cos(radians(lat2)) * 
         sin(dlon/2) * sin(dlon/2);
    
    c := 2 * atan2(sqrt(a), sqrt(1 - a));
    
    RETURN R * c;
END;
$$;

COMMENT ON FUNCTION public.haversine_distance IS 'Calculate distance between two coordinates using Haversine formula (result in kilometers)';

-- ============================================
-- BAHAGIAN 3: DELIVERY FEE CALCULATION RPC
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_delivery_fee(
    customer_latitude numeric,
    customer_longitude numeric,
    min_fee numeric DEFAULT 3
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    store_coords record;
    distance_km numeric;
    delivery_fee numeric;
BEGIN
    -- Get active store coordinates
    SELECT latitude, longitude INTO store_coords
    FROM public.store_settings
    WHERE is_active = true
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'error', 'Store location not configured',
            'distance_km', 0,
            'delivery_fee', min_fee
        );
    END IF;
    
    -- Calculate distance using Haversine
    distance_km := public.haversine_distance(
        store_coords.latitude,
        store_coords.longitude,
        customer_latitude,
        customer_longitude
    );
    
    -- Master Prompt Seksyen 24: Formula floor(distance_km)
    -- Minimum fee if distance < 1km
    IF distance_km < 1 THEN
        delivery_fee := min_fee;
    ELSE
        delivery_fee := floor(distance_km);
    END IF;
    
    -- Ensure fee is at least minimum
    IF delivery_fee < min_fee THEN
        delivery_fee := min_fee;
    END IF;
    
    RETURN jsonb_build_object(
        'distance_km', round(distance_km, 2),
        'delivery_fee', delivery_fee,
        'store_latitude', store_coords.latitude,
        'store_longitude', store_coords.longitude
    );
END;
$$;

COMMENT ON FUNCTION public.calculate_delivery_fee IS 'Calculate delivery fee based on customer coordinates (Server-side implementation for Master Prompt Seksyen 24)';

GRANT EXECUTE ON FUNCTION public.calculate_delivery_fee(numeric, numeric, numeric) TO authenticated, anon;

-- ============================================
-- BAHAGIAN 4: VERIFICATION
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration 20: Store Settings & Delivery Fee RPC berjaya dicipta';
    RAISE NOTICE '📌 Table: store_settings (RLS enabled)';
    RAISE NOTICE '📌 Function: haversine_distance()';
    RAISE NOTICE '📌 RPC: calculate_delivery_fee()';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  NEXT STEPS:';
    RAISE NOTICE '1. Frontend perlu update untuk panggil calculate_delivery_fee()';
    RAISE NOTICE '2. Remove hardcoded DEFAULT_STORE_COORDS dari lib/utils.ts';
    RAISE NOTICE '3. Update delivery fee calculation di app/order/[sellerId]/page.tsx';
END;
$$;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================