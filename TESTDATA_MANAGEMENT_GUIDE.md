# Test Data Management Guide

## Identifying Test Accounts

All test accounts created through the seeding system can be identified and removed using the following methods:

### Method 1: By Email Pattern

All seeded test accounts use predictable email patterns:

**Musicians:**
```sql
SELECT * FROM auth.users
WHERE email LIKE 'musician%@gigmate-test.com'
ORDER BY created_at;
```

**Venues:**
```sql
SELECT * FROM auth.users
WHERE email LIKE 'venue%@gigmate-test.com'
ORDER BY created_at;
```

**Fans:**
```sql
SELECT * FROM auth.users
WHERE email LIKE 'fan%@gigmate-test.com'
ORDER BY created_at;
```

**All Test Accounts:**
```sql
SELECT * FROM auth.users
WHERE email LIKE '%@gigmate-test.com'
ORDER BY created_at;
```

### Method 2: By Creation Date

If you know the exact date/time range when test data was seeded:

```sql
SELECT * FROM auth.users
WHERE created_at BETWEEN 'YYYY-MM-DD HH:MM:SS' AND 'YYYY-MM-DD HH:MM:SS'
ORDER BY created_at;
```

### Method 3: By Test Data Marker (Future Enhancement)

**Recommended:** Add a `is_test_data` flag to profiles table:

```sql
-- Add column to profiles table
ALTER TABLE profiles ADD COLUMN is_test_data boolean DEFAULT false;

-- Mark existing test accounts
UPDATE profiles
SET is_test_data = true
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email LIKE '%@gigmate-test.com'
);
```

Then query:
```sql
SELECT * FROM profiles WHERE is_test_data = true;
```

## Removing Test Accounts

### Safe Removal Process

1. **Back up first:**
```sql
-- Export test account IDs to a backup table
CREATE TABLE test_accounts_backup AS
SELECT * FROM auth.users
WHERE email LIKE '%@gigmate-test.com';
```

2. **Remove in correct order (respecting foreign keys):**

```sql
-- Start a transaction
BEGIN;

-- Get all test user IDs
WITH test_users AS (
  SELECT id FROM auth.users
  WHERE email LIKE '%@gigmate-test.com'
)

-- Delete dependent records first (in order)
DELETE FROM ai_operations_log WHERE id IN (SELECT id FROM test_users);
DELETE FROM user_behavior WHERE user_id IN (SELECT id FROM test_users);
DELETE FROM premium_messages WHERE sender_id IN (SELECT id FROM test_users) OR recipient_id IN (SELECT id FROM test_users);
DELETE FROM messages WHERE sender_id IN (SELECT id FROM test_users) OR recipient_id IN (SELECT id FROM test_users);
DELETE FROM conversations WHERE user1_id IN (SELECT id FROM test_users) OR user2_id IN (SELECT id FROM test_users);
DELETE FROM ratings WHERE user_id IN (SELECT id FROM test_users);
DELETE FROM transactions WHERE sender_id IN (SELECT id FROM test_users) OR recipient_id IN (SELECT id FROM test_users);
DELETE FROM tickets WHERE fan_id IN (SELECT id FROM test_users);
DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE fan_id IN (SELECT id FROM test_users));
DELETE FROM orders WHERE fan_id IN (SELECT id FROM test_users) OR musician_id IN (SELECT id FROM test_users);
DELETE FROM merchandise WHERE musician_id IN (SELECT id FROM test_users);
DELETE FROM agreements WHERE party1_id IN (SELECT id FROM test_users) OR party2_id IN (SELECT id FROM test_users);
DELETE FROM events WHERE musician_id IN (SELECT id FROM test_users) OR venue_id IN (SELECT id FROM test_users);
DELETE FROM gigs WHERE musician_id IN (SELECT id FROM test_users) OR venue_id IN (SELECT id FROM test_users);
DELETE FROM venues WHERE id IN (SELECT id FROM test_users);
DELETE FROM musicians WHERE id IN (SELECT id FROM test_users);
DELETE FROM profiles WHERE id IN (SELECT id FROM test_users);
DELETE FROM auth.users WHERE id IN (SELECT id FROM test_users);

-- If everything looks good
COMMIT;

-- If there's a problem
-- ROLLBACK;
```

