# GigMate Stripe Integration Setup Guide

**Last Updated:** November 9, 2025

This guide walks you through setting up Stripe payments for the GigMate platform.

---

## Overview

GigMate uses Stripe for:
- Event ticket purchases
- Venue subscription payments
- Booking deposits and escrow
- Platform fees (10% on all transactions)
- Merchandise sales

---

## Prerequisites

1. A Stripe account (free to create)
2. Access to Supabase Dashboard
3. Access to Vercel Dashboard (for deployment)

---

## Step 1: Create Stripe Account

1. Go to https://stripe.com
2. Click "Start now" or "Sign up"
3. Complete registration
4. Verify your email address
5. Complete business profile (can skip for testing)

---

## Step 2: Get API Keys

### Access Your Dashboard

1. Log in to https://dashboard.stripe.com
2. **Make sure you're in TEST MODE** (toggle in top right corner)
3. Click on "Developers" in the left sidebar
4. Click "API keys"

### Copy Your Keys

You'll see two types of keys:

**Publishable Key:**
- Format: `pk_test_...`
- Safe to expose in frontend code
- Used by browser to create payment sessions

**Secret Key:**
- Format: `sk_test_...`
- NEVER expose in frontend code
- Used by backend to process payments

---

## Step 3: Configure Frontend (Vercel)

### Add Environment Variable

**For Local Development:**

