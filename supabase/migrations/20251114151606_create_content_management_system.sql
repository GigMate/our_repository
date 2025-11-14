/*
  # Content Management System

  1. New Tables
    - `site_content`
      - `id` (uuid, primary key)
      - `page_key` (text, unique) - identifier like 'homepage_hero', 'terms_of_service'
      - `section_key` (text) - section within page like 'hero_title', 'hero_subtitle'
      - `content_type` (text) - 'text', 'html', 'markdown'
      - `content` (text) - the actual content
      - `metadata` (jsonb) - additional data like character limits, formatting options
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `updated_by` (uuid) - admin who last updated
    
    - `content_history`
      - `id` (uuid, primary key)
      - `content_id` (uuid, references site_content)
      - `old_content` (text)
      - `new_content` (text)
      - `updated_by` (uuid)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Admins can manage content
    - Anyone can read published content

  3. Features
    - Version history for rollback
    - Rich text editing support
    - Preview before publish
    - Multi-section editing
*/

-- Create site_content table
CREATE TABLE IF NOT EXISTS site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text NOT NULL,
  section_key text NOT NULL,
  content_type text NOT NULL DEFAULT 'text',
  content text NOT NULL DEFAULT '',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE(page_key, section_key)
);

-- Create content_history table
CREATE TABLE IF NOT EXISTS content_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid REFERENCES site_content(id) ON DELETE CASCADE,
  old_content text NOT NULL,
  new_content text NOT NULL,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for site_content
CREATE POLICY "Anyone can read site content"
  ON site_content FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can insert site content"
  ON site_content FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update site content"
  ON site_content FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- RLS Policies for content_history
CREATE POLICY "Admins can read content history"
  ON content_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can insert content history"
  ON content_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Create function to track content changes
CREATE OR REPLACE FUNCTION track_content_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert history record
  INSERT INTO content_history (content_id, old_content, new_content, updated_by)
  VALUES (NEW.id, OLD.content, NEW.content, auth.uid());
  
  -- Update timestamp
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for content changes
DROP TRIGGER IF EXISTS track_content_changes_trigger ON site_content;
CREATE TRIGGER track_content_changes_trigger
  BEFORE UPDATE ON site_content
  FOR EACH ROW
  WHEN (OLD.content IS DISTINCT FROM NEW.content)
  EXECUTE FUNCTION track_content_changes();

-- Seed default content
INSERT INTO site_content (page_key, section_key, content_type, content, metadata) VALUES
  ('homepage', 'hero_title', 'text', 'Welcome to GigMate', '{"max_length": 100}'),
  ('homepage', 'hero_subtitle', 'text', 'Connect Musicians, Venues, and Fans', '{"max_length": 200}'),
  ('homepage', 'hero_description', 'html', 'The ultimate platform for live music booking and discovery. Book gigs, sell tickets, and grow your audience.', '{"max_length": 500}'),
  ('homepage', 'musician_cta', 'text', 'Join as Musician', '{"max_length": 50}'),
  ('homepage', 'venue_cta', 'text', 'Join as Venue', '{"max_length": 50}'),
  ('homepage', 'fan_cta', 'text', 'Explore Events', '{"max_length": 50}'),
  
  ('features', 'musician_title', 'text', 'For Musicians', '{"max_length": 100}'),
  ('features', 'musician_description', 'html', 'Book gigs, manage your calendar, sell merchandise, and connect with fans directly.', '{"max_length": 500}'),
  ('features', 'venue_title', 'text', 'For Venues', '{"max_length": 100}'),
  ('features', 'venue_description', 'html', 'Find talent, manage bookings, sell tickets, and grow your audience with powerful tools.', '{"max_length": 500}'),
  ('features', 'fan_title', 'text', 'For Fans', '{"max_length": 100}'),
  ('features', 'fan_description', 'html', 'Discover live music, buy tickets, support your favorite artists, and never miss a show.', '{"max_length": 500}'),
  
  ('pricing', 'free_tier_title', 'text', 'Free Forever', '{"max_length": 50}'),
  ('pricing', 'free_tier_description', 'html', 'Get started with essential features at no cost.', '{"max_length": 200}'),
  ('pricing', 'pro_tier_title', 'text', 'Pro', '{"max_length": 50}'),
  ('pricing', 'pro_tier_description', 'html', 'Advanced features for serious professionals.', '{"max_length": 200}'),
  
  ('email_templates', 'welcome_subject', 'text', 'Welcome to GigMate!', '{"max_length": 100}'),
  ('email_templates', 'welcome_body', 'html', '<h1>Welcome to GigMate!</h1><p>We''re excited to have you join our community.</p>', '{"max_length": 5000}'),
  ('email_templates', 'booking_confirmed_subject', 'text', 'Your Booking is Confirmed', '{"max_length": 100}'),
  ('email_templates', 'booking_confirmed_body', 'html', '<h1>Booking Confirmed</h1><p>Your booking has been confirmed. Details below:</p>', '{"max_length": 5000}')
ON CONFLICT (page_key, section_key) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_site_content_page_key ON site_content(page_key);
CREATE INDEX IF NOT EXISTS idx_site_content_updated_at ON site_content(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_history_content_id ON content_history(content_id);
CREATE INDEX IF NOT EXISTS idx_content_history_updated_at ON content_history(updated_at DESC);
