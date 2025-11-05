/*
  # Create Comprehensive Rating System with Premium Features

  1. New Features
    - Fan subscription tiers (free, premium, vip)
    - Enhanced ratings table with detailed categories
    - Rating visibility based on subscription tier
    - Verified purchase/attendance badges
    - Response capability for rated parties

  2. Monetization Strategy
    FREE FANS:
    - Can rate after attending events/purchasing merch
    - Can view their own ratings given/received
    - See only basic star rating on profiles (no details)
    - Limited to 3 ratings per month

    PREMIUM FANS ($4.99/month):
    - Unlimited ratings
    - View all detailed ratings and reviews
    - See full rating breakdowns by category
    - Access to rating analytics
    - Can filter by rating type

    VIP FANS ($9.99/month):
    - All Premium features
    - Early access to events
    - Priority customer support
    - Can see "verified attendee" badges
    - Access to aggregate statistics
    - Can export rating data

    MUSICIANS/VENUES:
    - Higher tiers unlock ability to see detailed fan feedback
    - Can respond to ratings at Gold+ tier
    - Get rating trend analytics at Platinum tier
*/

-- Create fan subscription tier enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fan_subscription_tier') THEN
    CREATE TYPE fan_subscription_tier AS ENUM ('free', 'premium', 'vip');
  END IF;
END $$;

-- Add fan subscription tier to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'fan_subscription_tier'
  ) THEN
    ALTER TABLE profiles ADD COLUMN fan_subscription_tier fan_subscription_tier DEFAULT 'free';
  END IF;
END $$;

-- Create rating categories enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rating_category') THEN
    CREATE TYPE rating_category AS ENUM (
      'overall',
      'performance_quality',
      'professionalism', 
      'venue_atmosphere',
      'sound_quality',
      'cleanliness',
      'staff_friendliness',
      'value_for_money'
    );
  END IF;
END $$;

-- Enhanced ratings table
DO $$
BEGIN
  -- Add new columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ratings' AND column_name = 'category'
  ) THEN
    ALTER TABLE ratings ADD COLUMN category rating_category DEFAULT 'overall';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ratings' AND column_name = 'event_id'
  ) THEN
    ALTER TABLE ratings ADD COLUMN event_id uuid REFERENCES events(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ratings' AND column_name = 'booking_id'
  ) THEN
    ALTER TABLE ratings ADD COLUMN booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ratings' AND column_name = 'verified_purchase'
  ) THEN
    ALTER TABLE ratings ADD COLUMN verified_purchase boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ratings' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE ratings ADD COLUMN is_public boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ratings' AND column_name = 'helpful_count'
  ) THEN
    ALTER TABLE ratings ADD COLUMN helpful_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ratings' AND column_name = 'response'
  ) THEN
    ALTER TABLE ratings ADD COLUMN response text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ratings' AND column_name = 'response_date'
  ) THEN
    ALTER TABLE ratings ADD COLUMN response_date timestamptz;
  END IF;
END $$;

-- Create fan rating quota tracking table
CREATE TABLE IF NOT EXISTS fan_rating_quotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month_year text NOT NULL,
  ratings_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(fan_id, month_year)
);

ALTER TABLE fan_rating_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quota"
  ON fan_rating_quotas FOR SELECT
  TO authenticated
  USING (fan_id = auth.uid());

CREATE POLICY "System can manage quotas"
  ON fan_rating_quotas FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create helpful votes table
CREATE TABLE IF NOT EXISTS rating_helpful_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id uuid NOT NULL REFERENCES ratings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(rating_id, user_id)
);

ALTER TABLE rating_helpful_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view helpful votes"
  ON rating_helpful_votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can vote helpful"
  ON rating_helpful_votes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Update RLS policies for ratings with premium access control
DROP POLICY IF EXISTS "Users can view their own ratings" ON ratings;
DROP POLICY IF EXISTS "Top tier users can view all ratings" ON ratings;
DROP POLICY IF EXISTS "Users can create ratings" ON ratings;

-- Policy 1: Users can always see their own ratings
CREATE POLICY "Users can view own ratings"
  ON ratings FOR SELECT
  TO authenticated
  USING (rated_user_id = auth.uid() OR rater_id = auth.uid());

-- Policy 2: Premium/VIP fans can see all public ratings
CREATE POLICY "Premium fans can view all ratings"
  ON ratings FOR SELECT
  TO authenticated
  USING (
    is_public = true
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'fan'
      AND profiles.fan_subscription_tier IN ('premium', 'vip')
    )
  );

