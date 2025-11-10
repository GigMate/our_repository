/*
  # Fix Legal Documents - Filter by User Type

  1. Changes
    - Update `get_pending_legal_documents` to return only documents relevant to user type
    - Fans only get: privacy_policy, terms_of_service, fan_terms, payment_terms
    - Musicians only get: privacy_policy, terms_of_service, artist_agreement, payment_terms
    - Venues only get: privacy_policy, terms_of_service, venue_agreement, payment_terms
    - Merch vendors get: privacy_policy, terms_of_service, merch_vendor_agreement, payment_terms, dropship_terms
    - Investors get: privacy_policy, terms_of_service (handled separately)
    - Admins/Consumers get: privacy_policy, terms_of_service, payment_terms

  2. Logic
    - Universal documents: privacy_policy, terms_of_service, payment_terms
    - Role-specific documents: Only shown to matching user types
    - No more irrelevant NDAs or agreements for fans
  
  3. Security
    - No changes to RLS policies
    - Function remains SECURITY DEFINER
*/

DROP FUNCTION IF EXISTS get_pending_legal_documents(uuid);

CREATE FUNCTION get_pending_legal_documents(p_user_id uuid)
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
BEGIN
  SELECT p.user_type, COALESCE(p.is_merch_vendor, false)
  INTO v_user_type, v_is_merch_vendor
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
  )
  ORDER BY 
    CASE 
      WHEN ld.document_type = 'privacy_policy' THEN 1
      WHEN ld.document_type = 'terms_of_service' THEN 2
      WHEN ld.document_type = 'payment_terms' THEN 3
      ELSE 4
    END,
    ld.created_at ASC;
END;
$$;
