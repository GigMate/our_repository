# Beta Tester NDA & Legal Documents Requirement

## Description
Require beta testers to sign NDA, Non-Compete, and IP Agreement before accessing the platform.

## Current Status
- ✅ Legal consent system exists (LegalConsentGate component)
- ✅ Digital signature capture works
- ✅ Investor NDA system exists
- ❌ Beta tester document types NOT in legal_documents table
- ❌ No beta_tester document type enum value

## Required Changes

### 1. Database Migration
Add new document types to legal_documents table:
- `beta_tester_nda` - Beta Tester Non-Disclosure Agreement
- `beta_tester_ip_agreement` - Beta Tester IP Agreement
- `beta_tester_non_compete` - Beta Tester Non-Compete Agreement

### 2. Update Legal Document Check Constraint
Modify the `legal_documents.document_type` CHECK constraint to include:
```sql
'beta_tester_nda', 'beta_tester_ip_agreement', 'beta_tester_non_compete'
```

### 3. Update get_pending_legal_documents Function
Add logic to return beta tester documents for users with beta_tester flag:
```sql
OR (v_is_beta_tester = true AND ld.document_type IN (
  'beta_tester_nda',
  'beta_tester_ip_agreement',
  'beta_tester_non_compete'
))
```

### 4. Add Beta Tester Flag to Profiles
```sql
ALTER TABLE profiles ADD COLUMN is_beta_tester boolean DEFAULT false;
```

### 5. Insert Beta Tester Legal Documents
Pre-populate the legal_documents table with:
1. Beta Tester NDA (comprehensive non-disclosure terms)
2. Beta Tester IP Agreement (all IP belongs to GigMate)
3. Beta Tester Non-Compete (cannot build competing platform for 2 years)

## User Flow
1. User registers or is flagged as beta_tester by admin
2. On next login, LegalConsentGate checks for pending documents
3. User sees 3 documents requiring signature:
   - Beta Tester NDA (must sign)
   - IP Agreement (must sign)
   - Non-Compete Agreement (must sign)
4. User cannot proceed until all 3 are signed
5. All signatures tracked with timestamp, IP address, user agent

## Admin Management
Admins can:
- View all beta tester consents in Legal Document Manager
- Export signatures for legal compliance
- See who has/hasn't signed
- Update document versions (triggers re-consent)

## Files to Modify
- New migration: `add_beta_tester_legal_documents.sql`
- Update: `get_pending_legal_documents` function
- Profiles table: add `is_beta_tester` column

## Legal Document Content
Documents should include:
- Clear definition of confidential information
- Non-disclosure obligations
- IP assignment clauses
- Non-compete restrictions (geographic, duration)
- Beta software disclaimer
- Termination terms
- Remedies for breach

## Priority
**CRITICAL** - Must be implemented before beta launch
- Protects company IP
- Prevents beta testers from stealing ideas
- Creates legal recourse for violations
- Standard practice for all software betas

## Implementation Notes
- Can be done without modifying frontend (LegalConsentGate already works)
- Backend-only database changes
- Admin can manually set `is_beta_tester = true` for specific users
- Documents will auto-present on next login
- Existing beta testers will be prompted to sign

## Testing
1. Set a test user's `is_beta_tester = true`
2. Login as that user
3. Should see 3 documents requiring signature
4. Sign all 3
5. Should gain access to platform
6. Check `user_legal_consents` table for records
