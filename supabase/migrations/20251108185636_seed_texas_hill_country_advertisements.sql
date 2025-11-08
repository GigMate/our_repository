/*
  # Seed Texas Hill Country Advertisements

  1. Advertisement Data
    - 15 local Texas Hill Country business ads
    - Various tiers (premium, standard, basic)
    - Includes realistic images from Pexels
    - Covers wineries, breweries, venues, restaurants, and markets

  2. Note
    - These ads will display based on location and tier
    - All images are royalty-free stock photos from Pexels
    - Active for 1 year from creation
*/

-- Insert 15 Texas Hill Country sponsor advertisements
INSERT INTO advertisements (
  advertiser_name,
  ad_tier,
  title,
  description,
  image_url,
  link_url,
  placement,
  is_active,
  start_date,
  end_date,
  impressions,
  clicks,
  created_at
)
VALUES
  (
    'Hill Country Winery',
    'premium',
    'Live Music Weekends at Hill Country Winery',
    'Join us every Friday and Saturday for live music in the vineyard! Award-winning wines, stunning views, and great Texas music. Reservations recommended. Located in beautiful Fredericksburg, TX.',
    'https://images.pexels.com/photos/1407846/pexels-photo-1407846.jpeg',
    'https://hillcountrywinery.com',
    'fan_dashboard',
    true,
    now(),
    now() + interval '1 year',
    0,
    0,
    now()
  ),
  (
    'Fredericksburg Brewing Co',
    'premium',
    'Craft Beer & Live Music Nightly',
    'Experience authentic German brewing traditions with live Texas music nightly. 12 craft beers on tap, traditional German food, and the best live music in the Hill Country! Downtown Fredericksburg.',
    'https://images.pexels.com/photos/1089930/pexels-photo-1089930.jpeg',
    'https://fbgbrewing.com',
    'musician_dashboard',
    true,
    now(),
    now() + interval '1 year',
    0,
    0,
    now()
  ),
  (
    'Luckenbach Texas',
    'premium',
    'Everybody is Somebody in Luckenbach',
    'The most famous dancehall in Texas. Live music 7 days a week. Come dance where Willie Nelson and Waylon Jennings made history! Historic venue with cold beer and hot music.',
    'https://images.pexels.com/photos/1154723/pexels-photo-1154723.jpeg',
    'https://luckenbachtexas.com',
    'venue_dashboard',
    true,
    now(),
    now() + interval '1 year',
    0,
    0,
    now()
  ),
  (
    'Texas Hill Country BBQ',
    'standard',
    'Best Brisket in the Hill Country',
    'Award-winning BBQ with live country music every weekend. Slow-smoked for 14 hours using Texas post oak. Family-owned since 1985. Our brisket is legendary! Dripping Springs.',
    'https://images.pexels.com/photos/1566837/pexels-photo-1566837.jpeg',
    'https://texashillcountrybbq.com',
    'fan_dashboard',
    true,
    now(),
    now() + interval '1 year',
    0,
    0,
    now()
  ),
  (
    'Stonewall Peach Ranch',
    'standard',
    'Music in the Peach Orchards',
    'Live acoustic music among the peach trees every Saturday. Fresh peaches, local wines, farm tours, and beautiful Hill Country views. Family-friendly atmosphere. Near LBJ Ranch in Stonewall.',
    'https://images.pexels.com/photos/1114690/pexels-photo-1114690.jpeg',
    'https://stonewallpeachranch.com',
    'fan_dashboard',
    true,
    now(),
    now() + interval '1 year',
    0,
    0,
    now()
  ),
  (
    'Gruene Hall',
    'premium',
    'Texas Oldest Continually Operating Dance Hall',
    'Est. 1878. World-famous venue hosting Willie Nelson, George Strait, Lyle Lovett, and emerging artists. Live music every week! Book your show today. New Braunfels Historic District.',
    'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg',
    'https://gruenehall.com',
    'musician_dashboard',
    true,
    now(),
    now() + interval '1 year',
    0,
    0,
    now()
  ),
  (
    'The Banjo Cafe',
    'basic',
    'Acoustic Music & Best Coffee in Fredericksburg',
    'Intimate 75-seat listening room for folk, bluegrass, and Americana. Best coffee in Fredericksburg. Live music Friday-Sunday. Open mic Thursdays! Downtown on South Llano Street.',
    'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg',
    'https://banjocafe.com',
    'musician_dashboard',
    true,
    now(),
    now() + interval '1 year',
    0,
    0,
    now()
  ),
  (
    'Canyon Lake Marina',
    'standard',
    'Sunset Concerts on the Water',
    'Summer music series on the water! Boat rentals, jet skis, waterfront dining, and live music under the stars. Every Friday evening May-September. Beautiful Canyon Lake, TX.',
    'https://images.pexels.com/photos/273886/pexels-photo-273886.jpeg',
    'https://canyonlakemarina.com',
    'fan_dashboard',
    true,
    now(),
    now() + interval '1 year',
    0,
    0,
    now()
  ),
  (
    'Wimberley Market Days',
    'standard',
    'First Saturday Music & Market',
    '400+ vendors, food trucks, and 3 live music stages! First Saturday of every month. Free admission and free parking. Bring the whole family! Lion Field in Wimberley.',
    'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg',
    'https://wimberleymarketdays.com',
    'venue_dashboard',
    true,
    now(),
    now() + interval '1 year',
    0,
    0,
    now()
  ),
  (
    'Bandera Rodeo Arena',
    'standard',
    'Cowboy Capital of the World',
    'Professional rodeo every Friday & Saturday + live country music after the show. Experience real Texas cowboy culture! Tickets available online. Bandera, the Cowboy Capital.',
    'https://images.pexels.com/photos/618463/pexels-photo-618463.jpeg',
    'https://banderacowboycapital.com',
    'fan_dashboard',
    true,
    now(),
    now() + interval '1 year',
    0,
    0,
    now()
  ),
  (
    'Comfort Ranch House',
    'basic',
    'Fine Hill Country Dining with Live Music',
    'Upscale Hill Country dining with weekend entertainment. Friday steaks, Saturday seafood, Sunday gospel brunch with acoustic music. Reservations recommended. Historic Comfort, TX.',
    'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg',
    'https://comfortranchhouse.com',
    'venue_dashboard',
    true,
    now(),
    now() + interval '1 year',
    0,
    0,
    now()
  ),
  (
    'Kerrville River Walk Cafe',
    'basic',
    'Music by the Guadalupe River',
    'Beautiful Guadalupe River views with live music Thursday-Sunday. Fresh local cuisine, craft cocktails, and the best sunset views in Kerrville. Riverside patio seating available.',
    'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg',
    'https://kerrvilleriverwalk.com',
    'fan_dashboard',
    true,
    now(),
    now() + interval '1 year',
    0,
    0,
    now()
  ),
  (
    'Boerne Artisan Market',
    'basic',
    'Music, Crafts & Hill Country Charm',
    'Monthly artisan market with live music, local crafts, and Hill Country charm. 100+ vendors, food trucks, kids activities. Second Saturday! Downtown Boerne Main Plaza.',
    'https://images.pexels.com/photos/1263349/pexels-photo-1263349.jpeg',
    'https://boerneartisanmarket.com',
    'venue_dashboard',
    true,
    now(),
    now() + interval '1 year',
    0,
    0,
    now()
  ),
  (
    'Anhalt Dance Hall',
    'basic',
    'Historic Texas Dance Hall Since 1870s',
    'Historic 1870s German dance hall. Polka, waltz, and Texas swing every weekend. Dance lessons 7pm, band starts 8pm. Bring your boots! Spring Branch, TX.',
    'https://images.pexels.com/photos/1047442/pexels-photo-1047442.jpeg',
    'https://anhaltdancehall.com',
    'musician_dashboard',
    true,
    now(),
    now() + interval '1 year',
    0,
    0,
    now()
  ),
  (
    'Johnson City Honey Farm',
    'basic',
    'Farm Music Events & Honey Tastings',
    'Seasonal acoustic concerts on the farm. Honey tastings, farm tours, local music, and picnic areas. Family-friendly fun! Check website for concert dates. Near LBJ National Park.',
    'https://images.pexels.com/photos/247502/pexels-photo-247502.jpeg',
    'https://johnsoncityhoneyfarm.com',
    'fan_dashboard',
    true,
    now(),
    now() + interval '1 year',
    0,
    0,
    now()
  )
ON CONFLICT DO NOTHING;