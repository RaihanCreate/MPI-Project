/*
# Stock Management Schema for Warkop Lengkong Baraca

This migration creates the database tables for a web-based stock/inventory management system
for a coffee shop (warkop). It supports product categories, products with stock levels,
and a transaction log for every stock-in and stock-out event.

1. New Tables

- `categories`
  - `id` (uuid, primary key)
  - `name` (text, not null) — category name e.g. "Minuman", "Makanan", "Sembako"
  - `description` (text) — optional description
  - `created_at` (timestamptz)

- `products`
  - `id` (uuid, primary key)
  - `name` (text, not null) — product name
  - `category_id` (uuid, FK to categories) — optional category
  - `sku` (text) — optional product code / barcode
  - `unit` (text, not null) — measurement unit e.g. "pcs", "kg", "box", "botol"
  - `stock_quantity` (numeric, default 0) — current stock on hand
  - `min_stock_level` (numeric, default 0) — low-stock threshold for alerts
  - `buy_price` (numeric, default 0) — purchase price per unit
  - `sell_price` (numeric, default 0) — selling price per unit
  - `created_at` (timestamptz)

- `stock_transactions`
  - `id` (uuid, primary key)
  - `product_id` (uuid, FK to products, not null) — which product was adjusted
  - `type` (text, not null) — 'in' for stock added, 'out' for stock removed
  - `quantity` (numeric, not null) — amount changed (always positive)
  - `note` (text) — optional description of the transaction
  - `created_at` (timestamptz)

2. Security

- RLS enabled on all three tables.
- This is a single-tenant app with no sign-in screen, so all policies
  use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
  because the data is intentionally shared/public.

3. Important Notes

- `stock_transactions` is the authoritative audit log. The frontend updates
  `products.stock_quantity` when inserting a transaction.
- A trigger auto-updates `products.stock_quantity` after every stock_transaction
  insert so the product stock stays in sync with the transaction log.
*/

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_categories" ON categories;
CREATE POLICY "anon_select_categories" ON categories FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
CREATE POLICY "anon_insert_categories" ON categories FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_categories" ON categories;
CREATE POLICY "anon_update_categories" ON categories FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_categories" ON categories;
CREATE POLICY "anon_delete_categories" ON categories FOR DELETE
TO anon, authenticated USING (true);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  sku text DEFAULT '',
  unit text NOT NULL DEFAULT 'pcs',
  stock_quantity numeric NOT NULL DEFAULT 0,
  min_stock_level numeric NOT NULL DEFAULT 0,
  buy_price numeric NOT NULL DEFAULT 0,
  sell_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_products" ON products;
CREATE POLICY "anon_insert_products" ON products FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "anon_delete_products" ON products FOR DELETE
TO anon, authenticated USING (true);

-- Stock transactions table
CREATE TABLE IF NOT EXISTS stock_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('in', 'out')),
  quantity numeric NOT NULL CHECK (quantity > 0),
  note text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_stock_transactions" ON stock_transactions;
CREATE POLICY "anon_select_stock_transactions" ON stock_transactions FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_stock_transactions" ON stock_transactions;
CREATE POLICY "anon_insert_stock_transactions" ON stock_transactions FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_stock_transactions" ON stock_transactions;
CREATE POLICY "anon_update_stock_transactions" ON stock_transactions FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_stock_transactions" ON stock_transactions;
CREATE POLICY "anon_delete_stock_transactions" ON stock_transactions FOR DELETE
TO anon, authenticated USING (true);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_product_id ON stock_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_created_at ON stock_transactions(created_at DESC);

-- Trigger: auto-update product stock when a transaction is inserted
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.type = 'in' THEN
    UPDATE products
    SET stock_quantity = stock_quantity + NEW.quantity
    WHERE id = NEW.product_id;
  ELSIF NEW.type = 'out' THEN
    UPDATE products
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_product_stock ON stock_transactions;
CREATE TRIGGER trg_update_product_stock
AFTER INSERT ON stock_transactions
FOR EACH ROW
EXECUTE FUNCTION update_product_stock();
