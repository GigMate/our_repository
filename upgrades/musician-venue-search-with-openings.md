# Musician Search for Venues with Immediate Openings

## Description
Allow musicians to search for venues that have calendar availability and initiate booking requests. Premium subscribers get priority notifications and early access.

## Requirements

### Search & Discovery
1. Musicians can browse venues with open calendar dates
2. Filter by:
   - Date range (this week, this month, next 30/60/90 days)
   - Venue type (bar, restaurant, concert hall, etc.)
   - Capacity
   - Preferred genres
   - Distance/proximity
3. Show available dates prominently on venue cards
4. "Available Now" badge for venues with openings in next 7 days

### Booking Initiation
1. Musician clicks "Request Booking" from venue profile
2. Select date from available dates on calendar
3. Propose rate and add message
4. Attach portfolio items (setlist, videos, etc.)
5. Venue receives notification and can accept/decline/counter-offer

### Premium Features (Subscription Tiers)

**FREE Musicians:**
- Can browse and request bookings
- Standard response time
- 5 active booking requests at a time

**PREMIUM Musicians ($9.99/month):**
- Priority notifications to venues
- Unlimited active booking requests
- "Premium Musician" badge on profile
- Can see venues' booking history/rating

**PLATINUM Musicians ($19.99/month):**
- All Premium features
- First-to-know about new venue openings
- Featured placement in venue searches
- Analytics on booking request success rate
- Direct messaging with venues

**FREE Venues:**
- Receive all booking requests
- Standard notification timing
- Can accept/decline requests

**PREMIUM Venues ($14.99/month):**
- Priority access to premium musician pool
- Advanced filtering options
- Booking request analytics
- "Premium Venue" badge

**PLATINUM Venues ($29.99/month):**
- All Premium features
- Early access to new musicians
- Featured placement in musician searches
- Automatic matching recommendations
- Dedicated support

## Database Changes

### New Tables

```sql
-- Booking requests (before confirmed bookings)
CREATE TABLE booking_requests (
  id uuid PRIMARY KEY,
  musician_id uuid REFERENCES musicians(id),
  venue_id uuid REFERENCES venues(id),
  requested_date date NOT NULL,
  proposed_rate decimal(10,2),
  message text,
  status enum ('pending', 'accepted', 'declined', 'counter_offer', 'expired'),
  counter_offer_rate decimal(10,2),
  counter_offer_message text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Priority notification queue for premium users
CREATE TABLE priority_notifications (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  notification_type text,
  priority_level integer, -- 1=Platinum, 2=Premium, 3=Free
  sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

### Subscription Tiers
- Update existing premium_subscription_tier in profiles table
- Add tier-based rate limits and priority flags

## UI Changes

### Musician Dashboard
1. New "Find Open Venues" section
2. Filters: date range, venue type, genres, distance
3. Venue cards show:
   - Next 3 available dates
   - "Available Now" badge if has openings this week
   - Premium venue badge
4. Quick "Request Booking" button

### Venue Profile (Musician View)
1. Prominently display calendar with available dates
2. "Request Booking" button opens modal:
   - Select date (from available dates only)
   - Propose rate
   - Add message
   - Submit request

### Notifications
1. Premium users get push notifications immediately
2. Free users get batched notifications (hourly)
3. Email notifications for all booking requests

### Booking Request Management
1. New "Booking Requests" tab in both dashboards
2. Pending requests with countdown timers
3. Accept/Decline/Counter-offer actions
4. View musician portfolio before deciding

## Business Logic

### Priority System
```typescript
// Notification priority order:
1. Platinum subscribers - instant notification
2. Premium subscribers - within 5 minutes
3. Free users - hourly batch

// Search ranking:
1. Premium users appear higher in search results
2. Featured placement for platinum users
3. "Verified" badges for paid subscribers
```

### Rate Limiting
```typescript
// Active booking requests:
- Free: 5 simultaneous requests
- Premium: 20 simultaneous requests
- Platinum: unlimited

// Requests expire after:
- 48 hours if no venue response
- 24 hours after counter-offer if no musician response
```

## Files to Create/Modify

### New Components
- `src/components/Musician/VenueSearchWithOpenings.tsx`
- `src/components/Shared/BookingRequestModal.tsx`
- `src/components/Shared/BookingRequestManager.tsx`
- `src/components/Shared/PriorityNotificationBadge.tsx`

### Modify
- `src/components/Musician/MusicianDashboard.tsx` - Add venue search
- `src/components/Venue/VenueDashboard.tsx` - Add request manager
- `src/components/Shared/VenueDetailView.tsx` - Add request button

### Database
- New migration: `create_booking_request_system.sql`
- New migration: `create_priority_notification_system.sql`

## Priority
HIGH - Core feature for platform value proposition

## Monetization Impact
- Primary driver for premium subscriptions
- Clear value differentiation between tiers
- Network effects (more premium users = better matches)

## Notes
- Must be fair to free users while incentivizing upgrades
- Consider rate limiting to prevent spam
- Analytics tracking for conversion optimization
- A/B test notification timing for optimal engagement
