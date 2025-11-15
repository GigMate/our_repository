# Task 1: Enable Email Confirmation in Supabase

**Empowering live music communities, one gig at a time.**

## Overview
Email confirmation ensures users verify their email address before accessing the platform. This prevents spam accounts and validates user contact information.

---

## Step-by-Step Instructions

### 1. Access Supabase Dashboard
1. Go to https://supabase.com
2. Click "Sign In" (top right)
3. Log in with your Supabase account credentials
4. You'll see your dashboard with all projects

### 2. Select Your GigMate Project
1. Find your GigMate project in the project list
2. Click on the project card to open it
3. You should see the project overview page

### 3. Navigate to Authentication Settings
1. Look at the left sidebar navigation
2. Click on **"Authentication"** (icon looks like a shield/lock)
3. In the sub-menu that appears, click on **"Settings"**
4. You're now in the Authentication Settings page

### 4. Enable Email Confirmation
1. Scroll down to find the **"User Signups"** section
2. Look for the setting: **"Enable email confirmations"**
3. Toggle the switch to **ON** (it should turn green/blue)
4. You may see additional options appear:
   - **Confirmation URL**: Leave as default unless you have a custom domain
   - **Confirm email change**: Also toggle this ON (recommended)

### 5. Configure Email Templates (Optional but Recommended)
1. While still in Authentication > Settings, scroll to **"Email Templates"**
2. You can customize these templates:
   - **Confirm signup** - Email sent when users sign up
   - **Invite user** - Email for invited users
   - **Magic link** - For magic link authentication (if enabled)
   - **Change email address** - When users change their email
   - **Reset password** - For password resets

3. Click **"Confirm signup"** to customize:
   ```
   Subject: Confirm Your Email for GigMate

   Body:
   Hi {{ .Name }},

   Welcome to GigMate - Empowering live music communities, one gig at a time.

   Please confirm your email address by clicking the button below:

   {{ .ConfirmationURL }}

   If you didn't sign up for GigMate, you can safely ignore this email.

   Thanks,
   The GigMate Team
   ```

4. Click **"Save"** after customizing

### 6. Configure SMTP Settings (Important!)
By default, Supabase sends emails through their SMTP server, but it has rate limits.

**Default Supabase SMTP:**
- Pro Plan: 3 emails per hour per user
- Free Plan: Very limited

**Recommended: Set up Custom SMTP**
1. In Authentication > Settings, scroll to **"SMTP Settings"**
2. Toggle **"Enable Custom SMTP"** to ON
3. Enter your SMTP provider details:

**Option A: Use Gmail (Development/Testing)**
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: your-email@gmail.com
SMTP Password: [Your App Password - see instructions below]
Sender Email: your-email@gmail.com
Sender Name: GigMate
```

**To get Gmail App Password:**
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification (if not enabled)
3. Click "App passwords"
4. Generate password for "Mail"
5. Copy the 16-character password
6. Use this as SMTP Password

**Option B: Use SendGrid (Recommended for Production)**
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Password: [Your SendGrid API Key]
Sender Email: noreply@gigmate.com (your verified domain)
Sender Name: GigMate
```

**To get SendGrid API Key:**
1. Sign up at https://sendgrid.com (Free tier: 100 emails/day)
2. Go to Settings > API Keys
3. Click "Create API Key"
4. Name it "Supabase Email"
5. Give it "Full Access"
6. Copy the API key
7. Use this as SMTP Password

**Option C: Use Resend (Modern Alternative)**
```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend
SMTP Password: [Your Resend API Key]
Sender Email: noreply@gigmate.com
Sender Name: GigMate
```

**To get Resend API Key:**
1. Sign up at https://resend.com (Free tier: 3000 emails/month)
2. Go to API Keys
3. Create API Key
4. Copy and use as SMTP Password

4. Click **"Save"** after entering SMTP details
5. Click **"Send Test Email"** to verify it works

### 7. Configure Redirect URLs (Important!)
1. Still in Authentication > Settings
2. Find **"Redirect URLs"** or **"Site URL"** section
3. Add your application URLs:

**Development:**
```
http://localhost:5173
http://localhost:5173/onboarding
```

**Production (add when you deploy):**
```
https://gigmate.com
https://www.gigmate.com
https://gigmate.com/onboarding
https://*.vercel.app (for preview deployments)
```

