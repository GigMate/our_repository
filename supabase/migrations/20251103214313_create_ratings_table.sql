/*
  # Create Ratings Table

  1. New Tables
    - `ratings`
      - `id` (uuid, primary key)
      - `rater_id` (uuid) - User giving the rating (venue/musician)
      - `rated_user_id` (uuid) - User being rated (fan/musician/venue)
      - `rating` (integer) - 1-5 stars
      - `comment` (text) - Optional feedback
      - `transaction_type` (text) - ticket, merchandise, booking, etc.
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on ratings table
    - Users can view their own ratings
    - Top tier users (platinum/gold) can view all ratings
    - Users can create ratings
*/

CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rated_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  transaction_type text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ratings"
  ON ratings
  FOR SELECT
  TO authenticated
  USING (rated_user_id = auth.uid() OR rater_id = auth.uid());

CREATE POLICY "Top tier users can view all ratings"
  ON ratings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tier_level IN ('platinum', 'gold')
    )
  );

CREATE POLICY "Users can create ratings"
  ON ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (rater_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_ratings_rated_user ON ratings(rated_user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rater ON ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created ON ratings(created_at DESC);