/*
  # Seed Placeholder Advertisements

  1. Purpose
    - Create realistic placeholder ads from various sponsor types
    - Show platform has commercial interest and sponsorship potential
    - Display across different placements (fan, musician, venue dashboards)

  2. Sponsor Types
    - Music equipment brands
    - Beverage companies
    - Local businesses
    - Music streaming services
    - Instrument retailers
    - Event promotion companies
*/

-- Insert placeholder advertisements
INSERT INTO advertisements (advertiser_name, ad_tier, title, description, image_url, link_url, placement, is_active, start_date, end_date)
VALUES
-- Premium Tier Ads (appear everywhere)
(
  'Gibson Guitars',
  'premium',
  'Gibson Les Paul - The Sound of Legends',
  'Discover the iconic tone that shaped rock and roll. Premium crafted guitars for professional musicians.',
  'https://images.pexels.com/photos/1751731/pexels-photo-1751731.jpeg',
  'https://www.gibson.com',
  'all',
  true,
  now(),
  now() + interval '90 days'
),
(
  'Shure Microphones',
  'premium',
  'Shure SM58 - The World''s Most Popular Mic',
  'Industry standard vocal microphone used by professionals worldwide. Legendary sound quality.',
  'https://images.pexels.com/photos/164829/pexels-photo-164829.jpeg',
  'https://www.shure.com',
  'all',
  true,
  now(),
  now() + interval '90 days'
),
(
  'Fender',
  'premium',
  'American Professional II Series',
  'The next generation of professional instruments. Precision crafted in California.',
  'https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg',
  'https://www.fender.com',
  'musician_dashboard',
  true,
  now(),
  now() + interval '90 days'
),

-- Beverage Sponsors
(
  'Lone Star Beer',
  'standard',
  'The National Beer of Texas',
  'Premium Texas beer since 1884. Available for venue partnerships and event sponsorships.',
  'https://images.pexels.com/photos/1089930/pexels-photo-1089930.jpeg',
  'https://www.lonestar.com',
  'venue_dashboard',
  true,
  now(),
  now() + interval '60 days'
),
(
  'Tito''s Handmade Vodka',
  'premium',
  'Austin''s Original Craft Vodka',
  'Handcrafted vodka from Austin, Texas. Perfect for your venue''s premium cocktail menu.',
  'https://images.pexels.com/photos/602750/pexels-photo-602750.jpeg',
  'https://www.titosvodka.com',
  'venue_dashboard',
  true,
  now(),
  now() + interval '90 days'
),

-- Music Services
(
  'Spotify for Artists',
  'premium',
  'Grow Your Fanbase with Spotify',
  'Reach millions of listeners. Get verified, pitch your music, and access powerful insights.',
  'https://images.pexels.com/photos/3971985/pexels-photo-3971985.jpeg',
  'https://artists.spotify.com',
  'musician_dashboard',
  true,
  now(),
  now() + interval '120 days'
),
(
  'SoundCloud Pro',
  'standard',
  'Unlimited Uploads. Unlimited Possibilities.',
  'Share your music with the world. Advanced stats, monetization, and promotional tools.',
  'https://images.pexels.com/photos/3783471/pexels-photo-3783471.jpeg',
  'https://soundcloud.com/pro',
  'musician_dashboard',
  true,
  now(),
  now() + interval '60 days'
),

-- Equipment & Instruments
(
  'Guitar Center',
  'standard',
  'Everything Music. Every Day.',
  'The world''s largest music retailer. Guitars, drums, keyboards, PA systems, and more.',
  'https://images.pexels.com/photos/1010519/pexels-photo-1010519.jpeg',
  'https://www.guitarcenter.com',
  'musician_dashboard',
  true,
  now(),
  now() + interval '60 days'
),
(
  'Sweetwater',
  'standard',
  'America''s Favorite Music Technology Store',
  'Free shipping, expert advice, and 2-year warranty. Pro audio and music gear.',
  'https://images.pexels.com/photos/167491/pexels-photo-167491.jpeg',
  'https://www.sweetwater.com',
  'musician_dashboard',
  true,
  now(),
  now() + interval '60 days'
),
(
  'Roland',
  'premium',
  'Digital Pianos & Electronic Drums',
  'Professional keyboards and electronic percussion. Innovation in music technology since 1972.',
  'https://images.pexels.com/photos/2112008/pexels-photo-2112008.jpeg',
  'https://www.roland.com',
  'musician_dashboard',
  true,
  now(),
  now() + interval '90 days'
),