4. Click **"Add URL"** for each one
5. Click **"Save"**

### 8. Test Email Confirmation Flow

**A. Create Test Account**
1. Open your application in a browser
2. Go to the sign-up page
3. Create a new account with a real email you can access
4. Submit the form

**B. Verify Email Sent**
1. Check your email inbox
2. Look for confirmation email from GigMate/Supabase
3. Note: Check spam folder if not in inbox

**C. Click Confirmation Link**
1. Open the email
2. Click the confirmation link
3. You should be redirected to your app
4. The account should now be confirmed

**D. Verify in Supabase**
1. Go to Supabase Dashboard > Authentication > Users
2. Find your test user
3. Check the **"Confirmed"** column - should show checkmark
4. Click on the user to see details
5. **email_confirmed_at** should have a timestamp

### 9. Handle Unconfirmed Users in Your App

Your app should check if email is confirmed. Update the auth flow:

**Check Required in These Files:**
- `src/contexts/AuthContext.tsx` - Add confirmation check
- `src/components/Auth/SignUpForm.tsx` - Show confirmation message

The Supabase client automatically handles this - users won't be able to sign in until confirmed.

### 10. Monitor Email Confirmations

**In Supabase Dashboard:**
1. Go to Authentication > Users
2. You can see which users are confirmed (checkmark in "Confirmed" column)
3. Filter by confirmed/unconfirmed status
4. Manually confirm users if needed (useful for troubleshooting)

---

## Verification Checklist

After completing setup, verify:

- [ ] Email confirmation toggle is ON
- [ ] Custom SMTP configured (or using default)
- [ ] Test email sent successfully
- [ ] Email templates customized
- [ ] Redirect URLs configured
- [ ] Test user received confirmation email
- [ ] Test user successfully confirmed
- [ ] Unconfirmed users cannot sign in
- [ ] Confirmed users can sign in normally

---

## Common Issues & Solutions

### Issue 1: Emails Not Arriving
**Solutions:**
- Check spam folder
- Verify SMTP credentials are correct
- Send test email from Supabase Dashboard
- Check SMTP provider logs (SendGrid/Gmail)
- Ensure sender email is verified with provider

### Issue 2: Confirmation Link Doesn't Work
**Solutions:**
- Check Redirect URLs are configured correctly
- Ensure Site URL matches your app domain
- Check browser console for errors
- Verify link hasn't expired (default: 24 hours)

### Issue 3: Users Stuck in "Unconfirmed" State
**Solutions:**
- Manually confirm from Dashboard (temporary fix)
- Resend confirmation email via Dashboard
- Check if user clicked wrong link
- Create function to resend confirmation (see below)

### Issue 4: Rate Limit Reached (Default SMTP)
**Solutions:**
- Set up custom SMTP (recommended)
- Upgrade Supabase plan
- Use rate limiting on signup form

---

## Advanced: Resend Confirmation Email Function

Create an edge function to resend confirmation emails:

```typescript
// supabase/functions/resend-confirmation/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const { email } = await req.json();

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'signup',
    email: email,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
```

---

## Security Notes

1. **Email confirmation is critical** - prevents spam and bot accounts
2. **Don't disable after beta** - keep enabled permanently
3. **Monitor confirmation rates** - low rates may indicate UX issues
4. **Set reasonable expiration** - 24-48 hours is standard
5. **Consider email change confirmation** - prevents account hijacking

---

## Next Steps

After completing this task:
1. Mark this task complete
2. Move to **Task 2: Configure CAPTCHA Protection**
3. Keep monitoring email delivery during beta
4. Consider adding "Resend confirmation email" button in UI

---

## Support Resources

- Supabase Auth Docs: https://supabase.com/docs/guides/auth
- SMTP Setup Guide: https://supabase.com/docs/guides/auth/auth-smtp
- Email Templates: https://supabase.com/docs/guides/auth/auth-email-templates
- SendGrid Docs: https://docs.sendgrid.com/
- Resend Docs: https://resend.com/docs

---

**Status:** Ready to implement
**Estimated Time:** 15-30 minutes (including SMTP setup)
**Difficulty:** Easy to Medium

**When Complete:** Check this box in BETA_LAUNCH_READY.md
```
- [x] Enable email confirmation (Dashboard)
```
