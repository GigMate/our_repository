/*
  # Add Bronze Value to Tier Level Enum

  1. Changes
    - Add 'bronze' to tier_level enum
*/

ALTER TYPE tier_level ADD VALUE IF NOT EXISTS 'bronze';
