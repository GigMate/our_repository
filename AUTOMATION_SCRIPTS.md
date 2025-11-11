# 🤖 GigMate Automated Deployment Scripts

**Everything is automated. Just run one command.**

---

## 🚀 One-Command Deploy (Recommended)

```bash
./deploy-all.sh
```

**This single script does EVERYTHING:**
- ✅ Sets up environment (asks for Supabase credentials)
- ✅ Installs dependencies
- ✅ Builds the project
- ✅ Deploys to Vercel
- ✅ Deploys Edge Functions
- ✅ Verifies deployment

**Time:** 5-10 minutes (mostly automated)

---

## 📋 Individual Scripts (Advanced)

### 1. Setup Environment

```bash
./setup-env.sh
```

**What it does:**
- Asks for your Supabase URL and keys
- Creates `.env` file automatically
- Validates configuration

**When to use:** First time setup or reconfiguration

---

### 2. Deploy to Vercel

```bash
./deploy.sh
```

**What it does:**
- Installs dependencies
- Builds project
- Deploys to Vercel with environment variables
- Shows your live URL

**When to use:** After setup, to deploy/update your site

---

### 3. Deploy Edge Functions

```bash
./deploy-functions.sh
```

**What it does:**
- Deploys all 8 Supabase Edge Functions
- Shows deployment status for each
- Reports success/failure

**When to use:** After Vercel deployment, or to update functions

---

## 🎯 Quick Start (From Scratch)

**If you're starting from nothing:**

```bash
# 1. Run the complete automation
./deploy-all.sh

# 2. Follow the prompts:
#    - Enter Supabase URL
#    - Enter Supabase Anon Key
#    - (Optional) Enter Stripe key
#    - (Optional) Enter Google Maps key

# 3. Wait 5-10 minutes

# 4. Done! Your platform is live!
```

---

## 📝 What You Need

### Required (Script will ask for these):
- **Supabase URL** (from Supabase Dashboard)
- **Supabase Anon Key** (from Supabase Dashboard)

Get them from: https://supabase.com/dashboard → Your Project → Settings → API

### Optional (Add later):
- Stripe Publishable Key (for payments)
- Google Maps API Key (for location features)

---

## 🔄 Update Your Deployment

**To deploy updates:**

```bash
# Make your code changes, then:
./deploy.sh
```

That's it! Your changes are live in 2-3 minutes.

---

## 🐛 Troubleshooting

### "Permission denied" error

```bash
chmod +x *.sh
```

### "Vercel CLI not found"

Script will install it automatically, or run:
```bash
npm install -g vercel
```

### "Supabase CLI not found"

Script will install it automatically, or run:
```bash
npm install -g supabase
```

### Build fails

```bash
# Test build locally first
npm run build

# Check for errors and fix them
```

### Environment variables not set

```bash
# Run setup again
./setup-env.sh
```

---

## 📊 What Happens During Deployment

### deploy-all.sh Flow:

1. **Environment Check** (30 seconds)
   - Checks for `.env` file
   - Creates it if missing (interactive)
   - Validates required variables

2. **Dependencies** (1-2 minutes)
   - Runs `npm install`
   - Installs any missing packages

3. **Build** (10-15 seconds)
   - Runs `npm run build`
   - Compiles TypeScript
   - Bundles assets
   - Optimizes code

4. **Vercel Deployment** (2-3 minutes)
   - Uploads build to Vercel
   - Configures environment variables
   - Sets up routing
   - Enables SSL
   - Returns live URL

5. **Edge Functions** (1-2 minutes)
   - Deploys 8 Supabase functions
   - Configures CORS
   - Sets up webhooks
   - Verifies deployment

6. **Summary** (instant)
   - Shows your live URL
   - Lists next steps
   - Provides documentation links

**Total Time:** 5-10 minutes

---

## ✅ Post-Deployment (Manual Steps)

After automation completes, you need to:

### 1. Update Supabase Auth URLs (2 minutes)

1. Copy your Vercel URL from script output
2. Go to: https://supabase.com/dashboard
3. Navigate to: **Authentication → URL Configuration**
4. Set **Site URL:** `https://your-vercel-url.app`
5. Add **Redirect URL:** `https://your-vercel-url.app/**`
6. Click **Save**

### 2. Test Your Deployment (5 minutes)

1. Visit your Vercel URL
2. Try signing up
3. Test login
4. Browse features
5. Verify everything works

### 3. Configure Stripe (Optional - 5 minutes)

If using payments:

1. Go to: https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://YOUR-PROJECT.supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `customer.subscription.created`
4. Copy webhook secret
5. Add to Supabase:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

## 🎨 Customization

### Add More Environment Variables

Edit `.env` and redeploy:

```bash
# Edit .env file
nano .env

# Redeploy
./deploy.sh
```

### Update Edge Functions

Make changes to functions, then:

```bash
./deploy-functions.sh
```

### Change Deployment Settings

Edit `vercel.json` or use Vercel dashboard

---

## 📚 Documentation

- **Quick Guide:** `VERCEL_READY.md`
- **Detailed Guide:** `VERCEL_DEPLOYMENT_GUIDE.md`
- **Checklist:** `DEPLOY_NOW_CHECKLIST.md`
- **This File:** `AUTOMATION_SCRIPTS.md`

---

## 🎉 Summary

**Before automation:**
- 20+ manual steps
- 30-60 minutes
- Easy to make mistakes
- Required technical knowledge

**With automation:**
- Run 1 command: `./deploy-all.sh`
- Answer a few questions
- Wait 5-10 minutes
- Done!

**Your $100M platform deploys itself!** 🚀

---

## 🆘 Need Help?

1. Check troubleshooting section above
2. Read `VERCEL_DEPLOYMENT_GUIDE.md`
3. Check Vercel logs: `vercel logs`
4. Check function logs: `supabase functions logs function-name`

---

## 💡 Pro Tips

1. **First deployment:** Use `deploy-all.sh` - it does everything
2. **Updates:** Use `deploy.sh` - faster for code changes
3. **Functions only:** Use `deploy-functions.sh` - when updating functions
4. **Keep `.env` file safe** - never commit it to git
5. **Test locally first:** Run `npm run build` before deploying

---

**Everything is automated. Just run the script!** 🤖✨
