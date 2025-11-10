# Proximity Search Feature for Venues

## Description
Add radius-based proximity search to Venue Dashboard so venues can find musicians within a specific distance.

## Requirements
1. Add radius filter dropdown (5, 10, 25, 50, 100 miles)
2. Calculate distance between venue location and musician locations
3. Filter musicians based on selected radius
4. Show distance in search results
5. Sort by distance option

## Implementation Notes
- Use venue's lat/lng coordinates (already in database from venue table)
- Use musician's lat/lng coordinates (already in database from musicians table)
- Use PostGIS earth_distance or Haversine formula for distance calculation
- Add distance column to search results display
- Integrate with existing genre filter

## Database Changes
- No schema changes needed (lat/lng already exist in both tables)
- May need to add database function for distance calculation optimization

## UI Changes
- Add "Search Radius" dropdown to VenueDashboard filters
- Display distance in miles on each MusicianCard
- Add "Sort by Distance" option
- Show map view with musician pins and radius circle

## Files to Modify
- src/components/Venue/VenueDashboard.tsx
- src/components/Fan/MusicianCard.tsx (add distance display prop)

## Priority
Medium - Nice to have but not blocking
