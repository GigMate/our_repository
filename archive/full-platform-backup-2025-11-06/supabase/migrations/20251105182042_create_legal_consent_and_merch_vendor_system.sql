/*
  # Legal Consent & Merch Vendor System

  1. New Tables
    - `legal_documents` - Terms, privacy policy, etc.
    - `user_consents` - Track all consent agreements
    - `merch_vendors` - Separate vendor profiles
    - `dropship_orders` - Dropship fulfillment tracking
    - `vendor_inventory` - Vendor product catalog
    - `vendor_shipping_options` - Delivery preferences
  
  2. Features
    - Multi-party consent tracking
    - Version control for legal documents
    - Audit trail for compliance
    - Separate merch vendor user type
    - Dropship fulfillment integration
    - Day-before and overnight shipping
  
  3. Security
    - Enable RLS on all tables
    - Consent required before platform access
    - GDPR/CCPA compliance ready
    - Audit logging
*/

-- Legal documents management
CREATE TABLE IF NOT EXISTS legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type text NOT NULL CHECK (document_type IN (
    'terms_of_service', 'privacy_policy', 'payment_terms', 
    'vendor_agreement', 'artist_agreement', 'venue_agreement',
    'fan_terms', 'merch_vendor_agreement', 'dropship_terms'
  )),
  version text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  effective_date timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  requires_consent boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(document_type, version)
);

-- User consent tracking
CREATE TABLE IF NOT EXISTS user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  document_id uuid REFERENCES legal_documents(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL,
  document_version text NOT NULL,
  consented_at timestamptz DEFAULT now(),
  ip_address inet,
  user_agent text,
  consent_method text CHECK (consent_method IN (
    'registration', 'profile_update', 'feature_access', 'explicit_agreement'
  )),
  is_active boolean DEFAULT true,
  UNIQUE(user_id, document_id)
);

-- Add merch vendor type to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_merch_vendor'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_merch_vendor boolean DEFAULT false;
    ALTER TABLE profiles ADD COLUMN vendor_business_name text;
    ALTER TABLE profiles ADD COLUMN vendor_tax_id text;
    ALTER TABLE profiles ADD COLUMN vendor_type text CHECK (vendor_type IN (
      'independent', 'dropshipper', 'manufacturer', 'distributor', 'hybrid'
    ));
  END IF;
END $$;

-- Merch vendor profiles (extended info)
CREATE TABLE IF NOT EXISTS merch_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  business_name text NOT NULL,
  business_type text CHECK (business_type IN (
    'individual', 'llc', 'corporation', 'partnership'
  )),
  tax_id text,
  business_address jsonb,
  phone text,
  email text,
  website text,
  product_categories text[] DEFAULT ARRAY[]::text[],
  fulfillment_methods text[] DEFAULT ARRAY['self_fulfillment']::text[] CHECK (
    fulfillment_methods <@ ARRAY['self_fulfillment', 'dropship_standard', 'dropship_overnight', 'gigmate_warehousing']
  ),
  minimum_order_value integer DEFAULT 0,
  accepts_custom_orders boolean DEFAULT false,
  production_lead_time_days integer DEFAULT 7,
  shipping_countries text[] DEFAULT ARRAY['US']::text[],
  commission_rate numeric DEFAULT 0.15 CHECK (commission_rate >= 0 AND commission_rate <= 1),
  rating numeric DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_orders integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  stripe_connect_account_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Vendor inventory catalog
CREATE TABLE IF NOT EXISTS vendor_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES merch_vendors(id) ON DELETE CASCADE NOT NULL,
  product_name text NOT NULL,
  product_category text NOT NULL CHECK (product_category IN (
    'apparel', 'accessories', 'music_media', 'posters_prints', 
    'instruments', 'equipment', 'custom', 'other'
  )),
  description text,
  base_price_cents integer NOT NULL CHECK (base_price_cents >= 0),
  wholesale_price_cents integer,
  variations jsonb DEFAULT '[]'::jsonb,
  available_quantity integer DEFAULT 0 CHECK (available_quantity >= 0),
  reorder_threshold integer DEFAULT 10,
  product_images text[] DEFAULT ARRAY[]::text[],
  product_sku text,
  weight_oz numeric,
  dimensions_inches jsonb,
  customizable boolean DEFAULT false,
  customization_options jsonb,
  dropship_available boolean DEFAULT false,
  production_time_days integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Dropship order management
