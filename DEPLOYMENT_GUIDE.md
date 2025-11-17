# GigMate Deployment Guide - Vercel

## Quick Start Summary

1. Push code to GitHub
2. Connect GitHub to Vercel
3. Add environment variables
4. Deploy automatically
5. Get live URL: `your-app.vercel.app`

---

## Step-by-Step Deployment Instructions

### Prerequisites

-  GitHub account
-  Vercel account (free - sign up at vercel.com)
-  Your GigMate code ready

---

## Part 1: Push to GitHub

### Option A: Create New Repository (Recommended)

1. **Go to GitHub.com** and sign in
2. **Click "New Repository"**
   - Name: `gigmate-platform` (or your preferred name)
   - Description: "GigMate - Musicians, Venues, and Fans Platform"
   - Keep it **Private** (recommended for beta)
   - Don't initialize with README (we already have files)

3. **Initialize Git in your project** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial GigMate deployment setup"
   ```

4. **Connect to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/gigmate-platform.git
   git branch -M main
   git push -u origin main
   ```

### Option B: Use Existing Repository

If you already have a GitHub repo:
```bash
git add .
git commit -m "Add deployment configuration"
git push
```

---

## Part 2: Deploy to Vercel

### Step 1: Sign Up/Login to Vercel

1. Go to **https://vercel.com**
2. Click **"Sign Up"** (or Login)
3. **Connect with GitHub** (easiest option)
4. Authorize Vercel to access your repositories

### Step 2: Import Your Project

1. On Vercel dashboard, click **"Add New Project"**
2. Click **"Import Git Repository"**
3. Find your `gigmate-platform` repository
4. Click **"Import"**

### Step 3: Configure Build Settings

Vercel should auto-detect these settings:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

 **Leave these as default** - they're already correct!

### Step 4: Add Environment Variables

**CRITICAL STEP** - Your app won't work without these!

Click **"Environment Variables"** and add each one:

**VITE_SUPABASE_URL**
```
https://rmagqkuwulbcabxtzsjm.supabase.co
```

