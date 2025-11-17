# GigMate Data Seeding Guide

## What is Database Seeding

Database seeding populates your empty database with realistic test data. Think of it as creating fake users, venues, musicians, events, and bookings so you can:
- Test features without manually creating 100 accounts
- Demo the platform to investors/stakeholders
- Develop new features against realistic data volumes
- Test performance with production-like data

---

## When Should You Seed Data

###  **SEED DATA WHEN:**

#### 1. **Fresh Development Environment**
- You just cloned the project on a new machine
- You want to test features locally
- Your local database is empty

**How to seed:**
```bash
# In development, navigate to:
http://localhost:5173

# Login or create an admin account, then go to:
http://localhost:5173/admin/seed

# Click "Seed Database with 300 Accounts"
# Wait 2-3 minutes for completion
```

#### 2. **Demo/Presentation Preparation**
- Showing GigMate to potential investors
- Presenting to beta testers
- Creating marketing screenshots/videos
- Need realistic-looking data fast

**Why:** Empty databases look unimpressive. Seeded data shows the platform's full potential.

#### 3. **After Major Database Migrations**
- You just added new tables/columns
- Testing that relationships work correctly
- Want to verify data integrity after schema changes

**Note:** Seeding on top of existing data may cause conflicts. Consider resetting database first.

#### 4. **Testing Features at Scale**
- Testing search with 100 musicians
- Checking pagination with many events
- Load testing recommendation algorithms
- Verifying performance with realistic data volumes

#### 5. **Staging/QA Environment Setup**
- Deploying to a staging server
- QA team needs test accounts
- Running automated tests that need fixtures

---

### **DO NOT SEED DATA WHEN:**

#### 1. **Production Environment - NEVER**
- Real users exist
- Real transactions happening
- Real money involved
- Could create liability issues

**Why:** Seeded data has fake emails, passwords, and test transactions. This would:
- Confuse real users
- Pollute analytics
- Create fake revenue numbers
- Violate data integrity

#### 2. **Database Already Has Real Data**
- Users have signed up organically
- Real bookings exist
- Actual transactions occurred

