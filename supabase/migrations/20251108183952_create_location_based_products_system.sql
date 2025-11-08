/*
  # Location-Based Products System

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `seller_id` (uuid, references profiles) - The business/person selling
      - `name` (text) - Product name
      - `description` (text) - Product description
      - `price` (decimal) - Product price
      - `category` (text) - Product category (e.g., 'merchandise', 'tickets', 'services')
      - `image_url` (text) - Product image URL
      - `video_url` (text, optional) - Product video URL
      - `latitude` (decimal) - Geographic latitude
      - `longitude` (decimal) - Geographic longitude
      - `address` (text) - Physical address
      - `city` (text)
      - `state` (text)
      - `zip_code` (text)
      - `stock_quantity` (integer) - Available quantity
      - `is_active` (boolean) - Whether product is available
      - `stripe_product_id` (text) - Stripe product ID
      - `stripe_price_id` (text) - Stripe price ID
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `products` table
    - Allow public to read active products
    - Allow sellers to manage their own products

  3. Indexes
    - Index on seller_id for seller queries
    - Index on category for filtering
    - Index on is_active for active product queries
    - Composite index on latitude/longitude for location queries

  4. Functions
    - `find_products_within_radius` - Find products within X miles of coordinates
    - `calculate_distance` - Calculate distance between two geographic points
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  price decimal(10, 2) NOT NULL CHECK (price >= 0),
  category text NOT NULL,
  image_url text,
  video_url text,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  address text,
  city text,
  state text,
  zip_code text,
  stock_quantity integer DEFAULT 0 CHECK (stock_quantity >= 0),
  is_active boolean DEFAULT true,
  stripe_product_id text,
  stripe_price_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Sellers can view own products"
  ON products FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert own products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own products"
  ON products FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete own products"
  ON products FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_lat_lon ON products(latitude, longitude);

-- Function to calculate distance in miles between two points using Haversine formula
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 decimal,
  lon1 decimal,
  lat2 decimal,
  lon2 decimal
)
RETURNS decimal
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN (
    3959 * acos(
      LEAST(1.0, GREATEST(-1.0,
        cos(radians(lat1)) * 
        cos(radians(lat2)) * 
        cos(radians(lon2) - radians(lon1)) + 
        sin(radians(lat1)) * 
        sin(radians(lat2))
      ))
    )
  );
END;
$$;

-- Function to find products within a radius (in miles)
CREATE OR REPLACE FUNCTION find_products_within_radius(
  user_lat decimal,
  user_lon decimal,
  radius_miles decimal DEFAULT 2
)
RETURNS TABLE (
  id uuid,
  seller_id uuid,
  name text,
  description text,
  price decimal,
  category text,
  image_url text,
  video_url text,
  latitude decimal,
  longitude decimal,
  address text,
  city text,
  state text,
  zip_code text,
  stock_quantity integer,
  distance_miles decimal,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.seller_id,
    p.name,
    p.description,
    p.price,
    p.category,
    p.image_url,
    p.video_url,
    p.latitude,
    p.longitude,
    p.address,
    p.city,
    p.state,
    p.zip_code,
    p.stock_quantity,
    calculate_distance(user_lat, user_lon, p.latitude, p.longitude) as distance_miles,
    p.created_at
  FROM products p
  WHERE 
    p.is_active = true
    AND p.stock_quantity > 0
    AND calculate_distance(user_lat, user_lon, p.latitude, p.longitude) <= radius_miles
  ORDER BY distance_miles ASC;
END;
$$;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();