**VITE_SUPABASE_ANON_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtYWdxa3V3dWxiY2FieHR6c2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxODU4ODgsImV4cCI6MjA3Nzc2MTg4OH0.CZ8gB9UmU1t1LptFUQr000lLj_MfVGHoMmB2NxfnyYI
```

**VITE_STRIPE_PUBLISHABLE_KEY**
```
pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE
```

**You must add your own Stripe publishable key from https://dashboard.stripe.com/test/apikeys**

**VITE_GOOGLE_MAPS_API_KEY**
```
YOUR_GOOGLE_MAPS_API_KEY_HERE
```

**Important Notes:**
- These are test/development keys - replace Stripe key with production key when going live
- You need to get a real Google Maps API key from Google Cloud Console
- You MUST get your own Stripe publishable key from https://dashboard.stripe.com/test/apikeys
-  Supabase keys are already configured and working

### Step 5: Deploy!

1. Click **"Deploy"**
2. Wait 2-3 minutes while Vercel builds your app
3. You'll see a progress screen with build logs
4. When complete, you'll get a live URL! 

Your app will be at something like:
```
https://gigmate-platform-abc123.vercel.app
```

---

## Part 3: Configure Stripe Secrets in Supabase

### Add Stripe Keys to Supabase Edge Functions

**CRITICAL:** Your Stripe integration won't work without these secrets!

1. **Go to Supabase Dashboard**: https://app.supabase.com/project/rmagqkuwulbcabxtzsjm/settings/functions
2. **Click on "Edge Functions" settings**
3. **Find the "Secrets" section**
4. **Add the following secrets:**

**STRIPE_SECRET_KEY**
- Click "Add new secret"
- Name: `STRIPE_SECRET_KEY`
- Value: Your Stripe secret key starting with `sk_test_...`
- Get it from: https://dashboard.stripe.com/test/apikeys

**STRIPE_WEBHOOK_SECRET**
- Click "Add new secret"
- Name: `STRIPE_WEBHOOK_SECRET`
- Value: `whsec_ltO4viqDLNfnREkNcSU6Zr1CL7BgMJrT`
- This is pre-configured for your project

5. **Save both secrets**

### Configure Stripe Webhook Endpoint

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/test/webhooks
2. **Click "Add endpoint"**
3. **Enter webhook URL:**
   ```
   https://rmagqkuwulbcabxtzsjm.supabase.co/functions/v1/stripe-webhook
   ```
4. **Select events to listen to:**
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. **Click "Add endpoint"**
6. **Copy the webhook signing secret** (starts with `whsec_...`)
7. **Update STRIPE_WEBHOOK_SECRET in Supabase** if different from default

---

## Part 4: Configure Supabase for Production

### Update Supabase URL Allowlist

Your Vercel URL needs to be allowed in Supabase:

1. **Go to Supabase Dashboard**: https://app.supabase.com
2. **Select your project**: `rmagqkuwulbcabxtzsjm`
3. **Go to Authentication -> URL Configuration**
4. **Add your Vercel URL to "Site URL"**:
   ```
   https://your-app-name.vercel.app
   ```
5. **Add to "Redirect URLs"**:
   ```
   https://your-app-name.vercel.app/**
   ```

This allows Supabase authentication to work on your deployed app.

---

## Part 5: Test Your Deployment

### Basic Tests:

1.  **Visit your Vercel URL**
2.  **Homepage loads correctly**
3.  **Try to sign up** as a musician/venue/fan
4.  **Check if NDA screen appears** (if you added one)
5.  **Login works**
6.  **Dashboard loads**

### If Something Doesn't Work:

**Check Vercel Logs:**
1. Go to Vercel Dashboard
2. Click on your project
3. Click "Deployments"
4. Click latest deployment
5. View "Build Logs" and "Function Logs"

**Common Issues:**

**"Blank page"**
- Check browser console for errors
- Verify environment variables are set correctly
- Make sure Supabase URL is in the allowlist

**"Authentication not working"**
- Check Supabase redirect URLs
- Verify VITE_SUPABASE_ANON_KEY is correct

**"Payments failing"**
- Check Stripe publishable key is correct in Vercel environment variables
- Verify Stripe secret key is set in Supabase Edge Functions secrets
- Verify webhook endpoint is configured in Stripe Dashboard
- Check webhook secret matches in Supabase

---

## Automatic Deployments

 **Great news!** Every time you push to GitHub, Vercel will automatically:
1. Build your app
2. Deploy the new version
3. Give you a preview URL

**To deploy an update:**
```bash
git add .
git commit -m "Fix bug in musician dashboard"
git push
```

Vercel detects the push and deploys automatically!

---

## Custom Domain (Optional)

Want `gigmate.com` instead of the Vercel subdomain

1. **Buy a domain** (Namecheap, GoDaddy, Google Domains, etc.)
2. **In Vercel Dashboard**:
   - Go to your project
   - Click "Settings" -> "Domains"
   - Click "Add"
   - Enter your domain: `gigmate.com`
3. **Update DNS records** (Vercel will show you exactly what to add)
4. **Wait for DNS propagation** (5-60 minutes)
5. **Update Supabase URLs** to use your custom domain

---

## Security Checklist

Before going fully live:

- [ ] Replace test Stripe keys with production keys (both Vercel and Supabase)
- [ ] Update Stripe webhook endpoint to production URL
- [ ] Verify webhook secret is updated for production
- [ ] Get real Google Maps API key
- [ ] Set up custom domain with SSL
- [ ] Review Supabase RLS policies
- [ ] Enable Vercel password protection (for private beta)
- [ ] Configure CORS properly
- [ ] Review all environment variables
- [ ] Test payment flows end-to-end in production mode

---

## Cost Estimate

### Vercel (Free Tier):
-  Unlimited personal projects
-  100GB bandwidth/month
-  Automatic HTTPS
-  Preview deployments

### Supabase (Free Tier):
-  500MB database
-  1GB file storage
-  2GB bandwidth
-  50,000 monthly active users

**Total Cost for Beta: $0/month** 

---

## Quick Reference

### Your URLs:

**Frontend (Vercel):**
Will be provided after deployment (something like `gigmate-platform-abc123.vercel.app`)

**Backend (Supabase):**
```
https://rmagqkuwulbcabxtzsjm.supabase.co
```

**Edge Functions:**
```
https://rmagqkuwulbcabxtzsjm.supabase.co/functions/v1/
```

**Supabase Dashboard:**
```
https://app.supabase.com/project/rmagqkuwulbcabxtzsjm
```

**Vercel Dashboard:**
```
https://vercel.com/dashboard
```

---

 **You're ready to deploy GigMate!**

Follow these steps and you'll have a live app in under 30 minutes.
