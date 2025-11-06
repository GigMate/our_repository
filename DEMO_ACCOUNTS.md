# GigMate Demo Accounts & Data Seeding

## Database Seeding Instructions

To populate the database with demo data (venues, musicians, and test accounts):

1. Navigate to: `http://localhost:5173/admin/seed`
2. Click the "Seed Database" button
3. Wait for the seeding process to complete

This will create:
- 10 live music venues across Texas Hill Country counties (Kerr, Kendall, Blanco, Gillespie, Bandera, Comal)
- 8 demo musicians/bands with various genres
- 3 demo user accounts (one for each user type)
- Sample merchandise items

## Demo Login Credentials

### Fan Account
- **Email:** demo.fan@gigmate.us
- **Password:** demo123
- **User:** Alex Thompson
- **Purpose:** Browse musicians, discover gigs, purchase merchandise

### Musician Account
- **Email:** demo.musician@gigmate.us
- **Password:** demo123
- **User:** Jordan Rivers
- **Purpose:** Manage gigs, list merchandise, view bookings

### Venue Account
- **Email:** demo.venue@gigmate.us
- **Password:** demo123
- **User:** Sarah Martinez
- **Purpose:** Book musicians, manage venue profile, post gig opportunities

### Investor Accounts (5 Total)
- **Email:** investor1@gigmate.demo through investor5@gigmate.demo
- **Password:** DemoPass123!
- **Users:** Alex Chen, Maria Rodriguez, James Thompson, Sarah Patel, David Kim
- **Purpose:** Access platform analytics, revenue metrics, growth insights, and KPIs

## Pre-populated Venues

The database includes 10 realistic venues across Texas Hill Country:

### Kerr County
- The Rustic Barn (Kerrville) - 200 capacity
- The Kerrville Folk Festival Grounds - 600 capacity

### Kendall County
- Hill Country Music Hall (Boerne) - 350 capacity
- Cypress Creek Winery (Comfort) - 150 capacity

### Gillespie County
- Fredericksburg Beer Garden - 250 capacity
- Luckenbach Dance Hall - 300 capacity

### Bandera County
- Bandera Saloon - 180 capacity

### Blanco County
- Blanco River Amphitheater - 500 capacity

### Comal County
- New Braunfels Music Factory - 400 capacity
- Gruene Hall - 350 capacity

## Pre-populated Musicians

8 demo musicians/bands covering various genres:
- Jordan Rivers (Country/Folk/Americana)
- The Hill Country Band (Country/Honky-Tonk)
- Sarah "Bluebird" Johnson (Blues/Soul)
- The Lonesome Pines (Bluegrass)
- Texas Red (Outlaw Country)
- Mesa Verde (Tejano/Conjunto)
- Acoustic Sunrise (Acoustic/Pop)
- The Rodeo Kings (Country/Dance)

## Notes

- All demo accounts use the same password: `demo123`
- The seeding script is idempotent - it can be run multiple times
- Existing records will be preserved (won't create duplicates)
- Perfect for demonstrations to venue owners, artists, and potential investors