CREATE TABLE IF NOT EXISTS dropship_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  vendor_id uuid REFERENCES merch_vendors(id) ON DELETE CASCADE NOT NULL,
  purchaser_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  purchaser_type text NOT NULL CHECK (purchaser_type IN (
    'musician', 'venue', 'fan', 'other_vendor'
  )),
  items jsonb NOT NULL,
  subtotal_cents integer NOT NULL,
  shipping_cost_cents integer NOT NULL,
  total_cents integer NOT NULL,
  gigmate_commission_cents integer NOT NULL,
  vendor_payout_cents integer NOT NULL,
  shipping_method text NOT NULL CHECK (shipping_method IN (
    'standard', 'expedited', 'day_before', 'overnight', 'pickup'
  )),
  delivery_address jsonb NOT NULL,
  delivery_date date,
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'production', 'shipped', 'delivered', 
    'cancelled', 'refunded', 'failed'
  )),
  tracking_number text,
  carrier text,
  payment_intent_id text,
  special_instructions text,
  estimated_production_date date,
  estimated_ship_date date,
  actual_ship_date date,
  actual_delivery_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Vendor shipping preferences
CREATE TABLE IF NOT EXISTS vendor_shipping_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES merch_vendors(id) ON DELETE CASCADE NOT NULL,
  method text NOT NULL CHECK (method IN (
    'standard', 'expedited', 'day_before', 'overnight'
  )),
  base_cost_cents integer NOT NULL,
  per_pound_cents integer DEFAULT 0,
  per_mile_cents integer DEFAULT 0,
  max_distance_miles integer,
  guaranteed_delivery boolean DEFAULT false,
  cutoff_time_hours integer,
  available_days text[] DEFAULT ARRAY['mon','tue','wed','thu','fri']::text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE merch_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE dropship_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_shipping_options ENABLE ROW LEVEL SECURITY;

-- RLS Policies for legal_documents
CREATE POLICY "Anyone can view active legal documents"
  ON legal_documents FOR SELECT
  USING (is_active = true);

-- RLS Policies for user_consents
CREATE POLICY "Users can view own consents"
  ON user_consents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own consents"
  ON user_consents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for merch_vendors
CREATE POLICY "Anyone can view active verified vendors"
  ON merch_vendors FOR SELECT
  USING (is_active = true AND is_verified = true);

CREATE POLICY "Vendors can manage own profile"
  ON merch_vendors FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for vendor_inventory
CREATE POLICY "Anyone can view active inventory"
  ON vendor_inventory FOR SELECT
  USING (
    is_active = true AND 
    EXISTS (
      SELECT 1 FROM merch_vendors 
      WHERE merch_vendors.id = vendor_inventory.vendor_id 
      AND merch_vendors.is_active = true
    )
  );

CREATE POLICY "Vendors can manage own inventory"
  ON vendor_inventory FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM merch_vendors 
      WHERE merch_vendors.id = vendor_inventory.vendor_id 
      AND merch_vendors.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM merch_vendors 
      WHERE merch_vendors.id = vendor_inventory.vendor_id 
      AND merch_vendors.user_id = auth.uid()
    )
  );

-- RLS Policies for dropship_orders
CREATE POLICY "Users can view own dropship orders"
  ON dropship_orders FOR SELECT
  TO authenticated
  USING (
    auth.uid() = purchaser_id OR
    EXISTS (
      SELECT 1 FROM merch_vendors 
      WHERE merch_vendors.id = dropship_orders.vendor_id 
      AND merch_vendors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create dropship orders"
  ON dropship_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = purchaser_id);

CREATE POLICY "Vendors can update own orders"
  ON dropship_orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM merch_vendors 
      WHERE merch_vendors.id = dropship_orders.vendor_id 
      AND merch_vendors.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM merch_vendors 
      WHERE merch_vendors.id = dropship_orders.vendor_id 
      AND merch_vendors.user_id = auth.uid()
    )
  );

-- RLS Policies for vendor_shipping_options
CREATE POLICY "Anyone can view active shipping options"
  ON vendor_shipping_options FOR SELECT
  USING (is_active = true);

CREATE POLICY "Vendors can manage own shipping options"
  ON vendor_shipping_options FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM merch_vendors 
      WHERE merch_vendors.id = vendor_shipping_options.vendor_id 
      AND merch_vendors.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM merch_vendors 
      WHERE merch_vendors.id = vendor_shipping_options.vendor_id 
      AND merch_vendors.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_legal_documents_type ON legal_documents(document_type, is_active);
