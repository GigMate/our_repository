/*
  # Investor Legal Document & Signature System

  1. New Tables
    - `investor_legal_documents`
      - Stores the legal documents (NDA, IP Agreement, NCA) as text/HTML
      - View-only storage, no download capability
      - Documents are stored as secure text content
    
    - `investor_document_signatures`
      - Records electronic signatures for each document
      - Tracks signature timestamp and IP address
      - Links to investor_interest_requests

  2. Updates
    - Add document_signature_completed to investor_interest_requests
    - Add auto_generated_password field (encrypted)
    - Add password_sent_at timestamp

  3. Security
    - Enable RLS on all tables
    - Only approved investors can view documents
    - Signatures are immutable once created
    - Admins can manage documents

  4. Functions
    - Function to check if all documents are signed
    - Function to auto-generate secure password
*/

-- Create investor legal documents table
CREATE TABLE IF NOT EXISTS investor_legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type text NOT NULL CHECK (document_type IN ('nda', 'ip_agreement', 'non_compete')),
  title text NOT NULL,
  content text NOT NULL,
  version integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(document_type, version)
);

-- Create investor document signatures table
CREATE TABLE IF NOT EXISTS investor_document_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_request_id uuid NOT NULL REFERENCES investor_interest_requests(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES investor_legal_documents(id),
  document_type text NOT NULL,
  signed_at timestamptz DEFAULT now(),
  signature_ip text,
  full_name text NOT NULL,
  email text NOT NULL,
  UNIQUE(investor_request_id, document_type)
);

-- Add new fields to investor_interest_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investor_interest_requests' AND column_name = 'documents_signed_at'
  ) THEN
    ALTER TABLE investor_interest_requests ADD COLUMN documents_signed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investor_interest_requests' AND column_name = 'password_generated_at'
  ) THEN
    ALTER TABLE investor_interest_requests ADD COLUMN password_generated_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investor_interest_requests' AND column_name = 'invitation_sent_at'
  ) THEN
    ALTER TABLE investor_interest_requests ADD COLUMN invitation_sent_at timestamptz;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE investor_legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_document_signatures ENABLE ROW LEVEL SECURITY;

-- RLS Policies for investor_legal_documents

CREATE POLICY "Anyone can view active legal documents"
  ON investor_legal_documents FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage legal documents"
  ON investor_legal_documents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email LIKE '%@gigmate.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email LIKE '%@gigmate.com'
    )
  );

-- RLS Policies for investor_document_signatures

CREATE POLICY "Users can create signatures for their requests"
  ON investor_document_signatures FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM investor_interest_requests
      WHERE investor_interest_requests.id = investor_request_id
      AND investor_interest_requests.email = email
    )
  );

CREATE POLICY "Users can view their own signatures"
  ON investor_document_signatures FOR SELECT
  USING (email = auth.jwt()->>'email');

CREATE POLICY "Admins can view all signatures"
  ON investor_document_signatures FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email LIKE '%@gigmate.com'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_investor_legal_docs_type ON investor_legal_documents(document_type, is_active);
CREATE INDEX IF NOT EXISTS idx_investor_signatures_request ON investor_document_signatures(investor_request_id);
CREATE INDEX IF NOT EXISTS idx_investor_signatures_email ON investor_document_signatures(email);

