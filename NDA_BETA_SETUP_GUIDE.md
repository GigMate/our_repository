# GigMate NDA & Beta Agreement System - Setup Guide

## Overview

GigMate now includes a comprehensive legal consent system that requires users to review and accept legal documents (NDAs, Beta Agreements, etc.) before accessing the application. This system includes:

- **Database-tracked consents** with timestamps and IP addresses
- **Digital signature capture** for binding agreements
- **Version control** for document updates
- **Admin interface** to manage legal documents
- **Automatic gating** - users cannot access the app until they accept all active documents

---

## How It Works

### For Users:
1. User logs in to GigMate
2. System checks if they've accepted all active legal documents
3. If not, they see a full-screen consent form
4. User reviews document(s), provides digital signature (if required), and accepts
5. Consent is recorded with timestamp, IP, and user agent
6. User gains access to the application

### For Administrators:
1. Admin creates legal documents via the Legal Document Manager
2. Documents can be marked as "active" or "inactive"
3. Only active documents require user acceptance
4. Admin can view all user consents and signatures
5. Documents can be versioned (e.g., v1.0, v1.1, v2.0)

---

## Initial Setup - Adding Your NDA

### Step 1: Access the Legal Document Manager

Navigate to: `/admin/legal` (you'll need to add a route for this - see Implementation section below)

OR integrate the `LegalDocumentManager` component into your admin dashboard.

### Step 2: Add Your NDA Document

1. Click **"Add Document"**
2. Fill in the form:
   - **Document Type**: Select "Non-Disclosure Agreement (NDA)"
   - **Document Title**: e.g., "GigMate Beta Tester NDA"
   - **Version**: Start with "1.0"
   - **Document Content**: Paste your full NDA text OR upload a .txt file
   - **Require Signature**: Check this box (recommended for NDAs)
3. Click **"Create Document"**

### Step 3: Activate the Document

Once created, the document is automatically marked as "Active". This means:
- All existing users will see it on their next login
- All new users must accept it before accessing the app
- The system tracks who has accepted and when

---

## Sample NDA Template

Here's a basic NDA template you can customize:

```
GIGMATE BETA TESTER NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into as of [DATE] by and between GigMate, Inc. ("Company") and the undersigned beta tester ("Recipient").

1. CONFIDENTIAL INFORMATION
Recipient acknowledges that during the beta testing period, they will have access to proprietary and confidential information regarding GigMate's platform, including but not limited to:
- Software features, functionality, and design
- Business plans and strategies
- User data and analytics
- Technical specifications

2. NON-DISCLOSURE OBLIGATIONS
Recipient agrees to:
- Keep all Confidential Information strictly confidential
- Not disclose any Confidential Information to third parties
- Use the information solely for beta testing purposes
- Not reverse engineer, decompile, or attempt to derive source code

3. BETA TESTING TERMS
- Beta access is temporary and may be revoked at any time
- The software is provided "AS IS" without warranties
- Recipient agrees to provide feedback and report bugs
- All intellectual property rights remain with the Company

4. TERM
This Agreement remains in effect for the duration of the beta period and for 2 years thereafter.

5. REMEDIES
Recipient acknowledges that breach of this Agreement may cause irreparable harm and agrees that Company is entitled to seek injunctive relief in addition to other remedies.

By accepting this agreement, I acknowledge that I have read, understood, and agree to be bound by these terms.
```

---

##  Adding a Beta Agreement

In addition to the NDA, you may want a separate Beta Testing Agreement:

1. Click **"Add Document"** again
2. Select **Document Type**: "Beta Testing Agreement"
3. **Document Title**: "GigMate Beta Testing Terms"
4. **Content**: Include terms like:
   - Expected behavior and conduct
   - Bug reporting requirements
   - No guarantee of service availability
   - Right to use feedback for product improvement
   - Limitation of liability

Users will see both documents in sequence and must accept both.

---

## Managing Legal Documents

### Viewing User Consents

1. In the Legal Document Manager, click **"View Consents"** on any document
2. See a list of all users who have accepted, including:
   - User name and email
   - Version accepted
   - Date/time of acceptance
   - View their digital signature (if provided)

### Updating Documents

**Important**: When you update a document, existing users who accepted the old version are NOT required to re-accept unless you create a new version.

**To require re-acceptance:**
1. Create a new document with a new version number (e.g., v2.0)
2. Deactivate the old version
3. Activate the new version
4. All users will be required to accept the new version on next login

### Deactivating Documents

Click **"Deactivate"** to stop requiring user acceptance. This is useful for:
- Temporary documents
- Testing
- Documents that are no longer legally required

---

## Technical Implementation

### Files Created

1. **Database Migration**: `supabase/migrations/create_legal_consent_system.sql`
   - Tables: `legal_documents`, `user_legal_consents`
   - Functions: `check_user_legal_compliance()`, `get_pending_legal_documents()`

2. **Components**:
   - `src/components/Auth/LegalConsentGate.tsx` - Wraps app and shows consent screen
   - `src/components/Admin/LegalDocumentManager.tsx` - Admin interface
   - `src/components/Shared/ErrorBoundary.tsx` - Error handling

3. **Integration**: `src/App.tsx` - LegalConsentGate wraps all authenticated content

### Adding Admin Route

To access the Legal Document Manager, add a route in your App.tsx:

```typescript
// In App.tsx, add to the admin section:
const [showLegalManager, setShowLegalManager] = useState(false);

useEffect(() => {
  const path = window.location.pathname;
  if (path === '/admin/legal') {
    setShowLegalManager(true);
  }
}, []);

if (showLegalManager) {
  return <LegalDocumentManager />;
}
```

Or import and use in your admin dashboard:

```typescript
import LegalDocumentManager from './components/Admin/LegalDocumentManager';

// In your admin panel:
<LegalDocumentManager />
```

---

## Security & Compliance

### Data Captured

For each consent, the system records:
- User ID (linked to auth.users)
- Document ID and version
- Timestamp of acceptance
- IP address (for legal verification)
- User agent (browser/device info)
- Digital signature (if required)

### Database Security

- **Row Level Security (RLS)** is enabled on all tables
- Users can only view their own consent records
- Only authenticated users can create consent records
- Legal documents are readable by all authenticated users
- Document management requires service role (admin access)

### Compliance Features

- **Audit Trail**: Complete history of who accepted what and when
- **Version Control**: Track document changes over time
- **Digital Signatures**: Legally binding signature capture
- **IP Logging**: Proves when and where acceptance occurred
- **Immutable Records**: Consents cannot be deleted or modified

---

## Testing the System

### As an Admin:
1. Add a test NDA document
2. Mark it as active
3. Log out

### As a User:
1. Log in with a test account
2. You should see the NDA consent screen
3. Try to submit without accepting (should fail)
4. Try to submit without signature if required (should fail)
5. Provide signature and accept
6. Verify you gain access to the app
7. Log out and back in - should NOT see consent screen again

### Verify Tracking:
1. Go back to admin view
2. Check "View Consents" on the document
3. Verify your test user's consent is recorded with all details

---

## Common Scenarios

### Scenario 1: Adding Documents Mid-Beta
**Q**: What if I add an NDA after users are already using the beta?

**A**: All existing users will see the NDA on their next login. They cannot proceed without accepting it.

---

### Scenario 2: User Refuses to Accept
**Q**: What if a user doesn't want to accept the NDA?

**A**: They will be stuck on the consent screen and cannot access the application. They can log out but cannot proceed without acceptance.

---

### Scenario 3: Updating Terms
**Q**: How do I update my NDA after users have accepted it?

**A**:
- **Minor changes**: Edit the document, bump the version (e.g., 1.0 → 1.1)
- **Major changes**: Create a new document with version 2.0, deactivate v1.0, activate v2.0
- Users will be required to re-accept the new version

---

### Scenario 4: Multiple Documents
**Q**: Can users be required to accept multiple documents?

**A**: Yes! The system shows documents sequentially. Users must accept all active documents before accessing the app.

---

## Troubleshooting

### Users Not Seeing Consent Screen

**Check**:
1. Are any documents marked as "Active"?
2. Has the migration been applied? Run: `supabase db pull` to verify tables exist
3. Check browser console for errors
4. Verify RLS policies are enabled

### Consent Screen Showing After Acceptance

**Check**:
1. Verify the consent was actually saved (check `user_legal_consents` table)
2. Ensure the document ID matches between document and consent
3. Check if document was deactivated/reactivated (this requires re-acceptance)

### Signature Not Saving

**Check**:
1. Verify `requires_signature` is true on the document
2. Check if user actually drew a signature (canvas must have content)
3. Look for errors in browser console

---

## Best Practices

1. **Test First**: Always test new documents with a test account first
2. **Clear Language**: Write NDAs in clear, understandable language
3. **Version Properly**: Use semantic versioning (1.0, 1.1, 2.0)
4. **Backup Consents**: Regularly export consent data for legal records
5. **Monitor Acceptance**: Check regularly to ensure users are accepting
6. **Legal Review**: Have your NDAs reviewed by a lawyer before use

---

## Database Schema Reference

### legal_documents Table
```sql
id                  uuid PRIMARY KEY
document_type       text (nda, beta_agreement, etc.)
title               text
content             text (full document text)
version             text (e.g., "1.0")
is_active           boolean
requires_signature  boolean
created_at          timestamptz
updated_at          timestamptz
```

### user_legal_consents Table
```sql
id                  uuid PRIMARY KEY
user_id             uuid → auth.users
document_id         uuid → legal_documents
document_version    text
ip_address          text
user_agent          text
signature_data      text (base64 image)
consent_given_at    timestamptz
created_at          timestamptz
UNIQUE(user_id, document_id)
```

---

## Next Steps

1. ✅ **Prepare Your NDA**: Draft or customize the NDA template above
2. ✅ **Add Route**: Create an admin route to `/admin/legal` for the Legal Document Manager
3. ✅ **Upload NDA**: Use the manager to add your NDA document
4. ✅ **Test Thoroughly**: Create test accounts and verify the entire flow
5. ✅ **Monitor**: Check consent tracking as beta testers sign up
6. ✅ **Iterate**: Update documents as needed based on legal advice

---

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify database migrations are applied
3. Review RLS policies in Supabase dashboard
4. Test with a fresh user account
5. Check that document is marked as "Active"

The legal consent system is now ready to protect your beta launch! 🎉
