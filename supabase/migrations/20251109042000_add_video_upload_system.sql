/*
  # Add Video Upload System

  1. New Tables
    - `videos`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `entity_type` (text) - 'venue', 'musician', 'event', 'product'
      - `entity_id` (uuid) - references the specific entity
      - `storage_path` (text) - path in Supabase Storage
      - `file_name` (text) - original file name
      - `file_size` (integer) - size in bytes
      - `mime_type` (text) - video mime type
      - `duration` (integer) - video duration in seconds
      - `thumbnail_path` (text) - auto-generated thumbnail
      - `is_featured` (boolean) - featured video for the entity
      - `display_order` (integer) - order for gallery display
      - `processing_status` (text) - 'pending', 'processing', 'ready', 'failed'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Storage Buckets
    - Create 'videos' bucket for storing user videos
    - Create 'thumbnails' bucket for video thumbnails

  3. Media Ownership
    - All uploaded media (images and videos) become property of GigMate
    - Users grant full rights upon upload
    - GigMate can use for any purpose including marketing

  4. Security
    - Enable RLS on `videos` table
    - Add policies for authenticated users to upload videos
    - Add storage policies for video upload/download
    - Videos are public for viewing but upload restricted

  5. Indexes
    - Index on entity_type and entity_id for fast lookups
    - Index on user_id for user's videos
*/

-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('venue', 'musician', 'event', 'product')),
  entity_id uuid NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer NOT NULL,
  mime_type text NOT NULL,
  duration integer DEFAULT 0,
  thumbnail_path text,
  is_featured boolean DEFAULT false,
  display_order integer DEFAULT 0,
  processing_status text DEFAULT 'ready' CHECK (processing_status IN ('pending', 'processing', 'ready', 'failed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_videos_entity ON videos(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_videos_user ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_featured ON videos(entity_type, entity_id, is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(processing_status) WHERE processing_status != 'ready';

-- Enable RLS
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for videos table
CREATE POLICY "Anyone can view videos"
  ON videos FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert videos"
  ON videos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos"
  ON videos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos"
  ON videos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  524288000,
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 524288000,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];

-- Create storage bucket for thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for videos bucket
CREATE POLICY "Authenticated users can upload videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Anyone can view videos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'videos');

CREATE POLICY "Users can update their own videos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for thumbnails bucket
CREATE POLICY "Authenticated users can upload thumbnails"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'thumbnails');

CREATE POLICY "Anyone can view thumbnails"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'thumbnails');

CREATE POLICY "Users can update their own thumbnails"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own thumbnails"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_videos_updated_at_trigger ON videos;
CREATE TRIGGER update_videos_updated_at_trigger
  BEFORE UPDATE ON videos
  FOR EACH ROW
  EXECUTE FUNCTION update_videos_updated_at();

-- Function to ensure only one featured video per entity
CREATE OR REPLACE FUNCTION ensure_single_featured_video()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_featured = true THEN
    UPDATE videos
    SET is_featured = false
    WHERE entity_type = NEW.entity_type
      AND entity_id = NEW.entity_id
      AND id != NEW.id
      AND is_featured = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure single featured video
DROP TRIGGER IF EXISTS ensure_single_featured_video_trigger ON videos;
CREATE TRIGGER ensure_single_featured_video_trigger
  BEFORE INSERT OR UPDATE ON videos
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_featured_video();

-- Add media_rights_accepted to profiles (tracks that user accepted ownership transfer)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS media_rights_accepted boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS media_rights_accepted_at timestamptz;

-- Function to track media rights acceptance
CREATE OR REPLACE FUNCTION record_media_rights_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.media_rights_accepted = true AND OLD.media_rights_accepted = false THEN
    NEW.media_rights_accepted_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for media rights acceptance
DROP TRIGGER IF EXISTS record_media_rights_acceptance_trigger ON profiles;
CREATE TRIGGER record_media_rights_acceptance_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION record_media_rights_acceptance();
