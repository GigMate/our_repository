# GoDaddy SMTP Setup for Supabase - GigMate

## Your Email Configuration
- **Email Address:** admin@gigmate.us
- **Provider:** GoDaddy
- **Domain:** gigmate.us

---

## Step 1: Get GoDaddy SMTP Credentials

### Option A: Using GoDaddy Workspace Email (Professional Email)

If you have GoDaddy Workspace Email (paid email hosting):

**SMTP Settings:**
```
SMTP Host: smtp.office365.com
SMTP Port: 587
SMTP User: admin@gigmate.us
SMTP Password: [Your email password]
Sender Email: admin@gigmate.us
Sender Name: GigMate
```

**Why Office365?** GoDaddy Workspace uses Microsoft 365 infrastructure.

### Option B: Using GoDaddy cPanel Email (Legacy)

If you have cPanel/older GoDaddy email:

**SMTP Settings:**
```
SMTP Host: smtpout.secureserver.net
SMTP Port: 465 (SSL) or 587 (TLS)
SMTP User: admin@gigmate.us
SMTP Password: [Your email password]
Sender Email: admin@gigmate.us
Sender Name: GigMate
```

### Option C: Check Your Exact Settings

1. Log in to https://account.godaddy.com
2. Go to **"Email & Office"** → **"My Email"**
3. Find your email: admin@gigmate.us
4. Click **"Manage"** or **"Settings"**
5. Look for **"SMTP Settings"** or **"Email Settings"**
6. GoDaddy will show you the exact SMTP server details

---

## Step 2: Configure SMTP in Supabase Dashboard

### Navigate to Supabase
1. Go to https://supabase.com
2. Sign in to your account
3. Select your **GigMate** project
4. Click **"Authentication"** in left sidebar
5. Click **"Settings"** (under Authentication)

### Enable Custom SMTP
1. Scroll down to **"SMTP Settings"** section
2. Toggle **"Enable Custom SMTP"** to **ON**

### Enter GoDaddy SMTP Details

**For GoDaddy Workspace (Office365):**
```
Host: smtp.office365.com
Port: 587
Username: admin@gigmate.us
Password: [Your admin@gigmate.us password]
Sender email: admin@gigmate.us
Sender name: GigMate
```

**For GoDaddy Legacy (cPanel):**
```
Host: smtpout.secureserver.net
Port: 587
Username: admin@gigmate.us
Password: [Your admin@gigmate.us password]
Sender email: admin@gigmate.us
Sender name: GigMate
```

3. Click **"Save"**

---

## Step 3: Send Test Email

1. After saving SMTP settings, look for **"Send Test Email"** button
2. Click it
3. Enter a test email address (your personal email)
4. Click **"Send"**
5. Check your inbox (and spam folder)

### If Test Fails:

**Error: "Authentication failed"**
- Double-check your admin@gigmate.us password
- Try resetting the email password in GoDaddy
- Ensure you're using the correct SMTP host

**Error: "Connection timeout"**
- Try port 465 instead of 587
- Check if GoDaddy requires SSL/TLS
- Contact GoDaddy support to verify SMTP is enabled

**Error: "Relay access denied"**
- Ensure SMTP username matches sender email
- Check if SMTP is enabled for your account
- May need to enable "SMTP Relay" in GoDaddy settings

---

## Step 4: Enable Email Confirmation

Once SMTP test succeeds:

1. Scroll up to **"User Signups"** section
2. Find **"Enable email confirmations"**
3. Toggle to **ON**
4. Also enable **"Enable email change confirmations"**
5. Click **"Save"**

---

## Step 5: Configure Redirect URLs

1. Still in Authentication > Settings
2. Find **"Redirect URLs"** section
3. Add these URLs:

**For Development:**
```
http://localhost:5173
http://localhost:5173/onboarding
```

**For Production:**
```
https://gigmate.us
https://www.gigmate.us
https://gigmate.us/onboarding
```

4. Set **"Site URL"** to: `https://gigmate.us`
5. Click **"Save"**

---

## Step 6: Customize Email Templates

1. Scroll to **"Email Templates"** section
2. Click **"Confirm signup"**
3. Customize the template:

```
Subject: Confirm Your Email - GigMate

Body:
Hi there,

Welcome to GigMate! Please confirm your email address to activate your account.

{{ .ConfirmationURL }}

If you didn't sign up for GigMate, you can safely ignore this email.

Best regards,
The GigMate Team
admin@gigmate.us
```

4. Click **"Save"**

5. Repeat for other templates:
   - **Reset password**
   - **Change email address**
   - **Invite user**

---

## Step 7: Test Complete Flow

### Create Test Account
1. Open your app: http://localhost:5173
2. Click **"Sign Up"**
3. Use a real email you can access (not admin@gigmate.us)
4. Complete the signup form
5. Submit

### Check Email Delivery
1. Check the inbox of your test email
2. Look for email from: **admin@gigmate.us** (GigMate)
3. Subject: "Confirm Your Email - GigMate"
4. **Check spam folder if not in inbox**

