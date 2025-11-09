# GigMate Platform

A comprehensive marketplace connecting musicians, venues, and fans for live music bookings, ticketing, and event management.

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Stripe account
- Google Maps API key

### Environment Variables

Create a `.env` file with:

```bash
VITE_SUPABASE_URL=https://rmagqkuwulbcabxtzsjm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtYWdxa3V3dWxiY2FieHR6c2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxODU4ODgsImV4cCI6MjA3Nzc2MTg4OH0.CZ8gB9UmU1t1LptFUQr000lLj_MfVGHoMmB2NxfnyYI
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
VITE_GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE
```

### Stripe Configuration

#### 1. Get Your Stripe Keys

**Frontend (Vercel):**
- Get publishable key from: https://dashboard.stripe.com/test/apikeys
- Add to `.env` and Vercel environment variables

**Backend (Supabase):**
- Go to: https://app.supabase.com/project/rmagqkuwulbcabxtzsjm/settings/functions
- Add secret `STRIPE_SECRET_KEY` (from Stripe Dashboard)
- Add secret `STRIPE_WEBHOOK_SECRET` (value: `whsec_ltO4viqDLNfnREkNcSU6Zr1CL7BgMJrT`)

#### 2. Configure Webhook

- Go to: https://dashboard.stripe.com/test/webhooks
- Add endpoint: `https://rmagqkuwulbcabxtzsjm.supabase.co/functions/v1/stripe-webhook`
- Select events: checkout.session.completed, payment_intent.*
- Copy webhook secret and update in Supabase if needed

### Installation

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
```

## Documentation

- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Step-by-step deployment instructions
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md) - Feature implementation details
- [Beta Tester Guide](./BETA_TESTER_GUIDE.md) - Testing guide for beta users
- [Business Plan](./GIGMATE_COMPLETE_PLATFORM_DOCUMENTATION_2025.md) - Complete platform documentation

## Features

- User authentication for Musicians, Venues, Fans, Consumers, and Investors
- Booking and escrow system
- Ticketing with QR codes
- Event management
- Rating and review system
- Messaging between users
- Premium subscriptions
- Location-based search
- Social media integration
- Merchandise management
- Credit economy
- AI-powered features

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- Stripe (Payments)
- Google Maps API

## Support

For issues or questions, refer to the documentation files or contact the development team.
