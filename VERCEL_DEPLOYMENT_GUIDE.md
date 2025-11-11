# 🚀 GigMate - Vercel Deployment Guide

**Complete step-by-step guide to deploy GigMate to Vercel**

---

## ✅ Pre-Deployment Checklist

Before deploying, ensure you have:

- [x] Supabase project set up
- [x] All database migrations run
- [x] Environment variables ready
- [x] Stripe account (if using payments)
- [x] Google Maps API key (if using maps)
- [ ] Vercel account (free tier works)
- [ ] GitHub repository (recommended)

---

## 📋 Step 1: Prepare Environment Variables

You'll need these environment variables for Vercel. Get them from your Supabase project:

### Required Variables:

```bash
# Supabase (REQUIRED - Get from Supabase Dashboard > Project Settings > API)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# These are already available in Supabase Edge Functions environment
# You only need to set them in your .env for local development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Optional (but recommended):

```bash
# Stripe (for payments)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Google Maps (for location features)
VITE_GOOGLE_MAPS_API_KEY=AIza...

# Email (optional - Supabase has built-in email)
RESEND_API_KEY=re_...

# Mayday Background Checks (optional)
MAYDAY_API_KEY=your_key_here
```

---

## 🌐 Step 2: Deploy to Vercel

### Option A: Deploy via GitHub (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Select the repository

3. **Configure Project:**
   - Framework Preset: **Vite**
   - Root Directory: `./` (leave default)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Add Environment Variables:**
   - In Vercel dashboard, go to Settings > Environment Variables
   - Add each variable from Step 1
   - **IMPORTANT:** Only add `VITE_` prefixed variables for the frontend
   - Other variables are for Edge Functions (already in Supabase)

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your site will be live at `your-project.vercel.app`

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Follow prompts:**
   - Set up and deploy: Y
   - Scope: Select your account
   - Link to existing project: N (first time)
   - Project name: gigmate (or your choice)
   - Directory: ./
   - Override settings: N

5. **Add Environment Variables:**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   vercel env add VITE_STRIPE_PUBLISHABLE_KEY
   vercel env add VITE_GOOGLE_MAPS_API_KEY
   ```

6. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

---

## 🔧 Step 3: Configure Supabase for Production

### Update Supabase Auth Settings:

1. **Go to Supabase Dashboard** → Authentication → URL Configuration

2. **Add your Vercel URL to Site URL:**
   ```
   https://your-project.vercel.app
   ```

3. **Add Redirect URLs:**
   ```
   https://your-project.vercel.app/**
   https://your-project.vercel.app/auth/callback
   ```

4. **Save Changes**

### Deploy Edge Functions:

Your Edge Functions are already in the `supabase/functions/` directory. To deploy them:

```bash
# Deploy all functions
supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook
supabase functions deploy send-email
supabase functions deploy process-email-queue
supabase functions deploy auto-generate-events
supabase functions deploy osint-investigator
supabase functions deploy send-osint-daily-report
supabase functions deploy request-mayday-background-check
```

Or deploy all at once:
```bash
for func in supabase/functions/*/; do
  supabase functions deploy $(basename $func)
done
```

---

## 🎯 Step 4: Configure Stripe Webhooks (If Using Payments)

1. **Go to Stripe Dashboard** → Developers → Webhooks

2. **Add Endpoint:**
   ```
   https://your-project.supabase.co/functions/v1/stripe-webhook
   ```

3. **Select Events:**
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

4. **Get Webhook Secret:**
   - Copy the webhook signing secret (starts with `whsec_`)
   - Add to Supabase Edge Function secrets:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

## 🗺️ Step 5: Configure Google Maps API (If Using Maps)

1. **Go to Google Cloud Console** → APIs & Services → Credentials