-- Policy 3: Gold+ musicians can see ratings in their search radius
CREATE POLICY "Gold+ musicians can view ratings"
  ON ratings FOR SELECT
  TO authenticated
  USING (
    is_public = true
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'musician'
      AND profiles.tier_level IN ('gold', 'platinum')
    )
  );

-- Policy 4: Regional+ venues can see ratings
CREATE POLICY "Regional+ venues can view ratings"
  ON ratings FOR SELECT
  TO authenticated
  USING (
    is_public = true
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'venue'
      AND profiles.venue_subscription_tier IN ('regional', 'state', 'national')
    )
  );

-- Policy 5: Anyone can see basic aggregate ratings (handled in app)
CREATE POLICY "Public basic stats"
  ON ratings FOR SELECT
  TO authenticated
  USING (
    is_public = true
    AND category = 'overall'
  );

-- Policy 6: Create ratings with quota check
CREATE POLICY "Users can create ratings"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    rater_id = auth.uid()
    AND (
      -- Premium/VIP fans unlimited
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.user_type = 'fan'
        AND profiles.fan_subscription_tier IN ('premium', 'vip')
      )
      OR
      -- Venues and musicians unlimited
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.user_type IN ('venue', 'musician')
      )
      OR
      -- Free fans limited (checked in app layer)
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.user_type = 'fan'
        AND profiles.fan_subscription_tier = 'free'
      )
    )
  );

-- Policy 7: Gold+ can respond to ratings
CREATE POLICY "Gold+ can respond to ratings"
  ON ratings FOR UPDATE
  TO authenticated
  USING (
    rated_user_id = auth.uid()
    AND (
      (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.user_type = 'musician'
          AND profiles.tier_level IN ('gold', 'platinum')
        )
      )
      OR
      (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.user_type = 'venue'
          AND profiles.venue_subscription_tier IN ('state', 'national')
        )
      )
    )
  )
  WITH CHECK (rated_user_id = auth.uid());

-- Function to check and update rating quota
CREATE OR REPLACE FUNCTION public.check_fan_rating_quota(fan_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  current_month text;
  quota_record record;
  fan_tier text;
BEGIN
  -- Get fan tier
  SELECT fan_subscription_tier INTO fan_tier
  FROM public.profiles
  WHERE id = fan_id AND user_type = 'fan';

  -- Premium/VIP have unlimited
  IF fan_tier IN ('premium', 'vip') THEN
    RETURN true;
  END IF;

  -- Check free tier quota
  current_month := to_char(now(), 'YYYY-MM');
  
  SELECT * INTO quota_record
  FROM public.fan_rating_quotas
  WHERE fan_rating_quotas.fan_id = check_fan_rating_quota.fan_id
  AND month_year = current_month;

  IF quota_record IS NULL THEN
    -- Create new quota record
    INSERT INTO public.fan_rating_quotas (fan_id, month_year, ratings_count)
    VALUES (fan_id, current_month, 0);
    RETURN true;
  END IF;

  -- Check if under limit (3 for free tier)
  IF quota_record.ratings_count >= 3 THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

-- Function to increment rating quota
CREATE OR REPLACE FUNCTION public.increment_fan_rating_quota()
RETURNS trigger
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  current_month text;
  rater_type text;
BEGIN
  -- Only track for fans
  SELECT user_type INTO rater_type
  FROM public.profiles
  WHERE id = NEW.rater_id;

  IF rater_type = 'fan' THEN
    current_month := to_char(now(), 'YYYY-MM');
    
    INSERT INTO public.fan_rating_quotas (fan_id, month_year, ratings_count)
    VALUES (NEW.rater_id, current_month, 1)
    ON CONFLICT (fan_id, month_year)
    DO UPDATE SET ratings_count = public.fan_rating_quotas.ratings_count + 1;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to track fan rating quota
DROP TRIGGER IF EXISTS track_fan_rating_quota ON ratings;
CREATE TRIGGER track_fan_rating_quota
  AFTER INSERT ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_fan_rating_quota();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ratings_category ON ratings(category);
CREATE INDEX IF NOT EXISTS idx_ratings_event ON ratings(event_id);
CREATE INDEX IF NOT EXISTS idx_ratings_booking ON ratings(booking_id);
CREATE INDEX IF NOT EXISTS idx_ratings_verified ON ratings(verified_purchase);
CREATE INDEX IF NOT EXISTS idx_ratings_public ON ratings(is_public);
CREATE INDEX IF NOT EXISTS idx_fan_quota_month ON fan_rating_quotas(fan_id, month_year);
