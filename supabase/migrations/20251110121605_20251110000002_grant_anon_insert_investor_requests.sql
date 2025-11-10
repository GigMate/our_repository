/*
  # Grant Explicit Permissions for Anonymous Inserts

  Ensures that the anon (public) role has explicit INSERT permission
  on investor_interest_requests table, in addition to RLS policies.

  Changes:
  - Grant INSERT permission to anon role
  - Grant USAGE on the sequence for ID generation
*/

-- Grant INSERT permission explicitly to anon role
GRANT INSERT ON investor_interest_requests TO anon;

-- Also grant for authenticated users
GRANT INSERT ON investor_interest_requests TO authenticated;

-- Grant USAGE on the id sequence so anon can generate UUIDs
GRANT USAGE ON SCHEMA public TO anon;
