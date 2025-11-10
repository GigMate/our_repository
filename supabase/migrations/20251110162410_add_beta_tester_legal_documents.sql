/*
  # Add Beta Tester Legal Documents

  1. Changes
    - Add new document types to legal_documents table
    - Insert beta tester NDA, IP Agreement, and Non-Compete
    - Update get_pending_legal_documents function to include beta tester docs

  2. New Document Types
    - beta_tester_nda - Comprehensive NDA for beta testers
    - beta_tester_ip_agreement - IP ownership assignment
    - beta_tester_non_compete - Non-compete agreement

  3. Security
    - All legal documents require signature
    - Beta testers must sign before platform access
*/

-- Update legal_documents table constraint to include beta tester document types
ALTER TABLE legal_documents DROP CONSTRAINT IF EXISTS legal_documents_document_type_check;

ALTER TABLE legal_documents ADD CONSTRAINT legal_documents_document_type_check 
CHECK (document_type IN (
  'terms_of_service', 'privacy_policy', 'payment_terms', 
  'vendor_agreement', 'artist_agreement', 'venue_agreement',
  'fan_terms', 'merch_vendor_agreement', 'dropship_terms',
  'beta_tester_nda', 'beta_tester_ip_agreement', 'beta_tester_non_compete'
));

-- Insert beta tester legal documents
INSERT INTO legal_documents (document_type, version, title, content, effective_date, requires_consent) VALUES
(
  'beta_tester_nda',
  '1.0',
  'GigMate Beta Tester Non-Disclosure Agreement',
  E'GIGMATE BETA TESTER NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into as of the date of acceptance by and between GigMate, Inc. ("Company") and the undersigned beta tester ("Recipient").

1. CONFIDENTIAL INFORMATION
Recipient acknowledges that during the beta testing period, they will have access to proprietary and confidential information regarding GigMate\'s platform, including but not limited to:
- Software features, functionality, design, and architecture
- Business plans, strategies, and financial information
- User data, analytics, and usage patterns
- Technical specifications and implementation details
- Marketing plans and customer information
- Trade secrets and proprietary algorithms

2. NON-DISCLOSURE OBLIGATIONS
Recipient agrees to:
- Keep all Confidential Information strictly confidential
- Not disclose any Confidential Information to any third parties
- Use the information solely for beta testing purposes
- Not reverse engineer, decompile, or attempt to derive source code
- Not take screenshots, screen recordings, or copies of any materials
- Not discuss the platform publicly on social media or other forums
- Immediately report any unauthorized disclosure

3. BETA TESTING TERMS
- Beta access is temporary and may be revoked at any time without notice
- The software is provided "AS IS" without warranties of any kind
- Company is not liable for any damages arising from use of beta software
- Recipient agrees to provide constructive feedback and report bugs
- All intellectual property rights remain exclusively with the Company
- No compensation is owed for testing activities

4. PROHIBITED ACTIVITIES
Recipient shall NOT:
- Share login credentials with others
- Attempt to hack, exploit, or bypass security measures
- Use the platform for commercial purposes during beta
- Create competing software or services based on GigMate
- Recruit other beta testers for competing ventures

5. TERM AND TERMINATION
This Agreement remains in effect for the duration of the beta period and for THREE (3) YEARS thereafter. Company may terminate beta access at any time. Upon termination, Recipient must cease all use and delete all materials.

6. REMEDIES
Recipient acknowledges that breach of this Agreement may cause irreparable harm to the Company and agrees that Company is entitled to seek injunctive relief, monetary damages, and attorneys\' fees in addition to other remedies available at law or equity.

7. GENERAL PROVISIONS
- This Agreement is governed by the laws of Texas
- Any disputes shall be resolved in Travis County, Texas
- If any provision is unenforceable, the remainder stays in effect
- This Agreement may not be assigned without written consent

By accepting this agreement, I acknowledge that I have read, understood, and agree to be bound by these terms. I understand this is a legally binding contract.',
  now(),
  true
),
(
  'beta_tester_ip_agreement',
  '1.0',
  'GigMate Beta Tester Intellectual Property Agreement',
  E'GIGMATE BETA TESTER INTELLECTUAL PROPERTY AGREEMENT

This Intellectual Property Agreement ("Agreement") is entered into as of the date of acceptance by and between GigMate, Inc. ("Company") and the undersigned beta tester ("Recipient").

1. OWNERSHIP OF INTELLECTUAL PROPERTY
Recipient acknowledges and agrees that:
- All intellectual property rights in GigMate platform belong solely to Company
- Company owns all software, designs, features, algorithms, and documentation
- Any suggestions, feedback, or ideas provided by Recipient become Company property
- Recipient has no ownership claim to any part of the platform
- Company may use Recipient feedback without compensation or attribution

2. ASSIGNMENT OF RIGHTS
To the extent Recipient creates any derivative works, modifications, or improvements during beta testing, Recipient hereby assigns all rights, title, and interest in such works to Company. This includes but is not limited to:
- Bug reports and solutions
- Feature suggestions and improvements
- Documentation or training materials
- Test data and results

3. NO LICENSE GRANTED
This Agreement does NOT grant Recipient any license, right, or interest in Company\'s intellectual property except for the limited right to use the beta software for testing purposes during the beta period.

4. THIRD-PARTY RIGHTS
Recipient represents and warrants that:
- They have the right to participate in beta testing
- Their participation does not violate any other agreements
- They will not introduce third-party intellectual property into the platform
- They will not upload infringing content

5. FUTURE INNOVATIONS
Recipient agrees that any innovations, inventions, or improvements related to live music booking, venue management, or musician services discovered during beta testing belong to Company, even if discovered after beta period ends.

6. INDEMNIFICATION
Recipient agrees to indemnify and hold harmless Company from any claims arising from Recipient\'s breach of this Agreement or violation of third-party intellectual property rights.

By accepting this agreement, I acknowledge that I have read, understood, and agree to be bound by these terms. I assign all rights in my feedback and contributions to GigMate, Inc.',
  now(),
  true
),
(
  'beta_tester_non_compete',
  '1.0',
  'GigMate Beta Tester Non-Compete Agreement',
  E'GIGMATE BETA TESTER NON-COMPETE AGREEMENT

This Non-Compete Agreement ("Agreement") is entered into as of the date of acceptance by and between GigMate, Inc. ("Company") and the undersigned beta tester ("Recipient").

1. NON-COMPETE COVENANT
During the beta period and for TWO (2) YEARS thereafter, Recipient agrees NOT to:

a) Create, develop, or launch a competing platform that:
   - Connects musicians with venues
   - Facilitates live music bookings
   - Provides ticketing for live music events
   - Offers escrow services for music payments
   - Includes musician/venue profiles and ratings

