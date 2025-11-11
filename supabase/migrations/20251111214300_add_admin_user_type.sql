/*
  # Add admin user type

  1. Changes
    - Add 'admin' to the user_type enum
  
  2. Security
    - No changes to RLS policies needed
*/

-- Add 'admin' to the user_type enum
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'admin';
