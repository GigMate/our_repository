import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserType = 'musician' | 'venue' | 'fan';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  user_type: UserType;
  average_rating: number;
  total_ratings: number;
  created_at: string;
  updated_at: string;
}

export interface Musician {
  id: string;
  stage_name: string;
  bio?: string;
  genres: string[];
  experience_years: number;
  website?: string;
  social_links?: Record<string, string>;
  hourly_rate?: number;
  equipment_description?: string;
  created_at: string;
}

export interface Venue {
  id: string;
  venue_name: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  capacity: number;
  amenities: string[];
  venue_type?: string;
  created_at: string;
}

export interface Gig {
  id: string;
  musician_id: string;
  venue_id: string;
  title: string;
  description?: string;
  gig_date: string;
  duration_hours: number;
  agreed_payment: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
}

export interface Merchandise {
  id: string;
  musician_id: string;
  name: string;
  description?: string;
  price: number;
  category: 'apparel' | 'album' | 'poster' | 'digital' | 'other';
  images: string[];
  inventory_count: number;
  is_active: boolean;
  is_limited_edition: boolean;
  variations?: Record<string, string[]>;
  created_at: string;
}

export interface Order {
  id: string;
  fan_id: string;
  musician_id: string;
  total_amount: number;
  status: 'pending' | 'paid' | 'fulfilled' | 'cancelled';
  fulfillment_type: 'shipping' | 'pickup';
  pickup_gig_id?: string;
  qr_code?: string;
  shipping_address?: Record<string, string>;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  merchandise_id: string;
  quantity: number;
  unit_price: number;
  variation_selection?: Record<string, string>;
  created_at: string;
}
