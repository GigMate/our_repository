# GigMate Deployment Guide

## Quick Deploy to Vercel (Recommended)

### Prerequisites
- GitHub account
- Vercel account (free at vercel.com)
- Your Supabase project credentials

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/gigmate.git
git push -u origin main
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New Project"
3. Import your GigMate repository
4. Configure environment variables:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
5. Click "Deploy"

### Step 3: Configure Custom Domain
1. In Vercel dashboard, go to your project settings
2. Click "Domains"
3. Add `www.gigmate.us` and `gigmate.us`
4. Vercel will provide DNS records to add to your domain registrar:
   - **A Record**: Point `@` to `76.76.21.21`
   - **CNAME**: Point `www` to `cname.vercel-dns.com`
5. Wait for DNS propagation (5-30 minutes)

### Step 4: Update Supabase Settings
1. Go to your Supabase dashboard
2. Navigate to Authentication → URL Configuration
3. Add your production URL to allowed redirect URLs:
   - `https://www.gigmate.us`
   - `https://gigmate.us`

## Alternative: Deploy to Netlify

### Step 1: Build Configuration
Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Step 2: Deploy
1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select your repository
4. Add environment variables (same as Vercel)
5. Click "Deploy"

### Step 3: Custom Domain
1. Go to Domain settings
2. Add custom domain `www.gigmate.us`
3. Follow DNS configuration instructions

## Manual Deployment (Traditional Hosting)

### Step 1: Build the Project
```bash
npm run build
```

### Step 2: Upload Files
Upload the entire `dist` folder contents to your web host via:
- FTP/SFTP
- cPanel File Manager
- Your hosting provider's upload tool

### Step 3: Configure Web Server
Ensure all routes redirect to `index.html`

**Apache (.htaccess):**
```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

**Nginx:**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### Step 4: Set Environment Variables
Create a `.env.production` file in your hosting environment or use your host's environment variable settings.

## Environment Variables Required

- `VITE_SUPABASE_URL` - Your Supabase project URL (found in Supabase dashboard)
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key (found in Supabase dashboard)

## Post-Deployment Checklist

- [ ] Site loads at www.gigmate.us
- [ ] Authentication works (sign up, login, logout)
- [ ] Database operations work correctly
- [ ] All pages are accessible
- [ ] Forms submit properly
- [ ] Images and assets load
- [ ] Mobile responsive design works
- [ ] SSL certificate is active (https)

## Troubleshooting

**404 errors on page refresh:**
- Check that routing configuration is correct
- Verify `vercel.json` or `.htaccess` is in place

**Authentication not working:**
- Verify environment variables are set correctly
- Check Supabase allowed redirect URLs include your domain

**White screen/blank page:**
- Check browser console for errors
- Verify all environment variables are set
- Ensure build completed successfully

## Need Help?

Check these resources:
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [Supabase Documentation](https://supabase.com/docs)
