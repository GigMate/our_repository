/*
  # Create Image Storage System

  1. New Tables
    - `images`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `entity_type` (text) - 'venue', 'musician', 'event'
      - `entity_id` (uuid) - references the specific entity
      - `storage_path` (text) - path in Supabase Storage
      - `file_name` (text) - original file name
      - `file_size` (integer) - size in bytes
      - `mime_type` (text) - image mime type
      - `is_primary` (boolean) - primary image for the entity
      - `display_order` (integer) - order for gallery display
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Storage Buckets
    - Create 'images' bucket for storing venue, musician, and event images

  3. Security
    - Enable RLS on `images` table
    - Add policies for authenticated users to manage their images
    - Add storage policies for image upload/download

  4. Indexes
    - Index on entity_type and entity_id for fast lookups
    - Index on user_id for user's images
*/

-- Create images table
CREATE TABLE IF NOT EXISTS images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('venue', 'musician', 'event')),
  entity_id uuid NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer NOT NULL,
  mime_type text NOT NULL,
  is_primary boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_images_entity ON images(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_images_user ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_primary ON images(entity_type, entity_id, is_primary) WHERE is_primary = true;

-- Enable RLS
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for images table
CREATE POLICY "Users can view all images"
  ON images FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own images"
  ON images FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own images"
  ON images FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own images"
  ON images FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for images bucket
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'images');

CREATE POLICY "Anyone can view images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'images');

CREATE POLICY "Users can update their own images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_images_updated_at_trigger ON images;
CREATE TRIGGER update_images_updated_at_trigger
  BEFORE UPDATE ON images
  FOR EACH ROW
  EXECUTE FUNCTION update_images_updated_at();

-- Function to ensure only one primary image per entity
CREATE OR REPLACE FUNCTION ensure_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE images
    SET is_primary = false
    WHERE entity_type = NEW.entity_type
      AND entity_id = NEW.entity_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure single primary image
DROP TRIGGER IF EXISTS ensure_single_primary_image_trigger ON images;
CREATE TRIGGER ensure_single_primary_image_trigger
  BEFORE INSERT OR UPDATE ON images
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_image();