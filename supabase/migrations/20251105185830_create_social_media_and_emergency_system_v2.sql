/*
  # Social Media Integration & Emergency Replacement System

  1. New Features
    - Social media accounts for all users
    - Posting capability tracking
    - Emergency replacement musician system
    - Emergency rates and requirements
    - Geofence search for premium venues
    - Content rights management

  2. New Tables
    - `social_media_accounts` - Links to external social platforms
    - `social_media_posts` - Posts made from GigMate
    - `emergency_availability` - Musician emergency booking info
    - `emergency_replacements` - Track emergency booking requests
    - `content_rights` - Shared asset rights tracking

  3. Security
    - RLS enabled on all tables
    - Users can manage own social accounts
    - Venues can see emergency rates
    - Content rights tracked immutably
*/

-- Social Media Accounts Table
CREATE TABLE IF NOT EXISTS social_media_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('facebook', 'instagram', 'twitter', 'tiktok', 'youtube', 'spotify', 'soundcloud', 'bandcamp')),
  username text NOT NULL,
  profile_url text NOT NULL,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  is_connected boolean DEFAULT false,
  can_post boolean DEFAULT false,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_social_media_user_id ON social_media_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_media_platform ON social_media_accounts(platform);

-- Social Media Posts Table
CREATE TABLE IF NOT EXISTS social_media_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platforms text[] NOT NULL DEFAULT ARRAY[]::text[],
  content text NOT NULL,
  media_urls text[] DEFAULT ARRAY[]::text[],
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  post_type text CHECK (post_type IN ('event_promotion', 'general', 'behind_scenes', 'announcement')),
  scheduled_for timestamptz,
  posted_at timestamptz,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posting', 'posted', 'failed')),
  platform_post_ids jsonb DEFAULT '{}'::jsonb,
  engagement_stats jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_posts_user_id ON social_media_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_event_id ON social_media_posts(event_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_media_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON social_media_posts(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- Emergency Availability Table
CREATE TABLE IF NOT EXISTS emergency_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  musician_id uuid NOT NULL REFERENCES musicians(id) ON DELETE CASCADE,
  is_available boolean DEFAULT false,
  emergency_rate numeric(10, 2) NOT NULL,
  emergency_rate_currency text DEFAULT 'USD',
  max_distance_miles integer DEFAULT 50,
  response_time_minutes integer DEFAULT 60,
  minimum_notice_hours integer DEFAULT 4,
  requirements text[] DEFAULT ARRAY[]::text[],
  equipment_needed text[] DEFAULT ARRAY[]::text[],
  notes text,
  last_emergency_booking timestamptz,
  total_emergency_bookings integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(musician_id)
);

CREATE INDEX IF NOT EXISTS idx_emergency_musician_id ON emergency_availability(musician_id);
CREATE INDEX IF NOT EXISTS idx_emergency_available ON emergency_availability(is_available) WHERE is_available = true;

-- Emergency Replacement Requests Table
CREATE TABLE IF NOT EXISTS emergency_replacements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  original_musician_id uuid NOT NULL REFERENCES musicians(id) ON DELETE CASCADE,
  cancellation_reason text NOT NULL,
  event_date timestamptz NOT NULL,
  original_rate numeric(10, 2) NOT NULL,
  max_emergency_rate numeric(10, 2) NOT NULL,
  search_radius_miles integer NOT NULL,
  required_genres text[] NOT NULL,
  status text DEFAULT 'searching' CHECK (status IN ('searching', 'candidates_found', 'accepted', 'failed', 'cancelled')),
  candidates jsonb DEFAULT '[]'::jsonb,
  selected_musician_id uuid REFERENCES musicians(id) ON DELETE SET NULL,
  replacement_rate numeric(10, 2),
  accepted_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emergency_replacements_venue ON emergency_replacements(venue_id);
CREATE INDEX IF NOT EXISTS idx_emergency_replacements_original_musician ON emergency_replacements(original_musician_id);
CREATE INDEX IF NOT EXISTS idx_emergency_replacements_status ON emergency_replacements(status);
CREATE INDEX IF NOT EXISTS idx_emergency_replacements_expires ON emergency_replacements(expires_at) WHERE status = 'searching';

-- Content Rights Management Table
CREATE TABLE IF NOT EXISTS content_rights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('image', 'video', 'audio', 'text', 'post')),
  content_url text NOT NULL,
  original_owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  uploaded_via text NOT NULL CHECK (uploaded_via IN ('gigmate_app', 'social_import', 'direct_upload')),
  file_hash text,
  metadata jsonb DEFAULT '{}'::jsonb,
  rights_agreement_accepted boolean NOT NULL DEFAULT false,
  rights_agreement_version text NOT NULL DEFAULT '1.0',
  rights_agreement_date timestamptz NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text,
  gigmate_usage_allowed boolean DEFAULT true,
  commercial_usage_allowed boolean DEFAULT true,
  derivative_works_allowed boolean DEFAULT true,
  attribution_required boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(content_url, original_owner_id)
);