CREATE INDEX IF NOT EXISTS idx_user_consents_user ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_document ON user_consents(document_id);
CREATE INDEX IF NOT EXISTS idx_merch_vendors_user ON merch_vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_merch_vendors_active ON merch_vendors(is_active, is_verified);
CREATE INDEX IF NOT EXISTS idx_vendor_inventory_vendor ON vendor_inventory(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_inventory_active ON vendor_inventory(is_active, dropship_available);
CREATE INDEX IF NOT EXISTS idx_dropship_orders_vendor ON dropship_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_dropship_orders_purchaser ON dropship_orders(purchaser_id);
CREATE INDEX IF NOT EXISTS idx_dropship_orders_status ON dropship_orders(status);
CREATE INDEX IF NOT EXISTS idx_dropship_orders_delivery_date ON dropship_orders(delivery_date);

-- Insert default legal documents
INSERT INTO legal_documents (document_type, version, title, content, effective_date) VALUES
(
  'terms_of_service',
  '1.0',
  'GigMate Terms of Service',
  'By using GigMate, you agree to these terms. You must be 18 years or older to use this platform. All users agree to act professionally and respectfully. GigMate reserves the right to remove any content or users that violate these terms. All transactions are subject to our payment processing terms. You are responsible for maintaining account security. GigMate is not liable for disputes between users. These terms may be updated with notice.',
  now()
),
(
  'privacy_policy',
  '1.0',
  'GigMate Privacy Policy',
  'GigMate collects and uses your data to provide services. We collect: profile information, payment details, messages, usage data, and location data. We use this to: match users, process payments, improve services, and prevent fraud. We may share data with: payment processors, analytics services, and law enforcement when required. You have the right to: access, correct, delete, and export your data. We use cookies and tracking. Data is stored securely and encrypted. Contact us for data requests.',
  now()
),
(
  'payment_terms',
  '1.0',
  'GigMate Payment Terms',
  'All payments processed through Stripe. GigMate charges commission on transactions. Payouts processed weekly via ACH. Refunds handled per our refund policy. You are responsible for taxes. Chargebacks may result in account suspension. Failed payments may result in service interruption. Currency is USD unless specified. Fees are non-refundable except as required by law.',
  now()
),
(
  'artist_agreement',
  '1.0',
  'Artist/Musician Agreement',
  'As an artist on GigMate, you agree to: provide accurate information, honor confirmed bookings, maintain professional conduct, pay applicable commissions, own rights to content you upload, not engage in fraud or misrepresentation, and comply with venue requirements. You retain ownership of your music and content. GigMate has license to display your content on the platform.',
  now()
),
(
  'venue_agreement',
  '1.0',
  'Venue Agreement',
  'As a venue on GigMate, you agree to: provide accurate venue information, honor confirmed bookings, pay agreed amounts to artists, maintain safe venues, carry appropriate insurance, comply with local regulations, pay applicable platform fees, and treat artists professionally. You are responsible for venue operations and liability.',
  now()
),
(
  'fan_terms',
  '1.0',
  'Fan Terms and Conditions',
  'As a fan on GigMate, you agree to: respect artists and venues, pay for tickets and merchandise, not engage in harassment or spam, comply with event rules, be responsible for your account security, and pay for premium messaging services. Ticket sales are final unless otherwise specified. You must be 18+ for some events.',
  now()
),
(
  'merch_vendor_agreement',
  '1.0',
  'Merchandise Vendor Agreement',
  'As a vendor on GigMate, you agree to: provide quality products, fulfill orders promptly, maintain accurate inventory, pay applicable commissions (15% standard), honor pricing, ship as promised, handle returns professionally, maintain business licenses, pay applicable taxes, and provide tracking information. GigMate is not liable for product quality or delivery issues between vendor and customer.',
  now()
),
(
  'dropship_terms',
  '1.0',
  'Dropship Service Terms',
  'Dropship services subject to availability and timing. Day-before delivery requires 48-hour notice. Overnight delivery requires 24-hour notice. Additional fees apply for expedited shipping. Vendor responsible for product quality. GigMate handles logistics only. Failed deliveries may result in refunds. Event-specific deadlines are firm. Custom products have longer lead times. Cancellations subject to production status.',
  now()
)
ON CONFLICT DO NOTHING;

-- Function to check user consent status
CREATE OR REPLACE FUNCTION check_user_consents(p_user_id uuid, p_user_type text)
RETURNS jsonb AS $$
DECLARE
  v_required_docs text[];
  v_missing_docs text[];
  v_result jsonb;
BEGIN
  -- Determine required documents based on user type
  v_required_docs := ARRAY['terms_of_service', 'privacy_policy', 'payment_terms'];
  
  IF p_user_type = 'musician' THEN
    v_required_docs := v_required_docs || 'artist_agreement';
  ELSIF p_user_type = 'venue' THEN
    v_required_docs := v_required_docs || 'venue_agreement';
  ELSIF p_user_type = 'fan' THEN
    v_required_docs := v_required_docs || 'fan_terms';
  END IF;
  
  -- Check for merch vendor
  IF EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id AND is_merch_vendor = true) THEN
    v_required_docs := v_required_docs || ARRAY['merch_vendor_agreement', 'dropship_terms'];
  END IF;
  
  -- Find missing consents
  SELECT array_agg(document_type) INTO v_missing_docs
  FROM legal_documents ld
  WHERE ld.document_type = ANY(v_required_docs)
    AND ld.is_active = true
    AND ld.requires_consent = true
    AND NOT EXISTS (
      SELECT 1 FROM user_consents uc
      WHERE uc.user_id = p_user_id
        AND uc.document_id = ld.id
        AND uc.is_active = true
    );
  
  -- Build result
  v_result := jsonb_build_object(
    'all_consents_given', (v_missing_docs IS NULL OR array_length(v_missing_docs, 1) IS NULL),
    'missing_documents', COALESCE(v_missing_docs, ARRAY[]::text[]),
    'required_documents', v_required_docs
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record user consent
CREATE OR REPLACE FUNCTION record_user_consent(
  p_user_id uuid,
  p_document_type text,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_consent_method text DEFAULT 'explicit_agreement'
)
RETURNS uuid AS $$
DECLARE
  v_document_id uuid;
  v_consent_id uuid;
BEGIN
  -- Get latest active document
  SELECT id INTO v_document_id
  FROM legal_documents
  WHERE document_type = p_document_type
    AND is_active = true
  ORDER BY effective_date DESC
  LIMIT 1;
  
  IF v_document_id IS NULL THEN
    RAISE EXCEPTION 'Document type % not found', p_document_type;
  END IF;
  
  -- Record consent
  INSERT INTO user_consents (
    user_id,
    document_id,
    document_type,
    document_version,
    ip_address,
    user_agent,
    consent_method
  )
  SELECT
    p_user_id,
    v_document_id,
    p_document_type,
    version,
    p_ip_address,
    p_user_agent,
    p_consent_method
  FROM legal_documents
  WHERE id = v_document_id
  ON CONFLICT (user_id, document_id) DO UPDATE
  SET consented_at = now(),
      is_active = true
  RETURNING id INTO v_consent_id;
  
  RETURN v_consent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate dropship delivery date
CREATE OR REPLACE FUNCTION calculate_dropship_delivery_date(
  p_vendor_id uuid,
  p_shipping_method text,
  p_event_date date DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_production_days integer;
  v_shipping_days integer;
  v_estimated_ship_date date;
  v_estimated_delivery_date date;
  v_cutoff_date date;
BEGIN
  -- Get vendor production time
  SELECT production_lead_time_days INTO v_production_days
  FROM merch_vendors
  WHERE id = p_vendor_id;
  
  -- Calculate shipping days
  v_shipping_days := CASE p_shipping_method
    WHEN 'overnight' THEN 1
    WHEN 'day_before' THEN 1
    WHEN 'expedited' THEN 2
    WHEN 'standard' THEN 5
    ELSE 7
  END;
  
  -- Calculate dates
  v_estimated_ship_date := CURRENT_DATE + v_production_days;
  v_estimated_delivery_date := v_estimated_ship_date + v_shipping_days;
  
  -- If event date specified, calculate cutoff
  IF p_event_date IS NOT NULL THEN
    IF p_shipping_method = 'day_before' THEN
      v_cutoff_date := p_event_date - v_production_days - 2;
    ELSIF p_shipping_method = 'overnight' THEN
      v_cutoff_date := p_event_date - v_production_days - 1;
    ELSE
      v_cutoff_date := p_event_date - v_production_days - v_shipping_days;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'estimated_ship_date', v_estimated_ship_date,
    'estimated_delivery_date', v_estimated_delivery_date,
    'order_cutoff_date', v_cutoff_date,
    'can_meet_deadline', (p_event_date IS NULL OR v_estimated_delivery_date <= p_event_date)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