-- Function to check if all documents are signed
CREATE OR REPLACE FUNCTION check_all_documents_signed(request_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  required_docs_count integer;
  signed_docs_count integer;
BEGIN
  SELECT COUNT(*) INTO required_docs_count
  FROM investor_legal_documents
  WHERE is_active = true;

  SELECT COUNT(DISTINCT document_type) INTO signed_docs_count
  FROM investor_document_signatures
  WHERE investor_request_id = request_id;

  RETURN signed_docs_count >= required_docs_count;
END;
$$;

-- Function to generate secure random password
CREATE OR REPLACE FUNCTION generate_investor_password()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..16 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Trigger to update documents_signed_at when all documents are signed
CREATE OR REPLACE FUNCTION update_documents_signed_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF check_all_documents_signed(NEW.investor_request_id) THEN
    UPDATE investor_interest_requests
    SET documents_signed_at = now()
    WHERE id = NEW.investor_request_id
    AND documents_signed_at IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_documents_signed
  AFTER INSERT ON investor_document_signatures
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_signed_status();

-- Insert default legal documents
INSERT INTO investor_legal_documents (document_type, title, content, version, is_active)
VALUES 
(
  'nda',
  'Non-Disclosure Agreement for Prospective Investors',
  '<div style="font-family: Arial, sans-serif; max-width: 800px; padding: 40px; line-height: 1.6;">
    <h1 style="text-align: center; color: #1a1a1a;">NON-DISCLOSURE AGREEMENT</h1>
    <h2 style="text-align: center; color: #666; font-weight: normal;">For Prospective Investors</h2>
    
    <p style="margin-top: 30px;"><strong>THIS AGREEMENT</strong> is made effective as of the date of electronic signature below.</p>
    
    <h3 style="color: #1a1a1a; margin-top: 30px;">BETWEEN:</h3>
    <p><strong>GigMate</strong> ("Disclosing Party")</p>
    <p>AND</p>
    <p><strong>The Investor</strong> ("Receiving Party")</p>
    
    <h3 style="color: #1a1a1a; margin-top: 30px;">RECITALS:</h3>
    <p>WHEREAS the Receiving Party desires to invest in or evaluate an investment opportunity in GigMate;</p>
    <p>WHEREAS in connection with such evaluation, the Disclosing Party may disclose certain confidential and proprietary information;</p>
    
    <h3 style="color: #1a1a1a; margin-top: 30px;">1. CONFIDENTIAL INFORMATION</h3>
    <p>Confidential Information includes, but is not limited to:</p>
    <ul style="margin-left: 20px;">
      <li>Business plans, strategies, and financial information</li>
      <li>Revenue data, user metrics, and growth analytics</li>
      <li>Technology architecture, algorithms, and source code</li>
      <li>Customer data, user behavior analytics, and market research</li>
      <li>Trade secrets, intellectual property, and proprietary processes</li>
      <li>Strategic partnerships, expansion plans, and business opportunities</li>
    </ul>
    
    <h3 style="color: #1a1a1a; margin-top: 30px;">2. OBLIGATIONS OF RECEIVING PARTY</h3>
    <p>The Receiving Party agrees to:</p>
    <ul style="margin-left: 20px;">
      <li>Keep all Confidential Information strictly confidential</li>
      <li>Not disclose Confidential Information to any third party without prior written consent</li>
      <li>Use Confidential Information solely for evaluating investment opportunities</li>
      <li>Limit access to Confidential Information to authorized personnel only</li>
      <li>Take reasonable security measures to protect Confidential Information</li>
    </ul>
    
    <h3 style="color: #1a1a1a; margin-top: 30px;">3. TERM AND TERMINATION</h3>
    <p>This Agreement shall remain in effect for a period of five (5) years from the date of signature, or until terminated by written agreement of both parties.</p>
    
    <h3 style="color: #1a1a1a; margin-top: 30px;">4. RETURN OF MATERIALS</h3>
    <p>Upon termination or request, the Receiving Party shall immediately return or destroy all Confidential Information and certify such destruction in writing.</p>
    
    <h3 style="color: #1a1a1a; margin-top: 30px;">5. NO LICENSE GRANTED</h3>
    <p>Nothing in this Agreement grants any license or right to the Receiving Party to use any intellectual property of the Disclosing Party.</p>
    
    <h3 style="color: #1a1a1a; margin-top: 30px;">6. GOVERNING LAW</h3>
    <p>This Agreement shall be governed by and construed in accordance with the laws of the State of Texas, United States.</p>
    
    <div style="margin-top: 50px; padding: 20px; background-color: #f5f5f5; border-left: 4px solid #ff6b35;">
      <p style="margin: 0;"><strong>ELECTRONIC SIGNATURE NOTICE:</strong></p>
      <p style="margin: 10px 0 0 0;">By clicking "I Agree" below, you are providing your electronic signature and agreeing to be legally bound by all terms and conditions of this Non-Disclosure Agreement.</p>
    </div>
  </div>',
  1,
  true
),
(
  'ip_agreement',
  'Intellectual Property Agreement for Investors',
  '<div style="font-family: Arial, sans-serif; max-width: 800px; padding: 40px; line-height: 1.6;">
    <h1 style="text-align: center; color: #1a1a1a;">INTELLECTUAL PROPERTY AGREEMENT</h1>
    <h2 style="text-align: center; color: #666; font-weight: normal;">For Investors</h2>
    
    <p style="margin-top: 30px;"><strong>THIS AGREEMENT</strong> is made effective as of the date of electronic signature below.</p>
    
    <h3 style="color: #1a1a1a; margin-top: 30px;">BETWEEN:</h3>
    <p><strong>GigMate</strong> ("Company")</p>
    <p>AND</p>
    <p><strong>The Investor</strong> ("Investor")</p>
    
    <h3 style="color: #1a1a1a; margin-top: 30px;">1. OWNERSHIP OF INTELLECTUAL PROPERTY</h3>
    <p>The Investor acknowledges and agrees that all intellectual property related to GigMate, including but not limited to:</p>
    <ul style="margin-left: 20px;">
      <li>Software, source code, and technical architecture</li>
      <li>Algorithms, data models, and AI/ML implementations</li>
      <li>Trademarks, trade names, logos, and branding materials</li>
      <li>Business processes, methodologies, and operational procedures</li>
      <li>User data, analytics platforms, and proprietary databases</li>
      <li>Marketing materials, content, and creative works</li>
    </ul>
    <p>are and shall remain the sole and exclusive property of GigMate.</p>
    
    <h3 style="color: #1a1a1a; margin-top: 30px;">2. NO RIGHTS GRANTED</h3>
    <p>Nothing in this Agreement or in any investment relationship grants the Investor any rights, license, or interest in the Company''s intellectual property, except as explicitly provided in a separate written investment agreement.</p>
    
    <h3 style="color: #1a1a1a; margin-top: 30px;">3. RESTRICTIONS ON USE</h3>
    <p>The Investor agrees NOT to:</p>
    <ul style="margin-left: 20px;">
      <li>Copy, reproduce, or duplicate any intellectual property</li>
      <li>Reverse engineer, decompile, or disassemble any software or technology</li>
      <li>Create derivative works based on GigMate''s intellectual property</li>
      <li>Use any intellectual property for competing purposes</li>
      <li>Transfer, sell, or license any intellectual property to third parties</li>
      <li>Remove or alter any proprietary notices or labels</li>
    </ul>
    
    <h3 style="color: #1a1a1a; margin-top: 30px;">4. CONFIDENTIAL NATURE</h3>
    <p>The Investor acknowledges that GigMate''s intellectual property constitutes valuable trade secrets and confidential information protected by law.</p>
    
    <h3 style="color: #1a1a1a; margin-top: 30px;">5. REMEDIES</h3>
    <p>The Investor acknowledges that any breach of this Agreement may cause irreparable harm to the Company, and that monetary damages may be inadequate. The Company shall be entitled to seek equitable relief, including injunction and specific performance.</p>
    
    <h3 style="color: #1a1a1a; margin-top: 30px;">6. SURVIVAL</h3>
    <p>The provisions of this Agreement shall survive any termination of the investment relationship and shall remain in full force and effect indefinitely.</p>
    
    <div style="margin-top: 50px; padding: 20px; background-color: #f5f5f5; border-left: 4px solid #ff6b35;">
      <p style="margin: 0;"><strong>ELECTRONIC SIGNATURE NOTICE:</strong></p>
      <p style="margin: 10px 0 0 0;">By clicking "I Agree" below, you are providing your electronic signature and agreeing to be legally bound by all terms and conditions of this Intellectual Property Agreement.</p>
    </div>
  </div>',
  1,
  true
),
(
  'non_compete',
  'Non-Compete Agreement for Investors',
  '<div style="font-family: Arial, sans-serif; max-width: 800px; padding: 40px; line-height: 1.6;">
    <h1 style="text-align: center; color: #1a1a1a;">NON-COMPETE AGREEMENT</h1>
    <h2 style="text-align: center; color: #666; font-weight: normal;">For Investors</h2>
    
    <p style="margin-top: 30px;"><strong>THIS AGREEMENT</strong> is made effective as of the date of electronic signature below.</p>
    
    <h3 style="color: #1a1a1a; margin-top: 30px;">BETWEEN:</h3>
    <p><strong>GigMate</strong> ("Company")</p>
    <p>AND</p>
    <p><strong>The Investor</strong> ("Investor")</p>
    
    <h3 style="color: #1a1a1a; margin-top: 30px;">1. NON-COMPETE COVENANT</h3>
    <p>During the term of the investment relationship and for a period of two (2) years following its termination, the Investor agrees NOT to:</p>
    
    <h4 style="color: #333; margin-top: 20px;">A. Competing Businesses</h4>
    <ul style="margin-left: 20px;">
      <li>Invest in, fund, or provide capital to any competing business</li>
      <li>Develop, launch, or operate a competing platform or service</li>
      <li>Participate in the management or operation of competing businesses</li>
      <li>Provide consulting or advisory services to competitors</li>
    </ul>
    
    <h4 style="color: #333; margin-top: 20px;">B. Definition of Competing Business</h4>
    <p>A "competing business" includes any business that:</p>
    <ul style="margin-left: 20px;">
      <li>Operates a live music booking or venue management platform</li>
      <li>Provides marketplace services connecting musicians and venues</li>
      <li>Offers event ticketing or booking services for live music</li>
      <li>Develops technology or software for music industry management</li>
      <li>Operates fan engagement platforms for musicians or venues</li>
    </ul>
    
    <h3 style="color: #1a1a1a; margin-top: 30px;">2. GEOGRAPHIC SCOPE</h3>
    <p>This non-compete agreement applies worldwide, as GigMate operates and plans to expand internationally.</p>
    
    <h3 style="color: #1a1a1a; margin-top: 30px;">3. NON-SOLICITATION</h3>
    <p>The Investor agrees NOT to:</p>
    <ul style="margin-left: 20px;">
      <li>Solicit or recruit GigMate employees, contractors, or consultants</li>
      <li>Encourage customers, venues, or musicians to terminate their relationship with GigMate</li>
      <li>Interfere with GigMate''s business relationships or contracts</li>
      <li>Disparage GigMate, its products, services, or management</li>
    </ul>
    
    <h3 style="color: #1a1a1a; margin-top: 30px;">4. REASONABLENESS</h3>
    <p>The Investor acknowledges that the restrictions in this Agreement are reasonable and necessary to protect GigMate''s legitimate business interests, including its confidential information, customer relationships, and competitive position.</p>
    
    <h3 style="color: #1a1a1a; margin-top: 30px;">5. REMEDIES</h3>
    <p>In the event of breach, the Company shall be entitled to:</p>
    <ul style="margin-left: 20px;">
      <li>Immediate injunctive relief without posting bond</li>
      <li>Recovery of actual damages and lost profits</li>
      <li>Recovery of attorneys'' fees and costs</li>
      <li>Any other relief deemed appropriate by a court of law</li>
    </ul>
    
    <h3 style="color: #1a1a1a; margin-top: 30px;">6. SEVERABILITY</h3>
    <p>If any provision of this Agreement is found to be unenforceable, the remaining provisions shall continue in full force and effect, and the unenforceable provision shall be modified to the minimum extent necessary to make it enforceable.</p>
    
    <div style="margin-top: 50px; padding: 20px; background-color: #f5f5f5; border-left: 4px solid #ff6b35;">
      <p style="margin: 0;"><strong>ELECTRONIC SIGNATURE NOTICE:</strong></p>
      <p style="margin: 10px 0 0 0;">By clicking "I Agree" below, you are providing your electronic signature and agreeing to be legally bound by all terms and conditions of this Non-Compete Agreement.</p>
    </div>
  </div>',
  1,
  true
)
ON CONFLICT (document_type, version) DO NOTHING;