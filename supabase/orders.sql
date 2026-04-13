-- =============================================
-- PEHCHAN — Orders & Order Items Schema
-- Append to Supabase SQL Editor (or run separately)
-- =============================================

-- Order status enum
CREATE TYPE order_status AS ENUM (
  'pending',
  'payment_received',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
);

-- Payment gateway enum
CREATE TYPE payment_gateway AS ENUM (
  'jazzCash',
  'easyPaisa',
  'xpay'
);

-- =============================================
-- ORDERS
-- =============================================
CREATE TABLE IF NOT EXISTS public.orders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Customer info (no auth required for MVP)
  customer_name     TEXT NOT NULL,
  customer_email    TEXT NOT NULL,
  customer_phone    TEXT NOT NULL,

  -- Shipping address
  address_line1     TEXT NOT NULL,
  city              TEXT NOT NULL,
  province          TEXT NOT NULL,

  -- Payment
  gateway           payment_gateway NOT NULL,
  -- Stores the simulated gateway transaction reference
  gateway_txn_ref   TEXT,

  -- Financials (server-verified totals only — never trust client)
  subtotal_pkr      NUMERIC(12, 2) NOT NULL,
  shipping_pkr      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_pkr         NUMERIC(12, 2) NOT NULL,

  status            order_status NOT NULL DEFAULT 'pending',

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ORDER ITEMS
-- =============================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id              UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id            UUID NOT NULL REFERENCES public.products(id),
  variant_id            TEXT,                    -- May be 'default' for MVP
  product_title         TEXT NOT NULL,           -- Snapshot at time of order
  product_image_url     TEXT,                    -- Snapshot at time of order
  quantity              INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_pkr        NUMERIC(10, 2) NOT NULL, -- Server-verified price snapshot
  -- JSONB column for POD customisation data (e.g. { "custom_name": "Ahmed", "upload_url": "..." })
  pod_customization     JSONB,
  is_pod                BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- UPDATED_AT TRIGGER on orders
-- =============================================
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Orders: NO public read. Only service_role (server) can read/write.
-- No client-facing policies needed — all writes go through the API route
-- which uses the service_role key to bypass RLS.

-- Allow the service_role (API route) full access — this is enforced by
-- Supabase automatically when using the service_role key.
-- Add explicit customer-facing read policy here if you add auth later:
-- CREATE POLICY "Customers can view their own orders"
--   ON public.orders FOR SELECT
--   USING (auth.uid() = customer_id);