b) Work for, consult with, or advise any competing business in the live music booking space

c) Solicit or recruit any GigMate users, beta testers, or employees

d) Invest in or provide funding to competing ventures

2. GEOGRAPHIC SCOPE
This non-compete applies to:
- United States and its territories
- Any location where GigMate operates or plans to operate
- Online/digital platforms accessible from these locations

3. DEFINITION OF COMPETING BUSINESS
A competing business includes any company, platform, or service that offers TWO or more of the following:
- Musician-venue matching or booking
- Live music event ticketing
- Music industry payment processing or escrow
- Musician/venue discovery and ratings
- Live music calendar or event management

4. REASONABLE RESTRICTIONS
Recipient acknowledges that:
- These restrictions are reasonable in scope and duration
- They are necessary to protect Company\'s confidential information and trade secrets
- They do not prevent Recipient from earning a living
- Recipient may work in other industries without restriction
- Recipient may perform as a musician or operate a venue (as a user, not competitor)

5. BLUE PENCIL CLAUSE
If any court finds these restrictions too broad, the court may modify them to the maximum extent enforceable rather than invalidating the entire agreement.

6. INJUNCTIVE RELIEF
Recipient agrees that violation of this non-compete would cause irreparable harm to Company and that Company is entitled to immediate injunctive relief without posting bond.

7. ENFORCEMENT
- Governed by Texas law
- Any legal action filed in Travis County, Texas
- Prevailing party entitled to attorneys\' fees
- Recipient liable for damages caused by breach

8. ACKNOWLEDGMENT
Recipient acknowledges that:
- They have had opportunity to review this agreement
- They understand the restrictions and their implications
- The restrictions are fair consideration for beta access
- Company has valuable trade secrets and competitive advantages to protect

By accepting this agreement, I acknowledge that I have read, understood, and agree to be bound by these terms. I agree not to compete with GigMate for two years following beta participation.',
  now(),
  true
)
ON CONFLICT (document_type, version) DO NOTHING;

-- Update get_pending_legal_documents function to include beta tester documents
DROP FUNCTION IF EXISTS get_pending_legal_documents(uuid);

CREATE OR REPLACE FUNCTION get_pending_legal_documents(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  document_type text,
  title text,
  content text,
  version text,
  requires_consent boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type text;
  v_is_merch_vendor boolean;
  v_is_beta_tester boolean;
BEGIN
  SELECT 
    p.user_type, 
    COALESCE(p.is_merch_vendor, false),
    COALESCE(p.is_beta_tester, false)
  INTO v_user_type, v_is_merch_vendor, v_is_beta_tester
  FROM profiles p
  WHERE p.id = p_user_id;

  RETURN QUERY
  SELECT
    ld.id,
    ld.document_type,
    ld.title,
    ld.content,
    ld.version,
    ld.requires_consent
  FROM legal_documents ld
  WHERE ld.is_active = true
  AND NOT EXISTS (
    SELECT 1
    FROM user_legal_consents ulc
    WHERE ulc.user_id = p_user_id
    AND ulc.document_id = ld.id
  )
  AND (
    ld.document_type IN ('privacy_policy', 'terms_of_service')
    OR (ld.document_type = 'payment_terms')
    OR (v_user_type = 'fan' AND ld.document_type = 'fan_terms')
    OR (v_user_type = 'musician' AND ld.document_type = 'artist_agreement')
    OR (v_user_type = 'venue' AND ld.document_type = 'venue_agreement')
    OR (v_is_merch_vendor = true AND ld.document_type IN ('merch_vendor_agreement', 'dropship_terms'))
    OR (v_is_beta_tester = true AND ld.document_type IN ('beta_tester_nda', 'beta_tester_ip_agreement', 'beta_tester_non_compete'))
  )
  ORDER BY 
    CASE 
      WHEN ld.document_type = 'privacy_policy' THEN 1
      WHEN ld.document_type = 'terms_of_service' THEN 2
      WHEN ld.document_type = 'payment_terms' THEN 3
      WHEN ld.document_type LIKE 'beta_tester%' THEN 4
      ELSE 5
    END,
    ld.created_at ASC;
END;
$$;

-- Update user_legal_consents to work with new table name (if it was renamed)
CREATE OR REPLACE FUNCTION check_user_legal_compliance(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM get_pending_legal_documents(p_user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
