/*
  # Extend vehicles table for onboarding flow

  ## New columns
  - `engine` (text, nullable) — engine description, e.g. "2.5L 4-cylinder"
  - `drivetrain` (text, nullable) — e.g. "FWD", "AWD", "RWD", "4WD"
  - `odometer_unit` (text, not null, default 'mi') — "mi" or "km"
  - `is_primary` (boolean, not null, default false) — marks the user's
    first/selected primary vehicle; at most one row per user should be true

  ## Notes
  - All columns are additive — no existing data is affected.
  - odometer_unit defaults to 'mi' so existing rows remain valid.
  - is_primary has no unique constraint at the DB level because enforcing
    exactly-one-primary per user is handled in application logic; a partial
    unique index would require more complex migration and the app logic is
    sufficient for this use case.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'engine'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN engine text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'drivetrain'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN drivetrain text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'odometer_unit'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN odometer_unit text NOT NULL DEFAULT 'mi';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'is_primary'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN is_primary boolean NOT NULL DEFAULT false;
  END IF;
END $$;