### Confirm Email
1. Open the confirmation email
2. Click the confirmation link
3. Should redirect to your app
4. You should be logged in or see success message

### Verify in Supabase
1. Go back to Supabase Dashboard
2. Click **"Authentication"** → **"Users"**
3. Find your test user
4. Check **"Confirmed"** column - should show ✓
5. Click user to see **"email_confirmed_at"** timestamp

---

## Step 8: Monitor and Troubleshoot

### Check Email Logs
1. In Supabase Dashboard: **"Logs"** (left sidebar)
2. Filter by: **"Auth"**
3. Look for email-related events
4. Check for errors or failed sends

### GoDaddy Email Limits
- GoDaddy Workspace: 250-1000 emails/day (depends on plan)
- Legacy cPanel: 250 emails/day
- Monitor usage during beta launch

### If Emails Still Not Arriving:

**Option 1: Check GoDaddy Email Settings**
1. Log in to GoDaddy account
2. Go to Email & Office
3. Check if SMTP is enabled
4. Enable "SMTP Relay" if available
5. Check for sending limits/restrictions

**Option 2: Use GoDaddy Support**
- Call: 1-480-505-8877
- Chat: Available in GoDaddy account
- Ask: "How do I configure SMTP for my email admin@gigmate.us?"

**Option 3: Alternative - Use SendGrid**
If GoDaddy SMTP has issues, consider switching to SendGrid:
- Free tier: 100 emails/day
- More reliable for transactional emails
- Better deliverability
- Detailed analytics

---

## GoDaddy-Specific Tips

1. **Warm up your email:** Start with low volume, gradually increase
2. **Check SPF/DKIM records:** Improves deliverability
3. **Avoid spam triggers:** Don't send too many emails at once
4. **Monitor blacklists:** GoDaddy IPs can get blacklisted
5. **Consider dedicated IP:** If sending high volume

---

## Verification Checklist

- [ ] GoDaddy SMTP credentials obtained
- [ ] Custom SMTP enabled in Supabase
- [ ] SMTP settings entered (host, port, credentials)
- [ ] Test email sent successfully
- [ ] Email confirmation enabled
- [ ] Redirect URLs configured
- [ ] Email templates customized
- [ ] Complete signup flow tested
- [ ] Confirmation email received
- [ ] User confirmed in Supabase Dashboard
- [ ] Emails arriving in inbox (not spam)

---

## Common GoDaddy SMTP Issues

### Issue 1: "Less Secure Apps" Error
**Solution:** GoDaddy Workspace may require app-specific passwords
1. Log in to GoDaddy Workspace admin
2. Create an app-specific password
3. Use that instead of main password

### Issue 2: Port Blocked
**Solution:**
- Try port 465 instead of 587
- Or try port 25 (less recommended)
- Check with hosting provider if deploying

### Issue 3: Emails Go to Spam
**Solutions:**
1. Verify domain: Add SPF record
   ```
   v=spf1 include:spf.protection.outlook.com ~all
   ```
2. Add DKIM record (check GoDaddy DNS settings)
3. Set up DMARC record
4. Send from professional domain (not personal email)

### Issue 4: Daily Limit Reached
**Solutions:**
- Upgrade GoDaddy email plan
- Implement email rate limiting in app
- Switch to SendGrid/Resend for high volume

---

## SPF Record Setup (Recommended)

Improves email deliverability:

1. Go to GoDaddy account
2. Navigate to **"Domains"** → **"My Domains"**
3. Find **gigmate.us** → Click **"DNS"**
4. Add **TXT Record**:
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:spf.secureserver.net ~all
   ```
   (For Workspace Email, use: `v=spf1 include:spf.protection.outlook.com ~all`)
5. Save
6. Wait 1-24 hours for propagation

---

## Next Steps After Email Setup

1. ✅ Mark Task 1 complete in todo list
2. Move to **Task 2: Configure CAPTCHA Protection**
3. Monitor email delivery during beta testing
4. Set up email analytics (open rates, delivery rates)
5. Consider backup email service (SendGrid) if issues persist

---

## Support Resources

- **GoDaddy Support:** https://www.godaddy.com/help
- **GoDaddy SMTP Guide:** https://www.godaddy.com/help/server-and-port-settings-for-workspace-email-6949
- **Supabase SMTP Docs:** https://supabase.com/docs/guides/auth/auth-smtp
- **Email Deliverability Guide:** https://supabase.com/docs/guides/auth/auth-email-templates

---

**Your Configuration Summary:**
```
Email: admin@gigmate.us
Provider: GoDaddy
SMTP Host: smtp.office365.com (or smtpout.secureserver.net)
SMTP Port: 587
Domain: gigmate.us
```

**Status:** Ready to configure
**Estimated Time:** 20-30 minutes
**Difficulty:** Medium

Let me know once you've completed the SMTP setup and test email, then we'll move to Task 2!
