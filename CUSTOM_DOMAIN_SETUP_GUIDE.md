# Custom Domain Setup Guide - gigmate.us

**Last Updated:** November 10, 2025
**Domain:** gigmate.us
**Platform:** GigMate Live Music Booking Platform

---

## Overview

This guide explains how to connect your custom domain (gigmate.us) to your GigMate deployment and continue using AI assistance for development. **Good news: Using a custom domain does NOT prevent you from continuing development with Claude Code!**

---

## Part 1: Connecting gigmate.us to Your Deployment

### Option A: Vercel Deployment (Recommended)

#### Step 1: Deploy to Vercel
```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy your project
vercel --prod
```

#### Step 2: Add Custom Domain in Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your GigMate project
3. Click **"Settings"** -> **"Domains"**
4. Click **"Add Domain"**
5. Enter: `gigmate.us`
6. Click **"Add"**

Vercel will provide DNS records you need to add.

#### Step 3: Configure DNS at Your Domain Registrar

You'll need to add these records (Vercel will show exact values):

**For Root Domain (gigmate.us):**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

**For WWW Subdomain (www.gigmate.us):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

#### Step 4: Add DNS Records

1. Log into your domain registrar (where you bought gigmate.us)
   - GoDaddy, Namecheap, Google Domains, etc.
2. Find DNS Management or DNS Records section
3. Add the A record for root domain
4. Add the CNAME record for www subdomain
5. Save changes

**DNS propagation takes 1-48 hours** (usually 1-4 hours)

#### Step 5: Verify Domain in Vercel

1. Return to Vercel Dashboard -> Domains
2. Wait for verification (green checkmark)
3. Your site will be live at gigmate.us!

#### Step 6: Enable Password Protection

1. In Vercel Dashboard, go to **Settings** -> **Deployment Protection**
2. Enable **"Password Protection"**
3. Set a strong password
4. Share password only with beta testers

---

### Option B: Netlify Deployment

#### Step 1: Deploy to Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

#### Step 2: Add Custom Domain in Netlify

