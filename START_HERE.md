# 🚀 START HERE - Deploy GigMate in 5 Minutes

## Step 1: Get Your Supabase Credentials (2 minutes)

1. Go to: https://supabase.com/dashboard
2. Click your project
3. Go to: **Settings → API**
4. Copy these 2 values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

---

## Step 2: Run ONE Command (3 minutes)

```bash
./deploy-all.sh
```

That's it! The script will:
1. Ask for your Supabase URL and key
2. Install everything needed
3. Build your platform
4. Deploy to Vercel
5. Deploy Edge Functions
6. Give you your live URL

---

## Step 3: Update Supabase (2 minutes)

After deployment:

1. Copy your Vercel URL from the script output
2. Go back to Supabase Dashboard
3. Navigate to: **Authentication → URL Configuration**
4. Set **Site URL:** to your Vercel URL
5. Add **Redirect URLs:** `your-vercel-url/**`
6. Click **Save**

---

## ✅ Done!

Your GigMate platform is now live!

Visit your Vercel URL and test:
- Sign up
- Log in
- Browse events
- All features work!

---

## 🆘 Problems?

### "Permission denied"
```bash
chmod +x deploy-all.sh
./deploy-all.sh
```

### Need details?
See: `AUTOMATION_SCRIPTS.md`

---

**That's all you need! Three steps, 5 minutes, fully automated!** 🎉
