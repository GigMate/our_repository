# GigMate Social Media Integration & Emergency Replacement System
## Complete Feature Documentation

---

## Overview

GigMate now includes two powerful premium features:

1. **Social Media Integration** - Connect accounts, post from GigMate, share content
2. **Emergency Replacement System** - Auto-find musicians when bookings cancel (Premium venues only)

Both features include comprehensive legal protections through content rights management.

---

## Part 1: Social Media Integration

### Supported Platforms

**8 Platforms Integrated:**

1. **Facebook** - Events, posts, business pages
2. **Instagram** - Photos, stories, reels
3. **Twitter/X** - Quick updates, event announcements
4. **TikTok** - Video content, viral marketing
5. **YouTube** - Performance videos, live streams
6. **Spotify** - Music profiles (musicians)
7. **SoundCloud** - Track uploads (musicians)
8. **Bandcamp** - Music sales (musicians)

### Features for All User Types

#### **Musicians:**
- Link all 8 platforms
- Post from GigMate to multiple platforms simultaneously
- Share event promotions automatically
- Cross-post performance videos
- Sync Spotify/SoundCloud profiles
- Track engagement across platforms

#### **Venues:**
- Link Facebook, Instagram, Twitter, TikTok
- Promote events to all platforms at once
- Share artist lineup announcements
- Post behind-the-scenes content
- Build venue brand across socials
- Track event promotion performance

#### **Fans:**
- Link personal accounts (optional)
- Share events to social media
- Tag artists in content
- Get credit for user-generated content
- Featured fan photos
- Build social presence

### Posting from GigMate App

**Create Once, Post Everywhere:**

```typescript
// User creates post in GigMate
{
  content: "Live show tonight at 8pm! Come out!",
  platforms: ['facebook', 'instagram', 'twitter'],
  media_urls: ['photo1.jpg', 'photo2.jpg'],
  event_id: 'event-uuid',
  post_type: 'event_promotion',
  scheduled_for: '2025-01-10T18:00:00Z'
}

// GigMate posts to all 3 platforms automatically
// Tracks engagement from each
// Reports back total reach
```

**Post Types:**

1. **Event Promotion** - Automated or manual
2. **General Update** - News, announcements
3. **Behind the Scenes** - Candid moments
4. **Announcement** - Important updates

**Scheduling:**
- Post immediately
- Schedule for specific time
- Auto-post before events (24hrs, 6hrs, 1hr)
- Recurring posts (weekly gig announcements)

**Media Support:**
- Images (up to 10 per post)
- Videos (up to 5 minutes)
- Audio clips
- Event posters (auto-generated)

### Technical Implementation

#### Database Schema

**social_media_accounts:**
```sql
- user_id (links to profile)
- platform (facebook, instagram, etc.)
- username
- profile_url
- access_token (encrypted)
- is_connected (boolean)
- can_post (boolean)
- last_synced_at
```

**social_media_posts:**
```sql
- user_id
- platforms (array)
- content (text)
- media_urls (array)
- event_id (optional link)
- post_type
- scheduled_for
- status (draft, scheduled, posted, failed)
- platform_post_ids (JSON - IDs from each platform)
- engagement_stats (JSON - likes, shares, comments)
```

#### OAuth Flow

**Connection Process:**

1. User clicks "Connect Instagram"
2. Redirected to Instagram OAuth
3. User authorizes GigMate
4. Receives access_token + refresh_token
5. Tokens stored encrypted in database
6. Connection marked as active
7. User can now post to Instagram from GigMate

