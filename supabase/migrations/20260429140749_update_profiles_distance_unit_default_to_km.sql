/*
  # Update profiles.distance_unit default to 'km'

  ## Change
  - Alters the DEFAULT for `profiles.distance_unit` from 'mi' to 'km'
  - All new user profiles will now default to kilometers
  - Existing profiles are unaffected (their stored value is preserved)

  ## Notes
  - Only the column DEFAULT is changed; no data is modified
  - The CHECK constraint (IN ('mi', 'km')) remains unchanged
*/

ALTER TABLE profiles
  ALTER COLUMN distance_unit SET DEFAULT 'km';