**Why:** Seeding is additive (adds 300 MORE accounts). You'll end up with:
- Mix of real and fake data (can't tell them apart)
- Inflated user counts
- Fake transactions skewing analytics

**Exception:** You can seed IF you add a `is_test_data` flag and filter test accounts from real metrics.

#### 3. **After Launch Day**
- Platform is live
- Users are actively signing up
- Revenue is being generated

**Why:** No going back. Real users = real responsibility.

---

## What Gets Created When You Seed

### Current Seed Data (as of your DatabaseSeeder.tsx):

**300 Total Accounts:**
-  **100 Musicians**
  - 25 Bronze tier (entry-level)
  - 25 Silver tier (mid-level)
  - 50 Gold tier (premium)
  - All have availability slots
  - Distributed across music genres
  - Geographic coordinates (Texas Hill Country focus)

-  **100 Venues**
  - **First 29 are REAL venues** in Texas Hill Country:
    - The Roundup (New Braunfels)
    - Gruene Hall (Gruene)
    - Luckenbach Texas (Luckenbach)
    - Whitewater Amphitheatre (New Braunfels)
    - 11th Street Cowboy Bar (Bandera)
    - Venues across Kendall, Gillespie, Blanco, Comal, Bandera, Kerr counties
  - Remaining 71 are fictional venues
  - Subscription tiers: Local, Regional, State, National
  - All have realistic addresses and coordinates

-  **100 Fans**
  - 25 Bronze tier
  - 25 Silver tier
  - 50 Gold tier
  - Ready to browse events and purchase tickets

**Related Data:**
-  **50 Events** (connecting venues and musicians)
-  **30 Bookings** (various statuses: pending, confirmed, completed)
-  **Availability Slots** for all musicians
-  **Geographic data** (latitude/longitude for mapping)

**Credentials:**
- Email format: `lastname.type#@gigmate.us`
  - Example: `smith.musician1@gigmate.us`
  - Example: `johnson.venue15@gigmate.us`
  - Example: `williams.fan42@gigmate.us`
- Password for ALL accounts: `password123`

---

## How to Seed Data (Step-by-Step)

### Method 1: Using the Admin UI (Recommended)

**Step 1: Start Your Development Server**
```bash
npm run dev
```

**Step 2: Create an Admin Account (First Time Only)**
- Navigate to http://localhost:5173
- Sign up for any account type
- Note: Anyone can access the seeder in development

**Step 3: Access the Database Seeder**
- Go to: `http://localhost:5173/admin/seed`
- Or navigate via the UI if there's an admin menu

**Step 4: Click "Seed Database"**
- Click the big button: "Seed Database with 300 Accounts"
- Wait 2-3 minutes (creates 300 accounts + relationships)
- Watch status messages for progress

**Step 5: Verify Success**
```
Database seeding completed successfully!

Created:
- 100 Musicians (25% bronze, 25% silver, 50% gold)
- 100 Venues (25% local, 25% regional, 25% state, 25% national)
- 100 Fans (25% bronze, 25% silver, 50% gold)
- 50 Events
- 30 Bookings
- Availability slots for all musicians
```

**Step 6: Test Login**
- Log out
- Try logging in with a test account:
  - Email: `smith.musician1@gigmate.us`
  - Password: `password123`

---

### Method 2: Programmatic Seeding (For Automated Testing)

**Option A: Call seedData function directly**
```typescript
import { seedDatabase } from './lib/seedData';

// In your test setup
beforeAll(async () => {
  await seedDatabase();
});
```

**Option B: Create a seed script**
```typescript
// scripts/seed.ts
import { seedDatabase } from '../src/lib/seedData';

async function main() {
  console.log('Starting database seed...');
  const result = await seedDatabase();

  if (result.success) {
    console.log('Seeding completed successfully!');
  } else {
    console.error('Seeding failed');
    process.exit(1);
  }
}

main();
```

Run with:
```bash
npx tsx scripts/seed.ts
```

---

## Resetting Your Database (Start Fresh)

Sometimes you want to wipe everything and re-seed:

### **DANGEROUS: This Deletes ALL Data**

**Method 1: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. SQL Editor
3. Run this query:
```sql
-- Delete all data (keeps tables intact)
TRUNCATE
  profiles,
  musicians,
  venues,
  fans,
  events,
  bookings,
  messages,
  availability_slots,
  user_subscriptions,
  transactions
CASCADE;

-- Reset auto-incrementing IDs
ALTER SEQUENCE IF EXISTS events_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS bookings_id_seq RESTART WITH 1;
```

**Method 2: Drop and Recreate (Nuclear Option)**
```bash
# Reset migrations (only in development!)
supabase db reset

# This will:
# - Drop all tables
# - Re-run all migrations
# - Start with completely fresh database
```

**Then re-seed:**
- Go to http://localhost:5173/admin/seed
- Click "Seed Database" again

---

## Seeding Strategy by Environment

### **Local Development**
- **Seed:** YES, every time you start fresh
- **How often:** Whenever you reset your database
- **Data volume:** 300 accounts (current default)
- **Purpose:** Testing and feature development

### **Staging/QA Environment**
- **Seed:** YES, once after deployment
- **How often:** After each major deployment
- **Data volume:** 300-1000 accounts (can customize)
- **Purpose:** QA testing, demos, presentations
- **Add flag:** Consider marking as `is_test_data: true`

### **Production**
- **Seed:** NEVER
- **Real users only**
- **Data comes from:** Actual signups and activity
- **Exception:** You could seed ONE demo account for customer support testing

---

## Customizing Seed Data

Want to change what gets createdEdit this file:

**File:** `src/lib/seedData.ts`

**Examples:**

**Change number of accounts:**
```typescript
// Line ~20
const MUSICIAN_COUNT = 50;  // Change from 100
const VENUE_COUNT = 50;     // Change from 100
const FAN_COUNT = 50;       // Change from 100
```

**Change geographic focus:**
```typescript
// Add more cities/regions
const LOCATIONS = [
  { city: 'Austin', state: 'TX', lat: 30.2672, lng: -97.7431 },
  { city: 'Nashville', state: 'TN', lat: 36.1627, lng: -86.7816 },
  { city: 'Portland', state: 'OR', lat: 45.5152, lng: -122.6784 },
];
```

**Add different music genres:**
```typescript
// Already defined in src/lib/genres.ts
// Just reference different genres in seed data
```

**Change tier distribution:**
```typescript
// Current: 25% bronze, 25% silver, 50% gold
// Change to: 50% bronze, 30% silver, 20% gold

const tier =
  i < 50 'bronze' :   // First 50
  i < 80 'silver' :   // Next 30
  'gold';               // Last 20
```

---

## Seed Data Best Practices

###  **DO:**

1. **Seed in development** - Makes testing easier
2. **Use realistic data** - Better for demos
3. **Include edge cases** - Users with 0 ratings, empty profiles, etc.
4. **Test all features** - Create data that exercises all code paths
5. **Version your seed data** - Track changes in git
6. **Document credentials** - Keep list of test accounts handy
7. **Add timestamps** - Realistic created_at/updated_at dates

### **DON'T:**

1. **Seed in production** - Ever. Period.
2. **Use real emails** - All test emails should be @example.com or @gigmate.us
3. **Use real payment info** - Test credit cards only
4. **Forget to document** - Team needs to know test accounts exist
5. **Mix real and fake data** - Can't tell them apart in analytics
6. **Seed sensitive data** - No real SSNs, addresses, phone numbers
7. **Assume seed data is safe** - Still validate inputs, test edge cases

---

## Troubleshooting Seeding Issues

### Problem: "Email already exists" errors

**Cause:** Database already has accounts with these emails

**Solution:**
```sql
-- Delete test accounts
DELETE FROM profiles WHERE email LIKE '%@gigmate.us';
```

Or use a different email pattern in seedData.ts:
```typescript
const email = `test.${lastName.toLowerCase()}.${userType}${i}@example.com`;
```

### Problem: "Foreign key constraint violation"

**Cause:** Tables created in wrong order, or data references non-existent records

**Solution:**
- Check that parent records (profiles, venues, musicians) are created first
- Verify IDs exist before creating relationships
- Use `ON DELETE CASCADE` in migrations

### Problem: Seeding takes forever (>5 minutes)

**Cause:** Creating accounts synchronously, network latency

**Solution:**
- Batch insert operations
- Use Promise.all() for parallel creation
- Reduce account count for faster seeding
- Check database indexes are created

### Problem: Subscriptions not created for users

**Cause:** Subscription system expects manual signup, not bulk import

**Solution:**
Add to your seedData.ts:
```typescript
// After creating each user
await supabase.rpc('upsert_user_subscription', {
  p_user_id: userId,
  p_plan_name: 'free',
  p_billing_cycle: 'monthly'
});
```

---

## Quick Reference

| Environment | Seed Data| When| Volume |
|------------|-----------|-------|--------|
| **Local Dev** |  YES | Every fresh clone | 300 accounts |
| **Staging** |  YES | After deployment | 300-1000 |
| **Production** | NEVER | Never | Real users only |
| **CI/CD Tests** |  YES | Before test run | Minimal (10-20) |
| **Demos** |  YES | Before presentation | 300 accounts |

**Seed Command:**
```
Navigate to: http://localhost:5173/admin/seed
Click: "Seed Database with 300 Accounts"
Wait: 2-3 minutes
Test: Login with smith.musician1@gigmate.us / password123
```

**Reset Command:**
```sql
TRUNCATE profiles, musicians, venues, fans CASCADE;
```

---

## Summary

**Seed data when:**
- Starting local development
- Preparing demos
- Testing features
- QA environment setup

**Don't seed when:**
- In production
- Real users exist
- Money is involved

**The rule of thumb:**
> If even one real user has signed up, DO NOT SEED. Ever.

**Current seed creates:**
- 300 accounts (100 each: musicians, venues, fans)
- 50 events
- 30 bookings
- All with subscription tiers and realistic data

**Access seeder:**
`http://localhost:5173/admin/seed`

---

**You're ready to seed!** Just remember: development only, never production.