**Security:**
- Tokens encrypted at rest (AES-256)
- Refresh tokens rotated regularly
- Revocable by user at any time
- Scopes limited to posting only (can't read DMs)

#### Cross-Posting Logic

```typescript
async function postToAllPlatforms(post) {
  const results = [];

  for (const platform of post.platforms) {
    try {
      const account = await getAccount(post.user_id, platform);

      if (platform === 'instagram') {
        const result = await postToInstagram(account, post);
        results.push({ platform, success: true, post_id: result.id });
      } else if (platform === 'facebook') {
        const result = await postToFacebook(account, post);
        results.push({ platform, success: true, post_id: result.id });
      }
      // ... other platforms

    } catch (error) {
      results.push({ platform, success: false, error: error.message });
    }
  }

  // Update post with results
  await updatePost(post.id, {
    status: 'posted',
    platform_post_ids: results,
    posted_at: new Date()
  });
}
```

---

## Part 2: Content Rights Management

### Shared Asset Rights

**Key Principle:**

> **All content uploaded to GigMate becomes a SHARED ASSET. Original owner retains full rights, and GigMate receives perpetual license to use for platform purposes.**

### What This Means

#### **For Original Owners:**

**You Keep:**
- ✅ Full ownership
- ✅ Copyright
- ✅ Right to use anywhere
- ✅ Right to sell/license
- ✅ Credit/attribution
- ✅ Can delete from GigMate anytime

**You Grant GigMate:**
- Non-exclusive license
- Worldwide usage rights
- Right to display on platform
- Right to use in marketing
- Right to create derivatives (e.g., thumbnails, crops)
- Royalty-free usage

#### **For GigMate:**

**Can Use Content For:**
- Platform display (profiles, feeds, search)
- Marketing materials (ads, social media, website)
- Promotional campaigns
- Press releases
- User acquisition
- Featured content ("Photo of the Week")
- Compilations (highlight reels)

**Cannot:**
- Sell original content directly
- Claim ownership
- Remove attribution
- Use outside platform purposes
- License to third parties for profit

### Legal Protection

**content_rights table tracks:**

```sql
{
  content_url: "gigmate.com/images/abc123.jpg",
  original_owner_id: "user-uuid",
  uploaded_via: "gigmate_app",
  rights_agreement_accepted: true,
  rights_agreement_version: "1.0",
  rights_agreement_date: "2025-01-10T10:00:00Z",
  ip_address: "192.168.1.1",
  user_agent: "GigMate iOS App 1.0",
  gigmate_usage_allowed: true,
  commercial_usage_allowed: true,
  derivative_works_allowed: true,
  attribution_required: true
}
```

**Immutable Audit Trail:**
- Every upload recorded
- IP address logged
- Timestamp captured
- Agreement version tracked
- User agent saved
- Cannot be modified after creation

### User Agreement Flow

**On First Upload:**

```
┌─────────────────────────────────────────┐
│  Content Rights Agreement               │
├─────────────────────────────────────────┤
│                                         │
│  By uploading content to GigMate, you:  │
│                                         │
│  ✓ Retain full ownership                │
│  ✓ Grant GigMate usage rights           │
│  ✓ Allow derivative works               │
│  ✓ Enable commercial use                │
│  ✓ Permit marketing usage               │
│                                         │
│  You can delete content anytime.        │
│  GigMate will credit you when possible. │
│                                         │
│  [✓] I understand and agree             │
│                                         │
│  [Continue]  [Cancel]                   │
└─────────────────────────────────────────┘
```

**Checkbox Required:**
- Must check box to proceed
- Agreement stored in database
- Can review terms anytime
- Version controlled (1.0, 1.1, etc.)

### Attribution System

**Automatic Credit:**

Every shared image/video displays:
- "Photo by @username"
- Link to original poster profile
- Original post date
- Platform source (if imported from social)

**Featured Content:**
- "Photo of the Week by @username"
- Notification sent to original owner
- Bonus credits awarded
- Shared to GigMate social media with credit

### Deletion Rights

**Users Can:**
- Delete content anytime
- Removes from public display immediately
- Purged from CDN within 24 hours
- Rights record remains (audit trail)
- GigMate must stop using in new materials

**GigMate Retains:**
- Right to keep in existing materials (already published)
- Right to keep in analytics/reports
- Audit trail (required by law)
- Backups (30-day retention)

---

## Part 3: Emergency Replacement System

### The Problem It Solves

**Scenario:**

> **Friday, 6pm:** Band cancels on venue for tonight's 9pm show. Venue scrambles to find replacement. Calls 20 musicians. None available. Show cancelled. Venue loses ticket revenue, fan trust, reputation.

**GigMate Solution:**

> **Friday, 6pm:** Band cancels. GigMate automatically searches 150-mile radius for available musicians matching genres. Finds 8 candidates with emergency rates. Venue reviews, selects, books replacement in 10 minutes. Show goes on!

### Premium Feature Only

**Available To:**
- Regional tier venues ($49.99/month)
- State tier venues ($99.99/month)
- National tier venues ($199.99/month)

**Not Available To:**
- Free venues
- Local tier ($19.99/month)

**Why Premium:**
- Emergency search is expensive (computational + priority)
- Premium musicians opt-in (most are premium tier)
- High-value feature justifies upgrade
- Prevents abuse (free tiers might cancel/rebook repeatedly)

### How It Works

#### Step 1: Booking Cancellation

**Musician cancels booking:**

```typescript
await cancelBooking(bookingId, {
  reason: "Family emergency - unable to perform",
  status: 'cancelled'
});

// Automatically triggers emergency_replacement_search()
```

#### Step 2: Automatic Search

**System executes:**

```sql
-- Check if venue is premium
SELECT subscription_type FROM subscriptions
WHERE user_id = venue_id AND status = 'active';

-- If premium, create emergency replacement request
INSERT INTO emergency_replacements (
  original_booking_id,
  venue_id,
  event_date,
  original_rate,
  max_emergency_rate, -- original_rate * 1.5
  search_radius_miles, -- 100 (regional), 150 (state), 200 (national)
  required_genres, -- same as cancelled musician
  expires_at -- now() + 4 hours
);

-- Find candidates
SELECT * FROM find_emergency_replacement_musicians(
  venue_id,
  event_date,
  required_genres,
  search_radius_miles,
  max_emergency_rate
);
```

#### Step 3: Candidate Matching

**Algorithm finds musicians who:**

1. ✅ Have emergency availability enabled
2. ✅ Match required genres
3. ✅ Are not booked that date
4. ✅ Emergency rate <= max_emergency_rate
5. ✅ Within search radius
6. ✅ Available on short notice

**Scoring:**

```typescript
match_score = (
  genre_overlap / total_required_genres * 100
)

// Example:
// Required: [Rock, Blues, Country]
// Musician A: [Rock, Blues, Jazz] → 66% match
// Musician B: [Rock, Blues, Country, Folk] → 100% match
// Musician B ranked higher
```

**Sort Order:**
1. Match score (highest first)
2. Emergency rate (lowest first)
3. Average rating (highest first)
4. Total gigs (most experienced first)

#### Step 4: Venue Review

**Venue receives notification:**

```
┌────────────────────────────────────────────┐
│  🚨 Emergency Replacement Needed           │
├────────────────────────────────────────────┤
│                                            │
│  Original: The Blue Notes (cancelled)      │
│  Event: Friday 9pm                         │
│  Original Rate: $500                       │
│                                            │
│  8 AVAILABLE REPLACEMENTS FOUND:           │
│                                            │
│  1. Johnny's Band                          │
│     • 100% genre match (Rock, Blues)       │
│     • Emergency Rate: $600 ($100 more)     │
│     • 4.8★ rating (45 gigs)                │
│     • 35 miles away                        │
│     • Can be there in 60 minutes           │
│     [View Profile] [Book Now]              │
│                                            │
│  2. The Roadhouse Kings                    │
│     • 66% genre match (Rock, Country)      │
│     • Emergency Rate: $550 ($50 more)      │
│     • 4.6★ rating (32 gigs)                │
│     • 42 miles away                        │
│     • Can be there in 90 minutes           │
│     [View Profile] [Book Now]              │
│                                            │
│  ... 6 more candidates                     │
│                                            │
│  Expires in: 3 hours 45 minutes            │
└────────────────────────────────────────────┘
```

#### Step 5: Booking Confirmation

**Venue selects musician:**
- Clicks "Book Now"
- Reviews emergency rate + requirements
- Confirms booking
- Musician immediately notified
- New booking created
- Original booking marked as "replaced"

**Musician receives:**
- Push notification
- SMS (optional)
- Email
- In-app message
- Must accept within response_time (usually 60 minutes)

### Emergency Availability Settings

**Musicians Configure:**

```typescript
{
  is_available: true, // Toggle on/off
  emergency_rate: 800, // $800 for emergency bookings
  max_distance_miles: 75, // Will travel up to 75 miles
  response_time_minutes: 60, // Can respond within 1 hour
  minimum_notice_hours: 4, // Need at least 4 hours notice
  requirements: [
    "PA system must be provided",
    "Load-in assistance required",
    "Green room access"
  ],
  equipment_needed: [
    "Full drum kit",
    "Bass amp",
    "Microphones (4)"
  ],
  notes: "Available for country/rock/blues gigs. Can bring full 4-piece band."
}
```

**Toggle Availability:**
- Enable when available for emergency gigs
- Disable when fully booked
- Auto-disable when booking accepted
- Re-enable manually

**Emergency Rate:**
- Set higher than normal rate (typically 1.3x - 2x)
- Compensates for short notice
- Reflects urgency premium
- Venue sees rate before booking

**Distance:**
- Maximum miles willing to travel
- Used in geofence search
- Larger radius = more opportunities
- Can adjust anytime

**Requirements:**
- List any special needs
- Equipment venue must provide
- Load-in help needed
- Technical requirements
- Venue sees before booking

### Search Radius by Tier

**Tier determines max search distance:**

| Venue Tier | Search Radius | Rationale |
|------------|---------------|-----------|
| Regional | 100 miles | Covers local metro + surrounding area |
| State | 150 miles | Covers multiple metros statewide |
| National | 200 miles | Major travel for major venues |

**Example (Austin, TX venue):**
- Regional (100mi): Covers San Antonio, Hill Country
- State (150mi): Adds Houston, Waco
- National (200mi): Includes Dallas/Fort Worth

### Emergency Rates

**Pricing Strategy:**

**Normal Booking:**
- Musician sets standard rate: $500
- Venue books weeks in advance
- Time to prepare, promote, etc.

**Emergency Booking:**
- Musician sets emergency rate: $750 (1.5x)
- Venue needs same-day replacement
- Short notice premium
- Urgency surcharge

**Venue's Max Rate:**
- System calculates: original_rate * 1.5
- Example: $500 booking → max $750 emergency
- Prevents price gouging
- Fair for both parties

**Why Higher Rates:**
- Short notice inconvenience
- May cancel other plans
- Rush to venue
- Less prep time
- Deserves premium

### Success Tracking

**Metrics Tracked:**

```sql
-- For musicians
emergency_availability.total_emergency_bookings
emergency_availability.last_emergency_booking

-- For venues
emergency_replacements.status
emergency_replacements.accepted_at

-- Platform-wide
SELECT
  COUNT(*) as total_emergency_requests,
  COUNT(*) FILTER (WHERE status = 'accepted') as successful,
  AVG(replacement_rate - original_rate) as avg_premium,
  AVG(EXTRACT(EPOCH FROM (accepted_at - created_at))/60) as avg_response_minutes
FROM emergency_replacements;
```

**KPIs:**
- Emergency request fill rate (target: 80%+)
- Average response time (target: <30 minutes)
- Average rate premium (expect: 30-50%)
- Venue satisfaction (post-event survey)

---

## Part 4: Business Impact

### Social Media Integration Value

**For Platform:**

**User Engagement:**
- Users stay in GigMate longer (no switching to Instagram)
- More content created (easy cross-posting)
- Viral potential (shared to external platforms)
- Brand awareness (GigMate watermark on shared content)

**Network Effects:**
- User posts → followers see GigMate events
- Followers sign up for GigMate
- More users → more content → more shares
- Flywheel effect

**Revenue Impact:**
- Higher engagement = more bookings
- More bookings = more transaction fees
- Cross-posting feature = premium tier incentive
- Estimated +15-25% user engagement

**Marketing Value:**
- User-generated content (free marketing)
- Authentic social proof
- Reaches beyond platform
- Estimated marketing value: $50K-100K/month equivalent

### Emergency Replacement Value

**For Venues:**

**Problem Solved:**
- No more cancelled shows
- No more frantic phone calls
- No more lost revenue
- No more disappointed fans
- Peace of mind

**Financial Impact:**

**Scenario Without GigMate:**
- Show cancelled due to no replacement
- Lost ticket revenue: $2,000
- Lost bar sales: $3,000
- Lost future business: $5,000 (fans stop coming)
- Total loss: $10,000

**Scenario With GigMate:**
- Replacement found in 15 minutes
- Emergency rate premium: $250 extra
- Show goes on
- Revenue saved: $10,000
- Cost: $250
- **Net benefit: $9,750**

**ROI:**
- One emergency replacement pays for 19 months of Regional subscription
- Priceless for reputation protection

**For Musicians:**

**New Revenue Stream:**
- Emergency bookings = extra income
- Higher rates justified
- Fill calendar gaps
- Last-minute opportunities

**Example:**
- Musician typically books 8 gigs/month
- Adds 2 emergency gigs/month at 1.5x rate
- Extra monthly income: $1,200-1,500
- Annual: $14,400-18,000 additional

**For GigMate:**

**Premium Tier Driver:**
- Feature exclusively for premium venues
- Strong incentive to upgrade
- High perceived value
- Estimated conversion boost: +40%

**Transaction Fees:**
- 10% fee on emergency bookings
- Higher booking amounts (emergency rates)
- More total bookings (cancellations filled)
- Estimated additional revenue: $200K-400K/year

**Platform Stickiness:**
- Venues can't leave (need emergency feature)
- Musicians stay available (want emergency gigs)
- Lock-in effect
- Higher lifetime value

### Combined Revenue Impact

**Year 2 Projections:**

| Feature | Revenue Impact |
|---------|----------------|
| Social Integration | +$800K (engagement boost) |
| Emergency Replacements | +$350K (direct fees) |
| Premium Upgrades | +$600K (tier conversions) |
| **Total** | **+$1.75M** |

**Year 3 Projections:**

| Feature | Revenue Impact |
|---------|----------------|
| Social Integration | +$3.2M |
| Emergency Replacements | +$1.4M |
| Premium Upgrades | +$2.4M |
| **Total** | **+$7M** |

---

## Part 5: Implementation Details

### Social Media UI Components

**Account Connection Screen:**

```
┌──────────────────────────────────────┐
│  Connect Social Media Accounts       │
├──────────────────────────────────────┤
│                                      │
│  📘 Facebook     [Connected ✓]       │
│     @johnsband                       │
│     Last synced: 2 hours ago         │
│     [Disconnect]                     │
│                                      │
│  📷 Instagram    [Connect]           │
│                                      │
│  🐦 Twitter      [Connect]           │
│                                      │
│  🎵 TikTok       [Connect]           │
│                                      │
│  ▶️  YouTube     [Connect]           │
│                                      │
│  🎵 Spotify      [Connected ✓]       │
│     @johnsband                       │
│     [Disconnect]                     │
│                                      │
└──────────────────────────────────────┘
```

**Post Creation Screen:**

```
┌────────────────────────────────────────┐
│  Create Post                           │
├────────────────────────────────────────┤
│                                        │
│  Post to:                              │
│  [✓] Facebook  [✓] Instagram  [ ] Twitter
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ Live at The Saxon Pub tonight!   │ │
│  │ 9pm showtime. Come see us!      │ │
│  │                                  │ │
│  │ #livemusic #austin #gig         │ │
│  └──────────────────────────────────┘ │
│                                        │
│  📷 Add Photos  🎥 Add Video           │
│                                        │
│  🔗 Link Event: Friday Night Live      │
│                                        │
│  ⏰ Post Now  📅 Schedule for Later    │
│                                        │
│  [Post]                                │
│                                        │
└────────────────────────────────────────┘
```

### Emergency Availability UI

**Musician Settings:**

```
┌──────────────────────────────────────────┐
│  Emergency Availability Settings         │
├──────────────────────────────────────────┤
│                                          │
│  Status: [ON]  [OFF]                     │
│                                          │
│  Emergency Rate: $________               │
│  (Your normal rate: $500)                │
│  Recommended: $650-750                   │
│                                          │
│  Max Distance: [___] miles               │
│  Current: 75 miles                       │
│                                          │
│  Response Time: [___] minutes            │
│  (How quickly can you respond?)          │
│                                          │
│  Minimum Notice: [___] hours             │
│  (How much advance warning do you need?) │
│                                          │
│  Requirements (optional):                │
│  ┌────────────────────────────────────┐ │
│  │ • PA system must be provided       │ │
│  │ • Load-in help needed              │ │
│  │ • Parking for van                  │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Equipment Needed:                       │
│  ┌────────────────────────────────────┐ │
│  │ • Full drum kit                    │ │
│  │ • Bass amp (minimum 300W)          │ │
│  │ • 4 microphones                    │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Additional Notes:                       │
│  ┌────────────────────────────────────┐ │
│  │ Available for country, rock, and   │ │
│  │ blues gigs. Can bring full 4-piece │ │
│  │ band on short notice.              │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Total Emergency Bookings: 12            │
│  Last Emergency Gig: 2 weeks ago         │
│                                          │
│  [Save Settings]                         │
│                                          │
└──────────────────────────────────────────┘
```

### Content Rights Flow

**Upload with Rights Agreement:**

```typescript
async function uploadContent(file, user) {
  // Show rights agreement modal
  const agreed = await showRightsAgreement();

  if (!agreed) {
    throw new Error('Content rights agreement required');
  }

  // Upload file
  const url = await uploadToStorage(file);

  // Record rights
  await db.content_rights.insert({
    content_url: url,
    original_owner_id: user.id,
    content_type: file.type,
    uploaded_via: 'gigmate_app',
    rights_agreement_accepted: true,
    rights_agreement_version: '1.0',
    rights_agreement_date: new Date(),
    ip_address: request.ip,
    user_agent: request.headers['user-agent'],
    gigmate_usage_allowed: true,
    commercial_usage_allowed: true,
    derivative_works_allowed: true,
    attribution_required: true
  });

  return url;
}
```

---

## Part 6: Marketing Messaging

### Social Media Integration

**For Musicians:**

> **"Post Once, Reach Everywhere"**
>
> Connect your Facebook, Instagram, Twitter, TikTok, and more. Create one post in GigMate and share it to all platforms instantly. Save time, reach more fans, grow your audience.

**For Venues:**

> **"Promote Events Across All Platforms in Seconds"**
>
> Stop copying and pasting event details to 5 different apps. Post once from GigMate, and it goes to Facebook, Instagram, Twitter automatically. More reach, less work.

### Emergency Replacement

**For Premium Venues:**

> **"Never Cancel a Show Again"**
>
> Musician cancelled last minute? GigMate automatically finds available replacements within your area, matching your genre and budget. Book a replacement in minutes, not hours. Your show goes on, your fans stay happy.

**For Musicians:**

> **"Turn On Emergency Availability, Earn Extra Income"**
>
> Be the hero who saves the show. Enable emergency availability and get contacted when venues need last-minute replacements. Set your premium rate, choose your radius, earn 30-50% more for urgent gigs.

### Content Rights

**Transparency Messaging:**

> **"You Own Your Content, We Share It"**
>
> Every photo and video you upload belongs to you. Always. We just get permission to display it on GigMate and use it in our marketing (with credit to you!). You can delete it anytime. Fair and simple.

---

## Conclusion

These two premium features transform GigMate from "booking platform" into "complete music business operating system":

1. **Social Media Integration** = Stay in GigMate, reach everywhere, save time, grow audience
2. **Emergency Replacement** = Never lose revenue to cancellations, premium feature drives upgrades
3. **Content Rights** = Legal protection for everyone, user trust, marketing leverage

**Combined Impact:**
- +$7M additional revenue by Year 3
- 40% increase in premium conversions
- 25% increase in user engagement
- Category-defining features (no competitor has both)

**The result:** GigMate becomes indispensable for serious music professionals.

---

**Making live music better—and easier—for everyone.**