-- Ticketing & Promotion
(
  'Eventbrite',
  'standard',
  'Sell More Tickets. Grow Your Event.',
  'Powerful ticketing platform for venues and promoters. Easy setup, secure payments.',
  'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg',
  'https://www.eventbrite.com',
  'venue_dashboard',
  true,
  now(),
  now() + interval '90 days'
),
(
  'BandsInTown',
  'standard',
  'Connect With Fans on Tour',
  'Get discovered by millions of music fans. Track RSVPs and sell tickets directly.',
  'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg',
  'https://www.bandsintown.com',
  'musician_dashboard',
  true,
  now(),
  now() + interval '60 days'
),

-- Local Texas Businesses
(
  'Austin City Limits',
  'premium',
  'Texas'' Longest-Running Music Series',
  'Be part of Austin''s legendary music scene. Venue partnerships and artist opportunities.',
  'https://images.pexels.com/photos/1047442/pexels-photo-1047442.jpeg',
  'https://acltv.com',
  'all',
  true,
  now(),
  now() + interval '120 days'
),
(
  'SXSW',
  'premium',
  'Music. Film. Interactive.',
  'The premier destination for discovery. Showcase opportunities and industry connections.',
  'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg',
  'https://www.sxsw.com',
  'all',
  true,
  now(),
  now() + interval '180 days'
),

-- Sound & Lighting
(
  'QSC Audio',
  'standard',
  'Professional Sound Reinforcement',
  'Industry-leading PA systems and powered speakers. Premium sound for your venue.',
  'https://images.pexels.com/photos/1387037/pexels-photo-1387037.jpeg',
  'https://www.qsc.com',
  'venue_dashboard',
  true,
  now(),
  now() + interval '90 days'
),
(
  'Chauvet DJ',
  'standard',
  'Stage Lighting Solutions',
  'Professional lighting for venues and mobile DJs. Create unforgettable atmosphere.',
  'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg',
  'https://www.chauvetdj.com',
  'venue_dashboard',
  true,
  now(),
  now() + interval '60 days'
),

-- Fan-Focused Ads
(
  'StubHub',
  'standard',
  'Buy and Sell Concert Tickets',
  'The world''s largest ticket marketplace. Find seats to the hottest shows.',
  'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg',
  'https://www.stubhub.com',
  'fan_dashboard',
  true,
  now(),
  now() + interval '90 days'
),
(
  'Live Nation',
  'premium',
  'Live Music. Live Life.',
  'Discover concerts near you. Exclusive presales and VIP experiences.',
  'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg',
  'https://www.livenation.com',
  'fan_dashboard',
  true,
  now(),
  now() + interval '120 days'
),

-- Insurance & Services
(
  'Clarion Insurance',
  'standard',
  'Insurance for Musicians & Venues',
  'Protect your equipment, liability coverage, and event insurance. Trusted by professionals.',
  'https://images.pexels.com/photos/6347720/pexels-photo-6347720.jpeg',
  'https://www.clarionins.com',
  'all',
  true,
  now(),
  now() + interval '90 days'
),

-- Music Education
(
  'Berklee Online',
  'standard',
  'Study Music Online from Berklee',
  'Award-winning online music courses from Berklee College of Music. Advance your career.',
  'https://images.pexels.com/photos/1047442/pexels-photo-1047442.jpeg',
  'https://online.berklee.edu',
  'musician_dashboard',
  true,
  now(),
  now() + interval '120 days'
)

ON CONFLICT DO NOTHING;