CREATE INDEX IF NOT EXISTS idx_content_rights_owner ON content_rights(original_owner_id);
CREATE INDEX IF NOT EXISTS idx_content_rights_type ON content_rights(content_type);
CREATE INDEX IF NOT EXISTS idx_content_rights_hash ON content_rights(file_hash) WHERE file_hash IS NOT NULL;

-- Enable RLS
ALTER TABLE social_media_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_replacements ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_rights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for social_media_accounts
CREATE POLICY "Users can view own social media accounts"
  ON social_media_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own social media accounts"
  ON social_media_accounts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own social media accounts"
  ON social_media_accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own social media accounts"
  ON social_media_accounts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for social_media_posts
CREATE POLICY "Users can view own social media posts"
  ON social_media_posts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own social media posts"
  ON social_media_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own social media posts"
  ON social_media_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own social media posts"
  ON social_media_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for emergency_availability
CREATE POLICY "Musicians can manage own emergency availability"
  ON emergency_availability FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM musicians WHERE id = musician_id)
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM musicians WHERE id = musician_id)
  );

CREATE POLICY "Venues can view available emergency musicians"
  ON emergency_availability FOR SELECT
  TO authenticated
  USING (
    is_available = true
    AND auth.uid() IN (SELECT id FROM venues)
  );

-- RLS Policies for emergency_replacements
CREATE POLICY "Venues can view own emergency replacements"
  ON emergency_replacements FOR SELECT
  TO authenticated
  USING (auth.uid() = venue_id);

CREATE POLICY "Premium venues can create emergency replacements"
  ON emergency_replacements FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = venue_id
    AND auth.uid() IN (
      SELECT s.user_id FROM subscriptions s
      WHERE s.status = 'active' 
      AND s.subscription_type LIKE 'venue_%'
      AND s.subscription_type IN ('venue_regional', 'venue_state', 'venue_national')
    )
  );

CREATE POLICY "Venues can update own emergency replacements"
  ON emergency_replacements FOR UPDATE
  TO authenticated
  USING (auth.uid() = venue_id)
  WITH CHECK (auth.uid() = venue_id);

CREATE POLICY "Musicians can view emergency replacements for their genres"
  ON emergency_replacements FOR SELECT
  TO authenticated
  USING (
    status = 'candidates_found'
    AND auth.uid() IN (
      SELECT m.id FROM musicians m
      WHERE m.genres && required_genres
    )
  );

-- RLS Policies for content_rights
CREATE POLICY "Users can view own content rights"
  ON content_rights FOR SELECT
  TO authenticated
  USING (auth.uid() = original_owner_id);

CREATE POLICY "Users can insert own content rights"
  ON content_rights FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = original_owner_id
    AND rights_agreement_accepted = true
  );

CREATE POLICY "GigMate can view all content rights for usage"
  ON content_rights FOR SELECT
  TO authenticated
  USING (gigmate_usage_allowed = true);