1. Go to [app.netlify.com](https://app.netlify.com)
2. Select your site
3. Click **"Domain settings"**
4. Click **"Add custom domain"**
5. Enter: `gigmate.us`
6. Follow DNS configuration instructions

#### Step 3: Configure DNS

Add these records at your domain registrar:

```
Type: A
Name: @
Value: 75.2.60.5
TTL: 3600

Type: CNAME
Name: www
Value: [your-site].netlify.app
TTL: 3600
```

#### Step 4: Enable Password Protection

1. Go to Site Settings -> Visitor Access
2. Enable **"Password Protection"**
3. Set password
4. Save

---

## Part 2: SSL/HTTPS Certificate (Automatic)

Both Vercel and Netlify automatically provision free SSL certificates via Let's Encrypt:

-  Certificate issued within minutes of domain verification
-  Auto-renewal every 90 days
-  Forces HTTPS (redirects HTTP automatically)
-  No configuration needed

Your site will be accessible at:
- `https://gigmate.us` 
- `https://www.gigmate.us` 
- `http://gigmate.us` -> redirects to HTTPS 

---

## Part 3: Continuing Development with Custom Domain

###  YES - You Can Still Use Claude Code!

**Using a custom domain does NOT prevent you from continuing development.** Here's how it works:

### Scenario 1: Local Development (Recommended)
```bash
# Continue working on your code locally
cd /path/to/gigmate-project

# Make changes with Claude Code assistance
# Test locally with:
npm run dev

# When ready, deploy updates:
vercel --prod
# or
netlify deploy --prod
```

**With this approach:**
-  Claude Code can modify files directly
-  Test changes locally before deployment
-  Deploy when ready
-  Custom domain shows latest deployed version

### Scenario 2: Direct Production Updates

If you need to update the live site:

1. **Make changes with Claude Code locally**
2. **Test thoroughly with `npm run dev`**
3. **Deploy update:**
   ```bash
   vercel --prod
   # or
   netlify deploy --prod
   ```
4. **Changes appear on gigmate.us within seconds**

### Scenario 3: Using Git for Version Control

**Recommended workflow:**

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial deployment"

# Connect to GitHub/GitLab
git remote add origin https://github.com/yourusername/gigmate.git
git push -u origin main

# Connect Vercel/Netlify to GitHub
# Auto-deploys on every push!
```

**Benefits:**
-  Version control of all changes
-  Auto-deploy on git push
-  Easy rollback if needed
-  Claude Code can still help you make changes
-  Preview deployments for testing

---

## Part 4: Maintaining Access Control

### Beta Tester Access Flow

1. **User visits gigmate.us**
2. **Sees password prompt** (Vercel/Netlify password protection)
3. **Enters hosting password** (you provide to beta testers)
4. **Lands on homepage**
5. **Clicks beta invitation link** (e.g., gigmate.us/beta/registercode=ABC12345)
6. **Registers account**
7. **MUST sign legal documents:**
   - NDA (Non-Disclosure Agreement)
   - IP Agreement
   - Non-Compete Agreement
8. **Cannot access platform until all signed**
9. **After signing, sees onboarding tour**
10. **Gets lifetime Pro membership + 100 credits automatically**

### Two-Layer Security

**Layer 1: Hosting Password**
- Blocks all visitors who don't have password
- You control who gets password
- Track who you've given password to

**Layer 2: Legal Documents**
- Even with hosting password, users must sign legal docs
- Blocks platform access until signed
- All signatures stored in database with timestamps and IP addresses

---

## Part 5: Environment Variables

Your environment variables remain secure:

### For Vercel:
1. Go to Project Settings -> Environment Variables
2. Add all variables from your `.env` file:
   ```
   VITE_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY
   VITE_STRIPE_PUBLISHABLE_KEY
   etc.
   ```
3. Redeploy for changes to take effect

### For Netlify:
1. Go to Site Settings -> Environment Variables
2. Add all variables
3. Redeploy

**Important:** Never commit `.env` file to git!

---

## Part 6: Updating Your Deployed Site

### Quick Update Process

```bash
# 1. Make changes with Claude Code
# Edit files as needed

# 2. Test locally
npm run dev

# 3. Build to verify no errors
npm run build

# 4. Deploy update
vercel --prod
# Changes live in 30-60 seconds!

# OR with Git (if connected)
git add .
git commit -m "Update beta tester benefits"
git push
# Auto-deploys within 2-3 minutes
```

### Emergency Rollback

If something breaks:

**Vercel:**
1. Go to Deployments tab
2. Find previous working deployment
3. Click "..." -> "Promote to Production"

**Netlify:**
1. Go to Deploys tab
2. Find previous working deploy
3. Click "Publish deploy"

---

## Part 7: Monitoring Your Custom Domain

### Check Domain Status

```bash
# Check DNS propagation
nslookup gigmate.us

# Check HTTPS certificate
curl -I https://gigmate.us

# Check domain in browser
open https://gigmate.us
```

### Common Issues & Solutions

**Issue:** Domain not resolving
- **Solution:** Wait for DNS propagation (up to 48 hours)
- **Check:** DNS records are correct in registrar

**Issue:** SSL certificate error
- **Solution:** Wait 10-15 minutes after domain verification
- **Vercel/Netlify auto-issues certificate**

**Issue:** Password protection not showing
- **Solution:** Re-enable in Vercel/Netlify settings
- **Check:** Deployment protection is active

**Issue:** Old version showing on gigmate.us
- **Solution:** Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)
- **Check:** Latest deployment is active in dashboard

---

## Part 8: Development Workflow with Custom Domain

### Recommended Workflow

```
1. Local Development (with Claude Code)
  
2. Test with npm run dev
  
3. Make more changes as needed
  
4. Run npm run build (verify no errors)
  
5. Deploy to production
  
6. Changes live on gigmate.us
  
7. Test on live site
  
8. Repeat as needed
```

### Claude Code Can Still Help You:

-  Add new features
-  Fix bugs
-  Update database migrations
-  Modify components
-  Update legal documents
-  Create new admin tools
-  Optimize performance
-  Everything else!

**The custom domain just changes WHERE the code is deployed, not HOW you develop it.**

---

## Part 9: Beta Tester Invitation Process

### Admin Workflow (Using gigmate.us)

1. **Navigate to admin panel:**
   ```
   https://gigmate.us/admin/beta
   ```

2. **Generate invitation:**
   - Enter beta tester's email
   - Click "Generate Invitation"
   - Copy invitation link

3. **Send to beta tester:**
   ```
   Hi [Name],

   You've been invited to beta test GigMate!

   1. Visit: https://gigmate.us
   2. Enter password: [hosting password]
   3. Use this invitation link:
      https://gigmate.us/beta/registercode=ABC12345
   4. Register and sign legal documents
   5. Start testing!

   As a beta tester, you get:
   - Lifetime Pro membership ($240/year value)
   - 50% off Business upgrades
   - 100 free credits
   - Priority support

   Thanks for helping us build the future of live music!
   ```

---

## Part 10: Troubleshooting Custom Domain

### DNS Check
```bash
# Check if domain points to correct server
dig gigmate.us

# Should show Vercel/Netlify IP address
```

### SSL Check
```bash
# Check certificate status
openssl s_client -connect gigmate.us:443 -servername gigmate.us
```

### Deployment Check
```bash
# Verify latest deployment
vercel ls
# or
netlify status
```

---

## Summary

###  Yes, You Can Use gigmate.us AND Continue Development

**The custom domain is just a pointer to your deployed code.** You continue to:
1. Write code locally (with Claude Code's help)
2. Test locally (npm run dev)
3. Deploy updates (vercel --prod or git push)
4. Updates appear on gigmate.us automatically

### Next Steps:

1.  Deploy to Vercel/Netlify
2.  Add gigmate.us in domain settings
3.  Configure DNS at your registrar
4.  Enable password protection
5.  Generate beta invitations
6.  Continue development with Claude Code
7.  Deploy updates as needed

**Your custom domain does NOT lock you out of development. It makes your platform look professional while you continue improving it!**
