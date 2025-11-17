# Deploy GigMate to Production - Quick Guide

**Time Required:** 15-30 minutes
**Prerequisites:** Vercel account, domain access

---

##  Step 1: Deploy to Vercel (5 minutes)

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel (opens browser)
vercel login

# Deploy to production
vercel --prod
```

**What happens:**
- Code is uploaded and built
- You get a production URL like `gigmate-xxx.vercel.app`
- Site is live but not yet on your custom domain

---

## ? Step 2: Add Password Protection (2 minutes)

**Why:** Keep beta private until you're ready for public launch

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to **Settings** -> **Deployment Protection**
4. Enable **"Password Protection"**
5. Set password: Choose something memorable for beta testers
   - Example: `GigMate2025Beta!`
6. **Save** this password - you'll send it to beta testers

---

##  Step 3: Connect gigmate.us Domain (10 minutes)

### In Vercel:
1. Go to **Settings** -> **Domains**
2. Click **"Add Domain"**
3. Enter: `gigmate.us`
4. Click **"Add"**

Vercel will show you DNS records to add. Keep this page open.

### At Your Domain Registrar (GoDaddy, Namecheap, etc.):
1. Log into your domain registrar
2. Find **DNS Management** or **DNS Settings**
3. Add these records:

**A Record (for gigmate.us):**
```
Type: A
Name: @ (or leave blank)
Value: 76.76.21.21
TTL: 3600
```

**CNAME Record (for www.gigmate.us):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

4. **Save** DNS changes

**Wait time:** 1-4 hours (sometimes up to 48 hours) for DNS to propagate

---

##  Step 4: Add Environment Variables (3 minutes)

In Vercel Dashboard -> Your Project -> **Settings** -> **Environment Variables**

Add these variables (get values from your Supabase dashboard):

```env
VITE_SUPABASE_URL
Value: [Your Supabase URL - looks like: https://xxx.supabase.co]

VITE_SUPABASE_ANON_KEY
Value: [Your Supabase Anon Key - starts with: eyJ...]

VITE_STRIPE_PUBLISHABLE_KEY
Value: pk_test_xxx (use test key for beta)

VITE_GOOGLE_MAPS_API_KEY (optional)
Value: [Your Google Maps API key if you have one]
```

**Important:** Click **"All"** or select all environments (Production, Preview, Development)

After adding variables, click **"Redeploy"** in Deployments tab.

---

##  Step 5: Verify Deployment (5 minutes)

### Test Checklist:

1. **Visit your Vercel URL** (from Step 1)
   - [ ] Password prompt appears
   - [ ] Enter password
   - [ ] Site loads correctly

2. **Test Registration Flow**
   - [ ] Click "Get Started"
   - [ ] Try creating an account
   - [ ] Check Supabase to see if data is saved

3. **Test Database Seeding**
   - [ ] Visit: `[your-url]/admin/seed`
   - [ ] Click "Seed Database"
   - [ ] Verify data appears

4. **Wait for Domain to Work**
   - [ ] Check: `https://gigmate.us` (may take 1-4 hours)
   - [ ] Look for green lock icon (SSL certificate)
   - [ ] Test all functionality on custom domain

---

## ? Step 6: Generate Beta Codes (5 minutes)

1. Log into your deployed site
2. Visit: `https://gigmate.us/admin/beta` (or your Vercel URL + `/admin/beta`)
3. Generate codes:
   - Create 5-7 codes for **Musicians**
   - Create 3-5 codes for **Venues**
   - Create 5-8 codes for **Fans**
4. **Save these codes** - you'll send them to beta testers

---

## ? Step 7: Invite Beta Testers (Same Day)

Use this email template:

```
Subject: You're Invited to GigMate Beta!

Hi [Name],

You've been selected to join the exclusive GigMate beta program!

YOUR BETA ACCESS:
Website: https://gigmate.us
Site Password: [your password from Step 2]
Beta Code: [unique code from Step 6]

GETTING STARTED:
1. Visit https://gigmate.us
2. Enter the site password when prompted
3. Click "Beta Registration"
4. Enter your beta code
5. Sign the NDA and create your account

As a beta tester, you get:
 Lifetime premium features (free forever)
 0.5% transaction fee (vs 2.5% standard)
 Priority support
 Voice in product direction

Questions? Reply to this email.

Welcome to GigMate!
```

---

## ? Step 8: Set Up Feedback Collection

**Option 1: Simple Email**
Create a new email: `beta@gigmate.us`
Tell testers: "Report bugs to beta@gigmate.us"

**Option 2: Google Form**
Create form with:
- User type (Musician/Venue/Fan)
- Issue description
- Screenshots (optional)
- Severity (Critical/High/Medium/Low)

**Option 3: Discord/Slack**
Create private server with channels:
- #announcements
- #bugs
- #feedback
- #feature-requests

---

##  Monitor During Beta

### Daily Tasks:
- [ ] Check for new registrations
- [ ] Review bug reports
- [ ] Fix critical issues (P0/P1)
- [ ] Respond to user questions

### Weekly Tasks:
- [ ] Deploy bug fixes and updates
- [ ] Send progress update email
- [ ] Survey beta testers
- [ ] Iterate on feedback

---

## ? Troubleshooting Common Issues

### "Site not loading after deployment"
- Check environment variables are set
- Verify Supabase URL and keys are correct
- Look at Vercel deployment logs for errors

### "Domain not working"
- DNS can take up to 48 hours
- Use `nslookup gigmate.us` to check propagation
- Try visiting Vercel URL instead temporarily

### "Can't register users"
- Check Supabase is accessible
- Verify RLS policies allow inserts
- Check browser console for errors

### "Password protection not working"
- Redeploy after enabling it
- Clear browser cache
- Try incognito/private window

---

##  You're Done!

After completing these steps:
-  Site is live at gigmate.us
-  Protected by password (private beta)
-  Environment variables configured
-  Beta codes generated
-  Ready to invite testers

---

## ? Need Help?

If you get stuck:
1. Check Vercel deployment logs
2. Check Supabase dashboard for errors
3. Check browser console (F12) for JavaScript errors
4. Ask me for help with specific error messages

---

## ? Next Steps After Deployment

**Today:**
- Deploy (Steps 1-4)
- Test basic functionality
- Generate beta codes

**Tomorrow:**
- Send first batch of invitations (5-10 people)
- Monitor registrations
- Be ready to help first testers

**This Week:**
- Invite remaining testers
- Fix any critical bugs
- Start collecting feedback

**Next 2-4 Weeks:**
- Iterate based on feedback
- Build confidence in platform
- Prepare for public launch

---

**Ready? Run this command to start:**

```bash
npm i -g vercel && vercel login && vercel --prod
```

**Then follow the steps above! You've got this!**