### Quick Delete Function

Create a function to make cleanup easy:

```sql
CREATE OR REPLACE FUNCTION delete_test_accounts()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  WITH test_users AS (
    SELECT id FROM auth.users
    WHERE email LIKE '%@gigmate-test.com'
  ),
  deleted AS (
    DELETE FROM auth.users
    WHERE id IN (SELECT id FROM test_users)
    RETURNING *
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Usage:
```sql
SELECT delete_test_accounts();
```

## Test Data Patterns

### Email Patterns

- **Musicians:** `musician1@gigmate-test.com` through `musician100@gigmate-test.com`
- **Venues:** `venue1@gigmate-test.com` through `venue100@gigmate-test.com`
- **Fans:** `fan1@gigmate-test.com` through `fan100@gigmate-test.com`

### Password

All test accounts use the same password: `TestPass123!`

### Identifying Characteristics

1. **Email domain:** `@gigmate-test.com`
2. **Creation timing:** All created within minutes of each other
3. **Sequential naming:** musician1, musician2, etc.
4. **Predictable data:** Stage names like "The Testing Band", "Test Venue 1"

## Production Safety

### Before Going Live

1. **Remove all test data:**
```sql
SELECT delete_test_accounts();
```

2. **Verify deletion:**
```sql
SELECT COUNT(*) FROM auth.users WHERE email LIKE '%@gigmate-test.com';
-- Should return 0
```

3. **Add constraints to prevent test emails:**
```sql
ALTER TABLE auth.users ADD CONSTRAINT no_test_emails
CHECK (email NOT LIKE '%@gigmate-test.com');
```

4. **Clear placeholder advertisements:**
```sql
-- Mark placeholder ads as inactive
UPDATE advertisements
SET is_active = false
WHERE advertiser_name IN (
  'Gibson Guitars', 'Shure Microphones', 'Fender',
  'Lone Star Beer', 'Tito''s Handmade Vodka',
  'Spotify for Artists', 'SoundCloud Pro', 'Guitar Center',
  'Sweetwater', 'Roland', 'Eventbrite', 'BandsInTown',
  'Austin City Limits', 'SXSW', 'QSC Audio', 'Chauvet DJ',
  'StubHub', 'Live Nation', 'Clarion Insurance', 'Berklee Online'
);

-- Or delete them entirely
DELETE FROM advertisements
WHERE advertiser_name IN (...);
```

## Keeping Some Test Data

If you want to keep test data for demo purposes:

1. **Mark as demo accounts:**
```sql
UPDATE profiles
SET is_test_data = true
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email LIKE '%@gigmate-test.com'
);
```

2. **Filter from analytics:**
```sql
-- Example: Count real users only
SELECT COUNT(*) FROM profiles
WHERE is_test_data = false OR is_test_data IS NULL;
```

3. **Prevent test accounts in production metrics:**
```sql
CREATE VIEW real_users AS
SELECT * FROM profiles
WHERE is_test_data = false OR is_test_data IS NULL;
```

## Automated Cleanup Script

For development environments:

```sql
-- Clean up test data older than 7 days
DELETE FROM auth.users
WHERE email LIKE '%@gigmate-test.com'
AND created_at < NOW() - INTERVAL '7 days';
```

## Monitoring Test Data

Check how much test data exists:

```sql
SELECT
  'Musicians' as type, COUNT(*) as count
FROM auth.users
WHERE email LIKE 'musician%@gigmate-test.com'
UNION ALL
SELECT
  'Venues' as type, COUNT(*) as count
FROM auth.users
WHERE email LIKE 'venue%@gigmate-test.com'
UNION ALL
SELECT
  'Fans' as type, COUNT(*) as count
FROM auth.users
WHERE email LIKE 'fan%@gigmate-test.com';
```

## Summary

**Test Account Identifiers:**
- Email pattern: `%@gigmate-test.com`
- Sequential IDs in names
- Same password for all: `TestPass123!`

**To Delete All Test Data:**
```sql
SELECT delete_test_accounts();
```

**Before Production:**
1. Delete all test accounts
2. Delete or deactivate placeholder ads
3. Add email domain constraints
4. Verify with count queries

---

**IMPORTANT:** Always backup your database before running delete operations!
