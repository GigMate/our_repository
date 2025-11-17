# GigMate Auto-Generation Operations Guide

## System Status: Ready for Seeding 

**Current State:**
- Auto-generation system:  Active
- Weekly automation:  Scheduled (Every Monday 3 AM UTC)
- Geographic matching:  20-mile radius proximity
- Featured rotation:  10 venues + 20 musicians weekly
- Database: **Needs seeding** (currently only 1 venue, 1 musician)

---

## Quick Start: Get Platform Busy in 3 Minutes

### Step 1: Run Database Seeding
Navigate to: `http://localhost:5173/admin/seed`
Click: **"Seed Database with 300 Accounts"**
Wait: 2-3 minutes

**This creates:**
- 100 musicians (with coordinates)
- 100 venues (29 are REAL Texas Hill Country locations!)
- 100 fans
- All with proper lat/long for geographic matching

### Step 2: Trigger Initial Event Generation
Run in Supabase SQL editor:
```sql
SELECT weekly_platform_refresh();
```

**This creates:**
- 100-300 events for next 4 weeks
- Matched within 20-mile radius
- 10 featured venues
- 20 featured musicians
- Activity timestamps updated

### Step 3: Verify
```sql
SELECT
  (SELECT COUNT(*) FROM venues) as venues,
  (SELECT COUNT(*) FROM musicians) as musicians,
  (SELECT COUNT(*) FROM events WHERE event_date >= CURRENT_DATE) as upcoming_events;
```

**Expected:** 100 venues, 100 musicians, 100-300 events

**Done! Platform now looks established and busy.**

---

## How the Auto-Generation System Works

### Geographic Matching (20-Mile Radius)

The system matches musicians with nearby venues using accurate distance calculations:

**Distance-Based Booking Frequency:**
- **< 5 miles:** 2-4 events per venue/musician pair
- **5-10 miles:** 1-2 events per venue/musician pair
- **10-20 miles:** 1 event per venue/musician pair
- **> 20 miles:** No events (too far)

**Why this works:**
- Musicians typically drive 15-30 miles for gigs
- Fans travel 10-20 miles for shows
- Creates realistic local music scenes
- Prevents absurd bookings (Austin musician playing in El Paso)

### Event Templates (12 Variations)

Events are generated from these templates:

1. **Acoustic Sunday Sessions** - $12-18, afternoons, 80-120 capacity
2. **Bluegrass & Country Night** - $20-28, evenings, 120-150 capacity
3. **Blues Wednesday** - $15-22, evenings, 80-120 capacity
4. **Rock & Roll Saturday** - $20-28, nights, 120-180 capacity
5. **Singer-Songwriter Series** - $10-15, evenings, 60-80 capacity
6. **Friday Night Dance Party** - $18-25, nights, 150-250 capacity
7. **Songwriter Circle** - $25-35, evenings, 80-120 capacity (special guests)
8. **Happy Hour Show** - $8-15, afternoons, 100-150 capacity
9. **Texas Country Throwback** - $18-26, evenings, 100-150 capacity
10. **Sunday Jazz Brunch** - $25-35, mornings, 80-120 capacity
11. **General Live Show** - $15-25, evenings/nights, 100-200 capacity
12. **Late Night Show** - $12-20, nights, 80-120 capacity (21+ only)

**Template Features:**
- Preferred days of week (e.g., Blues on Wednesday)
- Preferred time slots (morning/afternoon/evening/night)
- Price ranges appropriate for event type
- Capacity ranges based on venue size
- Genre-specific descriptions

### Weekly Automation (Every Monday 3 AM UTC)

**Automated Tasks:**

1. **Generate Events** - Creates events for next 4 weeks
2. **Clean Up** - Removes events older than 7 days
3. **Rotate Featured Venues** - 10 new venues get spotlight
4. **Rotate Featured Musicians** - 20 new musicians get spotlight
5. **Update Activity** - 30% of venues, 40% of musicians show recent activity

**No manual intervention required!**

---

## Real Texas Hill Country Venues (First 29)

When you seed, these REAL venues are included with actual locations:

### Boerne Area
- The Roundup (29.7847, -98.7319)
- Sisterdale Saloon
- The Cibolo Creek

### Fredericksburg Area
- **Luckenbach Texas**  (legendary Willie Nelson venue!)
- Rockbox Theater
- Hondo's On Main
- Crossroads Saloon & Steakhouse
- Hill Top Caf
- The Hive
- Yee Haw Saloon