1. Open your `.env` file
2. Add:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
   ```
3. Replace `YOUR_KEY_HERE` with your actual publishable key

**For Vercel Deployment:**

1. Go to https://vercel.com/dashboard
2. Select your GigMate project
3. Click "Settings"
4. Click "Environment Variables"
5. Add new variable:
   - Name: `VITE_STRIPE_PUBLISHABLE_KEY`
   - Value: `pk_test_YOUR_KEY_HERE`
   - Environment: Production, Preview, Development (check all)
6. Click "Save"
7. Redeploy your application

---

## Step 4: Configure Backend (Supabase)

### Add Stripe Secret Key

1. Go to https://app.supabase.com
2. Select your project
3. Click "Project Settings" (gear icon)
4. Click "Edge Functions"
5. Scroll to "Secrets" section
6. Click "Add new secret"

**Add STRIPE_SECRET_KEY:**
- Name: `STRIPE_SECRET_KEY`
- Value: Your secret key (starts with `sk_test_...`)
- Click "Save"

**Add STRIPE_WEBHOOK_SECRET:**
- Name: `STRIPE_WEBHOOK_SECRET`
- Value: `whsec_ltO4viqDLNfnREkNcSU6Zr1CL7BgMJrT`
- Note: This will be updated after creating webhook endpoint
- Click "Save"

---

## Step 5: Create Webhook Endpoint

Webhooks allow Stripe to notify your application when payments succeed or fail.

### Create the Endpoint

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Enter endpoint URL:
   ```
   https://rmagqkuwulbcabxtzsjm.supabase.co/functions/v1/stripe-webhook
   ```
4. Click "Select events"

### Select Events

Add these events:
- `checkout.session.completed`
- `checkout.session.expired`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### Save and Get Secret

1. Click "Add endpoint"
2. You'll see your new endpoint listed
3. Click on it to view details
4. Click "Reveal" next to "Signing secret"
5. Copy the secret (starts with `whsec_...`)
6. Go back to Supabase Edge Functions secrets
7. Update `STRIPE_WEBHOOK_SECRET` with this new value

---

## Step 6: Test the Integration

### Test Credit Cards

Stripe provides test cards for different scenarios:

**Success:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any valid ZIP

**Decline:**
- Card: `4000 0000 0000 0002`
- Will be declined

**3D Secure Required:**
- Card: `4000 0027 6000 3184`
- Will prompt for authentication

### Test Payment Flow

1. Go to your GigMate application
2. Find an event with tickets
3. Click "Buy Tickets"
4. Use test card `4242 4242 4242 4242`
5. Complete checkout
6. Verify:
   - Payment succeeds in app
   - Ticket is issued
   - Payment appears in Stripe Dashboard
   - Webhook event received

### Check Stripe Dashboard

1. Go to https://dashboard.stripe.com/test/payments
2. You should see your test payment
3. Click on it to view details
4. Check webhook events were sent successfully

### Check Webhook Delivery

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click on your endpoint
3. Click "Events" tab
4. Verify events show "Succeeded" status

---

## Step 7: Production Setup

### Switch to Live Mode

**IMPORTANT:** Only do this when ready to accept real payments!

1. Go to Stripe Dashboard
2. Toggle from "Test mode" to "Live mode" (top right)
3. Go to "Developers" > "API keys"
4. Copy your LIVE keys (start with `pk_live_...` and `sk_live_...`)

### Update Keys

**Vercel:**
- Update `VITE_STRIPE_PUBLISHABLE_KEY` with live publishable key

**Supabase:**
- Update `STRIPE_SECRET_KEY` with live secret key

### Create Live Webhook

1. Go to https://dashboard.stripe.com/webhooks (live mode)
2. Add endpoint with same URL
3. Select same events
4. Update `STRIPE_WEBHOOK_SECRET` with new live secret

### Verify Production

1. Make a small real transaction ($1)
2. Use your actual credit card
3. Verify payment processes correctly
4. Check webhook delivery
5. Refund the test transaction

---

## Troubleshooting

### "Invalid API Key"

**Problem:** Frontend can't connect to Stripe

**Solutions:**
- Verify `VITE_STRIPE_PUBLISHABLE_KEY` is set
- Check you're using publishable key (starts with `pk_`)
- Ensure key matches mode (test/live)
- Redeploy application after adding variable

### "Webhook Signature Verification Failed"

**Problem:** Stripe can't authenticate with your backend

**Solutions:**
- Verify `STRIPE_WEBHOOK_SECRET` is set in Supabase
- Check webhook URL is correct
- Ensure webhook secret matches Stripe Dashboard
- Test webhook using Stripe CLI

### "Payment Intent Failed"

**Problem:** Payment processing fails

**Solutions:**
- Verify `STRIPE_SECRET_KEY` is set in Supabase
- Check you're using secret key (starts with `sk_`)
- Ensure key has proper permissions
- Check Stripe Dashboard for error details

### Test Payment Not Working

**Solutions:**
- Ensure you're in TEST mode
- Use Stripe test cards only
- Check browser console for errors
- Verify all environment variables are set

---

## Stripe CLI (Advanced)

For local development, you can use Stripe CLI:

### Install

```bash
brew install stripe/stripe-cli/stripe
```

Or download from: https://stripe.com/docs/stripe-cli

### Login

```bash
stripe login
```

### Forward Webhooks to Local

```bash
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
```

This lets you test webhooks locally!

---

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all keys
3. **Rotate keys regularly** in production
4. **Monitor webhook events** for suspicious activity
5. **Enable Stripe Radar** for fraud detection
6. **Set up 2FA** on your Stripe account
7. **Review transactions** regularly

---

## Pricing & Fees

### Stripe Fees

**Per Transaction:**
- 2.9% + $0.30 for US cards
- Higher for international cards
- Check: https://stripe.com/pricing

### GigMate Platform Fees

**We charge:**
- 10% on ticket sales
- 10% on booking fees
- Calculated after Stripe fees

**Example:**
- Ticket price: $20.00
- Stripe fee: $0.88 (2.9% + $0.30)
- GigMate fee: $2.00 (10%)
- Venue/Musician receives: $17.12

---

## Support Resources

### Stripe Documentation
- https://stripe.com/docs
- https://stripe.com/docs/payments

### Stripe Support
- Email: support@stripe.com
- Live Chat: Available in Dashboard
- Phone: Available for verified businesses

### GigMate Support
- Check other documentation files
- Contact development team

---

## Checklist

Use this checklist to ensure everything is configured:

**Stripe Account:**
- [ ] Stripe account created
- [ ] Email verified
- [ ] Business profile completed
- [ ] Test mode enabled

**API Keys:**
- [ ] Publishable key copied
- [ ] Secret key copied
- [ ] Keys stored securely

**Frontend Configuration:**
- [ ] VITE_STRIPE_PUBLISHABLE_KEY set in .env
- [ ] VITE_STRIPE_PUBLISHABLE_KEY set in Vercel
- [ ] Application redeployed

**Backend Configuration:**
- [ ] STRIPE_SECRET_KEY set in Supabase
- [ ] STRIPE_WEBHOOK_SECRET set in Supabase

**Webhook Setup:**
- [ ] Webhook endpoint created
- [ ] All required events selected
- [ ] Webhook secret copied to Supabase

**Testing:**
- [ ] Test payment succeeds with 4242 card
- [ ] Test payment fails with 0002 card
- [ ] Payment shows in Stripe Dashboard
- [ ] Webhook events delivered successfully
- [ ] Ticket issued in application

**Production (when ready):**
- [ ] Switched to Live mode
- [ ] Live keys updated
- [ ] Live webhook created
- [ ] Real transaction tested
- [ ] Monitoring enabled

---

## Next Steps

After completing this setup:

1. Test all payment flows thoroughly
2. Review error handling
3. Set up payment monitoring
4. Configure email receipts
5. Test refund process
6. Review security settings

---

**Questions**

Refer to:
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
- Stripe Documentation: https://stripe.com/docs

Good luck with your Stripe integration!
