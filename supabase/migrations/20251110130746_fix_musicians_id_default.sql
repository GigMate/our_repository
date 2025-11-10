/*
  # Fix Musicians Table ID Default

  1. Problem
    - musicians.id column missing DEFAULT gen_random_uuid()
    - Seed functions fail with NULL constraint violation
    
  2. Solution
    - Add DEFAULT gen_random_uuid() to id column
    
  3. Security
    - No RLS changes
    - Only structural fix
*/

ALTER TABLE musicians 
ALTER COLUMN id SET DEFAULT gen_random_uuid();