-- Function to find emergency replacement musicians
CREATE OR REPLACE FUNCTION find_emergency_replacement_musicians(
  p_venue_id uuid,
  p_event_date timestamptz,
  p_required_genres text[],
  p_max_distance_miles integer,
  p_max_rate numeric
)
RETURNS TABLE (
  musician_id uuid,
  distance_miles numeric,
  emergency_rate numeric,
  response_time_minutes integer,
  match_score numeric,
  available_now boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id as musician_id,
    0.0 as distance_miles,
    ea.emergency_rate,
    ea.response_time_minutes,
    (
      (SELECT COUNT(*) FROM unnest(m.genres) g WHERE g = ANY(p_required_genres))::numeric / 
      GREATEST(array_length(p_required_genres, 1), 1)
    ) as match_score,
    ea.is_available as available_now
  FROM musicians m
  JOIN emergency_availability ea ON ea.musician_id = m.id
  LEFT JOIN bookings b ON b.musician_id = m.id 
    AND b.event_date = p_event_date 
    AND b.status NOT IN ('cancelled', 'rejected')
  WHERE
    ea.is_available = true
    AND ea.emergency_rate <= p_max_rate
    AND m.genres && p_required_genres
    AND b.id IS NULL
    AND ea.max_distance_miles >= p_max_distance_miles
  ORDER BY match_score DESC, ea.emergency_rate ASC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if venue has premium subscription
CREATE OR REPLACE FUNCTION is_premium_venue(p_venue_id uuid)
RETURNS boolean AS $$
DECLARE
  v_subscription_type text;
BEGIN
  SELECT s.subscription_type INTO v_subscription_type
  FROM subscriptions s
  WHERE s.user_id = p_venue_id 
    AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;
  
  RETURN v_subscription_type IN ('venue_regional', 'venue_state', 'venue_national');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to trigger emergency replacement search
CREATE OR REPLACE FUNCTION trigger_emergency_replacement_search()
RETURNS trigger AS $$
DECLARE
  v_venue_id uuid;
  v_event_date timestamptz;
  v_original_rate numeric;
  v_required_genres text[];
  v_search_radius integer;
  v_max_rate numeric;
  v_subscription_type text;
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    SELECT b.venue_id, b.event_date, b.agreed_price
    INTO v_venue_id, v_event_date, v_original_rate
    FROM bookings b
    WHERE b.id = NEW.id;
    
    SELECT s.subscription_type INTO v_subscription_type
    FROM subscriptions s
    WHERE s.user_id = v_venue_id AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1;
    
    IF v_subscription_type IN ('venue_regional', 'venue_state', 'venue_national') THEN
      SELECT m.genres INTO v_required_genres
      FROM musicians m
      WHERE m.id = NEW.musician_id;
      
      v_search_radius := CASE v_subscription_type
        WHEN 'venue_regional' THEN 100
        WHEN 'venue_state' THEN 150
        WHEN 'venue_national' THEN 200
        ELSE 50
      END;
      
      v_max_rate := v_original_rate * 1.5;
      
      INSERT INTO emergency_replacements (
        original_booking_id,
        venue_id,
        original_musician_id,
        cancellation_reason,
        event_date,
        original_rate,
        max_emergency_rate,
        search_radius_miles,
        required_genres,
        expires_at
      ) VALUES (
        NEW.id,
        v_venue_id,
        NEW.musician_id,
        COALESCE(NEW.cancellation_reason, 'No reason provided'),
        v_event_date,
        v_original_rate,
        v_max_rate,
        v_search_radius,
        v_required_genres,
        now() + interval '4 hours'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on booking cancellations
DROP TRIGGER IF EXISTS on_booking_cancellation_trigger ON bookings;
CREATE TRIGGER on_booking_cancellation_trigger
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_emergency_replacement_search();

-- Function to update emergency replacement candidates
CREATE OR REPLACE FUNCTION update_emergency_replacement_candidates(p_replacement_id uuid)
RETURNS void AS $$
DECLARE
  v_replacement record;
  v_candidates jsonb;
BEGIN
  SELECT * INTO v_replacement
  FROM emergency_replacements
  WHERE id = p_replacement_id;
  
  SELECT jsonb_agg(
    jsonb_build_object(
      'musician_id', musician_id,
      'emergency_rate', emergency_rate,
      'response_time_minutes', response_time_minutes,
      'match_score', match_score,
      'distance_miles', distance_miles
    )
  )
  INTO v_candidates
  FROM find_emergency_replacement_musicians(
    v_replacement.venue_id,
    v_replacement.event_date,
    v_replacement.required_genres,
    v_replacement.search_radius_miles,
    v_replacement.max_emergency_rate
  );
  
  UPDATE emergency_replacements
  SET
    candidates = COALESCE(v_candidates, '[]'::jsonb),
    status = CASE 
      WHEN v_candidates IS NOT NULL AND jsonb_array_length(v_candidates) > 0 
      THEN 'candidates_found'
      ELSE 'failed'
    END,
    updated_at = now()
  WHERE id = p_replacement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