2. **Create API Key** (if you don't have one)

3. **Enable Required APIs:**
   - Maps JavaScript API
   - Places API
   - Geocoding API

4. **Restrict API Key:**
   - Application restrictions: HTTP referrers
   - Add: `https://your-project.vercel.app/*`
   - Add: `http://localhost:5173/*` (for local dev)

5. **Add to Vercel:**
   - Vercel Dashboard → Settings → Environment Variables
   - Add `VITE_GOOGLE_MAPS_API_KEY`

---

## ✅ Step 6: Verify Deployment

### Test These Features:

1. **Homepage loads** ✓
   - Visit `https://your-project.vercel.app`
   - Should see GigMate homepage

2. **Authentication works** ✓
   - Try to sign up/login
   - Check email verification

3. **Database queries work** ✓
   - Browse musicians/venues
   - Should load data from Supabase

4. **Payments work** (if configured) ✓
   - Try to purchase credits/tickets
   - Should redirect to Stripe

5. **Maps work** (if configured) ✓
   - Open map search
   - Should display Google Maps

6. **Edge Functions work** ✓
   - Test email sending
   - Test any API calls

### Common Issues:

**Issue:** "Failed to fetch" errors
- **Fix:** Check CORS settings in Supabase
- Go to Supabase Dashboard → Settings → API
- Add Vercel URL to allowed origins

**Issue:** Environment variables not working
- **Fix:** Make sure variables start with `VITE_` for client-side
- Redeploy after adding variables

**Issue:** 404 on routes
- **Fix:** Vercel.json should have rewrite rule (already included)

**Issue:** Supabase connection fails
- **Fix:** Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Make sure they're set in Vercel dashboard

---

## 🔄 Step 7: Set Up Automatic Deployments

### With GitHub (Recommended):

1. **Every push to `main` automatically deploys**
   - Commit code → Push → Vercel deploys
   - No manual steps needed

2. **Preview Deployments:**
   - Push to any branch
   - Vercel creates preview URL
   - Test before merging to main

### Manual Deployments:

```bash
# From your local machine
vercel --prod
```

---

## 📊 Step 8: Monitor Your Deployment

### Vercel Dashboard:

1. **Analytics:**
   - View visitor stats
   - See performance metrics
   - Monitor bandwidth usage

2. **Logs:**
   - View deployment logs
   - Check for errors
   - Debug issues

3. **Domains:**
   - Add custom domain
   - Configure DNS
   - Enable SSL (automatic)

### Supabase Dashboard:

1. **Database:**
   - Monitor queries
   - Check table sizes
   - View logs

2. **Auth:**
   - Track user signups
   - Monitor auth attempts
   - Check email delivery

3. **Edge Functions:**
   - View function logs
   - Monitor invocations
   - Check errors

---

## 🎨 Step 9: Add Custom Domain (Optional)

1. **Buy domain** (Namecheap, GoDaddy, etc.)

2. **In Vercel:**
   - Settings → Domains
   - Add domain: `gigmate.com`
   - Add `www.gigmate.com`

3. **Configure DNS:**
   - Add A record: `76.76.21.21`
   - Add CNAME: `cname.vercel-dns.com`

4. **Wait for SSL:**
   - Vercel auto-generates SSL certificate
   - Takes 10-60 minutes

5. **Update Supabase:**
   - Add custom domain to allowed URLs
   - Update redirect URLs

---

## 🔐 Security Checklist

Before going live:

- [ ] Environment variables are NOT committed to git
- [ ] `.env` file is in `.gitignore`
- [ ] Supabase RLS policies are enabled on all tables
- [ ] Stripe webhooks are configured with secret
- [ ] Google Maps API key is restricted to your domain
- [ ] Supabase auth URLs are updated
- [ ] CORS is configured correctly
- [ ] All Edge Functions are deployed
- [ ] Database migrations are run
- [ ] Service role key is NOT exposed in frontend

---

## 📱 Step 10: Test on Mobile

Your app is responsive, but test these on mobile:

1. **Visit on phone:**
   - `https://your-project.vercel.app`

2. **Test features:**
   - Sign up/login
   - Browse events
   - Purchase tickets
   - Scan QR codes (venue scanner)
   - View tickets (fan wallet)
   - Maps functionality

3. **Add to Home Screen:**
   - iOS: Share → Add to Home Screen
   - Android: Menu → Add to Home Screen

---

## 🚀 Performance Optimization

### Vercel Settings:

1. **Enable Speed Insights:**
   - Vercel Dashboard → Analytics
   - Monitor Core Web Vitals

2. **Configure Headers:**
   Already configured in `vercel.json`

3. **Enable Compression:**
   Automatic with Vercel

### Lighthouse Score Goals:

- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

---

## 🐛 Troubleshooting

### Build Fails:

```bash
# Check build locally first
npm run build

# If successful locally but fails on Vercel:
# 1. Check Node.js version
# 2. Clear Vercel cache
# 3. Check for missing dependencies
```

### Environment Variables Not Loading:

```bash
# Verify in Vercel Dashboard
# Make sure they start with VITE_ for client-side
# Redeploy after adding variables
```

### Database Connection Issues:

```bash
# Check Supabase project status
# Verify VITE_SUPABASE_URL is correct
# Test with Supabase client locally first
```

### Edge Functions Not Working:

```bash
# Deploy functions manually
supabase functions deploy function-name

# Check function logs
supabase functions logs function-name

# Verify secrets are set
supabase secrets list
```

---

## 📞 Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Stripe Docs:** https://stripe.com/docs
- **Vite Docs:** https://vitejs.dev/guide/

---

## ✅ Deployment Complete!

Your GigMate platform is now live at:
- **Production:** `https://your-project.vercel.app`
- **Supabase:** `https://your-project.supabase.co`

### Next Steps:

1. **Seed Data:**
   - Run data seeding functions
   - Create test accounts
   - Add sample events

2. **Invite Beta Testers:**
   - Send them the Vercel URL
   - Have them create accounts
   - Gather feedback

3. **Monitor:**
   - Check Vercel analytics
   - Monitor Supabase usage
   - Watch for errors

4. **Iterate:**
   - Fix bugs
   - Add features
   - Deploy updates (automatic with GitHub)

---

**🎉 Congratulations! Your platform is LIVE!** 🎉

---

## Quick Reference Commands

```bash
# Deploy to Vercel (production)
vercel --prod

# Deploy Edge Function
supabase functions deploy function-name

# View Edge Function logs
supabase functions logs function-name

# Add Vercel environment variable
vercel env add VARIABLE_NAME

# Check Vercel deployment logs
vercel logs

# Link local project to Vercel
vercel link

# Run local build
npm run build

# Test production build locally
npm run preview
```

---

**Need help?** Check the documentation files in the project root or contact support.
