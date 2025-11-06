/*
  # Fix Legal Documents Function Column Name

  1. Changes
    - Drop and recreate `get_pending_legal_documents` function
    - Change `requires_signature` to `requires_consent` to match table schema
  
  2. Security
    - No changes to RLS policies
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
BEGIN
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
  ORDER BY ld.created_at ASC;
END;
$$;
