-- =============================================
-- PEHCHAN E-COMMERCE / POD STORE - Supabase Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

-- Products (standard apparel + POD)
CREATE TABLE IF NOT EXISTS public.products (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT NOT NULL,
  description   TEXT,
  base_price    NUMERIC(10, 2) NOT NULL,
  image_url     TEXT,
  category      TEXT,
  is_pod        BOOLEAN NOT NULL DEFAULT FALSE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Product Variants (size/color/SKU combos)
CREATE TABLE IF NOT EXISTS public.variants (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size          TEXT,                   -- e.g., 'XS', 'S', 'M', 'L', 'XL', 'XXL'
  color         TEXT,                   -- e.g., 'Midnight Black', 'Chalk White'
  color_hex     TEXT,                   -- e.g., '#1a1a1a'
  sku           TEXT UNIQUE,
  stock_count   INTEGER NOT NULL DEFAULT 0,
  price_delta   NUMERIC(10, 2) DEFAULT 0, -- Extra cost above base_price (e.g., XXL = +Rs 200)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- POD Customization Options (per product)
CREATE TABLE IF NOT EXISTS public.pod_options (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  option_type   TEXT NOT NULL, -- 'custom_name' | 'upload_image' | 'custom_text' | 'choose_color'
  label         TEXT NOT NULL, -- human-readable label shown in the UI (e.g., "Your Name")
  is_required   BOOLEAN NOT NULL DEFAULT FALSE,
  max_length    INTEGER,       -- For text fields: max characters allowed
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- UPDATED_AT TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.products   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variants   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pod_options ENABLE ROW LEVEL SECURITY;

-- PRODUCTS: Anyone can read active products (public storefront)
CREATE POLICY "Products are publicly readable"
  ON public.products FOR SELECT
  USING (is_active = TRUE);

-- VARIANTS: Anyone can read variants belonging to active products
CREATE POLICY "Variants are publicly readable"
  ON public.variants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id AND p.is_active = TRUE
    )
  );

-- POD_OPTIONS: Anyone can read POD options for active products
CREATE POLICY "POD options are publicly readable"
  ON public.pod_options FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id AND p.is_active = TRUE
    )
  );

-- ADMIN writes: only authenticated service_role can mutate (handled by server SDK)
-- Add specific INSERT/UPDATE/DELETE policies for authenticated admins if needed.

-- =============================================
-- SEED DATA (6 mock products matching the UI)
-- =============================================

INSERT INTO public.products (title, description, base_price, image_url, category, is_pod) VALUES
  ('AOP Essential Hoodie',  'Premium heavyweight 400 GSM French terry. All-Over Print ready.',       5500, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80',  'Heavyweight', TRUE),
  ('Graphic Tee - Midnight','Heavyweight 220 GSM ringspun cotton tee. Pre-shrunk.',                  2500, 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80',  'Graphic Tees', FALSE),
  ('Tech Cargo Pants',      '6-pocket utility cargo with ripstop outer shell.',                       4800, 'https://images.unsplash.com/photo-1523398002811-999aa8d9512e?w=800&q=80',  'Bottoms',      FALSE),
  ('Oversized Boxy Tee',    'Classic drop-shoulder boxy fit in 200 GSM cotton.',                     2200, 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80',  'Basics',       TRUE),
  ('Utility Vest - Onyx',   'Multi-pocket tactical vest with YKK® zippers.',                         3200, 'https://images.unsplash.com/photo-1509506489701-529edbd36077?w=800&q=80',  'Outerwear',    FALSE),
  ('Vintage Wash Denim',    'Enzyme-washed heavy denim with distressed detailing.',                   6000, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80',  'Bottoms',      FALSE)
ON CONFLICT DO NOTHING;