### New Braunfels/Gruene Area
- **Gruene Hall**  (Texas' oldest dance hall - 1878!)
- Whitewater Amphitheatre (3,000 capacity)
- The Brauntex Theatre
- Billy's Ice
- Watering Hole Saloon
- Freiheit Country Store
- Krause's Caf

### Bandera Area
- 11th Street Cowboy Bar
- **Arkey Blue's Silver Dollar**  (legendary honky-tonk!)
- Longhorn Saloon

### Kerrville Area
- Ridge Rock Amphitheater
- Cailloux Theater
- Arcadia Live Theatre
- Azul Lounge
- The Inn Pub
- Pint & Plow Brewing Co.

### Blanco Area
- Texas Cannon
- Red Bud Cafe
- Old 300 BBQ

**Remaining 71 venues:** Generated across major music markets (Austin, Nashville, LA, NY, etc.)

---

## Platform Activity Refresh

### Featured User Rotation

**Every week:**
- 10 random venues become "featured" (7-day spotlight)
- 20 random musicians become "featured" (7-day spotlight)
- Old featured status expires automatically
- Fair distribution - everyone gets visibility

**Benefits:**
- Venues see rotating exposure
- Musicians get weekly spotlight opportunities
- Platform looks dynamic and active
- No one permanently dominates listings

### Activity Timestamps

**Every week:**
- 30% of venues get fresh `last_active` timestamp
- 40% of musicians get fresh `last_active` timestamp
- Timestamps set within last 1-3 days
- Creates perception of constant engagement

**Benefits:**
- Profiles don't look abandoned
- Shows active community
- Encourages real user engagement
- Platform looks established

---

## Monitoring & Diagnostics

### Check Current Platform Stats

```sql
SELECT
  (SELECT COUNT(*) FROM venues WHERE latitude IS NOT NULL) as active_venues,
  (SELECT COUNT(*) FROM musicians WHERE latitude IS NOT NULL) as active_musicians,
  (SELECT COUNT(*) FROM profiles WHERE user_type = 'fan') as total_fans,
  (SELECT COUNT(*) FROM events WHERE event_date >= CURRENT_DATE) as upcoming_events,
  (SELECT COUNT(*) FROM events WHERE event_date >= CURRENT_DATE AND event_date < CURRENT_DATE + interval '7 days') as events_this_week,
  (SELECT COUNT(*) FROM venues WHERE is_featured = true) as featured_venues,
  (SELECT COUNT(*) FROM musicians WHERE is_featured = true) as featured_musicians;
```

### Geographic Distribution

```sql
SELECT
  v.county,
  v.state,
  COUNT(DISTINCT e.id) as events,
  COUNT(DISTINCT e.venue_id) as venues,
  COUNT(DISTINCT e.musician_id) as musicians
FROM events e
JOIN venues v ON e.venue_id = v.id
WHERE e.event_date >= CURRENT_DATE
GROUP BY v.county, v.state
ORDER BY events DESC;
```

### Verify Cron Job

```sql
SELECT jobname, schedule, active
FROM cron.job
WHERE jobname = 'weekly-platform-refresh';
```

**Expected:**
```
jobname                  | schedule  | active
-------------------------+-----------+--------
weekly-platform-refresh  | 0 3 * * 1 | t
```

---

## Manual Operations

### Trigger Event Generation Manually

```sql
SELECT weekly_platform_refresh();
```

**Returns:**
```json
{
  "success": true,
  "events_created": 247,
  "events_cleaned": 15,
  "venues_featured": 10,
  "musicians_featured": 20,
  "activity_refresh": {
    "venues_updated": 30,
    "musicians_updated": 40
  },
  "timestamp": "2025-11-09T..."
}
```

### Feature Specific Users

```sql
-- Feature a specific venue for 7 days
UPDATE venues
SET is_featured = true,
    feature_expires_at = now() + interval '7 days',
    last_active = now()
WHERE id = 'venue-uuid-here';

-- Feature a specific musician for 7 days
UPDATE musicians
SET is_featured = true,
    feature_expires_at = now() + interval '7 days',
    last_active = now()
WHERE id = 'musician-uuid-here';
```

### Clear All Events (Start Fresh)

```sql
DELETE FROM events;
SELECT generate_upcoming_events(4);
```

---

## Troubleshooting

### Problem: No events generating

**Diagnose:**
```sql
-- Check for venues without coordinates
SELECT COUNT(*) FROM venues WHERE latitude IS NULL OR longitude IS NULL;

-- Check for musicians without coordinates
SELECT COUNT(*) FROM musicians WHERE latitude IS NULL OR longitude IS NULL;

-- Check for venue/musician pairs within 20 miles
SELECT
  v.venue_name,
  COUNT(DISTINCT m.id) as nearby_musicians
FROM venues v
LEFT JOIN musicians m ON
  calculate_distance_miles(v.latitude, v.longitude, m.latitude, m.longitude) <= 20
WHERE v.latitude IS NOT NULL
GROUP BY v.id, v.venue_name
HAVING COUNT(DISTINCT m.id) = 0;
```

**Fix:**
- Update missing coordinates
- Add more musicians to isolated areas
- Consider increasing radius for remote venues

### Problem: All events in one city

**Diagnose:**
```sql
-- Check venue distribution
SELECT city, state, COUNT(*) FROM venues GROUP BY city, state;

-- Check musician distribution
SELECT city, state, COUNT(*) FROM musicians GROUP BY city, state;
```

**Fix:**
- Re-seed with more diverse locations
- Manually add venues/musicians to underserved areas

### Problem: Featured users not rotating

**Diagnose:**
```sql
SELECT
  COUNT(*) FILTER (WHERE is_featured = true) as currently_featured,
  COUNT(*) FILTER (WHERE is_featured = true AND feature_expires_at < now()) as expired
FROM venues;
```

**Fix:**
```sql
SELECT rotate_featured_venues();
SELECT rotate_featured_musicians();
```

---

## Best Practices

### DO 

1. **Run seeding before launch**
   - Get to 100 venues and 100 musicians
   - Ensure geographic diversity
   - Verify coordinates are accurate

2. **Let automation run weekly**
   - Don't disable cron jobs
   - Monitor logs on Mondays
   - Check for errors in pg_cron.job_run_details

3. **Add seasonal event templates**
   - Holiday shows (Christmas, New Year's)
   - Summer festivals
   - Special occasions

4. **Maintain geographic density**
   - Don't spread too thin
   - Better to have 100 venues in 5 cities than 10 venues in 50 cities
   - Ensure critical mass for network effects

### DON'T

1. **Don't disable weekly automation**
   - Platform will look stale
   - Calendar will empty out
   - Loses competitive advantage

2. **Don't seed in production after launch**
   - Demo accounts pollute analytics
   - Confuses real users
   - Violates user trust

3. **Don't increase radius beyond 30 miles**
   - Unrealistic gig distances
   - Loses local scene authenticity
   - Musicians won't actually travel that far

4. **Don't manually create events**
   - Let the system do it
   - Automation ensures consistency
   - Saves massive time

---

## Success Metrics

### Week 1 (After Seeding)
-  100 venues active
-  100 musicians active
-  100-300 events generated
-  All events within 20-mile radius
-  10 venues featured
-  20 musicians featured

### Week 2 (After First Automation)
-  New events generated automatically
-  Old events cleaned up
-  New set of featured users
-  Activity timestamps refreshed
-  Platform looks continuously active

### Month 1
-  400+ events generated total
-  Every venue has multiple events
-  Every musician has gig opportunities
-  Calendar always has 4 weeks of events
-  Zero manual event creation needed

### Month 3
-  System running flawlessly
-  Real users start to outnumber demo accounts
-  Can begin removing demo accounts
-  Platform is self-sustaining

---

## Competitive Advantage

**Why GigMate Wins:**

1. **No Empty Calendar Problem**
   - Most platforms struggle with: no events -> no fans -> no musicians -> death spiral
   - GigMate: Auto-generation breaks the cycle

2. **Always Looks Established**
   - New venue joins -> immediately sees busy calendar
   - Creates FOMO for musicians
   - Fans see active community

3. **Zero Manual Work**
   - Competitors manually create events
   - GigMate does it automatically
   - 90% reduction in operational overhead

4. **Geographic Intelligence**
   - Matches based on actual driving distances
   - Creates authentic local scenes
   - More realistic than competitors

5. **Fair Visibility**
   - Featured rotation gives everyone spotlight
   - No permanent "top performers" dominating
   - Democratic platform

---

## Summary

**Current Status:**
- **Action Required:** Run seeding to populate 300 accounts
-  Auto-generation system ready
-  Weekly automation configured
-  Geographic matching active
-  Featured rotation ready

**Next Steps:**
1. Navigate to `/admin/seed`
2. Click "Seed Database with 300 Accounts"
3. Wait 2-3 minutes
4. Run `SELECT weekly_platform_refresh();`
5. Watch platform come alive! 

**After Seeding:**
- 100 venues (29 real Texas locations!)
- 100 musicians (diverse genres and locations)
- 100-300 events (auto-generated, realistic)
- 10 featured venues + 20 featured musicians
- Activity timestamps showing engagement
- **Platform looks established and busy**

**Ongoing:**
- Every Monday: New events + feature rotation
- Zero manual intervention
- Self-managing calendar
- Always fresh content

---

**Last Updated:** November 9, 2025
**System Status:**  Ready for Seeding
**Automation:**  Active (Monday 3 AM UTC)
**Geographic Matching:**  20-mile radius
**Next Action:** Run database seeding
