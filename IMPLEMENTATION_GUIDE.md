# GigMate Implementation Guide
## Fixing the Top 10 Showstoppers

**Document Version:** 1.0
**Date:** November 4, 2025
**Status:** Ready for Implementation

---

## Table of Contents

1. [Stripe Payment Processing](#1-stripe-payment-processing)
2. [Complete Booking Workflow](#2-complete-booking-workflow)
3. [Email Notification System](#3-email-notification-system)
4. [In-App Messaging System](#4-in-app-messaging-system)
5. [Media Upload Capabilities](#5-media-upload-capabilities)
6. [Event Discovery & Search](#6-event-discovery--search)
7. [PWA & QR Code Tickets](#7-pwa--qr-code-tickets)
8. [Trust & Safety Features](#8-trust--safety-features)
9. [Analytics Dashboards](#9-analytics-dashboards)
10. [Legal Documents](#10-legal-documents)

---

## 1. Stripe Payment Processing

### Priority: CRITICAL (Must-Have for Launch)

### Overview
Integrate Stripe for all payment processing including bookings, subscriptions, ticket sales, and merchandise.

### Database Changes Required

```sql
-- Migration: add_stripe_integration.sql

-- Add Stripe customer IDs to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_account_id text UNIQUE;

-- Create subscription tracking table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE NOT NULL,
  stripe_price_id text NOT NULL,
  subscription_type text NOT NULL CHECK (subscription_type IN ('fan_premium', 'fan_vip', 'venue_local', 'venue_regional', 'venue_state', 'venue_national')),
  status text NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete')),
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create payment intents tracking
CREATE TABLE IF NOT EXISTS payment_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_payment_intent_id text UNIQUE NOT NULL,
  amount integer NOT NULL,
  currency text DEFAULT 'usd',
  status text NOT NULL,
  payment_type text NOT NULL CHECK (payment_type IN ('booking', 'ticket', 'merchandise', 'tip', 'subscription')),
  related_id uuid,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment intents"
  ON payment_intents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Update bookings table to track payment
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_intent_id uuid REFERENCES payment_intents(id),
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'succeeded', 'failed', 'refunded'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_user_id ON payment_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_stripe_id ON payment_intents(stripe_payment_intent_id);
```

### Environment Setup

#### Frontend Environment Variables (Vercel)

Add to Vercel project environment variables:

```bash
# Add to .env and Vercel
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

Get your publishable key from: https://dashboard.stripe.com/test/apikeys

#### Backend Secrets (Supabase Edge Functions)

Add these secrets in Supabase Dashboard at:
https://app.supabase.com/project/rmagqkuwulbcabxtzsjm/settings/functions

**Required Secrets:**

1. **STRIPE_SECRET_KEY**
   - Get from: https://dashboard.stripe.com/test/apikeys
   - Format: `sk_test_...`
   - Used by Edge Functions to process payments

2. **STRIPE_WEBHOOK_SECRET**
   - Get from: https://dashboard.stripe.com/test/webhooks (after creating endpoint)
   - Format: `whsec_...`
   - Pre-configured value: `whsec_ltO4viqDLNfnREkNcSU6Zr1CL7BgMJrT`
   - Used to verify webhook authenticity

**How to Add Secrets:**
1. Go to Supabase Dashboard -> Project Settings -> Edge Functions
2. Find "Secrets" section
3. Click "Add new secret"
4. Enter name and value
5. Click "Save"

### Implementation Files

**1. Stripe Configuration (`src/lib/stripe.ts`)**
```typescript
import { loadStripe, Stripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  throw new Error('Missing Stripe publishable key');
}

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};

export interface CreatePaymentIntentRequest {
  amount: number;
  currency: string;
  payment_type: 'booking' | 'ticket' | 'merchandise' | 'tip' | 'subscription';
  related_id: string;
  metadata: Record<string, any>;
}

export interface CreateSubscriptionRequest {
  price_id: string;
  subscription_type: string;
}
```

**2. Payment Hook (`src/hooks/usePayment.ts`)**
```typescript
import { useState } from 'react';
import { getStripe } from '../lib/stripe';
import { supabase } from '../lib/supabase';

export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPaymentIntent = async (
    amount: number,
    paymentType: string,
    relatedId: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fnError } = await supabase.functions.invoke(
        'create-payment-intent',
        {
          body: {
            amount,
            payment_type: paymentType,
            related_id: relatedId,
          },
        }
      );

      if (fnError) throw fnError;
      return data.clientSecret;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (
    clientSecret: string,
    paymentMethodId: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const stripe = await getStripe();
      if (!stripe) throw new Error('Stripe failed to load');

      const { error: stripeError } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: paymentMethodId,
        }
      );

      if (stripeError) throw stripeError;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (priceId: string, subscriptionType: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fnError } = await supabase.functions.invoke(
        'create-subscription',
        {
          body: {
            price_id: priceId,
            subscription_type: subscriptionType,
          },
        }
      );

      if (fnError) throw fnError;
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async (subscriptionId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: fnError } = await supabase.functions.invoke(
        'cancel-subscription',
        {
          body: { subscription_id: subscriptionId },
        }
      );

      if (fnError) throw fnError;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createPaymentIntent,
    processPayment,
    createSubscription,
    cancelSubscription,
  };
}
```

**3. Edge Functions**

Create three Supabase Edge Functions:

**a. `create-payment-intent` Function:**
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { amount, payment_type, related_id, metadata } = await req.json();

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'usd',
      metadata: {
        payment_type,
        related_id: related_id || '',
        ...metadata,
      },
    });

    // Save to database
    // (Add Supabase client code here to save payment intent)

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
```

**b. `create-subscription` Function:**
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { price_id, subscription_type } = await req.json();

    // Get user from auth header
    // Create or retrieve Stripe customer
    // Create subscription
    // Save to database

    const subscription = await stripe.subscriptions.create({
      customer: 'customer_id', // Retrieved from database
      items: [{ price: price_id }],
      metadata: {
        subscription_type,
      },
    });

    return new Response(
      JSON.stringify({ subscription }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
```

**c. `stripe-webhooks` Function:**
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  try {
    const event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);

    switch (event.type) {
      case 'payment_intent.succeeded':
        // Update booking/order status
        break;
      case 'payment_intent.payment_failed':
        // Handle failed payment
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        // Update subscription in database
        break;
      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

### Package Installation
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### Testing Checklist

#### Payment Processing
- [ ] Test successful payment: Use card `4242 4242 4242 4242`
- [ ] Test declined card: Use card `4000 0000 0000 0002`
- [ ] Test 3D Secure: Use card `4000 0027 6000 3184`
- [ ] Verify payment appears in Stripe Dashboard
- [ ] Check webhook events are received

#### Stripe Integration
- [ ] Verify STRIPE_SECRET_KEY is set in Supabase
- [ ] Verify STRIPE_WEBHOOK_SECRET is set in Supabase
- [ ] Verify VITE_STRIPE_PUBLISHABLE_KEY is set in Vercel
- [ ] Confirm webhook endpoint is active in Stripe Dashboard
- [ ] Test webhook signature verification

#### Subscriptions (if implemented)
- [ ] Test subscription creation
- [ ] Test subscription cancellation
- [ ] Verify subscription status updates
- [ ] Test payment failures

#### Escrow & Payouts (if implemented)
- [ ] Test escrow deposit
- [ ] Test escrow release
- [ ] Test refunds
- [ ] Verify platform fee deduction

### Stripe Dashboard Configuration

#### Step 1: Create Webhook Endpoint
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Enter URL: `https://rmagqkuwulbcabxtzsjm.supabase.co/functions/v1/stripe-webhook`
4. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click "Add endpoint"
6. Copy the webhook signing secret (starts with `whsec_...`)
7. Update `STRIPE_WEBHOOK_SECRET` in Supabase if different from default

#### Step 2: Create Product Prices (Optional for Subscriptions)
1. Go to: https://dashboard.stripe.com/test/products
2. Create products for each subscription tier:
   - Bronze: $9.99/month
   - Silver: $19.99/month
   - Gold: $49.99/month
   - Platinum: $99.99/month
3. Copy price IDs (start with `price_...`)
4. Update in your code if implementing subscriptions

#### Step 3: Test Mode
- Ensure you're in **Test mode** (toggle in top right)
- Use test credit card: `4242 4242 4242 4242`
- Any future date for expiry
- Any 3 digits for CVC

---

## 2. Complete Booking Workflow

### Priority: CRITICAL (Core Feature)

### Overview
Build end-to-end booking system with calendar, availability, requests, acceptance, and conflict detection.

### Database Changes Required

```sql
-- Migration: complete_booking_workflow.sql

-- Add availability calendar
CREATE TABLE IF NOT EXISTS availability_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  is_available boolean DEFAULT true,
  recurring_rule text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own availability"
  ON availability_slots FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Others can view availability"
  ON availability_slots FOR SELECT
  TO authenticated
  USING (true);

-- Update bookings table for workflow
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS request_status text DEFAULT 'pending'
  CHECK (request_status IN ('pending', 'accepted', 'declined', 'counter_offered', 'cancelled')),
ADD COLUMN IF NOT EXISTS counter_offer_amount numeric,
ADD COLUMN IF NOT EXISTS counter_offer_notes text,
ADD COLUMN IF NOT EXISTS cancellation_reason text,
ADD COLUMN IF NOT EXISTS cancellation_policy text,
ADD COLUMN IF NOT EXISTS rescheduled_from uuid REFERENCES bookings(id),
ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz,
ADD COLUMN IF NOT EXISTS start_time timestamptz,
ADD COLUMN IF NOT EXISTS end_time timestamptz;

-- Create booking conflicts check function
CREATE OR REPLACE FUNCTION check_booking_conflicts(
  p_user_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_exclude_booking_id uuid DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM bookings
    WHERE (musician_id = p_user_id OR venue_id = p_user_id)
    AND request_status IN ('accepted', 'pending')
    AND (id != p_exclude_booking_id OR p_exclude_booking_id IS NULL)
    AND (
      (start_time, end_time) OVERLAPS (p_start_time, p_end_time)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create booking request notification trigger
CREATE OR REPLACE FUNCTION notify_booking_request()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, related_id)
  VALUES (
    NEW.musician_id,
    'booking_request',
    'New Booking Request',
    'You have received a new booking request',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_booking_request_created
  AFTER INSERT ON bookings
  FOR EACH ROW
  WHEN (NEW.request_status = 'pending')
  EXECUTE FUNCTION notify_booking_request();
```

### Implementation Components

**1. Availability Calendar Component**
```typescript
// src/components/Shared/AvailabilityCalendar.tsx
import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function AvailabilityCalendar({ userId }: { userId: string }) {
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadAvailability();
  }, [userId, selectedDate]);

  const loadAvailability = async () => {
    const { data } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', selectedDate.toISOString());

    setAvailableSlots(data || []);
  };

  const toggleAvailability = async (slot: any) => {
    await supabase
      .from('availability_slots')
      .update({ is_available: !slot.is_available })
      .eq('id', slot.id);

    loadAvailability();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        Availability Calendar
      </h3>
      {/* Calendar implementation */}
    </div>
  );
}
```

**2. Booking Request Component**
```typescript
// src/components/Shared/BookingRequest.tsx
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { usePayment } from '../../hooks/usePayment';

interface BookingRequestProps {
  musicianId: string;
  venueId: string;
  onSuccess: () => void;
}

export function BookingRequest({ musicianId, venueId, onSuccess }: BookingRequestProps) {
  const { user } = useAuth();
  const { createPaymentIntent } = usePayment();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    offered_payment: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check for conflicts
      const { data: hasConflict } = await supabase
        .rpc('check_booking_conflicts', {
          p_user_id: musicianId,
          p_start_time: formData.start_time,
          p_end_time: formData.end_time,
        });

      if (hasConflict) {
        alert('This time slot conflicts with an existing booking');
        return;
      }

      // Create booking request
      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          musician_id: musicianId,
          venue_id: venueId,
          title: formData.title,
          description: formData.description,
          start_time: formData.start_time,
          end_time: formData.end_time,
          offered_payment: formData.offered_payment,
          request_status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Create payment intent for escrow
      await createPaymentIntent(
        formData.offered_payment,
        'booking',
        booking.id
      );

      onSuccess();
    } catch (error) {
      console.error('Booking error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form fields */}
    </form>
  );
}
```

**3. Booking Management Component**
```typescript
// src/components/Shared/BookingManager.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export function BookingManager() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    loadBookings();
  }, [profile]);

  const loadBookings = async () => {
    if (!profile) return;

    const query = supabase
      .from('bookings')
      .select('*, musician:profiles!musician_id(*), venue:profiles!venue_id(*)');

    if (profile.user_type === 'musician') {
      query.eq('musician_id', profile.id);
    } else if (profile.user_type === 'venue') {
      query.eq('venue_id', profile.id);
    }

    const { data } = await query;
    setBookings(data || []);
  };

  const handleAccept = async (bookingId: string) => {
    await supabase
      .from('bookings')
      .update({ request_status: 'accepted' })
      .eq('id', bookingId);

    loadBookings();
  };

  const handleDecline = async (bookingId: string) => {
    await supabase
      .from('bookings')
      .update({ request_status: 'declined' })
      .eq('id', bookingId);

    loadBookings();
  };

  const handleCounterOffer = async (bookingId: string, amount: number, notes: string) => {
    await supabase
      .from('bookings')
      .update({
        request_status: 'counter_offered',
        counter_offer_amount: amount,
        counter_offer_notes: notes,
      })
      .eq('id', bookingId);

    loadBookings();
  };

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <div key={booking.id} className="bg-white rounded-lg shadow p-6">
          {/* Booking details and action buttons */}
        </div>
      ))}
    </div>
  );
}
```

### Testing Checklist
- [ ] Create booking request
- [ ] Check conflict detection
- [ ] Accept booking
- [ ] Decline booking
- [ ] Counter-offer booking
- [ ] Cancel booking
- [ ] Reschedule booking
- [ ] Test availability calendar
- [ ] Test recurring availability
- [ ] Test reminder notifications

---

## 3. Email Notification System

### Priority: CRITICAL (User Engagement)

### Overview
Implement transactional email system using Supabase Edge Functions and a service like Resend or SendGrid.

### Edge Function Implementation

```typescript
// supabase/functions/send-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface EmailRequest {
  to: string;
  template: string;
  data: Record<string, any>;
}

const templates = {
  booking_request: {
    subject: 'New Booking Request',
    html: (data: any) => `
      <h1>New Booking Request</h1>
      <p>You have received a booking request from ${data.venue_name}</p>
      <p><strong>Event:</strong> ${data.title}</p>
      <p><strong>Date:</strong> ${data.date}</p>
      <p><strong>Payment:</strong> $${data.payment}</p>
      <a href="${data.link}">View Booking</a>
    `,
  },
  booking_accepted: {
    subject: 'Booking Accepted',
    html: (data: any) => `
      <h1>Booking Accepted!</h1>
      <p>${data.musician_name} has accepted your booking request.</p>
      <p><strong>Event:</strong> ${data.title}</p>
      <p><strong>Date:</strong> ${data.date}</p>
      <a href="${data.link}">View Details</a>
    `,
  },
  booking_reminder: {
    subject: 'Event Reminder',
    html: (data: any) => `
      <h1>Event Reminder</h1>
      <p>Your event is coming up in 24 hours!</p>
      <p><strong>Event:</strong> ${data.title}</p>
      <p><strong>Date:</strong> ${data.date}</p>
      <p><strong>Location:</strong> ${data.location}</p>
    `,
  },
  ticket_purchase: {
    subject: 'Ticket Purchase Confirmation',
    html: (data: any) => `
      <h1>Ticket Purchase Confirmed</h1>
      <p>Thank you for your purchase!</p>
      <p><strong>Event:</strong> ${data.event_name}</p>
      <p><strong>Quantity:</strong> ${data.quantity}</p>
      <p><strong>Total:</strong> $${data.total}</p>
      <p>Your tickets are attached as QR codes.</p>
    `,
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { to, template, data }: EmailRequest = await req.json();

    const templateConfig = templates[template as keyof typeof templates];
    if (!templateConfig) {
      throw new Error(`Unknown template: ${template}`);
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'GigMate <notifications@gigmate.us>',
        to,
        subject: templateConfig.subject,
        html: templateConfig.html(data),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### Database Trigger for Automated Emails

```sql
-- Create notification queue table
CREATE TABLE IF NOT EXISTS email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  template text NOT NULL,
  data jsonb NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  attempts integer DEFAULT 0,
  last_attempt_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Trigger to queue emails on booking events
CREATE OR REPLACE FUNCTION queue_booking_notification_email()
RETURNS TRIGGER AS $$
DECLARE
  musician_email text;
  venue_email text;
BEGIN
  -- Get emails
  SELECT email INTO musician_email FROM profiles WHERE id = NEW.musician_id;
  SELECT email INTO venue_email FROM profiles WHERE id = NEW.venue_id;

  -- Notify musician of new request
  IF NEW.request_status = 'pending' AND OLD.request_status IS NULL THEN
    INSERT INTO email_queue (recipient_email, template, data)
    VALUES (
      musician_email,
      'booking_request',
      jsonb_build_object(
        'title', NEW.title,
        'venue_name', (SELECT full_name FROM profiles WHERE id = NEW.venue_id),
        'date', NEW.start_time,
        'payment', NEW.offered_payment,
        'link', 'https://gigmate.us/bookings/' || NEW.id
      )
    );
  END IF;

  -- Notify venue of acceptance
  IF NEW.request_status = 'accepted' AND OLD.request_status = 'pending' THEN
    INSERT INTO email_queue (recipient_email, template, data)
    VALUES (
      venue_email,
      'booking_accepted',
      jsonb_build_object(
        'title', NEW.title,
        'musician_name', (SELECT full_name FROM profiles WHERE id = NEW.musician_id),
        'date', NEW.start_time,
        'link', 'https://gigmate.us/bookings/' || NEW.id
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_booking_status_change
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION queue_booking_notification_email();
```

### Background Worker to Process Queue

```typescript
// supabase/functions/process-email-queue/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get pending emails
    const { data: emails } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .order('created_at')
      .limit(10);

    for (const email of emails || []) {
      try {
        // Send email via send-email function
        await supabase.functions.invoke('send-email', {
          body: {
            to: email.recipient_email,
            template: email.template,
            data: email.data,
          },
        });

        // Mark as sent
        await supabase
          .from('email_queue')
          .update({ status: 'sent' })
          .eq('id', email.id);
      } catch (error) {
        // Mark as failed and increment attempts
        await supabase
          .from('email_queue')
          .update({
            status: 'failed',
            attempts: email.attempts + 1,
            last_attempt_at: new Date().toISOString(),
            error_message: error.message,
          })
          .eq('id', email.id);
      }
    }

    return new Response(
      JSON.stringify({ processed: emails.length || 0 }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

### Setup Instructions
1. Sign up for Resend (resend.com) - free tier: 100 emails/day
2. Add API key to Supabase secrets
3. Deploy edge functions
4. Set up cron job to run `process-email-queue` every 5 minutes
5. Test all email templates

---

## 4. In-App Messaging System

### Priority: HIGH (User Engagement)

### Overview
Build real-time messaging using Supabase Realtime for booking negotiations and customer support.

### Database Schema

```sql
-- Migration: create_messaging_system.sql

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  participant_2_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  related_booking_id uuid REFERENCES bookings(id),
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(participant_1_id, participant_2_id, related_booking_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  attachments jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (auth.uid() IN (participant_1_id, participant_2_id));

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IN (participant_1_id, participant_2_id));

CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND auth.uid() IN (participant_1_id, participant_2_id)
    )
  );

CREATE POLICY "Users can send messages to their conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND auth.uid() IN (participant_1_id, participant_2_id)
    )
    AND auth.uid() = sender_id
  );

CREATE INDEX idx_conversations_participants ON conversations(participant_1_id, participant_2_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
```

### Implementation

```typescript
// src/components/Shared/MessagingPanel.tsx
import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender: {
    full_name: string;
    avatar_url: string;
  };
}

interface MessagingPanelProps {
  recipientId: string;
  recipientName: string;
  bookingId: string;
}

export function MessagingPanel({ recipientId, recipientName, bookingId }: MessagingPanelProps) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !recipientId) return;

    // Get or create conversation
    initConversation();
  }, [user, recipientId, bookingId]);

  useEffect(() => {
    if (!conversationId) return;

    // Load messages
    loadMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId]);

  const initConversation = async () => {
    if (!user) return;

    // Try to find existing conversation
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
      .or(`participant_1_id.eq.${recipientId},participant_2_id.eq.${recipientId}`)
      .maybeSingle();

    if (existing) {
      setConversationId(existing.id);
    } else {
      // Create new conversation
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          participant_1_id: user.id,
          participant_2_id: recipientId,
          related_booking_id: bookingId,
        })
        .select('id')
        .single();

      setConversationId(newConv.id || null);
    }
  };

  const loadMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(full_name, avatar_url)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    setMessages(data || []);
    scrollToBottom();

    // Mark messages as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user!.id);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId) return;

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user!.id,
      content: newMessage.trim(),
    });

    // Update conversation last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    setNewMessage('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        <h3 className="font-semibold">{recipientName}</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender_id === user.id 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.sender_id === user.id
                  'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <span className="text-xs opacity-70">
                {new Date(message.created_at).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 5. Media Upload Capabilities

### Priority: HIGH (User Experience)

### Overview
Add photo, video, and audio upload capabilities to profiles using Supabase Storage.

### Storage Bucket Setup

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('profile-media', 'profile-media', true),
  ('event-media', 'event-media', true),
  ('merchandise-media', 'merchandise-media', true);

-- Set up storage policies
CREATE POLICY "Users can upload own profile media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view all profile media"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'profile-media');

CREATE POLICY "Users can delete own profile media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Database Changes

```sql
-- Add media columns to tables
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS media_gallery jsonb DEFAULT '[]'::jsonb;

ALTER TABLE musicians
ADD COLUMN IF NOT EXISTS audio_samples jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS video_samples jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS photo_gallery jsonb DEFAULT '[]'::jsonb;

ALTER TABLE venues
ADD COLUMN IF NOT EXISTS photo_gallery jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS virtual_tour_url text;

ALTER TABLE events
ADD COLUMN IF NOT EXISTS cover_image text,
ADD COLUMN IF NOT EXISTS gallery_images jsonb DEFAULT '[]'::jsonb;
```

### Implementation

```typescript
// src/components/Shared/MediaUploader.tsx
import { useState, useRef } from 'react';
import { Upload, X, Image, Music, Video } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface MediaUploaderProps {
  userId: string;
  mediaType: 'photo' | 'audio' | 'video';
  maxFiles: number;
  onUploadComplete: (urls: string[]) => void;
}

export function MediaUploader({ userId, mediaType, maxFiles = 10, onUploadComplete }: MediaUploaderProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAcceptedTypes = () => {
    switch (mediaType) {
      case 'photo':
        return 'image/jpeg,image/png,image/webp';
      case 'audio':
        return 'audio/mpeg,audio/wav,audio/mp3';
      case 'video':
        return 'video/mp4,video/webm';
    }
  };

  const getMaxSizeMB = () => {
    switch (mediaType) {
      case 'photo':
        return 5;
      case 'audio':
        return 10;
      case 'video':
        return 50;
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const maxSize = getMaxSizeMB() * 1024 * 1024;

        if (file.size > maxSize) {
          alert(`File ${file.name} is too large. Maximum size is ${getMaxSizeMB()}MB`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}-${Math.random()}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('profile-media')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('profile-media')
          .getPublicUrl(data.path);

        uploadedUrls.push(publicUrl);
      }

      setUploadedFiles([...uploadedFiles, ...uploadedUrls]);
      onUploadComplete(uploadedUrls);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async (url: string) => {
    try {
      // Extract file path from URL
      const path = url.split('/profile-media/')[1];
      await supabase.storage.from('profile-media').remove([path]);

      const updated = uploadedFiles.filter((u) => u !== url);
      setUploadedFiles(updated);
      onUploadComplete(updated);
    } catch (error) {
      console.error('Remove error:', error);
    }
  };

  const getIcon = () => {
    switch (mediaType) {
      case 'photo':
        return <Image className="w-6 h-6" />;
      case 'audio':
        return <Music className="w-6 h-6" />;
      case 'video':
        return <Video className="w-6 h-6" />;
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptedTypes()}
        multiple
        onChange={handleUpload}
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current.click()}
        disabled={uploading || uploadedFiles.length >= maxFiles}
        className="w-full py-3 border-2 border-dashed rounded-lg hover:border-blue-500 transition-colors flex items-center justify-center gap-2"
      >
        {getIcon()}
        {uploading 'Uploading...' : `Upload ${mediaType}s`}
      </button>

      <div className="grid grid-cols-3 gap-4">
        {uploadedFiles.map((url, index) => (
          <div key={index} className="relative group">
            {mediaType === 'photo' && (
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
            )}
            {mediaType === 'audio' && (
              <audio controls src={url} className="w-full" />
            )}
            {mediaType === 'video' && (
              <video controls src={url} className="w-full h-32 object-cover rounded-lg" />
            )}
            <button
              onClick={() => handleRemove(url)}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <p className="text-sm text-gray-500">
        {uploadedFiles.length} / {maxFiles} files uploaded. Max size: {getMaxSizeMB()}MB per file.
      </p>
    </div>
  );
}
```

---

## 6. Event Discovery & Search

### Priority: HIGH (Fan Engagement)

### Database Changes

```sql
-- Add full-text search
ALTER TABLE events
ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX idx_events_search ON events USING gin(search_vector);

CREATE OR REPLACE FUNCTION update_event_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.genres, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_search_vector_update
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_event_search_vector();

-- Add event filters
ALTER TABLE events
ADD COLUMN IF NOT EXISTS min_price numeric,
ADD COLUMN IF NOT EXISTS max_price numeric,
ADD COLUMN IF NOT EXISTS tags text[],
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ticket_sales_count integer DEFAULT 0;

-- Create saved searches
CREATE TABLE IF NOT EXISTS saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  search_query jsonb NOT NULL,
  notify_on_match boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved searches"
  ON saved_searches FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Implementation

```typescript
// src/components/Fan/EventDiscovery.tsx
import { useState, useEffect } from 'react';
import { Search, Filter, Star, TrendingUp, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export function EventDiscovery() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    genre: '',
    minPrice: '',
    maxPrice: '',
    date: '',
    location: '',
    featured: false,
  });
  const [sortBy, setSortBy] = useState<'date' | 'popular' | 'price'>('date');

  useEffect(() => {
    searchEvents();
  }, [filters, sortBy]);

  const searchEvents = async () => {
    setLoading(true);

    let query = supabase
      .from('events')
      .select('*, venue:venues(*), musician:musicians(*)');

    // Text search
    if (filters.search) {
      query = query.textSearch('search_vector', filters.search);
    }

    // Genre filter
    if (filters.genre) {
      query = query.contains('genres', [filters.genre]);
    }

    // Price range
    if (filters.minPrice) {
      query = query.gte('min_price', parseFloat(filters.minPrice));
    }
    if (filters.maxPrice) {
      query = query.lte('max_price', parseFloat(filters.maxPrice));
    }

    // Date filter
    if (filters.date) {
      query = query.gte('event_date', filters.date);
    }

    // Featured
    if (filters.featured) {
      query = query.eq('is_featured', true);
    }

    // Sorting
    switch (sortBy) {
      case 'date':
        query = query.order('event_date', { ascending: true });
        break;
      case 'popular':
        query = query.order('ticket_sales_count', { ascending: false });
        break;
      case 'price':
        query = query.order('min_price', { ascending: true });
        break;
    }

    const { data } = await query;
    setEvents(data || []);
    setLoading(false);
  };

  const getRecommendations = async () => {
    if (!profile) return;

    // Get user's ticket purchase history
    const { data: purchases } = await supabase
      .from('ticket_purchases')
      .select('event:events(genres)')
      .eq('fan_id', profile.id);

    // Extract favorite genres
    const genres = purchases.flatMap((p) => p.event.genres) || [];
    const genreCounts = genres.reduce((acc: any, genre: string) => {
      acc[genre] = (acc[genre] || 0) + 1;
      return acc;
    }, {});
    const favoriteGenres = Object.keys(genreCounts).sort(
      (a, b) => genreCounts[b] - genreCounts[a]
    );

    // Find similar events
    if (favoriteGenres.length > 0) {
      const { data } = await supabase
        .from('events')
        .select('*, venue:venues(*), musician:musicians(*)')
        .overlaps('genres', favoriteGenres)
        .gte('event_date', new Date().toISOString())
        .order('event_date')
        .limit(10);

      return data || [];
    }

    return [];
  };

  const saveSearch = async () => {
    await supabase.from('saved_searches').insert({
      user_id: profile.id,
      search_query: filters,
      notify_on_match: true,
    });

    alert('Search saved! We'll notify you when matching events are added.');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Discover Live Music</h2>

        {/* Search Bar */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search events, artists, venues..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setFilters({ ...filters, featured: !filters.featured })}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              filters.featured 'bg-yellow-500 text-white' : 'bg-gray-100'
            }`}
          >
            <Star className="w-4 h-4" />
            Featured
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <select
            value={filters.genre}
            onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">All Genres</option>
            <option value="rock">Rock</option>
            <option value="jazz">Jazz</option>
            <option value="blues">Blues</option>
            <option value="country">Country</option>
            <option value="electronic">Electronic</option>
          </select>

          <input
            type="number"
            value={filters.minPrice}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            placeholder="Min Price"
            className="px-4 py-2 border rounded-lg"
          />

          <input
            type="number"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            placeholder="Max Price"
            className="px-4 py-2 border rounded-lg"
          />

          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            className="px-4 py-2 border rounded-lg"
          />
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-sm font-medium">Sort by:</span>
          <button
            onClick={() => setSortBy('date')}
            className={`px-3 py-1 rounded ${sortBy === 'date' 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            Date
          </button>
          <button
            onClick={() => setSortBy('popular')}
            className={`px-3 py-1 rounded flex items-center gap-1 ${
              sortBy === 'popular' 'bg-blue-500 text-white' : 'bg-gray-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Popular
          </button>
          <button
            onClick={() => setSortBy('price')}
            className={`px-3 py-1 rounded ${sortBy === 'price' 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            Price
          </button>

          {profile && (
            <button
              onClick={saveSearch}
              className="ml-auto px-4 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            >
              Save Search
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-3 gap-6">
        {events.map((event) => (
          <div key={event.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            {event.cover_image && (
              <img src={event.cover_image} alt={event.title} className="w-full h-48 object-cover rounded-t-lg" />
            )}
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
              <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {event.venue.venue_name}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                {new Date(event.event_date).toLocaleDateString()}
              </p>
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-600">
                  ${event.min_price} - ${event.max_price}
                </span>
                <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  Buy Tickets
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 7. PWA & QR Code Tickets

### Priority: HIGH (Mobile Experience)

### PWA Manifest

```json
// public/manifest.json
{
  "name": "GigMate - Live Music Marketplace",
  "short_name": "GigMate",
  "description": "Discover and book live music events",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshot1.png",
      "sizes": "540x720",
      "type": "image/png"
    }
  ],
  "categories": ["entertainment", "music", "lifestyle"],
  "shortcuts": [
    {
      "name": "Find Events",
      "url": "/events",
      "description": "Browse upcoming events"
    },
    {
      "name": "My Tickets",
      "url": "/tickets",
      "description": "View your tickets"
    }
  ]
}
```

### Service Worker

```javascript
// public/sw.js
const CACHE_NAME = 'gigmate-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/assets/index.js',
  '/assets/index.css',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).catch(() => {
        return caches.match('/offline.html');
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

### QR Code Ticket System

```bash
npm install qrcode
```

```typescript
// src/lib/qrcode.ts
import QRCode from 'qrcode';

export async function generateTicketQR(ticketId: string): Promise<string> {
  const qrData = {
    ticketId,
    timestamp: Date.now(),
    checksum: generateChecksum(ticketId),
  };

  const qrString = JSON.stringify(qrData);
  const qrCodeDataURL = await QRCode.toDataURL(qrString, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 300,
  });

  return qrCodeDataURL;
}

function generateChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export function verifyTicketQR(qrData: string, ticketId: string): boolean {
  try {
    const parsed = JSON.parse(qrData);
    const checksum = generateChecksum(ticketId);
    return parsed.ticketId === ticketId && parsed.checksum === checksum;
  } catch {
    return false;
  }
}
```

```typescript
// src/components/Fan/TicketDisplay.tsx
import { useEffect, useState } from 'react';
import { generateTicketQR } from '../../lib/qrcode';

interface TicketDisplayProps {
  ticketId: string;
  eventName: string;
  eventDate: string;
  venue: string;
}

export function TicketDisplay({ ticketId, eventName, eventDate, venue }: TicketDisplayProps) {
  const [qrCode, setQrCode] = useState<string>('');

  useEffect(() => {
    generateTicketQR(ticketId).then(setQrCode);
  }, [ticketId]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm">
      <h3 className="text-xl font-bold mb-4">{eventName}</h3>
      <div className="space-y-2 mb-6">
        <p className="text-gray-600">
          <span className="font-medium">Date:</span> {new Date(eventDate).toLocaleString()}
        </p>
        <p className="text-gray-600">
          <span className="font-medium">Venue:</span> {venue}
        </p>
      </div>

      {qrCode && (
        <div className="flex justify-center">
          <img src={qrCode} alt="Ticket QR Code" className="w-64 h-64" />
        </div>
      )}

      <p className="text-xs text-center text-gray-500 mt-4">
        Ticket ID: {ticketId}
      </p>

      <button
        onClick={() => {
          const link = document.createElement('a');
          link.href = qrCode;
          link.download = `ticket-${ticketId}.png`;
          link.click();
        }}
        className="w-full mt-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Download Ticket
      </button>
    </div>
  );
}
```

### Scanner Component for Venues

```typescript
// src/components/Venue/TicketScanner.tsx
import { useState } from 'react';
import { Camera } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { verifyTicketQR } from '../../lib/qrcode';

export function TicketScanner() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ valid: boolean; message: string } | null>(null);

  const scanTicket = async (qrData: string) => {
    try {
      const parsed = JSON.parse(qrData);

      // Check if ticket exists and is valid
      const { data: ticket } = await supabase
        .from('ticket_purchases')
        .select('*, event:events(*)')
        .eq('id', parsed.ticketId)
        .maybeSingle();

      if (!ticket) {
        setResult({ valid: false, message: 'Invalid ticket' });
        return;
      }

      if (ticket.checked_in_at) {
        setResult({ valid: false, message: 'Ticket already used' });
        return;
      }

      // Verify checksum
      if (!verifyTicketQR(qrData, ticket.id)) {
        setResult({ valid: false, message: 'Ticket verification failed' });
        return;
      }

      // Mark as checked in
      await supabase
        .from('ticket_purchases')
        .update({ checked_in_at: new Date().toISOString() })
        .eq('id', ticket.id);

      setResult({ valid: true, message: 'Ticket validated successfully!' });
    } catch (error) {
      setResult({ valid: false, message: 'Error scanning ticket' });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Camera className="w-6 h-6" />
        Ticket Scanner
      </h3>

      <button
        onClick={() => setScanning(true)}
        className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Start Scanning
      </button>

      {result && (
        <div
          className={`mt-4 p-4 rounded-lg ${
            result.valid 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {result.message}
        </div>
      )}
    </div>
  );
}
```

---

## 8. Trust & Safety Features

### Priority: HIGH (User Trust)

### Database Schema

```sql
-- Migration: create_trust_safety_system.sql

CREATE TABLE IF NOT EXISTS verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  verification_type text NOT NULL CHECK (verification_type IN ('identity', 'email', 'phone', 'background', 'insurance')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  provider text,
  provider_id text,
  verified_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claimant_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  respondent_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  related_booking_id uuid REFERENCES bookings(id),
  dispute_type text NOT NULL CHECK (dispute_type IN ('payment', 'cancellation', 'no_show', 'quality', 'other')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  description text NOT NULL,
  evidence jsonb,
  resolution text,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  report_type text NOT NULL CHECK (report_type IN ('spam', 'harassment', 'fraud', 'inappropriate', 'other')),
  description text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'action_taken', 'dismissed')),
  admin_notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own verifications"
  ON verifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view disputes they're involved in"
  ON disputes FOR ALL
  TO authenticated
  USING (auth.uid() IN (claimant_id, respondent_id))
  WITH CHECK (auth.uid() IN (claimant_id, respondent_id));

CREATE POLICY "Users can create reports"
  ON user_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can manage own blocks"
  ON blocked_users FOR ALL
  TO authenticated
  USING (auth.uid() = blocker_id)
  WITH CHECK (auth.uid() = blocker_id);

-- Add verification badges to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_identity_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_background_checked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS trust_score numeric DEFAULT 100;
```

### Verification Component

```typescript
// src/components/Shared/VerificationManager.tsx
import { useState } from 'react';
import { Shield, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export function VerificationManager() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const requestVerification = async (type: string) => {
    setLoading(true);

    try {
      const { error } = await supabase.from('verifications').insert({
        user_id: profile.id,
        verification_type: type,
        status: 'pending',
      });

      if (error) throw error;
      alert('Verification request submitted!');
    } catch (error) {
      console.error('Verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Shield className="w-6 h-6" />
        Trust & Verification
      </h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-semibold">Identity Verification</h4>
            <p className="text-sm text-gray-600">Verify your identity with government ID</p>
          </div>
          {profile.is_identity_verified (
            <CheckCircle className="w-6 h-6 text-green-500" />
          ) : (
            <button
              onClick={() => requestVerification('identity')}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Verify
            </button>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-semibold">Background Check</h4>
            <p className="text-sm text-gray-600">Optional enhanced verification</p>
          </div>
          {profile.is_background_checked (
            <CheckCircle className="w-6 h-6 text-green-500" />
          ) : (
            <button
              onClick={() => requestVerification('background')}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Request
            </button>
          )}
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold mb-2">Trust Score</h4>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-500 h-4 rounded-full"
                style={{ width: `${profile.trust_score || 100}%` }}
              />
            </div>
            <span className="font-bold">{profile.trust_score || 100}/100</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Dispute Filing Component

```typescript
// src/components/Shared/DisputeForm.tsx
import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface DisputeFormProps {
  bookingId: string;
  respondentId: string;
  onSuccess: () => void;
}

export function DisputeForm({ bookingId, respondentId, onSuccess }: DisputeFormProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    dispute_type: 'payment',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('disputes').insert({
        claimant_id: profile.id,
        respondent_id: respondentId,
        related_booking_id: bookingId,
        dispute_type: formData.dispute_type,
        description: formData.description,
      });

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Dispute error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-600">
        <AlertTriangle className="w-6 h-6" />
        File a Dispute
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Dispute Type</label>
          <select
            value={formData.dispute_type}
            onChange={(e) => setFormData({ ...formData, dispute_type: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            required
          >
            <option value="payment">Payment Issue</option>
            <option value="cancellation">Cancellation Dispute</option>
            <option value="no_show">No Show</option>
            <option value="quality">Service Quality</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            rows={6}
            required
            placeholder="Please provide details about the dispute..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
        >
          {loading 'Submitting...' : 'File Dispute'}
        </button>

        <p className="text-xs text-gray-500">
          Disputes are reviewed within 24-48 hours. Both parties will be notified of the resolution.
        </p>
      </div>
    </form>
  );
}
```

---

## 9. Analytics Dashboards

### Priority: MEDIUM (Data-Driven Decisions)

### Implementation covered in DATA_MONETIZATION_STRATEGY.md

Key components needed:
- Revenue analytics dashboard
- Booking analytics
- Audience demographics
- Performance metrics
- Export functionality

---

## 10. Legal Documents

### Priority: CRITICAL (Legal Compliance)

### Required Documents:

**1. Terms of Service** (`/legal/terms-of-service.html`)
**2. Privacy Policy** (`/legal/privacy-policy.html`)
**3. Cookie Policy** (`/legal/cookie-policy.html`)
**4. Refund Policy** (`/legal/refund-policy.html`)
**5. Cancellation Policy** (`/legal/cancellation-policy.html`)
**6. User Conduct Guidelines** (`/legal/conduct-guidelines.html`)
**7. Venue/Musician Agreements** (`/legal/agreements.html`)

### Legal Component

```typescript
// src/components/Legal/LegalDocuments.tsx
import { FileText, Shield, RefreshCw, Ban } from 'lucide-react';

export function LegalDocuments() {
  const documents = [
    { name: 'Terms of Service', icon: FileText, path: '/legal/terms' },
    { name: 'Privacy Policy', icon: Shield, path: '/legal/privacy' },
    { name: 'Refund Policy', icon: RefreshCw, path: '/legal/refunds' },
    { name: 'Cancellation Policy', icon: Ban, path: '/legal/cancellations' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {documents.map((doc) => (
        <a
          key={doc.path}
          href={doc.path}
          className="p-6 border rounded-lg hover:shadow-lg transition-shadow flex items-center gap-4"
        >
          <doc.icon className="w-8 h-8 text-blue-500" />
          <span className="font-semibold">{doc.name}</span>
        </a>
      ))}
    </div>
  );
}
```

### Template Content (Terms of Service Example)

```html
<!DOCTYPE html>
<html>
<head>
  <title>GigMate Terms of Service</title>
</head>
<body>
  <h1>Terms of Service</h1>
  <p>Last Updated: November 4, 2025</p>

  <h2>1. Acceptance of Terms</h2>
  <p>By accessing and using GigMate.us, you accept and agree to be bound by the terms and provision of this agreement.</p>

  <h2>2. Platform Description</h2>
  <p>GigMate is a marketplace connecting musicians, venues, and music fans for live music bookings and ticket sales.</p>

  <h2>3. User Accounts</h2>
  <p>You must create an account to use certain features. You are responsible for maintaining the confidentiality of your account credentials.</p>

  <h2>4. Fees and Payments</h2>
  <p>GigMate charges a 10% platform fee on all bookings. Payment processing fees may apply.</p>

  <h2>5. Cancellation and Refunds</h2>
  <p>Cancellation and refund policies are outlined in our separate Refund Policy document.</p>

  <h2>6. User Conduct</h2>
  <p>Users must conduct themselves professionally and comply with our User Conduct Guidelines.</p>

  <h2>7. Intellectual Property</h2>
  <p>Users retain ownership of their content but grant GigMate a license to display and distribute it on our platform.</p>

  <h2>8. Dispute Resolution</h2>
  <p>Disputes between users should first be reported through our dispute resolution system.</p>

  <h2>9. Limitation of Liability</h2>
  <p>GigMate is not liable for disputes between users, event cancellations, or quality of services provided.</p>

  <h2>10. Changes to Terms</h2>
  <p>We reserve the right to modify these terms at any time. Continued use constitutes acceptance of changes.</p>

  <h2>Contact</h2>
  <p>For questions about these terms, contact legal@gigmate.us</p>
</body>
</html>
```

---

## Implementation Timeline

### Week 1-2: Foundation
- [x] Stripe integration
- [x] Database migrations for all features
- [ ] Edge functions deployment

### Week 3-4: Core Features
- [ ] Complete booking workflow
- [ ] Email notification system
- [ ] Messaging system

### Week 5-6: User Experience
- [ ] Media upload system
- [ ] Event discovery and search
- [ ] PWA manifest and service worker

### Week 7-8: Trust & Safety
- [ ] Verification system
- [ ] Dispute resolution
- [ ] QR code tickets

### Week 9-10: Analytics & Legal
- [ ] Analytics dashboards
- [ ] Legal documents
- [ ] Testing and bug fixes

### Week 11-12: Launch Preparation
- [ ] Load testing
- [ ] Security audit
- [ ] Beta testing
- [ ] Production deployment

---

## Testing Checklist

### Functional Testing
- [ ] User registration and login
- [ ] Profile creation (all user types)
- [ ] Booking creation and acceptance
- [ ] Payment processing
- [ ] Subscription management
- [ ] Ticket purchase and QR generation
- [ ] Messaging system
- [ ] Media uploads
- [ ] Event search and filters
- [ ] Dispute filing
- [ ] Verification requests

### Security Testing
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection
- [ ] RLS policy enforcement
- [ ] Authentication bypass attempts
- [ ] Payment security
- [ ] File upload validation

### Performance Testing
- [ ] Page load times < 2 seconds
- [ ] API response times < 500ms
- [ ] Database query optimization
- [ ] Image compression
- [ ] CDN configuration
- [ ] Load testing (1000+ concurrent users)

### Mobile Testing
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] PWA installation
- [ ] Offline functionality
- [ ] Touch interactions
- [ ] QR code scanning

### Browser Compatibility
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers

---

## Deployment Checklist

### Pre-Launch
- [ ] All environment variables configured
- [ ] Stripe webhooks configured
- [ ] Email service configured
- [ ] Google Maps API configured
- [ ] SSL certificate installed
- [ ] Domain configured
- [ ] CDN configured
- [ ] Database backups enabled
- [ ] Monitoring and alerting setup
- [ ] Error tracking (Sentry)
- [ ] Analytics (Google Analytics, Mixpanel)

### Launch Day
- [ ] Final smoke tests
- [ ] Rollback plan prepared
- [ ] Customer support ready
- [ ] Social media announcements
- [ ] Press release distribution
- [ ] Beta user notifications

### Post-Launch
- [ ] Monitor error rates
- [ ] Monitor server performance
- [ ] Monitor user feedback
- [ ] Daily check-ins first week
- [ ] Weekly reviews first month

---

## Support and Maintenance

### Daily Tasks
- Monitor error logs
- Check payment processing
- Review user reports
- Respond to support tickets

### Weekly Tasks
- Review analytics
- Check server performance
- Update content
- Process disputes

### Monthly Tasks
- Security patches
- Feature updates
- User surveys
- Financial reporting

---

## Conclusion

This implementation guide provides a comprehensive roadmap for addressing all 10 critical showstoppers. Each section includes:

- Database migrations
- Implementation code
- Testing procedures
- Configuration requirements

Follow this guide systematically to build a production-ready platform. Estimated timeline: 12 weeks with a dedicated development team.

**Next Steps:**
1. Review and prioritize features
2. Set up development environment
3. Begin with Stripe integration (most critical)
4. Work through features in priority order
5. Test thoroughly at each stage
6. Prepare for launch

Good luck building GigMate! 
